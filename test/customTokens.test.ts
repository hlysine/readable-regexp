import {
  GenericFunction,
  IncompleteToken,
  LiteralFunction,
  RegExpToken,
  defineToken,
  exactly,
  lineStart,
  r,
} from '../src';
import { assertType } from './testUtils';

declare module '../src' {
  interface RegExpToken {
    testConstant: RegExpToken;
    testString: string;
    testEmpty: null;
    testObject: { foo: string };

    testDynamicLiteral: LiteralFunction & IncompleteToken;
    testDynamicIncomplete: LiteralFunction;
    testDynamicGeneric: GenericFunction<[num: number], RegExpToken> & IncompleteToken;
    testDynamicOverload: GenericFunction<[num: number] | [bool: boolean], RegExpToken> & IncompleteToken;
    testDynamicString: GenericFunction<[str: string] | [TemplateStringsArray, ...unknown[]], RegExpToken> &
      IncompleteToken;
    testDynamicMixed: GenericFunction<[str: string | number] | [TemplateStringsArray, ...unknown[]], RegExpToken> &
      IncompleteToken;

    testMixed: LiteralFunction & RegExpToken;
  }
}

function isRegExpToken(token: unknown): token is RegExpToken {
  return (
    (typeof token === 'object' || typeof token === 'function') &&
    token !== null &&
    'toRegExp' in token &&
    'toString' in token
  );
}

