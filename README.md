# GitHub Actions Embedded Syntax Highlighting

[![Nightly](https://img.shields.io/github/v/release/dncrews/vscode-github-actions-embedded-syntax?display_name=tag&include_prereleases&label=nightly)](https://github.com/dncrews/vscode-github-actions-embedded-syntax/releases/tag/nightly)
[![Release workflow](https://img.shields.io/github/actions/workflow/status/dncrews/vscode-github-actions-embedded-syntax/release.yml?label=release)](https://github.com/dncrews/vscode-github-actions-embedded-syntax/actions/workflows/release.yml)
[![License](https://img.shields.io/github/license/dncrews/vscode-github-actions-embedded-syntax)](https://github.com/dncrews/vscode-github-actions-embedded-syntax/blob/main/LICENSE)

This VS Code extension injects embedded syntax highlighting into GitHub Actions YAML.

<img src="https://raw.githubusercontent.com/dncrews/vscode-github-actions-embedded-syntax/main/media/after.png" alt="Embedded syntax highlighting preview" width="450" />

It supports:

- JavaScript highlighting for `actions/github-script` `with.script` blocks
- `run:` block syntax highlighting based on an explicit step `shell:` value (for common shells/languages), when `shell` appears before `run` in the same step

## Requirements

- VS Code 1.85.0 or newer
- A YAML grammar that exposes the standard scopes VS Code uses for YAML and embedded TextMate injections
- Best results when used alongside `github.vscode-github-actions`

## Installation

Install from the VS Code Marketplace:

- Search for `GitHub Actions Embedded Syntax Highlighting`
- Or install from the command line:

```sh
code --install-extension dncrews.vscode-github-actions-embedded-syntax
```

If you want to test a local package instead:

```sh
npm install
npm run package
code --install-extension vscode-github-actions-embedded-syntax-0.0.1.vsix
```

To try the latest build from `main` before a Marketplace release:

1. Download the `.vsix` from the [Nightly release](https://github.com/dncrews/vscode-github-actions-embedded-syntax/releases/tag/nightly).
2. In VS Code, run `Extensions: Install from VSIX...`.
3. Select the downloaded `.vsix` file.

The `Nightly` prerelease is overwritten on each push to `main` and is intended for testing the latest unreleased build.

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

## Limitations

- `shell` must appear before `run` in the same step
- Best support is for block scalars (`run: |` / `run: >`)
- Dynamic expressions or custom shell templates are not detected
- Behavior depends on the installed YAML grammar because this extension works by TextMate grammar injection

## Before / After

Without this extension, embedded script content in workflow files is treated like plain YAML text:

![Before syntax highlighting](https://raw.githubusercontent.com/dncrews/vscode-github-actions-embedded-syntax/main/media/before.png)

With this extension, `actions/github-script` and supported `run` + `shell` blocks get embedded language highlighting:

![After syntax highlighting](https://raw.githubusercontent.com/dncrews/vscode-github-actions-embedded-syntax/main/media/after.png)

## Notes

- This is a TextMate grammar injection, so behavior depends on the installed YAML grammar in VS Code.
- The current heuristic targets `source.yaml` and GitHub Actions-style step structure.

## Development

```sh
npm install
npm test
npm run package
```

The packaged `.vsix` can be installed locally in VS Code for manual validation.

## Publishing

This repository includes GitHub Actions release automation. For local publishing, authenticate `vsce` with a Visual Studio Marketplace personal access token and then run:

```sh
npm install
npm run publish:extension
```

For GitHub Actions publishing, add a `VSCE_PAT` repository secret. Tagged releases will package the extension, upload the `.vsix` as an artifact, and publish to the Marketplace when that secret is available. Pushes to `main` also update a GitHub prerelease named `Nightly` with the latest `.vsix` attached for manual testing.

Versioned releases are managed by `release-please` from conventional commits on `main`. The [release-please.yml](/Users/crewsdx/Developer/vscode-syntax-gha/.github/workflows/release-please.yml) workflow opens or updates a release PR with the generated changelog and version bumps. When that PR is merged, `release-please` creates the `v*` tag and your existing release workflow publishes the extension from that tag.

## Support

Issues and feature requests: [GitHub issues](https://github.com/dncrews/vscode-github-actions-embedded-syntax/issues)
