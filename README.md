# GitHub Actions `actions/github-script` Syntax Highlighting

This VS Code extension injects JavaScript syntax highlighting into GitHub Actions YAML when a step uses `actions/github-script` and contains a `with.script: |` block.

## What it does

- Detects YAML step entries like `uses: actions/github-script@...`
- Looks for a nested `with:` block
- Treats the `script:` block scalar as embedded JavaScript

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
