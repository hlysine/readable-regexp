# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2023-08-18

### Changed

- Escape backslashes at the end of a character class option string

## [1.3.1] - 2023-08-18

### Added

- Documentation for all tokens
- A TypeDoc presenting documentations

### Changed

- Updated documentation in README
- Fixed `not` token potentially negating a numbered back-reference


## [1.3.0] - 2023-08-17

### Added

- More strict error checking for alternation and quantifiers
- Multi-paremeter support for `match`

### Changed

- Fixed the RegExp syntax of the `atMost` quantifier
- Updated some error messages to include more info
- Updated documentation in README

## [1.2.1] - 2023-08-16

### Changed

- Fixed typos in README
- Changed build pipeline to use Node 18

## [1.2.0] - 2023-08-16

### Added

- Conditional imports for ESM and CJS

### Changed

- Updated build dependencies
- Simplified TS types to fix type recursion error
- Updated documentation in README

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
[1.2.0]: https://github.com/hlysine/readable-regexp/releases/tag/v1.2.0
[1.2.1]: https://github.com/hlysine/readable-regexp/releases/tag/v1.2.1
[1.3.0]: https://github.com/hlysine/readable-regexp/releases/tag/v1.3.0
[1.3.1]: https://github.com/hlysine/readable-regexp/releases/tag/v1.3.1
[1.3.2]: https://github.com/hlysine/readable-regexp/releases/tag/v1.3.2
