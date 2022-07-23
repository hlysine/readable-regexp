import {
  AlternationFunction,
  CanBeNegated,
  CanBeQuantified,
  CharClassFunction,
  ExtraQuantifiedToken,
  FlagUnion,
  FlagsString,
  GroupFunction,
  LiteralFunction,
  QuantifiedToken,
  QuantifierFunction,
  RegExpLiteral,
  RegExpModifier,
  RegExpToken,
  negatableSymbol,
  quantifiableSymbol,
} from './types';
import GroupModifier, { GroupType } from './modifiers/GroupModifier';
import {
  assign,
  bind,
  captureName,
  flagString,
  getLiteralString,
  hexNumber,
  isLiteralArgument,
  octalNumber,
} from './helper';
import AlternationModifier from './modifiers/AlternationModifier';
import CaptureModifier from './modifiers/CaptureModifier';
import CharacterClassModifier from './modifiers/CharacterClassModifier';
import NegationModifier from './modifiers/NegationModifier';
import QuantityModifier from './modifiers/QuantityModifier';
import RepeatQuantifier from './modifiers/RepeatQuantifier';
import SimpleQuantifier from './modifiers/SimpleQuantifier';

class RegExpBuilder implements RegExpToken {
  public readonly regExp: string;
  public readonly modifiers: RegExpModifier[];
  public readonly backreferences: (string | number)[];
  public readonly namedGroups: (string | number)[];
  public readonly [negatableSymbol]: undefined;
  public readonly [quantifiableSymbol]: undefined;

  public constructor(
    regExp?: string,
    modifiers?: RegExpModifier[],
    backreferences?: (string | number)[],
    namedGroups?: (string | number)[]
  ) {
    this.regExp = regExp ?? '';
    this.modifiers = modifiers ?? [];
    this.backreferences = backreferences ?? [];
    this.namedGroups = namedGroups ?? [];
  }

  public toString(): string {
    const indexedGroups = this.namedGroups.filter(re => typeof re === 'number').length;
    const invalidRefs = this.backreferences.filter(re => {
      if (typeof re === 'number') return re > indexedGroups;
      else return !this.namedGroups.includes(re);
    });
    if (invalidRefs.length > 0) {
      throw new Error('The following backreferences are not defined: ' + invalidRefs.join(', '));
    }
    const duplicateNames = this.namedGroups
      .filter(re => typeof re === 'string')
      .filter((re, i) => this.namedGroups.indexOf(re) !== i)
      .filter((re, i) => this.namedGroups.indexOf(re) === i);
    if (duplicateNames.length > 0) {
      throw new Error('The following named groups are defined more than once: ' + duplicateNames.join(', '));
    }

    return this.executeModifiers();
  }

  public toRegExp<TFlag extends string>(
    ...flags: [(FlagsString<TFlag> & TFlag)?] | FlagUnion[] | [TemplateStringsArray, ...unknown[]]
  ): RegExp {
    let fl: string | undefined;
    if (isLiteralArgument(flags)) {
      fl = getLiteralString(flags);
    } else if (flags.length > 0) {
      fl = flags.join('');
    }
    if (fl && !flagString.test(fl)) throw new Error('Invalid flags: ' + flags);
    return new RegExp(this.toString(), fl);
  }

  /*
   * ========== Internal Functions ==========
   */

  public static isRegExpBuilder(obj: unknown): obj is RegExpBuilder {
    return (
      obj instanceof RegExpBuilder ||
      (typeof obj === 'function' && `regExp` in obj && `modifiers` in obj && `executeModifiers` in obj)
    );
  }

  public executeModifiers(regExp?: string): string {
    if (this.modifiers.length === 0) return this.regExp + (regExp ?? '');
    return (
      this.regExp +
      this.modifiers
        .reduce(
          (re, modifier) => {
            const [processed, trailing] = modifier.modify(re[0]);
            return [processed, (trailing ?? '') + re[1]];
          },
          [regExp ?? '', '']
        )
        .join('')
    );
  }

