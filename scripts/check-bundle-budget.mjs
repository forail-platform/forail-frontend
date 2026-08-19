#!/usr/bin/env node
/**
 * Fails the build when a chunk grows past its budget.
 *
 * The entry chunk is the one that matters: every visitor downloads and parses it
 * before the first screen appears. It was 1.44 MB because all 91 pages were
 * imported eagerly; route-level lazy loading brought it to ~250 kB. Without a
 * budget the next eager import puts it straight back, and nothing would say so.
 *
 * Budgets are on raw bytes, not gzip -- parse time tracks the uncompressed size.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ASSETS = 'build/forail/assets'

// Deliberately generous relative to today's sizes: this is a ratchet against
// regression, not a target to squeeze against on every commit.
const ENTRY_BUDGET = 400 * 1024
const CHUNK_BUDGET = 500 * 1024

// Vendor libraries that are legitimately large and already isolated, so they
// load only with the pages that use them. Splitting them further would trade one
// number for several without changing what a visitor downloads.
const EXEMPT = [/^vendor-charts-/, /^vendor-xterm-/]

let files
try {
  files = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
} catch {
  console.error(`No build output at ${ASSETS} — run \`npm run build\` first.`)
  process.exit(1)
}

const entry = files.filter((f) => f.startsWith('index-'))
if (entry.length === 0) {
  console.error('No entry chunk (index-*.js) found in the build output.')
  process.exit(1)
}

const failures = []
for (const file of files) {
  const size = statSync(join(ASSETS, file)).size
  const isEntry = file.startsWith('index-')
  if (!isEntry && EXEMPT.some((re) => re.test(file))) continue
  const budget = isEntry ? ENTRY_BUDGET : CHUNK_BUDGET
  if (size > budget) {
    failures.push(`${file}: ${(size / 1024).toFixed(1)} kB exceeds the ${(budget / 1024).toFixed(0)} kB budget`)
  }
}

const largest = files
  .map((f) => [f, statSync(join(ASSETS, f)).size])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
console.log('Largest chunks:')
for (const [f, size] of largest) console.log(`  ${(size / 1024).toFixed(1).padStart(8)} kB  ${f}`)

if (failures.length) {
  console.error('\nBundle budget exceeded:')
  for (const f of failures) console.error(`  ${f}`)
  console.error('\nUsually this means a page was imported eagerly in App.tsx, or a large')
  console.error('dependency was pulled in with a namespace import. Load it with lazy()')
  console.error('instead, or give it its own entry in vite.config manualChunks.')
  process.exit(1)
}
console.log('\nBundle budget OK.')
