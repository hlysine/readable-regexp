export type RegexLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export interface LiteralFunction<TOut = unknown> {
  (literal: string): RegexToken & TOut;
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & TOut;
}

export interface TokenFunction<TTags = unknown> {
  (node: RegexToken & CanBeQuantified & TTags): RegexToken & CanBeQuantified;
  (node: RegexToken & TTags): RegexToken;
}

export interface QuantifierFunction {
  (node: RegexToken & CanBeQuantified): RegexToken & CanBeQuantified;
}

export interface GroupFunction {
  (node: RegexToken): RegexToken & CanBeQuantified;
}

export interface MultiInputFunction {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & CanBeQuantified & MultiInputFunction;
  (...args: (string | RegexToken)[]): RegexToken & CanBeQuantified & MultiInputFunction;
}

export interface NamedCaptureFunction {
  (name: string): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  (template: TemplateStringsArray, ...args: unknown[]): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
}

export interface RepeatFunction {
  (min: number, max?: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
}

export interface LimitFunction {
  (limit: number): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
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
  get not(): TokenFunction<CanBeNegated> & NegatedToken & CanBeQuantified;
  get repeat(): RepeatFunction;
  get atLeast(): LimitFunction;
  get atMost(): LimitFunction;
  get maybe(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get zeroOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get oneOrMore(): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken;
  get capture(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified;
  get captureAs(): NamedCaptureFunction & CanBeQuantified;
  get ref(): LiteralFunction<CanBeQuantified> & CanBeQuantified;
  get group(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken & CanBeQuantified;
  get ahead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  get behind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  get notAhead(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;
  get notBehind(): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken;

  get oneOf(): MultiInputFunction & CanBeQuantified;
}

export type QuantifiedNegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeQuantified & CanBeNegated ? key : never]: RegexToken[key];
};

export type QuantifiedToken = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeQuantified ? key : never]: RegexToken[key];
} & {
  get not(): TokenFunction<CanBeNegated & CanBeQuantified> & QuantifiedNegatedToken;
};

export type NegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends CanBeNegated ? key : never]: RegexToken[key];
};

export interface RegexModifier {
  modify(regex: string): string;
  clone(): RegexModifier;
}
