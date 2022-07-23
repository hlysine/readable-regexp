export type RegExpLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export interface LiteralFunction<TOut = unknown> {
  (literal: string): RegExpToken & TOut;
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken & TOut;
}

export interface NumberFunction<TOut = unknown> {
  (num: number): RegExpToken & TOut;
}

export interface TokenFunction<TTags = unknown> {
  (node: RegExpToken & CanBeQuantified & TTags): RegExpToken & CanBeQuantified;
  (node: RegExpToken & TTags): RegExpToken;
}

export interface QuantifierFunction {
  (node: RegExpToken & CanBeQuantified): RegExpToken & CanBeQuantified;
}

export interface GroupFunction {
  (node?: RegExpToken): RegExpToken & CanBeQuantified;
}

export interface AlternationFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken & CanBeQuantified & AlternationFunction;
  (...args: (string | RegExpToken)[]): RegExpToken & CanBeQuantified & AlternationFunction;
}

export interface NamedCaptureFunction {
  (name: string): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken;
  (template: TemplateStringsArray, ...args: unknown[]): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken;
}

export interface RepeatFunction<TExclude extends string = never> {
  (min: number, max?: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<TExclude>;
}

export interface LimitFunction<TExclude extends string = never> {
  (limit: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<TExclude>;
}

export interface CharClassFunction<TOut = unknown> {
  (template: TemplateStringsArray, ...args: unknown[]): RegExpToken & CanBeQuantified & TOut & CharClassFunction<TOut>;
  (...args: (string | RegExpToken)[]): RegExpToken & CanBeQuantified & TOut & CharClassFunction<TOut>;
}

export const negatableSymbol = Symbol('negatableToken');
export const quantifiableSymbol = Symbol('quantifiableToken');

export interface CanBeNegated {
  readonly [negatableSymbol]: undefined;
}

export interface CanBeQuantified {
  readonly [quantifiableSymbol]: undefined;
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

  get char(): RegExpToken & CanBeQuantified;
  get whitespace(): RegExpToken & CanBeNegated & CanBeQuantified;
  get digit(): RegExpToken & CanBeNegated & CanBeQuantified;
  get word(): RegExpToken & CanBeNegated & CanBeQuantified;
  get verticalWhitespace(): RegExpToken & CanBeNegated & CanBeQuantified;
  get backspace(): RegExpToken & CanBeNegated & CanBeQuantified;
  get lineFeed(): RegExpToken & CanBeNegated & CanBeQuantified;
  get formFeed(): RegExpToken & CanBeNegated & CanBeQuantified;
  get carriageReturn(): RegExpToken & CanBeNegated & CanBeQuantified;
  get tab(): RegExpToken & CanBeNegated & CanBeQuantified;
  get nullChar(): RegExpToken & CanBeNegated & CanBeQuantified;
  get lineStart(): RegExpToken & CanBeNegated;
  get lineEnd(): RegExpToken & CanBeNegated;
  get wordBoundary(): RegExpToken & CanBeNegated;
  get exactly(): LiteralFunction<CanBeQuantified> & CanBeQuantified;
  get octal(): LiteralFunction<CanBeQuantified & CanBeNegated> & CanBeQuantified & CanBeNegated;
  get hex(): LiteralFunction<CanBeQuantified & CanBeNegated> & CanBeQuantified & CanBeNegated;
  get unicode(): LiteralFunction<CanBeQuantified & CanBeNegated> & CanBeQuantified & CanBeNegated;
  get charIn(): CharClassFunction<CanBeNegated> & CanBeQuantified & CanBeNegated;
  get notCharIn(): CharClassFunction & CanBeQuantified;
  get not(): TokenFunction<CanBeNegated> & NegatedToken & CanBeQuantified;

  get repeat(): RepeatFunction;
  get repeatLazily(): RepeatFunction<'lazily'>;
  get atLeast(): LimitFunction;
  get atLeastLazily(): LimitFunction<'lazily'>;
  get atMost(): LimitFunction;
  get atMostLazily(): LimitFunction<'lazily'>;
  get maybe(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get maybeLazily(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'>;
  get zeroOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get zeroOrMoreLazily(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'>;
  get oneOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get oneOrMoreLazily(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'>;

  get capture(): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken & CanBeQuantified;
  get captureAs(): NamedCaptureFunction & CanBeQuantified;
  get ref(): LiteralFunction<CanBeQuantified> & NumberFunction<CanBeQuantified> & CanBeQuantified;
  get group(): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken & CanBeQuantified;
  get ahead(): LiteralFunction<CanBeQuantified & CanBeNegated> & GroupFunction & RegExpToken & CanBeNegated;
  get behind(): LiteralFunction<CanBeQuantified & CanBeNegated> & GroupFunction & RegExpToken & CanBeNegated;
  get notAhead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken;
  get notBehind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken;
  get oneOf(): AlternationFunction & CanBeQuantified;

  get match(): TokenFunction & CanBeQuantified;
}

export type QuantifiedNegatedToken = {
  [key in keyof RegExpToken as RegExpToken[key] extends CanBeQuantified & CanBeNegated ? key : never]: RegExpToken[key];
};

export interface ExtraQuantifiedToken {
  get not(): TokenFunction<CanBeNegated & CanBeQuantified> & QuantifiedNegatedToken;
  get lazily(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> & CanBeQuantified;
  get match(): TokenFunction<CanBeQuantified>;
}

export type QuantifiedToken<TExclude extends string = never> = {
  [key in keyof RegExpToken as RegExpToken[key] extends CanBeQuantified
    ? key extends TExclude
      ? never
      : key
    : never]: RegExpToken[key];
} & {
  [key in keyof ExtraQuantifiedToken as key extends TExclude ? never : key]: ExtraQuantifiedToken[key];
};

export type NegatedToken = {
  [key in keyof RegExpToken as RegExpToken[key] extends CanBeNegated ? key : never]: RegExpToken[key];
};

export interface RegExpModifier {
  /**
   * Process a regExp token.
   * Returns a tuple where the first element is passed to the next modifier,
   * and the second element finishes processing and is appended to the end.
   */
  modify(regExp: string): [string, string?];
  clone(): RegExpModifier;
}
