export type RegExpLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export interface LiteralFunction {
  (literal: string): RegExpToken;
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken;
}

export interface NumberFunction {
  (num: number): RegExpToken;
}

export interface TokenFunction {
  (node: RegExpToken): RegExpToken;
}

export interface MultiTokenFunction {
  (...nodes: RegExpToken[]): RegExpToken;
}

export interface GroupFunction {
  (node?: RegExpToken): RegExpToken;
}

export interface AlternationFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken & AlternationFunction;
  (...args: (string | RegExpToken)[]): RegExpToken & AlternationFunction;
}

export interface NamedCaptureFunction {
  (name: string): LiteralFunction & GroupFunction & RegExpToken;
  (template: TemplateStringsArray, ...args: unknown[]): LiteralFunction & GroupFunction & RegExpToken;
}

export interface RepeatFunction {
  (min: number, max?: number): LiteralFunction & TokenFunction & RegExpToken;
}

export interface LimitFunction {
  (limit: number): LiteralFunction & TokenFunction & RegExpToken;
}

export interface CharClassFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken & CharClassFunction;
  (...args: (string | RegExpToken)[]): RegExpToken & CharClassFunction;
}

/**
 * Flags that can be set in a RegExp object.
 */
export enum Flag {
  /**
   * Allows more than 1 match.
   */
  Global = 'g',
  /**
   * ^ and $ match start/end of line.
   */
  MultiLine = 'm',
  /**
   * Case insensitive.
   */
  IgnoreCase = 'i',
  /**
   * The next match must follow the previous one.
   */
  Sticky = 'y',
  /**
   * Use full unicode.
   */
  Unicode = 'u',
  /**
   * Dot matches newlines.
   */
  SingleLine = 's',
  /**
   * Output match indices.
   */
  Indices = 'd',
}

export type FlagUnion = `${Flag}`;

export type FlagsString<TFlags extends string> = TFlags extends ''
  ? ''
  : TFlags extends `${FlagUnion}${infer rest}`
  ? TFlags extends `${infer first}${rest}`
    ? `${first}${FlagsString<rest>}`
    : never
  : never;

export interface FlagFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegExp;
  (...flags: FlagUnion[]): RegExp;
  <TFlag extends string>(flags?: FlagsString<TFlag> & TFlag): RegExp;
}

export interface RegExpToken {
  /**
   * Get the current expression as a RegExp string. This is a terminal operation, which means no more functions can be
   * chained after toString, and the string output cannot be converted back to a readable RegExp token.
   *
   * Back-references are validated when `toString` is called, and an error will be thrown if any of the back-references
   * are invalid.
   *
   * @example
   * ```js
   * const coordinates = oneOrMore.digit.exactly`,`.oneOrMore.digit.toString();
   * expect(coordinates).toBe("\\d+,\\d+");
   * ```
   */
  toString(): string;
  /**
   * Get a RegExp object of the current expression. This is a terminal operation, which means no more functions can be
   * chained after toRegExp, and the output cannot be converted back to a readable RegExp token.
   *
   * Back-references are validated when toRegExp is called, and an error will be thrown if any of the back-references
   * are invalid.
   *
   * You can supply a list of flags to set in the RegExp object:
   * -     toRegExp('gmi')
   * -     toRegExp`gmi`
   * -     toRegExp(Flag.Global, Flag.MultiLine, Flag.IgnoreCase)
   * -     toRegExp('g', 'm', 'i')
   *
   * @example
   * ```js
   * const coordinates = oneOrMore.digit
   *   .exactly`,`
   *   .oneOrMore.digit
   *   .toRegExp(Flag.Global);
   * console.log(coordinates.exec('[1,2] [3,4]'));  // expect 2 matches
   * ```
   */
  toRegExp: FlagFunction;

  /**
   * Match any character other than newline (or including line terminators when single line flag is set).
   *
   * Note: `not.char` does not exist because it does not match anything.
   *
   * @example
   *
   * ```js
   * char
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /./
   * ```
   */
  get char(): RegExpToken;

  /**
   * Match all types of whitespace characters.
   *
   * When negated: match anything other than a whitespace.
   *
   * @example
   *
   * ```js
   * whitespace
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\s/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.whitespace
   * not(whitespace)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\S/
   * ```
   */
  get whitespace(): RegExpToken;