  public addNode(node: string | RegExpBuilder, modifyBuilder?: (regExp: RegExpBuilder) => void): RegExpBuilder {
    let builder: RegExpBuilder;
    if (typeof node === 'string') {
      builder = new RegExpBuilder(
        this.executeModifiers(node),
        undefined,
        this.backreferences.slice(),
        this.namedGroups.slice()
      );
    } else {
      builder = new RegExpBuilder(
        this.executeModifiers(node.executeModifiers()),
        undefined,
        [...this.backreferences, ...node.backreferences],
        [...this.namedGroups, ...node.namedGroups]
      );
    }

    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public addModifier(modifier: RegExpModifier, modifyBuilder?: (regExp: RegExpBuilder) => void): RegExpBuilder {
    const builder = new RegExpBuilder(
      this.regExp,
      [modifier, ...this.modifiers],
      this.backreferences.slice(),
      this.namedGroups.slice()
    );
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  public mutateModifier(
    mutation: (modifier: RegExpModifier) => void,
    modifyBuilder?: (regExp: RegExpBuilder) => void
  ): RegExpBuilder {
    if (this.modifiers.length === 0) {
      throw new Error(
        "No modifiers to mutate. This probably means you are using a token that shouldn't be used alone."
      );
    }

    const newModifiers = this.modifiers.map(modifier => modifier.clone());
    mutation(newModifiers[0]);
    const builder = new RegExpBuilder(this.regExp, newModifiers, this.backreferences.slice(), this.namedGroups.slice());
    if (modifyBuilder) modifyBuilder(builder);
    return builder;
  }

  /*
   * ========== Special Tokens ==========
   */

  public get char(): RegExpToken['char'] {
    return this.addNode('.');
  }

  public get whitespace(): RegExpToken['whitespace'] {
    return this.addNode('\\s');
  }

  public get digit(): RegExpToken['digit'] {
    return this.addNode('\\d');
  }

  public get word(): RegExpToken['word'] {
    return this.addNode('\\w');
  }

  public get verticalWhitespace(): RegExpToken['verticalWhitespace'] {
    return this.addNode('\\v');
  }

  public get backspace(): RegExpToken['backspace'] {
    return this.addNode('[\\b]');
  }

  public get lineFeed(): RegExpToken['lineFeed'] {
    return this.addNode('\\n');
  }

  public get formFeed(): RegExpToken['formFeed'] {
    return this.addNode('\\f');
  }

  public get carriageReturn(): RegExpToken['carriageReturn'] {
    return this.addNode('\\r');
  }

  public get tab(): RegExpToken['tab'] {
    return this.addNode('\\t');
  }

  public get nullChar(): RegExpToken['nullChar'] {
    return this.addNode('\\0');
  }

  public get lineStart(): RegExpToken['lineStart'] {
    return this.addNode('^');
  }

  public get lineEnd(): RegExpToken['lineEnd'] {
    return this.addNode('$');
  }

  public get wordBoundary(): RegExpToken['wordBoundary'] {
    return this.addNode('\\b');
  }

  public get exactly(): RegExpToken['exactly'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken & CanBeQuantified {
      if (!isLiteralArgument(args)) throw new Error('Invalid arguments for exactly');
      const literal = getLiteralString(args);
      return this.addNode(literal);
    }
    return bind(func, this);
  }

  public get octal(): RegExpToken['octal'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken & CanBeQuantified & CanBeNegated {
      const literal = getLiteralString(args, false);
      if (!octalNumber.test(literal)) throw new Error('Invalid octal character');
      const num = Number.parseInt(literal, 8);
      if (Number.isNaN(num) || num > 0o777 || num < 0) throw new Error('Invalid octal character');
      if (num > 0o377) {
        // octal literals larger than 1 byte can be parsed by the regexp engine when they exist alone,
        // but they don't work in character classes, and hence cannot be negated.
        throw new Error(
          'Octal literals above 0o377 have inconsistent behavior. Please use hex/unicode literals instead.'
        );
      }
      return this.addNode(`[\\${num.toString(8)}]`);
    }
    return bind(func, this);
  }

  public get hex(): RegExpToken['hex'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken & CanBeQuantified & CanBeNegated {
      const literal = getLiteralString(args, false);
      if (!hexNumber.test(literal)) throw new Error('Invalid hex character');
      const num = Number.parseInt(literal, 16);
      if (Number.isNaN(num) || num > 0xffff || num < 0) throw new Error('Invalid hex character');
      if (num <= 0xff) return this.addNode(`\\x${num.toString(16).padStart(2, '0')}`);
      else return this.addNode(`\\u${num.toString(16).padStart(4, '0')}`);
    }
    return bind(func, this);
  }

  public get unicode(): RegExpToken['unicode'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral): RegExpToken & CanBeQuantified & CanBeNegated {
      const literal = getLiteralString(args, false);
      if (!hexNumber.test(literal)) throw new Error('Invalid unicode character');
      const num = Number.parseInt(literal, 16);
      if (Number.isNaN(num) || num > 0xffff || num < 0) throw new Error('Invalid unicode character');
      return this.addNode(`\\u${num.toString(16).padStart(4, '0')}`);
    }
    return bind(func, this);
  }

  public get charIn(): RegExpToken['charIn'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | (string | RegExpToken)[]
    ): RegExpToken & CanBeQuantified & CanBeNegated & CharClassFunction<CanBeNegated> {
      if (!(this.modifiers[0] instanceof CharacterClassModifier))
        throw new Error(`Unexpected modifier, expected CharacterClassModifier, but got ${this.modifiers[0]}`);
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args, false);
        return assign(
          func,
          this.mutateModifier(modifier => (modifier as CharacterClassModifier).add(literal))
        );
      } else {
        return assign(
          func,
          this.mutateModifier(modifier => {
            const mod = modifier as CharacterClassModifier;
            args.forEach(arg => {
              if (RegExpBuilder.isRegExpBuilder(arg)) {
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
    return bind(func, this.addModifier(new CharacterClassModifier(false)));
  }

  public get notCharIn(): RegExpToken['notCharIn'] {
    return this.not.charIn;
  }

  public get not(): RegExpToken['not'] {
    function func(this: RegExpBuilder, token: RegExpToken & CanBeNegated): RegExpToken & CanBeQuantified {
      if (RegExpBuilder.isRegExpBuilder(token)) {
        return this.addNode(token);
      } else {
        throw new Error('Invalid arguments for not');
      }
    }
    return assign(func, this.addModifier(new NegationModifier()));
  }

  /*
   * ========== Quantifiers ==========
   */

  public get repeat(): RegExpToken['repeat'] {
    function configure(
      this: RegExpBuilder,
      min: number,
      max?: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for repeat');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(min, max ?? min)));
    }
    return bind(configure, this);
  }

  public get repeatLazily(): RegExpToken['repeatLazily'] {
    function configure(
      this: RegExpBuilder,
      min: number,
      max?: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.repeat(min, max).lazily;
    }
    return bind(configure, this);
  }

  public get atLeast(): RegExpToken['atLeast'] {
    function configure(
      this: RegExpBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for atLeast');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(limit, undefined)));
    }
    return bind(configure, this);
  }

  public get atLeastLazily(): RegExpToken['atLeastLazily'] {
    function configure(
      this: RegExpBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.atLeast(limit).lazily;
    }
    return bind(configure, this);
  }

  public get atMost(): RegExpToken['atMost'] {
    function configure(
      this: RegExpBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken {
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
        if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
        } else {
          throw new Error('Invalid arguments for atMost');
        }
      }
      return assign(func, this.addModifier(new RepeatQuantifier(undefined, limit)));
    }
    return bind(configure, this);
  }

  public get atMostLazily(): RegExpToken['atMostLazily'] {
    function configure(
      this: RegExpBuilder,
      limit: number
    ): LiteralFunction<CanBeQuantified> & QuantifierFunction & QuantifiedToken<'lazily'> {
      return this.atMost(limit).lazily;
    }
    return bind(configure, this);
  }

  public get maybe(): RegExpToken['maybe'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for maybe');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}?`)));
  }

  public get maybeLazily(): RegExpToken['maybeLazily'] {
    return this.maybe.lazily;
  }

  public get zeroOrMore(): RegExpToken['zeroOrMore'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for zeroOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}*`)));
  }

  public get zeroOrMoreLazily(): RegExpToken['zeroOrMoreLazily'] {
    return this.zeroOrMore.lazily;
  }

  public get oneOrMore(): RegExpToken['oneOrMore'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for oneOrMore');
      }
    }
    return assign(func, this.addModifier(new SimpleQuantifier(regExp => `${regExp}+`)));
  }

  public get oneOrMoreLazily(): RegExpToken['oneOrMoreLazily'] {
    return this.oneOrMore.lazily;
  }

  public get lazily(): ExtraQuantifiedToken['lazily'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken]): RegExpToken & CanBeQuantified {
      if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
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

  public get capture(): RegExpToken['capture'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken & CanBeQuantified {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for capture');
      }
    }
    return assign(
      func,
      this.addModifier(new CaptureModifier(), builder => builder.namedGroups.push(0))
    );
  }

  public get captureAs(): RegExpToken['captureAs'] {
    function configure(
      this: RegExpBuilder,
      ...configArgs: RegExpLiteral
    ): LiteralFunction<CanBeQuantified> & GroupFunction & RegExpToken {
      if (!isLiteralArgument(configArgs)) {
        throw new Error('Invalid arguments for captureAs');
      }
      const name = getLiteralString(configArgs);
      if (!captureName.test(name))
        throw new Error('Invalid capture name. It must be alpha numeric and must not begin with a digit');
      function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken & CanBeQuantified {
        if (args.length === 0) {
          return this.addNode('');
        } else if (isLiteralArgument(args)) {
          const literal = getLiteralString(args);
          return this.addNode(literal);
        } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
          return this.addNode(args[0]);
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

  public get ref(): RegExpToken['ref'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [number]): RegExpToken & CanBeQuantified {
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

  public get group(): RegExpToken['group'] {
    function func(this: RegExpBuilder, ...args: RegExpLiteral | [RegExpToken?]): RegExpToken & CanBeQuantified {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.NonCapture)));
  }

  public get ahead(): RegExpToken['ahead'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | [RegExpToken?]
    ): RegExpToken & CanBeQuantified & CanBeNegated {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookahead)));
  }

  public get behind(): RegExpToken['behind'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | [RegExpToken?]
    ): RegExpToken & CanBeQuantified & CanBeNegated {
      if (args.length === 0) {
        return this.addNode('');
      } else if (isLiteralArgument(args)) {
        const literal = getLiteralString(args);
        return this.addNode(literal);
      } else if (RegExpBuilder.isRegExpBuilder(args[0])) {
        return this.addNode(args[0]);
      } else {
        throw new Error('Invalid arguments for group');
      }
    }
    return assign(func, this.addModifier(new GroupModifier(GroupType.PositiveLookbehind)));
  }

  public get notAhead(): RegExpToken['notAhead'] {
    return this.not.ahead;
  }

  public get notBehind(): RegExpToken['notBehind'] {
    return this.not.behind;
  }

  public get oneOf(): RegExpToken['oneOf'] {
    function func(
      this: RegExpBuilder,
      ...args: RegExpLiteral | (string | RegExpToken)[]
    ): RegExpToken & CanBeQuantified & AlternationFunction {
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
          this.mutateModifier(
            modifier => {
              const mod = modifier as AlternationModifier;
              args.forEach(arg => {
                if (RegExpBuilder.isRegExpBuilder(arg)) {
                  mod.add(arg.executeModifiers());
                } else if (typeof arg === 'string') {
                  mod.add(arg);
                } else {
                  throw new Error('Invalid arguments for oneOf');
                }
              });
            },
            builder =>
              args.forEach(arg => {
                if (RegExpBuilder.isRegExpBuilder(arg)) {
                  builder.backreferences.push(...arg.backreferences);
                  builder.namedGroups.push(...arg.namedGroups);
                }
              })
          )
        );
      }
    }
    return bind(func, this.addModifier(new AlternationModifier()));
  }

  /*
   * ========== Custom ==========
   */

  public get match(): RegExpToken['match'] {
    function func(this: RegExpBuilder, token: RegExpToken): RegExpToken & CanBeQuantified {
      if (!RegExpBuilder.isRegExpBuilder(token)) throw new Error('Invalid arguments for match');
      return this.addNode(token);
    }
    return bind(func, this);
  }
}

export const r: RegExpToken = new RegExpBuilder();

export const char = r.char;
export const whitespace = r.whitespace;
export const digit = r.digit;
export const word = r.word;
export const verticalWhitespace = r.verticalWhitespace;
export const backspace = r.backspace;
export const lineFeed = r.lineFeed;
export const formFeed = r.formFeed;
export const carriageReturn = r.carriageReturn;
export const tab = r.tab;
export const nullChar = r.nullChar;
export const lineStart = r.lineStart;
export const lineEnd = r.lineEnd;
export const wordBoundary = r.wordBoundary;
export const exactly = r.exactly;
export const octal = r.octal;
export const hex = r.hex;
export const unicode = r.unicode;
export const charIn = r.charIn;
export const notCharIn = r.notCharIn;
export const not = r.not;

export const repeat = r.repeat;
export const repeatLazily = r.repeatLazily;
export const atLeast = r.atLeast;
export const atLeastLazily = r.atLeastLazily;
export const atMost = r.atMost;
export const atMostLazily = r.atMostLazily;
export const maybe = r.maybe;
export const maybeLazily = r.maybeLazily;
export const zeroOrMore = r.zeroOrMore;
export const zeroOrMoreLazily = r.zeroOrMoreLazily;
export const oneOrMore = r.oneOrMore;
export const oneOrMoreLazily = r.oneOrMoreLazily;

export const capture = r.capture;
export const captureAs = r.captureAs;
export const ref = r.ref;
export const group = r.group;
export const ahead = r.ahead;
export const behind = r.behind;
export const notAhead = r.notAhead;
export const notBehind = r.notBehind;
export const oneOf = r.oneOf;

export const match = r.match;
