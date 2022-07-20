import { char, exactly, not } from '../src/index';

describe('char', () => {
  it('works', () => {
    expect(char.toString()).toBe('.');
  });
  it('is chainable', () => {
    expect(char.exactly`foo`.toString()).toBe('.foo');
    expect(exactly`foo`.char.toString()).toBe('foo.');
    expect(char.char.char.toString()).toBe('...');
  });
  it('cannot be negated', () => {
    // @ts-expect-error - char is not negatable
    expect(() => not.char).toThrow();
    // @ts-expect-error - char is not negatable
    expect(() => not(char)).toThrow();
  });
});
