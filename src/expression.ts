import {
  AlternationFunction,
  CanBeNegated,
  CanBeQuantified,
  CharGroupFunction,
  ExtraQuantifiedToken,
  GroupFunction,
  LiteralFunction,
  QuantifiedToken,
  QuantifierFunction,
  RegexLiteral,
  RegexModifier,
  RegexToken,
  negatableSymbol,
  quantifiableSymbol,
} from './types';
import GroupModifier, { GroupType } from './modifiers/GroupModifier';
import { assign, bind, captureName, getLiteralString, isLiteralArgument, unicodeHex } from './helper';
import AlternationModifier from './modifiers/AlternationModifier';
import CaptureModifier from './modifiers/CaptureModifier';
import CharacterGroupModifier from './modifiers/CharacterGroupModifier';
import NegationModifier from './modifiers/NegationModifier';
import QuantityModifier from './modifiers/QuantityModifier';
import RepeatQuantifier from './modifiers/RepeatQuantifier';
import SimpleQuantifier from './modifiers/SimpleQuantifier';

class RegexBuilder implements RegexToken {
  public readonly regex: string;
  public readonly modifiers: RegexModifier[];
  public readonly backreferences: (string | number)[];
  public readonly namedGroups: (string | number)[];
  public readonly [negatableSymbol]: undefined;
  public readonly [quantifiableSymbol]: undefined;

  public constructor(
    regex?: string,
    modifiers?: RegexModifier[],
    backreferences?: (string | number)[],
    namedGroups?: (string | number)[]
  ) {
    this.regex = regex ?? '';
    this.modifiers = modifiers ?? [];
    this.backreferences = backreferences ?? [];
    this.namedGroups = namedGroups ?? [];
  }

  public toString(): string {
    const indexedGroups = this.namedGroups.filter(r => typeof r === 'number').length;
    const invalidRefs = this.backreferences.filter(r => {
      if (typeof r === 'number') return r > indexedGroups;
      else return !this.namedGroups.includes(r);
    });
    if (invalidRefs.length > 0) {
      throw new Error('The following backreferences are not defined: ' + invalidRefs.join(', '));
    }
    return this.executeModifiers();
  }

  public toRegExp(): RegExp {
    return new RegExp(this.toString());
  }

  /*
   * ========== Internal Functions ==========
   */

  public static isRegexBuilder(obj: unknown): obj is RegexBuilder {
    return (
      obj instanceof RegexBuilder ||
      (typeof obj === 'function' && `regex` in obj && `modifiers` in obj && `executeModifiers` in obj)
    );
  }

  public executeModifiers(regex?: string): string {
    if (this.modifiers.length === 0) return this.regex + (regex ?? '');
    return (
      this.regex +
      this.modifiers
        .reduce(
          (r, modifier) => {
            const [processed, trailing] = modifier.modify(r[0]);
            return [processed, (trailing ?? '') + r[1]];
          },
          [regex ?? '', '']
        )
        .join('')
    );
  }

