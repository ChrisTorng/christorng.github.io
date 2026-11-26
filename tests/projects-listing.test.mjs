import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('all listed GitHub repositories have valid pushed_at snapshots', async () => {
  const source = await readFile(new URL('../data/projectsData.ts', import.meta.url), 'utf8')
  const data = JSON.parse(await readFile(new URL('../data/projectUpdatedDates.json', import.meta.url), 'utf8'))
  const names = [...new Set(
    [...source.matchAll(/href:\s*['"]https:\/\/github\.com\/ChrisTorng\/([a-zA-Z0-9._-]+)['"]/g)]
      .map((match) => match[1])
  )]
  assert.ok(names.length > 0)
  assert.deepEqual(Object.keys(data).sort(), [...names].sort())
  for (const name of names) {
    assert.ok(!Number.isNaN(Date.parse(data[name])), name + ' must have valid pushed_at')
  }
  assert.ok(names.includes('vllm-benchmarks'))
})
