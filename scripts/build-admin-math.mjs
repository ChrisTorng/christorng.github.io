import { build } from 'esbuild'
import { cp, mkdir } from 'node:fs/promises'

await mkdir('public/shared/math-v1', { recursive: true })
await build({
  entryPoints: ['utils/admin-math.mjs'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: true,
  outfile: 'public/shared/math-v1/admin-math.mjs',
})
await cp('node_modules/katex/dist/katex.min.css', 'public/shared/math-v1/katex.min.css')
await cp('node_modules/katex/dist/fonts', 'public/shared/math-v1/fonts', { recursive: true })
