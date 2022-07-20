export type RegexLiteral = [string] | [TemplateStringsArray, ...unknown[]];

export type LiteralFunction = {
  (literal: string): RegexToken;
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken;
};

export type ModifierFunction = {
  (node: RegexToken): RegexToken;
};

export type NegatableTokenFunction = {
  (node: RegexToken & NegatableTokenTag): RegexToken;
};

export type MultiInputFunction = {
  (template: TemplateStringsArray, ...args: unknown[]): RegexToken & MultiInputFunction;
  (...args: (string | RegexToken)[]): RegexToken & MultiInputFunction;
};

export const negatableTokenSymbol = Symbol('negatableToken');

export interface NegatableTokenTag {
  [negatableTokenSymbol]: true;
}

export interface NegatedToken {
  get whitespace(): RegexToken & NegatableTokenTag;
  get digit(): RegexToken & NegatableTokenTag;
  get word(): RegexToken & NegatableTokenTag;
  get verticalWhitespace(): RegexToken & NegatableTokenTag;
  get lineFeed(): RegexToken & NegatableTokenTag;
  get carriageReturn(): RegexToken & NegatableTokenTag;
  get tab(): RegexToken & NegatableTokenTag;
  get nullChar(): RegexToken & NegatableTokenTag;
}

export interface QuantifiedToken extends NegatedToken {
  get char(): RegexToken;
  exactly: LiteralFunction;
  not: NegatableTokenFunction & NegatedToken;
  oneOf: MultiInputFunction;
}

export interface RegexToken extends QuantifiedToken {
  oneOrMore: LiteralFunction & ModifierFunction & QuantifiedToken;
  toString(): string;
  toRegExp(): RegExp;
}

export interface RegexModifier {
  modify(regex: string): string;
  clone(): RegexModifier;
}