describe('custom tokens', () => {
  it('behaves correctly', () => {
    const testConstant = defineToken('testConstant', {
      constant(this: RegExpToken) {
        expect(isRegExpToken(this)).toBe(true);
        return this.exactly`foo`;
      },
    });
    assertType<RegExpToken>(testConstant);
    expect(() => {
      const testString = defineToken('testString', {
        // @ts-expect-error - the token does not intersect RegExpToken or IncompleteToken
        constant(this: RegExpToken) {
          expect(isRegExpToken(this)).toBe(true);
          return 'foo';
        },
      });
      assertType<never>(testString);
    }).toThrow('Invalid return value');

    expect(() => {
      // @ts-expect-error - no config provided
      const testEmpty = defineToken('testEmpty', {});
      assertType<never>(testEmpty);
    }).toThrow('valid configurations');

    expect(() => {
      const testObject = defineToken('testObject', {
        // @ts-expect-error - the token does not intersect RegExpToken or IncompleteToken
        constant(this: RegExpToken) {
          expect(isRegExpToken(this)).toBe(true);
          return { foo: 'bar' };
        },
      });
      assertType<never>(testObject);
    }).toThrow('Invalid return value');

    const testDynamicLiteral = defineToken('testDynamicLiteral', {
      dynamic(this: RegExpToken, str: string) {
        expect(isRegExpToken(this)).toBe(true);
        return this.exactly`${str}`;
      },
    });
    assertType<LiteralFunction & IncompleteToken>(testDynamicLiteral);
    const testDynamicIncomplete = defineToken('testDynamicIncomplete', {
      // @ts-expect-error - the dynamic token does not intersect IncompleteToken
      dynamic(this: RegExpToken, str: string) {
        expect(isRegExpToken(this)).toBe(true);
        return this.exactly`${str}`;
      },
    });
    assertType<never>(testDynamicIncomplete);
    const testDynamicGeneric = defineToken('testDynamicGeneric', {
      dynamic(this: RegExpToken, num: number) {
        expect(isRegExpToken(this)).toBe(true);
        return this.repeat(num)`f`;
      },
    });
    assertType<GenericFunction<[num: number], RegExpToken> & IncompleteToken>(testDynamicGeneric);
    const testDynamicOverload = defineToken('testDynamicOverload', {
      dynamic(this: RegExpToken, val: number | boolean) {
        expect(isRegExpToken(this)).toBe(true);
        return exactly`${val}`.match(this);
      },
    });
    assertType<GenericFunction<[num: number] | [bool: boolean], RegExpToken> & IncompleteToken>(testDynamicOverload);
    const testDynamicString = defineToken('testDynamicString', {
      dynamic(this: RegExpToken, val: string) {
        expect(isRegExpToken(this)).toBe(true);
        return this.charIn(val);
      },
    });
    assertType<GenericFunction<[str: string] | [TemplateStringsArray, ...unknown[]], RegExpToken> & IncompleteToken>(
      testDynamicString
    );
    const testDynamicMixed = defineToken('testDynamicMixed', {
      dynamic(this: RegExpToken, val: string | number) {
        expect(isRegExpToken(this)).toBe(true);
        return this.charIn(String(val));
      },
    });
    assertType<
      GenericFunction<[str: string | number] | [TemplateStringsArray, ...unknown[]], RegExpToken> & IncompleteToken
    >(testDynamicMixed);

    const testMixed = defineToken('testMixed', {
      dynamic(this: RegExpToken, val: string) {
        expect(isRegExpToken(this)).toBe(true);
        return this.exactly(String(val));
      },
      constant(this: RegExpToken) {
        expect(isRegExpToken(this)).toBe(true);
        return this.char;
      },
    });
    assertType<LiteralFunction & RegExpToken>(testMixed);

    expect(testConstant.toString()).toBe('foo');
    expect(r.testConstant.toString()).toBe('foo');
    expect(lineStart.testConstant.toString()).toBe('^foo');
    // @ts-expect-error - the token is constant
    expect(() => testConstant`foo`).toThrow();

    // @ts-expect-error - the token is incomplete
    expect(() => testDynamicLiteral.toString()).toThrow();
    expect(testDynamicLiteral`foo`.toString()).toBe('foo');
    expect(testDynamicLiteral('foo').toString()).toBe('foo');
    expect(r.testDynamicLiteral`foo`.toString()).toBe('foo');
    expect(lineStart.testDynamicLiteral`foo`.toString()).toBe('^foo');

    // @ts-expect-error - the token is incomplete
    expect(() => testDynamicGeneric.toString()).toThrow();
    expect(testDynamicGeneric(3).toString()).toBe('f{3}');
    expect(r.testDynamicGeneric(3).toString()).toBe('f{3}');
    expect(lineStart.testDynamicGeneric(3).toString()).toBe('^f{3}');

    // @ts-expect-error - the token is incomplete
    expect(() => testDynamicOverload.toString()).toThrow();
    expect(testDynamicOverload(3).toString()).toBe('3');
    expect(testDynamicOverload(true).toString()).toBe('true');
    expect(r.testDynamicOverload(3).toString()).toBe('3');
    expect(lineStart.testDynamicOverload(3).toString()).toBe('3^');

    // @ts-expect-error - the token is incomplete
    expect(() => testDynamicString.toString()).toThrow();
    expect(testDynamicString('abc').toString()).toBe('[abc]');
    expect(testDynamicString`abc`.toString()).toBe('[abc]');
    expect(r.testDynamicString('abc').toString()).toBe('[abc]');
    expect(lineStart.testDynamicString('abc').toString()).toBe('^[abc]');
    expect(testDynamicString`abc${'def'}`.toString()).toBe('[abcdef]');

    // @ts-expect-error - the token is incomplete
    expect(() => testDynamicMixed.toString()).toThrow();
    expect(testDynamicMixed('abc').toString()).toBe('[abc]');
    expect(testDynamicMixed`abc`.toString()).toBe('[abc]');
    expect(r.testDynamicMixed('abc').toString()).toBe('[abc]');
    expect(lineStart.testDynamicMixed('abc').toString()).toBe('^[abc]');

    expect(testMixed.toString()).toBe('.');
    expect(r.testMixed.toString()).toBe('.');
    expect(lineStart.testMixed.toString()).toBe('^.');
    expect(testMixed('abc').toString()).toBe('abc');
    expect(testMixed`abc`.toString()).toBe('abc');
    expect(r.testMixed('abc').toString()).toBe('abc');
    expect(lineStart.testMixed('abc').toString()).toBe('^abc');
  });
});
