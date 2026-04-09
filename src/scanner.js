import { glob } from 'glob'

const DEFAULT_IGNORE = ['**/node_modules/**', '**/dist/**', '**/.git/**']

/**
 * @param {string} targetPath  File or directory to scan
 * @param {string[]} extraIgnore  Additional glob patterns to ignore
 * @returns {Promise<string[]>}  Absolute file paths
 */
export async function scan(targetPath, extraIgnore = []) {
  const ignore = [...DEFAULT_IGNORE, ...extraIgnore]
  const files = await glob(`${targetPath}/**/*.{jsx,tsx}`, { ignore, absolute: true })
  // Handle case where targetPath is a single file
  if (files.length === 0) {
    const single = await glob(targetPath, { ignore, absolute: true })
    return single.filter((f) => f.endsWith('.jsx') || f.endsWith('.tsx'))
  }
  return files
}