  /**
   * Match a character between 0 to 9.
   *
   * @example
   *
   * ```js
   * digit
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\d/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.digit
   * not(digit)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\D/
   * ```
   */
  get digit(): RegExpToken;

  /**
   * Match alphanumeric characters and underscore.
   *
   * @example
   *
   * ```js
   * word
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\w/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.word
   * not(word)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\W/
   * ```
   */
  get word(): RegExpToken;

  /**
   * Match a vertical whitespace character.
   *
   * @example
   *
   * ```js
   * verticalWhitespace
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\v/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.verticalWhitespace
   * not(verticalWhitespace)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\v]/
   * ```
   */
  get verticalWhitespace(): RegExpToken;

  /**
   * Match a backspace character.
   *
   * @example
   *
   * ```js
   * backspace
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[\b]/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.backspace
   * not(backspace)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\b]/
   * ```
   */
  get backspace(): RegExpToken;

  /**
   * Match a line feed character.
   *
   * @example
   *
   * ```js
   * lineFeed
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\n/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.lineFeed
   * not(lineFeed)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\n]/
   * ```
   */
  get lineFeed(): RegExpToken;

  /**
   * Match a form feed character.
   *
   * @example
   *
   * ```js
   * formFeed
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\f/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.formFeed
   * not(formFeed)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\f]/
   * ```
   */
  get formFeed(): RegExpToken;

  /**
   * Match a carriage return character.
   *
   * @example
   *
   * ```js
   * carriageReturn
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\r/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.carriageReturn
   * not(carriageReturn)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\r]/
   * ```
   */
  get carriageReturn(): RegExpToken;

  /**
   * Match a tab character.
   *
   * @example
   *
   * ```js
   * tab
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\t/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.tab
   * not(tab)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\t]/
   * ```
   */
  get tab(): RegExpToken;

  /**
   * Match a null character.
   *
   * @example
   *
   * ```js
   * nullChar
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\0/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.nullChar
   * not(nullChar)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\0]/
   * ```
   */
  get nullChar(): RegExpToken;

  /**
   * Assert position at the start of string, or start of line if multiline flag is set.
   *
   * @example
   *
   * ```js
   * lineStart
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /^/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.lineStart
   * not(lineStart)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?!^)/
   * ```
   */
  get lineStart(): RegExpToken;

  /**
   * Assert position at the end of string, or end of line if multiline flag is set.
   *
   * @example
   *
   * ```js
   * lineEnd
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /$/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.lineEnd
   * not(lineEnd)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?!$)/
   * ```
   */
  get lineEnd(): RegExpToken;

  /**
   * Assert position at a word boundary, between `word` and non-`word` characters.
   *
   * @example
   *
   * ```js
   * wordBoundary
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\b/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * not.wordBoundary
   * not(wordBoundary)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\B/
   * ```
   */
  get wordBoundary(): RegExpToken;

  /**
   * Match the given string literally, escaping all special characters.
   *
   * @example
   *
   * ```js
   * exactly`match`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /match/
   * ```
   *
   * @example
   *
   * ```js
   * exactly`(yes/no)`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\(yes\/no\)/
   * ```
   */
  get exactly(): LiteralFunction;

  /**
   * Match a character with the given code point in base-8.
   *
   * Notes:
   *
   * The RegExp output of `octal` is always wrapped in a character class to disambiguate it from capture group
   * back-references.
   *
   * The maximum allowed value is `0o377`, which is equivalent to `0xff`.
   *
   * @example
   *
   * ```js
   * octal`123`
   * octal('123')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[\123]/
   * ```
   */
  get octal(): LiteralFunction;

  /**
   * Match a character with the given code point in base-16.
   *
   * Notes:
   *
   * Both `hex` and `unicode` have the same effect, but `hex` uses the single-byte escape sequence `\xff` if possible,
   * while `unicode` always uses the 2-byte sequence `\uffff`.
   *
   * @example
   *
   * ```js
   * hex`3f`
   * hex('3f')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\x3f/
   * ```
   */
  get hex(): LiteralFunction;

