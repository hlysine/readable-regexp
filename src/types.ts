export type RegexLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export interface LiteralFunction<TOut = unknown> {
  (literal: string): RegexToken & TOut;
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & TOut;
}

export interface NumberFunction<TOut = unknown> {
  (num: number): RegexToken & TOut;
}

export interface TokenFunction<TTags = unknown> {
  (node: RegexToken & CanBeQuantified & TTags): RegexToken & CanBeQuantified;
  (node: RegexToken & TTags): RegexToken;
}

export interface QuantifierFunction {
  (node: RegexToken & CanBeQuantified): RegexToken & CanBeQuantified;
}

export interface GroupFunction {
  (node?: RegexToken): RegexToken & CanBeQuantified;
}

export interface AlternationFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & CanBeQuantified & AlternationFunction;
  (...args: (string | RegexToken)[]): RegexToken & CanBeQuantified & AlternationFunction;
}

export interface NamedCaptureFunction {
  (name: string): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  (template: TemplateStringsArray, ...args: unknown[]): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
}

export interface RepeatFunction<TExclude extends string = never> {
  (min: number, max?: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<TExclude>;
}

export interface LimitFunction<TExclude extends string = never> {
  (limit: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<TExclude>;
}

export interface CharGroupFunction<TOut = unknown> {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & CanBeQuantified & TOut & CharGroupFunction<TOut>;
  (...args: (string | RegexToken)[]): RegexToken & CanBeQuantified & TOut & CharGroupFunction<TOut>;
}

export const negatableSymbol = Symbol('negatableToken');
export const quantifiableSymbol = Symbol('quantifiableToken');

export interface CanBeNegated {
  readonly [negatableSymbol]: undefined;
}

export interface CanBeQuantified {
  readonly [quantifiableSymbol]: undefined;
}

export interface RegexToken {
  toString(): string;
  toRegExp(): RegExp;

  get char(): RegexToken & CanBeQuantified;
  get whitespace(): RegexToken & CanBeNegated & CanBeQuantified;
  get digit(): RegexToken & CanBeNegated & CanBeQuantified;
  get word(): RegexToken & CanBeNegated & CanBeQuantified;
  get verticalWhitespace(): RegexToken & CanBeNegated & CanBeQuantified;
  get lineFeed(): RegexToken & CanBeNegated & CanBeQuantified;
  get carriageReturn(): RegexToken & CanBeNegated & CanBeQuantified;
  get tab(): RegexToken & CanBeNegated & CanBeQuantified;
  get nullChar(): RegexToken & CanBeNegated & CanBeQuantified;
  get lineStart(): RegexToken & CanBeNegated;
  get lineEnd(): RegexToken & CanBeNegated;
  get wordBoundary(): RegexToken & CanBeNegated;
  get exactly(): LiteralFunction<CanBeQuantified> & CanBeQuantified;
  get unicode(): LiteralFunction<CanBeQuantified & CanBeNegated> & CanBeQuantified & CanBeNegated;
  get charIn(): CharGroupFunction<CanBeNegated> & CanBeQuantified & CanBeNegated;
  get notCharIn(): CharGroupFunction & CanBeQuantified;
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

  get capture(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified;
  get captureAs(): NamedCaptureFunction & CanBeQuantified;
  get ref(): LiteralFunction<CanBeQuantified> & NumberFunction<CanBeQuantified> & CanBeQuantified;
  get group(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified;
  get ahead(): LiteralFunction<CanBeQuantified & CanBeNegated> & GroupFunction & RegexToken & CanBeNegated;
  get behind(): LiteralFunction<CanBeQuantified & CanBeNegated> & GroupFunction & RegexToken & CanBeNegated;
  get notAhead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  get notBehind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  get oneOf(): AlternationFunction & CanBeQuantified;

  get match(): TokenFunction & CanBeQuantified;
}

export type QuantifiedNegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeQuantified & CanBeNegated ? key : never]: RegexToken[key];
};

export interface ExtraQuantifiedToken {
  get not(): TokenFunction<CanBeNegated & CanBeQuantified> & QuantifiedNegatedToken;
  get lazily(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> & CanBeQuantified;
  get match(): TokenFunction<CanBeQuantified>;
}

export type QuantifiedToken<TExclude extends string = never> = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeQuantified
    ? key extends TExclude
      ? never
      : key
    : never]: RegexToken[key];
} & {
  [key in keyof ExtraQuantifiedToken as key extends TExclude ? never : key]: ExtraQuantifiedToken[key];
};

export type NegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeNegated ? key : never]: RegexToken[key];
};

export interface RegexModifier {
  /**
   * Process a regex token.
   * Returns a tuple where the first element is passed to the next modifier,
   * and the second element finishes processing and is appended to the end.
   */
  modify(regex: string): [string, string?];
  clone(): RegexModifier;
}
