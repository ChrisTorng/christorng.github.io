[CmdletBinding(SupportsShouldProcess)]
param(
  [switch]$Check,
  [switch]$ResetNextCache,
  [ValidateSet('Blog', 'Media', 'Assets', 'Notes', 'Bookmarks')]
  [string]$Service
)

$ErrorActionPreference = 'Stop'
$blogRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$repositoriesRoot = Split-Path $blogRoot -Parent
$services = @(
  @{ Name = 'Blog'; Repo = 'christorng.github.io'; Port = 3000; Command = 'start'; Dependency = 'next' },
  @{ Name = 'Media'; Repo = 'blog-media'; Port = 3001; Command = 'start'; Dependency = 'http-server' },
  @{ Name = 'Assets'; Repo = 'blog-assets'; Port = 3002; Command = 'start'; Dependency = 'http-server' },
  @{ Name = 'Notes'; Repo = 'blog-notes'; Port = 8787; Command = 'dev'; Dependency = 'wrangler' },
  @{ Name = 'Bookmarks'; Repo = 'blog-bookmarks'; Port = 8788; Command = 'dev'; Dependency = 'wrangler' }
)
foreach ($entry in $services) {
  $entry.Path = if ($entry.Name -eq 'Blog') { $blogRoot } else { Join-Path $repositoriesRoot $entry.Repo }
}

function Test-LocalPort([int]$Port) {
  foreach ($address in @('127.0.0.1', '::1')) {
    $client = [Net.Sockets.TcpClient]::new()
    try {
      $connection = $client.ConnectAsync($address, $Port)
      if ($connection.Wait(300) -and $client.Connected) { return $true }
    } catch {
      # A refused connection means this address is not listening.
    } finally {
      $client.Dispose()
    }
  }
  return $false
}

function Invoke-LocalNpm([string[]]$Arguments) {
  & npm.cmd @Arguments
  if ($LASTEXITCODE -ne 0) { throw "npm $($Arguments -join ' ') failed (exit $LASTEXITCODE)." }
}

function Initialize-LocalVariables([string]$RepositoryPath) {
  $variablesPath = Join-Path $RepositoryPath '.dev.vars'
  if (Test-Path -LiteralPath $variablesPath) {
    Write-Host 'Keeping existing .dev.vars.'
    return
  }
  $examplePath = Join-Path $RepositoryPath '.dev.vars.example'
  $example = [IO.File]::ReadAllText($examplePath)
  $bytes = New-Object byte[] 32
  $random = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $random.GetBytes($bytes) } finally { $random.Dispose() }
  $token = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
  $variables = [regex]::Replace($example, '(?m)^LOCAL_ADMIN_TOKEN=.*$', "LOCAL_ADMIN_TOKEN=$token")
  [IO.File]::WriteAllText($variablesPath, $variables, [Text.UTF8Encoding]::new($false))
  Write-Host 'Created .dev.vars with a random local token. Read it there to sign in.'
}

