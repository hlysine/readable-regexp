# readable-regexp

[![CI](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml/badge.svg)](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml)
[![Coverage Status](https://coveralls.io/repos/github/hlysine/readable-regex/badge.svg?branch=main)](https://coveralls.io/github/hlysine/readable-regex?branch=main)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)](https://www.typescriptlang.org/)

Create readable Regular Expressions with concise and flexible syntax.

## Installation

### Using a package manager

Install readable-regexp with your preferred package manager, and then import it with CommonJS or ES Modules syntax:

```bash
npm install readable-regexp

yarn add readable-regexp
```

```js
import { r } from 'readable-regexp';

const { r } = require('readable-regexp');
```

### Using a CDN

Import readable-regexp via a script tag in your HTML file, then access the `readableRegExp` global object in your JS code:

```html
<script
  src="https://cdn.jsdelivr.net/npm/readable-regexp@1.0.0/dist/readable-regexp.umd.js"
  integrity="sha256-UV18vP6S2jM3VSSwhk5SsfiA+ugCZ1kWQrU/5GXj75E="
  crossorigin="anonymous"
></script>
```

```js
const { r } = readableRegExp;
```

## Documentation

### Special Tokens

| Function                                               | RegExp equivalent | Explanation                                                       |
|--------------------------------------------------------|-------------------|-------------------------------------------------------------------|
| `` exactly`(yes/no)` ``                                | `\(yes\/no\)`     | Match the given string literally, escaping all special characters |
| `lineFeed`                                             | `\n`              | Match a line feed character                                       |
| `not.lineFeed`<br/>`not(lineFeed)`                     | `[^\n]`           | Match anything other than a line feed                             |
| `carriageReturn`                                       | `\r`              | Match a carriage return character                                 |
| `not.carriageReturn`<br/>`not(carriageReturn)`         | `[^\r]`           | Match anything other than a carriage return                       |
| `backspace`                                            | `[\b]`            | Match a backspace character                                       |
| `not.backspace`<br/>`not(backspace)`                   | `[^\b]`           | Match anything other than a backspace                             |
| `tab`                                                  | `\t`              | Match a tab character                                             |
| `not.tab`<br/>`not(tab)`                               | `[^\t]`           | Match anything other than a tab                                   |
| `verticalWhitespace`                                   | `\v`              | Match a vertical whitespace character                             |
| `not.verticalWhitespace`<br/>`not(verticalWhitespace)` | `[^\v]`           | Match anything other than a vertical whitespace                   |
| `formFeed`                                             | `\f`              | Match a form feed character                                       |
| `not.formFeed`<br/>`not(formFeed)`                     | `[^\f]`           | Match anything other than a form feed                             |
| `nullChar`                                             | `\0`              | Match a null character                                            |
| `not.nullChar`<br/>`not(nullChar)`                     | `[^\0]`           | Match anything not null                                           |
| `` octal`123` ``<br/>`octal('123')`                    | `[\123]`          | Match a character with the given code point in base-8 †           |
| `` hex`3f` ``<br/>`hex('3f')`                          | `\x3f`            | Match a character with the given code point in base-16 ‡          |
| `` unicode`3ef1` ``<br/>`unicode('3ef1')`              | `\u3ef1`          | Match a character with the given code point in base-16 ‡          |

#### † Notes on `octal`

The RegExp output of `octal` is always wrapped in a character class to disambiguate it from capture group back-references.

The maximum allowed value is `0o377`, which is equivalent to `0xff`.

#### ‡ Notes on `hex` and `unicode`

Both have the same effect, but `hex` uses the single-byte escape sequence `\xff` if possible, while `unicode` always 
uses the 2-byte sequence `\uffff`.

### Character Classes

| Function                                                                                                   | RegExp equivalent | Explanation                                                                                     |
|------------------------------------------------------------------------------------------------------------|-------------------|-------------------------------------------------------------------------------------------------|
| `word`                                                                                                     | `\w`              | Match alphanumeric characters and underscore                                                    |
| `not.word`<br/>`not(word)`                                                                                 | `\W`              | Match anything other than `\w`                                                                  |
| `digit`                                                                                                    | `\d`              | Match a character between `0` to `9`                                                            |
| `not.digit`<br/>`not(digit)`                                                                               | `\D`              | Match anything other than a digit                                                               |
| `whitespace`                                                                                               | `\s`              | Match all types of whitespace characters                                                        |
| `not.whitespace`<br/>`not(whitespace)`                                                                     | `\S`              | Match anything other than a whitespace                                                          |
| `char`                                                                                                     | `.`               | `not.char` does not exist because it does not match anything                                    |
| ``charIn`a-z_-` ``<br/>`charIn('a-z', '_-')`<br/>``charIn`a-z` `_-` ``                                     | `[a-z_-]`         | Match a character listed in the group. A hyphen denotes a range of characters, such as `a-z`. † |
| ``notCharIn`a-z_-` ``<br/>``not.charIn`a-z_-` ``<br/>`notCharIn('a-z', '_-')`<br/>``notCharIn`a-z` `_-` `` | `[^a-z_-]`        | Match a character not listed in the group. †                                                    |

#### † Notes on character classes

`charIn` accepts a list of strings and special sequences, but you can also combine the list into one string if you prefer:
- `charIn('a-z0-9' + whitespace)`
- ``charIn`a-z0-9${whitespace}` ``
- ``charIn`a-z0-9\s` ``

However, combining a list of options into one string is not equivalent to a simple string concatenation. `-` is escaped 
at the beginning and end of each string in the list, so `` charIn`a-` `z` `` matches `a`, `-` and `z` literally, while 
`` charIn`a-z` `` matches alphabets from `a` to `z`.

Apart from `-`, `^` and `]` are also escaped in the character class, so you cannot negate a `charIn` via a `^` character 
(you should use `notCharIn`), and you cannot close a character class prematurely.

All other characters are not escaped in `charIn`, so you can use escape sequences such as `\uffff` and `\xff` freely.

### Anchors

| Function                                   | RegExp equivalent | Explanation                                                                       |
|--------------------------------------------|-------------------|-----------------------------------------------------------------------------------|
| `lineStart`                                | `^`               | Assert position at the start of string, or start of line if multiline flag is set |
| `not.lineStart`<br/>`not(lineStart)`       | `(?!^)`           | Assert position not at the start of string/line                                   |
| `lineEnd`                                  | `$`               | Assert position at the end of string, or end of line if multiline flag is set     |
| `not.lineEnd`<br/>`not(lineEnd)`           | `(?!$)`           | Assert position not at the end of string/line                                     |
| `wordBoundary`                             | `\b`              | Assert position at a word boundary, between `word` and non-`word` characters      |
| `not.wordBoundary`<br/>`not(wordBoundary)` | `\B`              | Assert position not at a word boundary                                            |

### Quantifiers

| Function                                                                           | RegExp equivalent | Explanation                                                                                   |
|------------------------------------------------------------------------------------|-------------------|-----------------------------------------------------------------------------------------------|
| `` repeat(3,5)`foo` ``<br/>`` repeat(3,5).exactly`foo` ``<br/>`repeat(3,5)('foo')` | `(?:foo){3,5}`    | Match a token the specified amount of times. Supply 1 parameter for an exact number of times. |
| `` repeatLazily(3,5)`foo` ``<br/>`` repeat.lazily(3,5)`foo` ``                     | `(?:foo){3,5}?`   | Same as `repeat`, but match as short as possible                                              |
| `` atLeast(3)`foo` ``<br/>`` atLeast(3).exactly`foo` ``<br/>`atLeast(3)('foo')`    | `(?:foo){3,}`     | Match a token at least the specified amount of times.                                         |
| `` atLeastLazily(3)`foo` ``<br/>`` atLeast.lazily(3)`foo` ``                       | `(?:foo){3,}?`    | Same as `atLeast`, but match as short as possible                                             |
| `` atMost(3)`foo` ``<br/>`` atMost(3).exactly`foo` ``<br/>`atMost(3)('foo')`       | `(?:foo){,3}`     | Match a token at most the specified amount of times.                                          |
| `` atMostLazily(3)`foo` ``<br/>`` atMost.lazily(3)`foo` ``                         | `(?:foo){,3}?`    | Same as `atMost`, but match as short as possible                                              |
| `` maybe`foo` ``<br/>`` maybe.exactly`foo` ``<br/>`maybe('foo')`                   | `(?:foo)?`        | Match a token 0 to 1 times                                                                    |
| `` maybeLazily`foo` ``<br/>`` maybe.lazily`foo` ``                                 | `(?:foo)??`       | Same as `maybe`, but match as short as possible                                               |
| `` zeroOrMore`foo` ``<br/>`` zeroOrMore.exactly`foo` ``<br/>`zeroOrMore('foo')`    | `(?:foo)*`        | Match a token 0 to infinite times                                                             |
| `` zeroOrMoreLazily`foo` ``<br/>`` zeroOrMore.lazily`foo` ``                       | `(?:foo)*?`       | Same as `zeroOrMore`, but match as short as possible                                          |
| `` oneOrMore`foo` ``<br/>`` oneOrMore.exactly`foo` ``<br/>`oneOrMore('foo')`       | `(?:foo)+`        | Match a token 1 to infinite times                                                             |
| `` oneOrMoreLazily`foo` ``<br/>`` oneOrMore.lazily`foo` ``                         | `(?:foo)+?`       | Same as `oneOrMore`, but match as short as possible                                           |

### Groups

| Function                                                                                               | RegExp equivalent                    | Explanation                                                                                                         |
|--------------------------------------------------------------------------------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| `` capture`foo` ``<br/>`` capture.exactly`foo` ``<br/>`capture('foo')`                                 | `(foo)`                              | Wrap the given token in a capture group                                                                             |
| `` captureAs`name` `foo` ``<br/>`` captureAs`name`.exactly`foo` ``<br/>`captureAs('name')('foo')`      | `(?<name>foo)`                       | Wrap the given token in a named capture group                                                                       |
| `` captureAs`name` `foo`.ref`name` ``<br/>`` capture`foo`.ref(1) ``                                    | `(?<name>foo)\k<name>`<br/>`(foo)\1` | Supply a number to reference the capture group with that index. Supply a string to reference a named capture group. |
| `` group`foo` ``<br/>`` group.exactly`foo` ``<br/>`group('foo')`                                       | `(?:foo)`                            | Wrap the given token in a non-capture group                                                                         |
| `` ahead`foo` ``<br/>`` ahead.exactly`foo` ``<br/>`ahead('foo')`                                       | `(?=foo)`                            | Wrap the given token in a positive lookahead                                                                        |
| `` behind`foo` ``<br/>`` behind.exactly`foo` ``<br/>`behind('foo')`                                    | `(?<=foo)`                           | Wrap the given token in a positive lookbehind                                                                       |
| `` notAhead`foo` ``<br/>`` not.ahead`foo` ``<br/>`` notAhead.exactly`foo` ``<br/>`notAhead('foo')`     | `(?!foo)`                            | Wrap the given token in a negative lookahead                                                                        |
| `` notBehind`foo` ``<br/>`` not.behind`foo` ``<br/>`` notBehind.exactly`foo` ``<br/>`notBehind('foo')` | `(?<!foo)`                           | Wrap the given token in a negative lookbehind                                                                       |
| `` oneOf`foo` `bar` ``<br/>`` oneOf(exactly`foo`, exactly`bar`) ``<br/>`oneOf('foo', 'bar')`           | <code>(?:foo&#124;bar)</code>        | Match one in the provided list of options                                                                           |

### Misc

#### `match`

Include another readable RegExp token in the current expression. This is useful for extracting and re-using common expressions.

Example:

```js
const number = oneOrMore.digit;
const coordinates = match(number).exactly`,`.match(number);
```

This is equivalent to:

```js
const coordinates = oneOrMore.digit.exactly`,`.oneOrMore.digit;
```

#### `toString()`

Get the current expression as a RegExp string. This is a terminal operation, which means no more functions can 
be chained after `toString`, and the string output cannot be converted back to a readable RegExp token.

Back-references are validated when `toString` is called, and an error will be thrown if any of the back-references are 
invalid.

Example:

```js
const coordinates = oneOrMore.digit.exactly`,`.oneOrMore.digit.toString();
// coordinates: \d+,\d+
```

#### `toRegExp(flags?)`

Get a RegExp object of the current expression. This is a terminal operation, which means no more functions can
be chained after `toRegExp`, and the output cannot be converted back to a readable RegExp token.

Back-references are validated when `toRegExp` is called, and an error will be thrown if any of the back-references are
invalid.

You can supply a list of flags to set in the RegExp object:
- `toRegExp('gmi')`
- `` toRegExp`gmi` ``
- `toRegExp(Flag.Global, Flag.MultiLine, Flag.IgnoreCase)`
- `toRegExp('g', 'm', 'i')`

```js
const coordinates = oneOrMore.digit
    .exactly`,`
    .oneOrMore.digit
    .toRegExp(Flag.Global);
console.log(coordinates.exec('[1,2] [3,4]'))
```
