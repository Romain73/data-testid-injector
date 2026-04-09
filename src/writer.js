import { writeFileSync } from 'fs'

/**
 * Dry-run: print summary to stdout, return total count.
 *
 * @param {Array<{ filePath: string, count: number }>} results
 * @returns {number} total elements that would be tagged
 */
export function printDryRun(results) {
  const affected = results.filter((r) => r.count > 0)
  const total = affected.reduce((sum, r) => sum + r.count, 0)

  if (total === 0) {
    console.log('No elements to tag. All targets already have data-testid or no matching files found.')
    return 0
  }

  console.log(`Found ${results.length} file(s). ${total} element(s) would be tagged.\n`)
  for (const { filePath, count } of affected) {
    console.log(`  ${filePath}  (+${count})`)
  }
  console.log('\nRun with --write to apply changes.')
  return total
}

/**
 * Write mode: write transformed code to disk, print confirmation.
 *
 * @param {Array<{ filePath: string, code: string, count: number }>} results
 * @returns {number} total elements injected
 */
export function applyWrites(results) {
  const affected = results.filter((r) => r.count > 0)
  const total = affected.reduce((sum, r) => sum + r.count, 0)

  if (total === 0) {
    console.log('Nothing to do. All targets already have data-testid or no matching files found.')
    return 0
  }

  for (const { filePath, code, count } of affected) {
    writeFileSync(filePath, code, 'utf8')
    console.log(`✓ ${filePath}  (${count} injected)`)
  }

  console.log(`\nDone. ${total} element(s) tagged across ${affected.length} file(s).`)
  return total
}
