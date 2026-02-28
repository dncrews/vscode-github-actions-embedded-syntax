# Changelog

## [1.0.2](https://github.com/dncrews/vscode-github-actions-embedded-syntax/compare/v1.0.1...v1.0.2) (2026-02-28)


### Bug Fixes

* **grammar:** correct block scalar modifier regex to match YAML spec ([0b1ba77](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/0b1ba773ffd59a54626ead126f6b95c0a6f55703))

## [1.0.1](https://github.com/dncrews/vscode-github-actions-embedded-syntax/compare/v1.0.0...v1.0.1) (2026-02-28)


### Bug Fixes

* **ci:** do not include package name ([72298be](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/72298be64a3bea11b920226aca92bb587455f5a6))
* **ci:** use tokens and please just release this time ([bc7056a](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/bc7056ad4a6b37211330671c0f6993bd388f8866))
* **ci:** versioning needs to happen on semver-like things ([b059996](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/b0599967badecd77552e448486bbfc4edecbe0d4))

## [1.0.0](https://github.com/dncrews/vscode-github-actions-embedded-syntax/compare/vscode-github-actions-embedded-syntax-v0.0.1...vscode-github-actions-embedded-syntax-v1.0.0) (2026-02-27)


### ⚠ BREAKING CHANGES

* shell/run highlighting behavior has changed

### Features

* actions/github-script can now be wrapped in quotes ([d231d04](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/d231d045bdf00a8e10e605b597cbfed72fbdf832))
* add nightly VSIX releases and publish metadata ([b05dbc5](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/b05dbc545c7692339d710a3cf392522631c378ea))
* change injection behavior ([c76b029](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/c76b029b12eb1bb7228be74c5f8f5dfe5a42521f))
* **github-script:** add nodejs syntax highlighting for actions/github-script ([89649dc](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/89649dcc3cddb011380f59356cb926152a96465a))
* **shell:** add additional detection for shell + runs ([912bd15](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/912bd1523071996c713517e8892494020353ad81))


### Bug Fixes

* **ci:** add workflow_dispatch to tests ([0513c49](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/0513c49beef39b31367c07ea61c795705c6c0ee4))
* **docs:** contributing and release process ([ff34557](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/ff34557b49bf0487ed43fb2af3c93c708dc29eea))
* tighten github-script injection and valid scope names ([406328d](https://github.com/dncrews/vscode-github-actions-embedded-syntax/commit/406328d8b404f8b3df44aebb9281941d3b91fdca))

## 0.0.1

- Initial release.
- Adds embedded JavaScript highlighting for `actions/github-script` `with.script` blocks in GitHub Actions YAML.
- Adds heuristic embedded highlighting for `run:` blocks based on an explicit prior `shell:` value in the same step.
