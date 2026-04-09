import { describe, it, expect } from 'vitest'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'
import { resolveComponentName } from '../src/resolver.js'

const traverse = _traverse.default ?? _traverse

function getFirstJSXPath(code) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })
  let found = null
  traverse(ast, {
    JSXOpeningElement(path) {
      if (!found) found = path
    },
  })
  return found
}

describe('resolveComponentName', () => {
  it('resolves a named function declaration', () => {
    const code = `function LoginForm() { return <button /> }`
    const path = getFirstJSXPath(code)
    expect(resolveComponentName(path, 'login-form')).toBe('LoginForm')
  })

  it('resolves a named class declaration', () => {
    const code = `class SignupForm extends React.Component { render() { return <input /> } }`
    const path = getFirstJSXPath(code)
    expect(resolveComponentName(path, 'signup-form')).toBe('SignupForm')
  })

  it('resolves an arrow function assigned to a variable', () => {
    const code = `const ProfileCard = () => <button />`
    const path = getFirstJSXPath(code)
    expect(resolveComponentName(path, 'profile-card')).toBe('ProfileCard')
  })

  it('falls back to filename when no component name found', () => {
    const code = `export default () => <button />`
    const path = getFirstJSXPath(code)
    expect(resolveComponentName(path, 'my-widget')).toBe('my-widget')
  })

  it('does not match a non-function variable (e.g. React.memo wrapper)', () => {
    const code = `const Modal = React.memo(Base); export default function() { return <button /> }`
    const path = getFirstJSXPath(code)
    // The <button /> is inside the anonymous default export, not Modal
    // Modal is not a function initializer, so it should not match
    expect(resolveComponentName(path, 'modal')).toBe('modal')
  })

  it('climbs past inner arrow function helpers to find enclosing component', () => {
    const code = `
      function Dashboard() {
        const renderRow = (item) => <tr />;
        return <table />;
      }
    `
    // getFirstJSXPath finds <tr /> inside renderRow
    const path = getFirstJSXPath(code)
    expect(resolveComponentName(path, 'dashboard')).toBe('Dashboard')
  })
})
