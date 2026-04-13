# data-testid-injector

A CLI tool that automatically injects `data-testid` attributes into every `<input>`, `<button>`, `<select>`, and `<textarea>` across your React/JSX codebase — making your app instantly automation-ready without manual tagging.

## Features

- Targets `.jsx` and `.tsx` files
- Generates meaningful test IDs: `ComponentName-elementType-index` (e.g. `LoginForm-button-0`)
- Non-destructive: skips elements that already have a `data-testid`
- Dry-run by default — preview changes before applying them
- CI/CD friendly: clean exit codes, parse errors are non-fatal

## Installation

Clone the repo and link it globally:

```bash
git clone https://github.com/Romain73/data-testid-injector.git
cd data-testid-injector
npm install
npm link
```

The `data-testid-injector` command is now available anywhere on your machine.

To unlink later:

```bash
npm unlink -g data-testid-injector
```

## Usage

```bash
data-testid-injector <path> [options]
```

### Arguments

| Argument          | Description                                         |
| ----------------- | --------------------------------------------------- |
| `<path>`          | Target file or directory (required)                 |
| `--write`         | Apply changes to disk (default: dry-run)            |
| `--ignore <glob>` | Additional glob pattern to ignore (can be repeated) |
| `--version`       | Show version                                        |
| `--help`          | Show help                                           |

### Examples

Preview changes across your entire project:

```bash
data-testid-injector src/
```

Apply changes:

```bash
data-testid-injector src/ --write
```

Target a single file:

```bash
data-testid-injector src/components/LoginForm.tsx --write
```

Ignore generated or legacy folders:

```bash
data-testid-injector src/ --ignore "src/generated/**" --ignore "src/legacy/**"
```

### Dry-run output

```
Found 12 file(s). 34 element(s) would be tagged.

  src/components/LoginForm.tsx  (+3)
  src/components/SignupForm.tsx (+5)
  ...

Run with --write to apply changes.
```

### Write mode output

```
✓ src/components/LoginForm.tsx  (3 injected)
✓ src/components/SignupForm.tsx (5 injected)

Done. 34 element(s) tagged across 12 file(s).
```

## How IDs are generated

IDs follow the pattern `ComponentName-elementType-index`:

```jsx
// Before
function LoginForm() {
  return (
    <div>
      <input type="text" />
      <input type="password" />
      <button type="submit">Login</button>
    </div>
  )
}

// After
function LoginForm() {
  return (
    <div>
      <input type="text" data-testid="LoginForm-input-0" />
      <input type="password" data-testid="LoginForm-input-1" />
      <button type="submit" data-testid="LoginForm-button-0">
        Login
      </button>
    </div>
  )
}
```

**Component name resolution** (in priority order):

1. Named function declaration — `function LoginForm() {}`
2. Named arrow function — `const LoginForm = () => {}`
3. Named class — `class LoginForm extends React.Component {}`
4. Filename fallback — `login-form` from `LoginForm.tsx`

**Index counting** is per-component and per-element-type. Two components in the same file each start their own counters at 0.

## Supported elements

`<input>`, `<button>`, `<select>`, `<textarea>`

## Error handling

| Scenario                   | Behaviour                                             |
| -------------------------- | ----------------------------------------------------- |
| File can't be parsed       | Warning on stderr, file skipped, processing continues |
| File can't be read/written | Error on stderr, exit code 1                          |
| No matching files found    | Informational message, exit code 0                    |
| Invalid path               | Error on stderr, exit code 1                          |

## Testing

The project uses [Vitest](https://vitest.dev/) as the test runner.

### Run the test suite

```bash
npm test
```

### Watch mode

```bash
npm run test:watch
```

### Test structure

```
tests/
├── resolver.test.js       # Component name resolution (6 tests)
├── transformer.test.js    # AST injection logic (6 tests)
├── cli.test.js            # End-to-end CLI tests (6 tests)
└── fixtures/
    ├── input/             # Raw JSX input fixtures
    └── expected/          # Expected transformer output (generated from actual output)
```

#### resolver.test.js

Tests the `resolveComponentName` function in isolation:

- Resolves named function declaration
- Resolves named class declaration
- Resolves arrow function assigned to a variable
- Falls back to filename when no component name found
- Does not match non-function variables (e.g. `React.memo` wrappers)
- Climbs past inner helper functions to find the enclosing component

#### transformer.test.js

Fixture-based tests for the core injection logic:

- Injects `data-testid` on `<button>` and `<input>`
- Skips elements that already have `data-testid`
- Counts indexes independently per element type
- Resolves component name from arrow function
- Falls back to filename when no component name found
- Resets counters per component in multi-component files

#### cli.test.js

Integration tests that spawn the CLI as a subprocess:

- Dry-run reports files and count without modifying them
- `--write` mode modifies files and reports injected count
- Exits with code 1 when called with no arguments
- Exits with code 0 and shows help for `--help`
- Exits gracefully for a nonexistent path
- Prints `[warn]` to stderr on unparseable files and continues

### Test results

```
 ✓ tests/resolver.test.js     (6 tests)
 ✓ tests/transformer.test.js  (6 tests)
 ✓ tests/cli.test.js          (6 tests)

 Test Files  3 passed (3)
      Tests  18 passed (18)
```
