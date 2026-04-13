import recast from 'recast'
import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'
import * as t from '@babel/types'
import { resolveComponentName } from './resolver.js'

const traverse = _traverse.default ?? _traverse

const TARGET_ELEMENTS = new Set(['input', 'button', 'select', 'textarea'])

function babelParseForRecast(source) {
  return babelParse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    tokens: true,
  })
}

/**
 * @param {string} source  Raw file contents
 * @param {string} filenameFallback  kebab-cased filename without extension
 * @returns {{ code: string, count: number }}
 */
export function transform(source, filenameFallback) {
  const ast = recast.parse(source, { parser: { parse: babelParseForRecast } })

  // counters[componentName][elementType] = number
  const counters = {}
  let count = 0

  traverse(ast, {
    JSXOpeningElement(path) {
      const nameNode = path.node.name
      if (nameNode.type !== 'JSXIdentifier') return
      const tagName = nameNode.name
      if (!TARGET_ELEMENTS.has(tagName)) return

      const alreadyTagged = path.node.attributes.some(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name === 'data-testid'
      )
      if (alreadyTagged) return

      const componentName = resolveComponentName(path, filenameFallback)

      if (!counters[componentName]) counters[componentName] = {}
      if (counters[componentName][tagName] === undefined) {
        counters[componentName][tagName] = 0
      }

      const index = counters[componentName][tagName]++
      const testId = `${componentName}-${tagName}-${index}`

      path.node.attributes.push(
        t.jsxAttribute(
          t.jsxIdentifier('data-testid'),
          t.stringLiteral(testId)
        )
      )

      count++
    },
  })

  const { code } = recast.print(ast)

  return { code, count }
}
