# Contributing

## Development

Install dependencies and run the test suite before opening a pull request:

```sh
npm install
npm test
```

## Commit style

This repository uses conventional commits for release automation. Prefer commit messages like:

- `fix: correct github-script ref matching`
- `feat: add support for quoted github-script uses`
- `feat!: change shell detection behavior`

Breaking changes can also be called out in the commit body:

```text
feat: adjust shell detection

BREAKING CHANGE: shell detection now requires explicit step-level shell keys
```

## Release process

Releases are managed by `release-please`.

1. Conventional commits are merged into `main`.
2. The `Release Please` workflow opens or updates a release PR using the `RELEASE_PLEASE_TOKEN` repository secret.
3. That PR updates `package.json`, `package-lock.json`, and `CHANGELOG.md`.
4. Merging the release PR creates the `v*` tag.
5. The tag triggers the publish workflow for the VS Code extension.

Do not manually bump versions in `package.json` or push release tags unless you are intentionally bypassing the automated release flow.

## Pull requests

The `Tests` workflow runs on pull requests and should stay green before merge.