  public addNode(node: string, modifyBuilder?: (regex: RegexBuilder) => void): RegexBuilder {
    const builder = new RegexBuilder(
      this.executeModifiers(node),
      undefined,
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public addModifier(modifier: RegexModifier, modifyBuilder?: (regex: RegexBuilder) => void): RegexBuilder {
    const builder = new RegexBuilder(
      this.regex,
      [modifier, ...this.modifiers],
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public mutateModifier(
    mutation: (modifier: RegexModifier) => void,
    modifyBuilder?: (regex: RegexBuilder) => void
  ): RegexBuilder {
    if (this.modifiers.length === 0) {
      throw new Error(
        "No modifiers to mutate. This probably means you are using a token that shouldn't be used alone."
      );
    }

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    const builder = new RegexBuilder(this.regex, newModifiers, this.backreferences.slice(), this.namedGroups.slice());
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegexToken['char'] {
    return this.addNode('.');
  }

  public get whitespace(): RegexToken['whitespace'] {
    return this.addNode('\\s');
  }

  public get digit(): RegexToken['digit'] {
    return this.addNode('\\d');
  }

  public get word(): RegexToken['word'] {
    return this.addNode('\\w');
  }

  public get verticalWhitespace(): RegexToken['verticalWhitespace'] {
    return this.addNode('\\v');
  }

  public get lineFeed(): RegexToken['lineFeed'] {
    return this.addNode('\\n');
  }

  public get carriageReturn(): RegexToken['carriageReturn'] {
    return this.addNode('\\r');
  }

  public get tab(): RegexToken['tab'] {
    return this.addNode('\\t');
  }

  public get nullChar(): RegexToken['nullChar'] {
    return this.addNode('\\0');
  }

  public get lineStart(): RegexToken['lineStart'] {
    return this.addNode('^');
  }

  public get lineEnd(): RegexToken['lineEnd'] {
    return this.addNode('$');
  }

  public get wordBoundary(): RegexToken['wordBoundary'] {
    return this.addNode('\\b');
  }

  public get exactly(): RegexToken['exactly'] {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken & CanBeQuantified {
      if (!isLiteralArgument(args)) throw new Error('Invalid arguments for exactly');
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return bind(func, this);
  }

  public get unicode(): RegexToken['unicode'] {
    function func(this: RegexBuilder, ...args: RegexLiteral): RegexToken & CanBeQuantified & CanBeNegated {
      const literal = getLiteralString(args, false);
      if (!unicodeHex.test(literal)) throw new Error('Invalid unicode literal');
      return this.addNode(`\\u${literal}`);
    }
    return bind(func, this);
  }

  public get charIn(): RegexToken['charIn'] {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | (string | RegexToken)[]
    ): RegexToken & CanBeQuantified & CanBeNegated & CharGroupFunction<CanBeNegated> {
      if (!(this.modifiers[0] instanceof CharacterGroupModifier))
        throw new Error(`Unexpected modifier, expected CharacterGroupModifier, but got ${this.modifiers[0]}`);
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args, false);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as CharacterGroupModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as CharacterGroupModifier;
            args.forEach(arg => {
              if (RegexBuilder.isRegexBuilder(arg)) {
                mod.add(arg.executeModifiers());
              } else if (typeof arg === 'string') {
                mod.add(arg);
              } else {
                throw new Error('Invalid arguments for charIn');
              }
            });
          })
        );
      }
    }
    return bind(func, this.addModifier(new CharacterGroupModifier(false)));
  }

  public get notCharIn(): RegexToken['notCharIn'] {
    return this.not.charIn;
  }

  public get not(): RegexToken['not'] {
    function func(this: RegexBuilder, token: RegexToken & CanBeNegated): RegexToken & CanBeQuantified {
      if (RegexBuilder.isRegexBuilder(token)) {
        return this.addNode(token.executeModifiers());
      } else {
        throw new Error('Invalid arguments for not');
      }
    }
    return assign(func, this.addModifier(new NegationModifier()));
  }

  /*
   * ========== Quantifiers ==========
   */

  public get repeat(): RegexToken['repeat'] {
    function configure(
      this: RegexBuilder,
      min: number,
      max?: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for repeat');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(min, max ?? min)));
    }
    return bind(configure, this);
  }

  public get repeatLazily(): RegexToken['repeatLazily'] {
    function configure(
      this: RegexBuilder,
      min: number,
      max?: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.repeat(min, max).lazily;
    }
    return bind(configure, this);
  }

