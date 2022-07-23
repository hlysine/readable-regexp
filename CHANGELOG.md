# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2022-07-23

### Added

- Hexadecimal and octal character escape sequences (`hex`, `octal`)
- Special tokens `\f` and `[\b]` (`formFeed`, `backspace`)
- Support for flags in the `toRegExp` function

## [1.0.0] - 2022-07-22

### Added

- Readable versions of RegExp tokens, quantifiers and group constructs
- Tests for the added features
- Basic readme
- Rollup build config for ES Modules and UMD formats
- Rollup build config for a .d.ts file

[1.0.0]: https://github.com/hlysine/readable-regexp/releases/tag/v1.0.0
[1.1.0]: https://github.com/hlysine/readable-regexp/releases/tag/v1.1.0
