<h1 align="center">readable-regexp</h1>

<div align="center">

[![CI](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml/badge.svg)](https://github.com/hlysine/readable-regexp/actions/workflows/main.yml)
[![Coverage Status](https://coveralls.io/repos/github/hlysine/readable-regexp/badge.svg?branch=main)](https://coveralls.io/github/hlysine/readable-regexp?branch=main)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-blue)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/readable-regexp)](https://www.npmjs.com/package/readable-regexp)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/readable-regexp)](https://www.npmjs.com/package/readable-regexp)
[![Dependencies](https://depx.co/api/badge/readable-regexp)](https://www.npmjs.com/package/readable-regexp)

</div>

<p align="center">
Regular Expressions - quick and concise, readable and composable.
</p>

[![Quick example of readable-regexp](https://github.com/hlysine/readable-regexp/assets/25472513/3c0540d5-1b25-4f83-afb4-7ed16a3a5140)](https://hlysine.gitbook.io/readable-regexp/)

<p align="center">
<a href="#features">Features</a> • <a href="#installation">Installation</a> • <a href="#quick-start--documentation">Quick Start / Documentation</a>
</p>

## Features

### 📖 Readable

Be explicit and extract common pieces

<details>
    <summary>Click to see examples</summary>

--------------------------------

Compare a readable-regexp expression:

```js
const num = capture.oneOf(
  oneOrMore.digit, // integer
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
const allowedChar = notCharIn`<>()[]\\\\` `.,;:@"` (whitespace);

const username =
  oneOrMore.match(allowedChar)
  .zeroOrMore(
    exactly`.`
    .oneOrMore.match(allowedChar)
  );

const quotedString =
  exactly`"`
  .oneOrMore.char
  .exactly`"`;

const ipv4Address =
  exactly`[`
  .repeat(1, 3).digit
  .exactly`.`
  .repeat(1, 3).digit
  .exactly`.`
  .repeat(1, 3).digit
  .exactly`.`
  .repeat(1, 3).digit
  .exactly`]`;

const domainName =
  oneOrMore(
    oneOrMore.charIn`a-z` `A-Z` `0-9` `-`
    .exactly`.`
  )
  .atLeast(2).charIn`a-z` `A-Z`;

const email =
  lineStart
  .capture.oneOf(username, quotedString)
  .exactly`@`
  .capture.oneOf(ipv4Address, domainName)
  .lineEnd
  .toRegExp();
```

This is far more readable and debuggable than the equivalent RegExp:

```js
const email =
  /^([^<>()[\]\\.,;:@"\s]+(?:\.[^<>()[\]\\.,;:@"\s]+)*|".+")@(\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\]|(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,})$/;
```

--------------------------------

</details>

### 📐 Flexible and Concise

Multiple shorthands and syntax options

<details>
  <summary>Click to see examples</summary>

--------------------------------

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

--------------------------------

</details>

### 🛟 Safe

Type check, auto-complete, and runtime safeguards

<details>
    <summary>Click to see examples</summary>

--------------------------------

Some errors can be avoided just by writing in readable-regexp:

```js
const o = 'Ȯ'; // 0x022e
const result1 = /\u22e/.test(n);
// false

const result2 = unicode`22e`.toRegExp().test(n);
// true
// '22e' is automatically fixed to be '\u022e'
```

Some errors can be caught by TypeScript at compile time:

**(Not working at the moment. These errors will either be thrown at runtime or be handled by readable-regexp to produce reasonable RegExp.)**

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
const result1 = /(foo)\2/.test('foofoo');
// false

const result2 = capture`foo`.ref(2).toRegExp().test('foofoo');
// Error: The following backreferences are not defined: 2
```

--------------------------------

</details>

## Installation

### With a package manager

```bash
npm install readable-regexp

yarn add readable-regexp
```

```js
import { oneOrMore, exactly } from 'readable-regexp';

const { oneOrMore, exactly } = require('readable-regexp');
```

### With a CDN

```html
<script src="https://cdn.jsdelivr.net/npm/readable-regexp/dist/readable-regexp.umd.js"></script>
```

```js
const { oneOrMore, exactly } = readableRegExp;
```

## Quick Start / Documentation

| [**Quick Start**](https://hlysine.gitbook.io/readable-regexp/getting-started/installation) |
|:------------------------------------------------------------------------------------------:|
| [**Documentation**](https://hlysine.gitbook.io/readable-regexp/)                           |
| [**TypeDoc**](https://hlysine.github.io/readable-regexp/)                                  |