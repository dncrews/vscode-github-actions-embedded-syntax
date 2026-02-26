# GitHub Actions Embedded Syntax Highlighting

This VS Code extension injects embedded syntax highlighting into GitHub Actions YAML.

It supports:

- JavaScript highlighting for `actions/github-script` `with.script` blocks
- `run:` block syntax highlighting based on an explicit step `shell:` value (for common shells/languages), when `shell` appears before `run` in the same step

## Recommended companion extension

For the best overall GitHub Actions editing experience (language mode, schemas, and validations), use this alongside the GitHub Actions extension: `github.vscode-github-actions`.

## What it does

- Detects YAML step entries like `uses: actions/github-script@...`
- Looks for a nested `with:` block
- Treats the `script:` block scalar as embedded JavaScript
- Detects explicit step `shell:` values before `run:`
- Treats `run:` block scalars as embedded shell/language code for common shells

## `run` + `shell` support (experimental heuristic)

Supported explicit `shell:` values:

- `bash`, `sh` -> shell script highlighting
- `pwsh`, `powershell` -> PowerShell highlighting
- `cmd` -> Windows batch highlighting
- `python` -> Python highlighting
- `node` -> JavaScript highlighting

Limitations:

- `shell` must appear before `run` in the same step
- Best support is for block scalars (`run: |` / `run: >`)
- Dynamic expressions or custom shell templates are not detected

## Example

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v8
        with:
          script: |
            const issue = context.issue;
            await github.rest.issues.createComment({
              ...issue,
              body: "hello"
            });
```

## Notes

- This is a TextMate grammar injection, so behavior depends on the installed YAML grammar in VS Code.
- The current heuristic targets `source.yaml` and GitHub Actions-style step structure.
