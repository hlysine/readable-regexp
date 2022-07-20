import { char, exactly, not, oneOf, oneOrMore, repeat, unicode, whitespace } from '../src/index';

describe('exactly', () => {
  it('accepts plain strings', () => {
    expect(exactly`foo`.toString()).toBe('foo');
    expect(exactly('foo').toString()).toBe('foo');
  });
  it('accepts template literals', () => {
    expect(exactly`foo${1}bar${2}`.toString()).toBe('foo1bar2');
  });
});

describe('unicode', () => {
  it('accepts literals', () => {
    expect(unicode`12ef`.toString()).toBe('\\u12ef');
    expect(unicode('12ef').toString()).toBe('\\u12ef');
  });
  it('accepts template literals', () => {
    expect(unicode`e${1}f${2}`.toString()).toBe('\\ue1f2');
  });
  it('validates correctly', () => {
    expect(unicode`12ef`.toString()).toBe('\\u12ef');
    expect(unicode`FFFF`.toString()).toBe('\\uFFFF');
    expect(unicode`aBcD`.toString()).toBe('\\uaBcD');
    expect(() => unicode``).toThrow();
    expect(() => unicode`g1h2`).toThrow();
    expect(() => unicode`123`).toThrow();
    expect(() => unicode`123ef`).toThrow();
  });
  it('can be negated and quantified', () => {
    expect(not.unicode`12ef`.toString()).toBe('[^\\u12ef]');
    expect(oneOrMore.unicode`12ef`.toString()).toBe('\\u12ef+');
    expect(oneOrMore.not.unicode`12ef`.toString()).toBe('(?:[^\\u12ef])+');
  });
});

describe('not', () => {
  it('is chainable', () => {
    expect(not.whitespace.exactly`foo`.toString()).toBe('\\Sfoo');
    expect(exactly`foo`.not.whitespace.toString()).toBe('foo\\S');
    expect(not.whitespace.not(whitespace).not.whitespace.toString()).toBe('\\S\\S\\S');
  });
  it('does not allow non-negatable tokens', () => {
    // @ts-expect-error - not(char) is not negatable
    expect(() => not(char)).toThrow();
  });
});

describe('repeat', () => {
  it('accepts plain strings', () => {
    expect(repeat(3)`foo`.toString()).toBe('(?:foo){3}');
    expect(repeat(3)('foo').toString()).toBe('(?:foo){3}');
    expect(repeat(3, 5)`foo`.toString()).toBe('(?:foo){3,5}');
    expect(repeat(3, 5)('foo').toString()).toBe('(?:foo){3,5}');
  });
  it('accepts special tokens', () => {
    expect(repeat(3)(char).toString()).toBe('.{3}');
    expect(repeat(3).char.toString()).toBe('.{3}');
    expect(repeat(3, 5)(char).toString()).toBe('.{3,5}');
    expect(repeat(3, 5).char.toString()).toBe('.{3,5}');
  });
  it('accepts expressions', () => {
    expect(repeat(3)(exactly`foo`).toString()).toBe('(?:foo){3}');
    expect(repeat(3).exactly`foo`.toString()).toBe('(?:foo){3}');
    expect(repeat(3, 5)(exactly`foo`).toString()).toBe('(?:foo){3,5}');
    expect(repeat(3, 5).exactly`foo`.toString()).toBe('(?:foo){3,5}');
  });
});

describe('oneOrMore', () => {
  it('accepts plain strings', () => {
    expect(oneOrMore`foo`.toString()).toBe('(?:foo)+');
    expect(oneOrMore('foo').toString()).toBe('(?:foo)+');
  });
  it('accepts special tokens', () => {
    expect(oneOrMore(char).toString()).toBe('.+');
    expect(oneOrMore.char.toString()).toBe('.+');
  });
  it('accepts expressions', () => {
    expect(oneOrMore(exactly`foo`).toString()).toBe('(?:foo)+');
    expect(oneOrMore.exactly`foo`.toString()).toBe('(?:foo)+');
  });
});

describe('oneOf', () => {
  it('accepts plain strings', () => {
    expect(oneOf`foo`.toString()).toBe('(?:foo)');
    expect(oneOf('foo').toString()).toBe('(?:foo)');
  });
  it('works with multiple values', () => {
    expect(oneOf`foo``bar``baz`.toString()).toBe('(?:foo|bar|baz)');
    expect(oneOf('foo', 'bar', exactly`baz`).toString()).toBe('(?:foo|bar|baz)');
    expect(oneOf('foo')('bar')(exactly`baz`).toString()).toBe('(?:foo|bar|baz)');
  });
  it('is chainable', () => {
    expect(oneOf`foo``bar``baz`.char.toString()).toBe('(?:foo|bar|baz).');
    expect(oneOrMore.oneOf`foo``bar`(exactly`baz`.char).toString()).toBe('(?:(?:foo|bar|baz.))+');
  });
});