  public get atLeast(): RegexToken['atLeast'] {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for atLeast');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(limit, null)));
    }
    return bind(configure, this);
  }

  public get atLeastLazily(): RegexToken['atLeastLazily'] {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.atLeast(limit).lazily;
    }
    return bind(configure, this);
  }

  public get atMost(): RegexToken['atMost'] {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for atMost');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(null, limit)));
    }
    return bind(configure, this);
  }

  public get atMostLazily(): RegexToken['atMostLazily'] {
    function configure(
      this: RegexBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.atMost(limit).lazily;
    }
    return bind(configure, this);
  }

  public get maybe(): RegexToken['maybe'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for maybe');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}?`)));
  }

  public get maybeLazily(): RegexToken['maybeLazily'] {
    return this.maybe.lazily;
  }

  public get zeroOrMore(): RegexToken['zeroOrMore'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for zeroOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}*`)));
  }

  public get zeroOrMoreLazily(): RegexToken['zeroOrMoreLazily'] {
    return this.zeroOrMore.lazily;
  }

  public get oneOrMore(): RegexToken['oneOrMore'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regex => `${regex}+`)));
  }

  public get oneOrMoreLazily(): RegexToken['oneOrMoreLazily'] {
    return this.oneOrMore.lazily;
  }

  public get lazily(): ExtraQuantifiedToken['lazily'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken]): RegexToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(
      func,
      this.mutateModifier(modifier => {
        if (!(modifier instanceof QuantityModifier)) throw new Error('lazily can only be used with quantifiers');
        modifier.lazy = true;
      })
    );
  }

  /*
   * ========== Groups ==========
   */

  public get capture(): RegexToken['capture'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken?]): RegexToken & CanBeQuantified {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for capture');
      }
    }
    return assign(
      func,
      this.addModifier(new CaptureModifier(), builder => builder.namedGroups.push(0))
    );
  }

  public get captureAs(): RegexToken['captureAs'] {
    function configure(
      this: RegexBuilder,
      ...configArgs: RegexLiteral
    ): LiteralFunction<CanBeQuantified> & GroupFunction & RegexToken {
      if (!isLiteralArgument(configArgs)) {
        throw new Error('Invalid arguments for captureAs');
      }
      const name = getLiteralString(configArgs);
      if (!captureName.test(name))
        throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
      function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken?]): RegexToken & CanBeQuantified {
        if (args.length === 0) {
          return this.addNode('');
        } else if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegexBuilder.isRegexBuilder(args[0])) {
          return this.addNode(args[0].executeModifiers());
        } else {
          throw new Error('Invalid arguments for captureAs');
        }
      }
      return assign(
        func,
        this.addModifier(new CaptureModifier(name), builder => builder.namedGroups.push(name, 0))
      );
    }
    return bind(configure, this);
  }

  public get ref(): RegexToken['ref'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [number]): RegexToken & CanBeQuantified {
      if (args.length === 1 && typeof args[0] === 'number') {
        const index = args[0];
        if (index <= 0) throw new Error('Invalid group index in ref');
        return this.addNode(`\\${args[0]}`, builder => builder.backreferences.push(index));
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args, false);
        if (!captureName.test(literal))
          throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
        return this.addNode(`\\k<${literal}>`, builder => builder.backreferences.push(literal));
      } else {
        throw new Error('Invalid arguments for ref');
      }
    }
    return bind(func, this);
  }

  public get group(): RegexToken['group'] {
    function func(this: RegexBuilder, ...args: RegexLiteral | [RegexToken?]): RegexToken & CanBeQuantified {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NonCapture)));
  }

  public get ahead(): RegexToken['ahead'] {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | [RegexToken?]
    ): RegexToken & CanBeQuantified & CanBeNegated {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookahead)));
  }

  public get behind(): RegexToken['behind'] {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | [RegexToken?]
    ): RegexToken & CanBeQuantified & CanBeNegated {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegexBuilder.isRegexBuilder(args[0])) {
        return this.addNode(args[0].executeModifiers());
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookbehind)));
  }

  public get notAhead(): RegexToken['notAhead'] {
    return this.not.ahead;
  }

  public get notBehind(): RegexToken['notBehind'] {
    return this.not.behind;
  }

  public get oneOf(): RegexToken['oneOf'] {
    function func(
      this: RegexBuilder,
      ...args: RegexLiteral | (string | RegexToken)[]
    ): RegexToken & CanBeQuantified & AlternationFunction {
      if (!(this.modifiers[0] instanceof AlternationModifier))
        throw new Error(`Unexpected modifier, expected OneOfModifier, but got ${this.modifiers[0]}`);
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as AlternationModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as AlternationModifier;
            args.forEach(arg => {
              if (RegexBuilder.isRegexBuilder(arg)) {
                mod.add(arg.executeModifiers());
              } else if (typeof arg === 'string') {
                mod.add(arg);
              } else {
                throw new Error('Invalid arguments for oneOf');
              }
            });
          })
        );
      }
    }
    return bind(func, this.addModifier(new AlternationModifier()));
  }
}

const root = new RegexBuilder();

export const char = root.char;
export const whitespace = root.whitespace;
export const digit = root.digit;
export const word = root.word;
export const verticalWhitespace = root.verticalWhitespace;
export const lineFeed = root.lineFeed;
export const carriageReturn = root.carriageReturn;
export const tab = root.tab;
export const nullChar = root.nullChar;
export const lineStart = root.lineStart;
export const lineEnd = root.lineEnd;
export const wordBoundary = root.wordBoundary;
export const exactly = root.exactly;
export const unicode = root.unicode;
export const charIn = root.charIn;
export const notCharIn = root.notCharIn;
export const not = root.not;

export const repeat = root.repeat;
export const repeatLazily = root.repeatLazily;
export const atLeast = root.atLeast;
export const atLeastLazily = root.atLeastLazily;
export const atMost = root.atMost;
export const atMostLazily = root.atMostLazily;
export const maybe = root.maybe;
export const maybeLazily = root.maybeLazily;
export const zeroOrMore = root.zeroOrMore;
export const zeroOrMoreLazily = root.zeroOrMoreLazily;
export const oneOrMore = root.oneOrMore;
export const oneOrMoreLazily = root.oneOrMoreLazily;

export const capture = root.capture;
export const captureAs = root.captureAs;
export const ref = root.ref;
export const group = root.group;
export const ahead = root.ahead;
export const behind = root.behind;
export const notAhead = root.notAhead;
export const notBehind = root.notBehind;
export const oneOf = root.oneOf;
