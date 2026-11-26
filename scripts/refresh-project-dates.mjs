import { readFile, writeFile } from 'node:fs/promises'

const sourceUrl = new URL('../data/projectsData.ts', import.meta.url)
const datesUrl = new URL('../data/projectUpdatedDates.json', import.meta.url)

const source = await readFile(sourceUrl, 'utf8')
const names = [...new Set(
  [...source.matchAll(/href:\s*['"]https:\/\/github\.com\/ChrisTorng\/([a-zA-Z0-9._-]+)['"]/g)]
    .map((match) => match[1])
)]
if (!names.length) throw new Error('No GitHub project links found in projectsData.ts')

const previous = JSON.parse(await readFile(datesUrl, 'utf8'))
const updated = {}
const errors = []
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'ChrisTorng-projects-site',
}
if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN

// Bounded parallelism: once per site build, not once per visitor.
for (let start = 0; start < names.length; start += 5) {
  await Promise.all(names.slice(start, start + 5).map(async (name) => {
    try {
      const response = await fetch(
        'https://api.github.com/repos/ChrisTorng/' + encodeURIComponent(name),
        { headers, signal: AbortSignal.timeout(15000), redirect: 'follow' }
      )
      if (!response.ok) throw new Error('HTTP ' + response.status)
      const info = await response.json()
      if (!info.pushed_at || Number.isNaN(Date.parse(info.pushed_at))) {
        throw new Error('Missing pushed_at')
      }
      updated[name] = info.pushed_at
    } catch (error) {
      errors.push(name + ': ' + String(error))
      if (previous[name]) updated[name] = previous[name]
    }
  }))
}

const missing = names.filter((name) => !updated[name])
if (missing.length) throw new Error('Missing pushed_at for: ' + missing.join(', '))
const ordered = Object.fromEntries(names.map((name) => [name, updated[name]]))
await writeFile(datesUrl, JSON.stringify(ordered, null, 2) + '\n', 'utf8')
console.log('Updated pushed_at snapshot for ' + names.length + ' projects')
if (errors.length) console.warn('Using prior dates for ' + errors.join('; '))
