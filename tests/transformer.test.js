import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { transform } from '../src/transformer.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function fixture(name) {
  return {
    input: readFileSync(join(__dirname, 'fixtures/input', name), 'utf8'),
    expected: readFileSync(join(__dirname, 'fixtures/expected', name), 'utf8'),
  }
}

describe('transform', () => {
  it('injects data-testid on button and input', () => {
    const { input, expected } = fixture('basic-button.jsx')
    const { code, count } = transform(input, 'basic-button')
    expect(code).toBe(expected)
    expect(count).toBe(2)
  })

  it('skips elements that already have data-testid', () => {
    const { input, expected } = fixture('already-tagged.jsx')
    const { code, count } = transform(input, 'already-tagged')
    expect(code).toBe(expected)
    expect(count).toBe(1)
  })

  it('counts indexes independently per element type', () => {
    const { input, expected } = fixture('multiple-types.jsx')
    const { code, count } = transform(input, 'multiple-types')
    expect(code).toBe(expected)
    expect(count).toBe(5)
  })

  it('resolves component name from arrow function', () => {
    const { input, expected } = fixture('arrow-function.jsx')
    const { code, count } = transform(input, 'arrow-function')
    expect(code).toBe(expected)
    expect(count).toBe(1)
  })

  it('falls back to filename when no component name found', () => {
    const { input, expected } = fixture('filename-fallback.jsx')
    const { code, count } = transform(input, 'filename-fallback')
    expect(code).toBe(expected)
    expect(count).toBe(1)
  })

  it('resets counters per component in multi-component files', () => {
    const { input, expected } = fixture('multiple-components.jsx')
    const { code, count } = transform(input, 'multiple-components')
    expect(code).toBe(expected)
    expect(count).toBe(2)
  })

  it('injects data-testid on a, form, and li elements', () => {
    const { input, expected } = fixture('new-elements.jsx')
    const { code, count } = transform(input, 'new-elements')
    expect(code).toBe(expected)
    expect(count).toBe(5)
  })
})