  /**
   * Match a character with the given code point in base-16.
   *
   * Notes:
   *
   * Both `hex` and `unicode` have the same effect, but `hex` uses the single-byte escape sequence `\xff` if possible,
   * while `unicode` always uses the 2-byte sequence `\uffff`.
   *
   * @example
   *
   * ```js
   * unicode`3ef1`
   * unicode('3ef1')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /\u3ef1/
   * ```
   */
  get unicode(): LiteralFunction;

  /**
   * Match a character listed in the group. A hyphen denotes a range of characters, such as `a-z`.
   *
   * Notes:
   *
   * `charIn` accepts a list of strings and special sequences, but you can also combine the list into one string if you
   * prefer:
   *
   *  -     charIn('a-z0-9' + whitespace)
   *  -     charIn`a-z0-9${whitespace}`
   *  -     charIn`a-z0-9\s`
   *
   * However, combining a list of options into one string is not equivalent to a simple string concatenation. `-` is
   * escaped at the beginning and end of each string in the list, so `` charIn`a-` `z` `` matches `a`, `-` and `z`
   * literally, while `` charIn`a-z` `` matches alphabets from `a` to `z`.
   *
   * Apart from `-`, `^` and `]` are also escaped in the character class, so you cannot negate a `charIn` via a `^`
   * character (you should use `notCharIn`), and you cannot close a character class prematurely.
   *
   * All other characters are not escaped in `charIn`, so you can use escape sequences such as `\uffff` and `\xff`
   * freely.
   *
   * @example
   *
   * ```js
   * charIn`a-z_-`
   * charIn('a-z', '_-')
   * charIn`a-z``_-`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[a-z_-]/
   * ```
   *
   * @example Negated token
   *
   * ```js
   * notCharIn`a-z_-`
   * not.charIn`a-z_-`
   * notCharIn('a-z', '_-')
   * notCharIn`a-z``_-`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^a-z_-]/
   * ```
   */
  get charIn(): CharClassFunction;

  /**
   * Match a character not listed in the group. A hyphen denotes a range of characters, such as `a-z`.
   *
   * `notCharIn` is a short form of `not.charIn`. For details regarding character classes, see the documentation of
   * {@link charIn}.
   *
   * @example
   *
   * ```js
   * notCharIn`a-z_-`
   * not.charIn`a-z_-`
   * notCharIn('a-z', '_-')
   * notCharIn`a-z``_-`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^a-z_-]/
   * ```
   */
  get notCharIn(): CharClassFunction;

  /**
   * Negate a given token, causing it to match anything other than the token itself.
   *
   * Negatable tokens: `lineFeed`, `carriageReturn`, `backspace`, `tab`, `verticalWhitespace`, `formFeed`, `nullChar`,
   * `octal`, `hex`, `unicode`, `word`, `digit`, `whitespace`, `charIn`, `lineStart`, `lineEnd`, `wordBoundary`,
   * `ahead`, `behind`
   *
   * Examples are provided in the documentation of the negatable tokens themselves.
   *
   * @example
   *
   * ```js
   * not.lineFeed
   * not(lineFeed)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /[^\n]/
   * ```
   */
  get not(): TokenFunction & RegExpToken;

  /**
   * Match a token the specified amount of times. Supply 1 parameter for an exact number of times, or 2 parameters for
   * min/max.
   *
   * @example 2 parameters for min/max
   *
   * ```js
   * repeat(3,5)`foo`
   * repeat(3,5).exactly`foo`
   * repeat(3,5)('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,5}/
   * ```
   *
   * @example 1 parameter for exact number
   *
   * ```js
   * repeat(3)`foo`
   * repeat(3).exactly`foo`
   * repeat(3)('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3}/
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * repeatLazily(3,5)`foo`
   * repeat.lazily(3,5)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,5}?/
   * ```
   */
  get repeat(): RepeatFunction;

  /**
   * Match a token the specified amount of times, trying to match as short as possible. Supply 1 parameter for an exact
   * number of times, or 2 parameters for min/max.
   *
   * `repeatLazily` is a short form of `repeat.lazily`. See the documentation of {@link repeat} for more details.
   *
   * @example
   *
   * ```js
   * repeatLazily(3,5)`foo`
   * repeat.lazily(3,5)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,5}?/
   * ```
   */
  get repeatLazily(): RepeatFunction;

