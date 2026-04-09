import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawnSync } from 'child_process'
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI = join(__dirname, '../bin/index.js')
const FIXTURE_INPUT = join(__dirname, 'fixtures/input/integration/LoginForm.tsx')
const FIXTURE_ORIGINAL = join(__dirname, 'fixtures/input/integration/LoginForm.original.tsx')

function runCLI(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' })
}

beforeEach(() => {
  copyFileSync(FIXTURE_INPUT, FIXTURE_ORIGINAL)
})

afterEach(() => {
  copyFileSync(FIXTURE_ORIGINAL, FIXTURE_INPUT)
})

describe('CLI', () => {
  it('dry-run reports files and count without modifying', () => {
    const result = runCLI([FIXTURE_INPUT])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('would be tagged')
    expect(result.stdout).toContain('LoginForm.tsx')
    const after = readFileSync(FIXTURE_INPUT, 'utf8')
    const before = readFileSync(FIXTURE_ORIGINAL, 'utf8')
    expect(after).toBe(before)
  })

  it('--write mode modifies file and reports injected count', () => {
    const result = runCLI([FIXTURE_INPUT, '--write'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('injected')
    const modified = readFileSync(FIXTURE_INPUT, 'utf8')
    expect(modified).toContain('data-testid="LoginForm-input-0"')
    expect(modified).toContain('data-testid="LoginForm-input-1"')
    expect(modified).toContain('data-testid="LoginForm-button-0"')
  })

  it('exits 1 with no arguments', () => {
    const result = runCLI([])
    expect(result.status).toBe(1)
  })

  it('exits 0 with --help', () => {
    const result = runCLI(['--help'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Usage:')
  })

  it('exits gracefully for nonexistent path', () => {
    const result = runCLI(['/nonexistent/path/that/does/not/exist'])
    expect(result.error).toBeUndefined()
  })

  it('prints warning to stderr on unparseable file but continues', () => {
    const badFile = join(__dirname, 'fixtures/input/bad-syntax.jsx')
    writeFileSync(badFile, 'this is not valid jsx }{{{', 'utf8')
    const result = runCLI([badFile])
    expect(result.stderr).toContain('[warn]')
  })
})
