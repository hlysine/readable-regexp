export type RegexLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export type LiteralFunction = {
  (literal: string): RegexToken;
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken;
};

export type TokenFunction<TTags = unknown> = {
  (node: RegexToken & TTags): RegexToken;
};

export type MultiInputFunction = {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & MultiInputFunction;
  (...args: (string | RegexToken)[]): RegexToken & MultiInputFunction;
};

export const negatableTokenSymbol = Symbol('negatableToken');
export const quantifiableTokenSymbol = Symbol('quantifiableToken');

export interface NegatableTokenTag {
  readonly [negatableTokenSymbol]: undefined;
}

export interface QuantifiableTokenTag {
  readonly [quantifiableTokenSymbol]: undefined;
}

export interface RegexToken {
  get char(): RegexToken & QuantifiableTokenTag;
  get whitespace(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get digit(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get word(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get verticalWhitespace(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get lineFeed(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get carriageReturn(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get tab(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get nullChar(): RegexToken & NegatableTokenTag & QuantifiableTokenTag;
  get lineStart(): RegexToken & NegatableTokenTag;
  get exactly(): LiteralFunction & QuantifiableTokenTag;
  get not(): TokenFunction<NegatableTokenTag> & NegatedToken & QuantifiableTokenTag;
  get oneOrMore(): LiteralFunction & TokenFunction & QuantifiedToken;
  get oneOf(): MultiInputFunction & QuantifiableTokenTag;
  toString(): string;
  toRegExp(): RegExp;
}

export type QuantifiedNegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends QuantifiableTokenTag & NegatableTokenTag
    ? key
    : never]: RegexToken[key];
};

export type QuantifiedToken = {
  [key in keyof RegexToken as RegexToken[key] extends QuantifiableTokenTag ? key : never]: RegexToken[key];
} & {
  get not(): TokenFunction<NegatableTokenTag & QuantifiableTokenTag> & QuantifiedNegatedToken;
};

export type NegatedToken = {
  [key in keyof RegexToken as RegexToken[key] extends NegatableTokenTag ? key : never]: RegexToken[key];
};

export interface RegexModifier {
  modify(regex: string): string;
  clone(): RegexModifier;
}
