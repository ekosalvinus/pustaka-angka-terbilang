// tsc menulis ulang import `.ts` -> `.js` di file .js, tapi tidak di .d.ts.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

for (const f of readdirSync('dist')) {
  if (!f.endsWith('.d.ts')) continue
  const path = `dist/${f}`
  writeFileSync(path, readFileSync(path, 'utf8').replace(/(from '\.[^']*)\.ts'/g, "$1.js'"))
}
