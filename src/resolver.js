/**
 * Walks up the AST from a JSXOpeningElement path to find the nearest
 * enclosing named React component. Falls back to filenameFallback.
 *
 * @param {import('@babel/traverse').NodePath} jsxPath
 * @param {string} filenameFallback  kebab-cased filename without extension
 * @returns {string}
 */
export function resolveComponentName(jsxPath, filenameFallback) {
  let current = jsxPath.parentPath

  while (current) {
    const { node } = current

    // function LoginForm() { ... }
    if (node.type === 'FunctionDeclaration' && node.id?.name) {
      if (/^[A-Z]/.test(node.id.name)) return node.id.name
    }

    // class LoginForm extends ... { ... }
    if (node.type === 'ClassDeclaration' && node.id?.name) {
      if (/^[A-Z]/.test(node.id.name)) return node.id.name
    }

    // const LoginForm = () => ...  or  const LoginForm = function() { ... }
    if (
      node.type === 'VariableDeclarator' &&
      node.id?.type === 'Identifier' &&
      /^[A-Z]/.test(node.id.name) &&
      (node.init?.type === 'ArrowFunctionExpression' ||
       node.init?.type === 'FunctionExpression')
    ) {
      return node.id.name
    }

    current = current.parentPath
  }

  return filenameFallback
}
