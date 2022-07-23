# readable-regexp

[![CI](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml/badge.svg)](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml)
[![Coverage Status](https://coveralls.io/repos/github/hlysine/readable-regex/badge.svg?branch=main)](https://coveralls.io/github/hlysine/readable-regex?branch=main)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/readable-regexp)](https://www.npmjs.com/package/readable-regexp)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/readable-regexp)](https://www.npmjs.com/package/readable-regexp)

Create readable Regular Expressions with concise and flexible syntax.

## Table of Contents

- [Installation](#installation)
    - [Using a package manager](#using-a-package-manager)
    - [Using a CDN](#using-a-cdn)
- [Features](#features)
    - [Readability](#readability)
    - [Flexibility & Conciseness](#flexibility--conciseness)
    - [Safety](#safety)
- [Documentation](#documentation)
    - [Syntax Rules](#syntax-rules)
    - [Special Tokens](#special-tokens)
    - [Character Classes](#character-classes)
    - [Anchors](#anchors)
    - [Quantifiers](#quantifiers)
    - [Groups](#groups)
    - [Misc](#misc)

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
  src="https://cdn.jsdelivr.net/npm/readable-regexp/dist/readable-regexp.umd.js"
></script>
```

```js
const { r } = readableRegExp;
```

## Features

### Readability

readable-regexp offers much better readability, so you don't need to confuse your future self or write tons of comment 
just to explain 1 line of regexp. It also allows you to extract and re-use repeating parts of an expression, and to add
inline comments to a part of the expression.

<details>
    <summary>Click to see examples</summary>

Compare a readable-regexp expression:

```js
const num = capture.oneOf(
    oneOrMore.digit,  // integer
    zeroOrMore.digit.exactly`.`.oneOrMore.digit // decimal
);
const regExp = match(num).exactly`,`.maybe` `.match(num).toRegExp(Flag.Global); // num is used twice here
```

With normal JS RegExp:

```js
const regExp = /(\d+|\d*\.\d+), ?(\d+|\d*\.\d+)/g; // we have to copy-paste the capture group
```

In a more complex use case, we can destructure the expression into manageable small parts:

```js
const protocol = captureAs`protocol`.oneOf(exactly`http`.maybe`s`)`smtp``ftp`; // this is short for oneOf(exactly`http`.maybe`s`, 'smtp', 'ftp')
const domain = captureAs`domain`(oneOrMore.charIn(word, '-').oneOrMore(exactly`.`.oneOrMore.charIn(word, '-')));
const port = exactly`:`.captureAs`port`.oneOrMore.digit;
const path = exactly`/`.maybe.captureAs`path`(
  oneOrMore.charIn(word, '-.').zeroOrMore(exactly`/`.oneOrMore.charIn(word, '-.'))
);
const query = exactly`?`.captureAs`query`.zeroOrMore.char;

// combining all the parts above
const regExp = lineStart
    .match(protocol)
    .exactly`://`
    .match(domain)
    .maybe(port)
    .maybe(path)
    .maybe(query)
    .lineEnd
    .toRegExp();
```

This is far more readable and debuggable than the equivalent RegExp:

```js
const regExp = /^(?<protocol>https?|smtp|ftp):\/\/(?<domain>[\w\-]+(?:\.[\w\-]+)+)(?::(?<port>\d+))?(?:\/(?<path>[\w\-.]+(?:\/[\w\-.]+)*)?)?(?:\?(?<query>.*))?$/;
```
</details>

### Flexibility & Conciseness

Readability is important, but conciseness is also equally important. This is why readable-regexp offers multiple 
shorthands and alternative syntax which you can adopt if you prefer.

<details>
  <summary>Click to see examples</summary>

Without all the shorthands, an expression looks like this:

```js
const regExp = exactly('[')
    .captureAs('timestamp')(oneOrMore(not(charIn(']'))))
    .exactly('] ')
    .captureAs('category')(oneOrMore(word).exactly('-').oneOrMore(word))
    .exactly(': ')
    .captureAs('message')(oneOrMore(char))
    .toRegExp('gm');
```

Whenever a function takes a single string literal, you can use a tagged template literal to remove the brackets:

```js
const regExp = exactly`[`
    .captureAs`timestamp`(oneOrMore(not(charIn`]`)))
    .exactly`] `
    .captureAs`category`(oneOrMore(word).exactly`-`.oneOrMore(word))
    .exactly`: `
    .captureAs`message`(oneOrMore(char))
    .toRegExp`gm`;
```

When there is only one token in a quantifier or group, you can chain it with `.` instead of using a bracket:

```js
const regExp = exactly`[`
    .captureAs`timestamp`.oneOrMore.not.charIn`]`
    .exactly`] `
    .captureAs`category`(oneOrMore.word.exactly`-`.oneOrMore.word)
    .exactly`: `
    .captureAs`message`.oneOrMore.char
    .toRegExp`gm`;
```

There are shorthands for negating a character class or a lookaround:

```js
const regExp = exactly`[`
    .captureAs`timestamp`.oneOrMore.notCharIn`]`
    .exactly`] `
    .captureAs`category`(oneOrMore.word.exactly`-`.oneOrMore.word)
    .exactly`: `
    .captureAs`message`.oneOrMore.char
    .toRegExp`gm`;
```

As you can see, most of the distracting brackets are gone, and you are left with a clean and concise expression.
</details>

### Safety

readable-regexp is written in TypeScript with strong typing, so auto-complete is available and a lot of common mistakes 
can be caught at compile time.
There is also additional type and reference checking at run time, allowing you to catch errors before even creating a
RegExp object.

<details>
    <summary>Click to see examples</summary>

Some errors can be avoided just by writing in readable-regexp:

```js
const o = "Ȯ"; // 0x022e
const result1 = /\u22e/.test(n);
// false

const result2 = unicode`22e`.toRegExp().test(n);
// true
// '22e' is automatically fixed to be '\u022e'
```

Some errors can be caught by TypeScript at compile time:

```js
// @ts-expect-error - You cannot use two quantifiers on one token
const regExp = oneOrMore.zeroOrMore`foo`;
```

```js
// @ts-expect-error - char is not negatable, because it matches nothing
const regExp = oneOrMore.not.char;
```

```js
// @ts-expect-error - k is not a valid flag
const regExp = char.toRegExp('gki');
```

Some can be caught at run time:

```js
const result1 = /(foo)\2/.test("foofoo");
// false

const result2 = capture`foo`.ref(2).toRegExp().test("foofoo");
// Error: The following backreferences are not defined: 2
```
</details>

## Documentation

### Syntax Rules

- Chain function calls with `.` to represent consecutive tokens.
  - `` exactly`fo`.maybe`o` `` = `foo?`


- Using a tagged template literal is equal to calling the function with one string argument. Interpolation also works in the tagged template literals.
  - `` exactly`foo` `` = `exactly('foo')`
  - `` exactly`foo${someVar}` `` = `exactly('foo' + someVar)`


- Chaining function calls is equal to calling the function with multiple arguments.
  - `` oneOf`foo` `bar` `baz` `` = `oneOf('foo')('bar')('baz')` = `oneOf('foo', 'bar', 'baz')`
  - `` oneOf`foo` `bar` (maybe.digit) `` = `oneOf('foo', 'bar', maybe.digit)`


- All expressions can be coerced to string. This is especially useful in character classes.
  - `` charIn`${word}-.` `` = `` charIn`\w-.` ``


- If a function expects an expression and your expression consists of 1 token only, you can chain the call to omit the bracket.
  - `oneOrMore(word)` = `oneOrMore.word`
  - `maybe(not(digit))` = `maybe.not.digit`

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
