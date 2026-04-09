#!/usr/bin/env node
import { readFileSync } from 'fs'
import { resolve, basename, extname, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { scan } from '../src/scanner.js'
import { transform } from '../src/transformer.js'
import { printDryRun, applyWrites } from '../src/writer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'))

const args = process.argv.slice(2)

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version)
  process.exit(0)
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  console.log(`
Usage: data-testid-injector <path> [options]

Arguments:
  <path>              Target file or directory (required)

Options:
  --write             Apply changes to disk (default: dry-run)
  --ignore <glob>     Additional glob pattern to ignore (can be repeated)
  --version           Show version
  --help              Show this help message
`)
  process.exit(args.length === 0 ? 1 : 0)
}

const writeMode = args.includes('--write')

// Collect --ignore values
const ignorePatterns = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--ignore' && args[i + 1]) {
    ignorePatterns.push(args[i + 1])
    i++
  }
}

const consumedByFlags = new Set(ignorePatterns)
const targetArg = args.find((a) => !a.startsWith('--') && !consumedByFlags.has(a))
if (!targetArg) {
  console.error('Error: No target path provided.')
  process.exit(1)
}

const targetPath = resolve(targetArg)

let files
try {
  files = await scan(targetPath, ignorePatterns)
} catch (err) {
  console.error(`Error scanning path "${targetPath}": ${err.message}`)
  process.exit(1)
}

if (files.length === 0) {
  console.log('No .jsx or .tsx files found.')
  process.exit(0)
}

const results = []
let hadError = false

for (const filePath of files) {
  let source
  try {
    source = readFileSync(filePath, 'utf8')
  } catch (err) {
    console.error(`[error] Could not read ${filePath}: ${err.message}`)
    hadError = true
    continue
  }

  const filenameFallback = basename(filePath, extname(filePath))
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()

  let result
  try {
    result = transform(source, filenameFallback)
  } catch (err) {
    process.stderr.write(`[warn] Could not parse ${filePath}: ${err.message}\n`)
    continue
  }

  results.push({ filePath, code: result.code, count: result.count })
}

if (writeMode) {
  applyWrites(results)
} else {
  printDryRun(results)
}

process.exit(hadError ? 1 : 0)