  /**
   * Match a token at least the specified amount of times.
   *
   * @example
   *
   * ```js
   * atLeast(3)`foo`
   * atLeast(3).exactly`foo`
   * atLeast(3)('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,}/
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * atLeastLazily(3)`foo`
   * atLeast.lazily(3)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,}?/
   * ```
   */
  get atLeast(): LimitFunction;

  /**
   * Match a token at least the specified amount of times, trying to match as short as possible.
   *
   * `atLeastLazily` is a short form of `atLeast.lazily`. See the documentation of {@link atLeast} for more details.
   *
   * @example
   *
   * ```js
   * atLeastLazily(3)`foo`
   * atLeast.lazily(3)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){3,}?/
   * ```
   */
  get atLeastLazily(): LimitFunction;

  /**
   * Match a token at most the specified amount of times.
   *
   * @example
   *
   * ```js
   * atMost(3)`foo`
   * atMost(3).exactly`foo`
   * atMost(3)('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){0,3}/
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * atMostLazily(3)`foo`
   * atMost.lazily(3)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){0,3}?/
   * ```
   */
  get atMost(): LimitFunction;

  /**
   * Match a token at most the specified amount of times, trying to match as short as possible.
   *
   * `atMostLazily` is a short form of `atMost.lazily`. See the documentation of {@link atMost} for more details.
   *
   * @example
   *
   * ```js
   * atMostLazily(3)`foo`
   * atMost.lazily(3)`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo){0,3}?/
   * ```
   */
  get atMostLazily(): LimitFunction;