if (!(Get-Command node.exe -ErrorAction SilentlyContinue) -or !(Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw 'Install Node.js 22 or newer, then reopen the terminal.'
}
$nodeMajor = [int]((& node.exe -p "process.versions.node.split('.')[0]") | Select-Object -Last 1)
if ($nodeMajor -lt 22) { throw 'Node.js 22 or newer is required.' }

if ($Service) {
  $entry = $services | Where-Object { $_.Name -eq $Service } | Select-Object -First 1
  if (Test-LocalPort $entry.Port) { throw "Port $($entry.Port) is already in use. Stop its existing service first." }
  if (!$PSCmdlet.ShouldProcess($entry.Path, "Prepare and run $Service on port $($entry.Port)")) { return }
  Set-Location -LiteralPath $entry.Path
  $Host.UI.RawUI.WindowTitle = "$Service : $($entry.Port)"
  Write-Host "$Service | $($entry.Path) | http://localhost:$($entry.Port)"
  $dependencyPath = Join-Path $entry.Path "node_modules/$($entry.Dependency)/package.json"
  if (!(Test-Path -LiteralPath $dependencyPath)) {
    if (Test-Path -LiteralPath (Join-Path $entry.Path 'package-lock.json')) {
      Invoke-LocalNpm -Arguments @('ci')
    } else {
      Invoke-LocalNpm -Arguments @('install')
    }
  }
  if ($Service -in @('Notes', 'Bookmarks')) {
    Initialize-LocalVariables $entry.Path
    Invoke-LocalNpm -Arguments @('run', 'db:migrate')
  }
  Write-Host 'Press Ctrl+C here to stop this service. The tab stays open.'
  if ($Service -eq 'Blog') {
    Invoke-LocalNpm -Arguments @('run', 'start', '--', '--port', '3000')
  } else {
    Invoke-LocalNpm -Arguments @('run', $entry.Command)
  }
  return
}

$terminal = Get-Command wt.exe -ErrorAction SilentlyContinue
if (!$terminal) { throw 'Windows Terminal (wt.exe) is required for separate service tabs.' }
$shell = Get-Command pwsh.exe -ErrorAction SilentlyContinue
if (!$shell) { $shell = Get-Command powershell.exe -ErrorAction Stop }

$problems = @()
$status = foreach ($entry in $services) {
  $packagePath = Join-Path $entry.Path 'package.json'
  $exists = Test-Path -LiteralPath $packagePath
  $busy = Test-LocalPort $entry.Port
  if (!$exists) { $problems += "Missing repository: $($entry.Path)" }
  if ($busy) { $problems += "Port $($entry.Port) is in use. Stop the existing $($entry.Name) service before launching all services." }
  if ($exists) {
    $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    if (!$package.scripts.($entry.Command)) { $problems += "Missing npm script '$($entry.Command)' in $($entry.Repo)." }
  }
  [pscustomobject]@{
    Service = $entry.Name
    Port = $entry.Port
    Repository = $entry.Path
    Status = if (!$exists) { 'Missing' } elseif ($busy) { 'In use' } else { 'Ready' }
  }
}
$status | Format-Table -AutoSize | Out-Host
if ($problems.Count) { throw ($problems -join [Environment]::NewLine) }
if ($Check) {
  Write-Host 'Checks passed. No services started or files changed.'
  return
}

if ($ResetNextCache) {
  # The fixed target must stay inside this workspace; never remove Contentlayer or D1 data.
  $cachePath = [IO.Path]::GetFullPath((Join-Path $blogRoot '.next'))
  if ((Split-Path $cachePath -Parent) -ne $blogRoot -or (Split-Path $cachePath -Leaf) -ne '.next') {
    throw 'Unexpected Next.js cache path.'
  }
  $nextProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction Stop |
    Where-Object { $_.CommandLine -match 'next[\\/].*(dev|start-server)|next dev' }
  if ($nextProcesses) { throw 'Stop all Next.js development servers before resetting .next.' }
  if ((Test-Path -LiteralPath $cachePath) -and $PSCmdlet.ShouldProcess($cachePath, 'Remove stopped Next.js cache')) {
    Remove-Item -LiteralPath $cachePath -Recurse -Force
  }
}

$terminalArguments = @('-w', 'new')
foreach ($entry in $services) {
  if ($terminalArguments.Count -gt 2) { $terminalArguments += ';' }
  $terminalArguments += @(
    'new-tab', '--title', "$($entry.Name) : $($entry.Port)", '--suppressApplicationTitle',
    '--startingDirectory', $entry.Path,
    $shell.Source, '-NoLogo', '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass',
    '-File', $PSCommandPath, '-Service', $entry.Name
  )
}
if ($PSCmdlet.ShouldProcess('Windows Terminal', 'Open five service tabs')) {
  & $terminal.Source @terminalArguments
  if ($LASTEXITCODE -ne 0) { throw "Windows Terminal failed (exit $LASTEXITCODE)." }
  Write-Host 'Starting five services in separate tabs. Open http://localhost:3000 after Blog reports Ready.'
}
