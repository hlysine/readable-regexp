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
  toString(): string;
  toRegExp: FlagFunction;

  get char(): RegExpToken;
  get whitespace(): RegExpToken;
  get digit(): RegExpToken;
  get word(): RegExpToken;
  get verticalWhitespace(): RegExpToken;
  get backspace(): RegExpToken;
  get lineFeed(): RegExpToken;
  get formFeed(): RegExpToken;
  get carriageReturn(): RegExpToken;
  get tab(): RegExpToken;
  get nullChar(): RegExpToken;
  get lineStart(): RegExpToken;
  get lineEnd(): RegExpToken;
  get wordBoundary(): RegExpToken;
  get exactly(): LiteralFunction;
  get octal(): LiteralFunction;
  get hex(): LiteralFunction;
  get unicode(): LiteralFunction;
  get charIn(): CharClassFunction;
  get notCharIn(): CharClassFunction;
  get not(): TokenFunction & RegExpToken;

  get repeat(): RepeatFunction;
  get repeatLazily(): RepeatFunction;
  get atLeast(): LimitFunction;
  get atLeastLazily(): LimitFunction;
  get atMost(): LimitFunction;
  get atMostLazily(): LimitFunction;
  get maybe(): LiteralFunction & TokenFunction & RegExpToken;
  get maybeLazily(): LiteralFunction & TokenFunction & RegExpToken;
  get zeroOrMore(): LiteralFunction & TokenFunction & RegExpToken;
  get zeroOrMoreLazily(): LiteralFunction & TokenFunction & RegExpToken;
  get oneOrMore(): LiteralFunction & TokenFunction & RegExpToken;
  get oneOrMoreLazily(): LiteralFunction & TokenFunction & RegExpToken;

  get capture(): LiteralFunction & GroupFunction & RegExpToken;
  get captureAs(): NamedCaptureFunction;
  get ref(): LiteralFunction & NumberFunction;
  get group(): LiteralFunction & GroupFunction & RegExpToken;
  get ahead(): LiteralFunction & GroupFunction & RegExpToken;
  get behind(): LiteralFunction & GroupFunction & RegExpToken;
  get notAhead(): LiteralFunction & GroupFunction & RegExpToken;
  get notBehind(): LiteralFunction & GroupFunction & RegExpToken;
  get oneOf(): AlternationFunction;

  get match(): TokenFunction;

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