  /**
   * Match a token 0 or 1 times.
   *
   * @example
   *
   * ```js
   * maybe`foo`
   * maybe.exactly`foo`
   * maybe('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)?/
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * maybeLazily`foo`
   * maybe.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)??/
   * ```
   */
  get maybe(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Match a token 0 or 1 times, trying to match as short as possible.
   *
   * `maybeLazily` is a short form of `maybe.lazily`. See the documentation of {@link maybe} for more details.
   *
   * @example
   *
   * ```js
   * maybeLazily`foo`
   * maybe.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)??/
   * ```
   */
  get maybeLazily(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Match a token 0 to infinite times.
   *
   * @example
   *
   * ```js
   * zeroOrMore`foo`
   * zeroOrMore.exactly`foo`
   * zeroOrMore('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)*／
   * // !! unicode ending slash to escape comment ending !!
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * zeroOrMoreLazily`foo`
   * zeroOrMore.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)*?/
   * ```
   */
  get zeroOrMore(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Match a token 0 to infinite times, trying to match as short as possible.
   *
   * `zeroOrMoreLazily` is a short form of `zeroOrMore.lazily`. See the documentation of {@link zeroOrMore} for more details.
   *
   * @example
   *
   * ```js
   * zeroOrMoreLazily`foo`
   * zeroOrMore.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)*?/
   * ```
   */
  get zeroOrMoreLazily(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Match a token 1 to infinite times.
   *
   * @example
   *
   * ```js
   * oneOrMore`foo`
   * oneOrMore.exactly`foo`
   * oneOrMore('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)+/
   * ```
   *
   * @example Lazy matching
   *
   * ```js
   * oneOrMoreLazily`foo`
   * oneOrMore.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)+?/
   * ```
   */
  get oneOrMore(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Match a token 1 to infinite times, trying to match as short as possible.
   *
   * `oneOrMoreLazily` is a short form of `oneOrMore.lazily`. See the documentation of {@link oneOrMore} for more details.
   *
   * @example
   *
   * ```js
   * oneOrMoreLazily`foo`
   * oneOrMore.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)+?/
   * ```
   */
  get oneOrMoreLazily(): LiteralFunction & TokenFunction & RegExpToken;

  /**
   * Wrap the given token in a capture group.
   *
   * @example
   *
   * ```js
   * capture`foo`
   * capture.exactly`foo`
   * capture('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(foo)/
   * ```
   */
  get capture(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Wrap the given token in a named capture group.
   *
   * @example
   *
   * ```js
   * captureAs`name``foo`
   * captureAs`name`.exactly`foo`
   * captureAs('name')('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?<name>foo)/
   * ```
   */
  get captureAs(): NamedCaptureFunction;

  /**
   * Supply a number to reference the capture group with that index. Supply a string to reference a named capture group.
   *
   * @example Named reference
   *
   * ```js
   * captureAs`name``foo`.ref`name`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?<name>foo)\k<name>/
   * ```
   *
   * @example Number reference
   *
   * ```js
   * capture`foo`.ref(1)
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(foo)\1/
   * ```
   */
  get ref(): LiteralFunction & NumberFunction;

  /**
   * Wrap the given token in a non-capture group.
   *
   * @example
   *
   * ```js
   * group`foo`
   * group.exactly`foo`
   * group('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)/
   * ```
   */
  get group(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Wrap the given token in a positive lookahead.
   *
   * @example
   *
   * ```js
   * ahead`foo`
   * ahead.exactly`foo`
   * ahead('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?=foo)/
   * ```
   *
   * @example Negated token - Negative lookahead
   *
   * ```js
   * notAhead`foo`
   * not.ahead`foo`
   * notAhead.exactly`foo`
   * notAhead('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?!foo)/
   * ```
   */
  get ahead(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Wrap the given token in a positive lookbehind.
   *
   * @example
   *
   * ```js
   * behind`foo`
   * behind.exactly`foo`
   * behind('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?<=foo)/
   * ```
   *
   * @example Negated token - Negative lookbehind
   *
   * ```js
   * notBehind`foo`
   * not.behind`foo`
   * notBehind.exactly`foo`
   * notBehind('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?<!foo)/
   * ```
   */
  get behind(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Wrap the given token in a negative lookahead.
   *
   * `notAhead` is a short form of `not.ahead`. See the documentation of {@link ahead} for more details.
   *
   * @example
   *
   * ```js
   * notAhead`foo`
   * not.ahead`foo`
   * notAhead.exactly`foo`
   * notAhead('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?!foo)/
   * ```
   */
  get notAhead(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Wrap the given token in a negative lookbehind.
   *
   * `notBehind` is a short form of `not.behind`. See the documentation of {@link behind} for more details.
   *
   * @example
   *
   * ```js
   * notBehind`foo`
   * not.behind`foo`
   * notBehind.exactly`foo`
   * notBehind('foo')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?<!foo)/
   * ```
   */
  get notBehind(): LiteralFunction & GroupFunction & RegExpToken;

  /**
   * Match one in the provided list of options.
   *
   * @example
   *
   * ```js
   * oneOf`foo``bar`
   * oneOf(exactly`foo`, exactly`bar`)
   * oneOf('foo', 'bar')
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo|bar)/
   * ```
   */
  get oneOf(): AlternationFunction;

  /**
   * Include another readable RegExp token in the current expression. This is useful for extracting and re-using common
   * expressions.
   *
   * @example
   *
   * ```js
   * const number = oneOrMore.digit;
   * const coordinates = match(number).exactly`,`.match(number);
   * ```
   *
   * This is equivalent to:
   *
   * ```js
   * const coordinates = oneOrMore.digit.exactly`,`.oneOrMore.digit;
   * ```
   *
   * `match` can also accept multiple tokens and chain them together, which can be useful for code formatting.
   *
   * @example
   *
   * ```js
   * const filename = match(
   *   oneOrMore.word,
   *   exactly`_`,
   *   oneOrMore.digit,
   *   exactly`.txt`
   * );
   * ```
   *
   * This is equivalent to:
   *
   * ```js
   * const filename = oneOrMore.word.exactly`_`.oneOrMore.digit.exactly`.txt`;
   * ```
   */
  get match(): MultiTokenFunction;

  /**
   * Converts a quantifier to be lazy, causing it to match as short as possible.
   *
   * Applicable tokens: `repeat`, `atLeast`, `atMost`, `maybe`, `zeroOrMore`, `oneOrMore`
   *
   * Examples are provided in the documentation of the applicable tokens themselves.
   *
   * @example
   *
   * ```js
   * oneOrMoreLazily`foo`
   * oneOrMore.lazily`foo`
   * ```
   *
   * RegExp equivalent:
   *
   * ```js
   * /(?:foo)+?/
   * ```
   */
  get lazily(): LiteralFunction & TokenFunction & RegExpToken;
}

export interface RegExpModifier {
  /**
   * Process a regExp token.
   * Returns a tuple where the first element is passed to the next modifier,
   * and the second element finishes processing and is appended to the end.
   */
  modify(regExp: string): [string, string?];
  clone(): RegExpModifier;
}
