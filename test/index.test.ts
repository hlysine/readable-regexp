import { char, exactly } from '../src/index';

describe('exactly', () => {
  it('works', () => {
    expect(exactly`foo`).toHaveProperty('regex', 'foo');
    expect(exactly('foo')).toHaveProperty('regex', 'foo');
  });
});

describe('char', () => {
  it('works', () => {
    expect(char).toHaveProperty('regex', '.');
  });
});

describe('chaining', () => {
  it('works', () => {
    expect(exactly`foo`.char).toHaveProperty('regex', 'foo.');
  });
});
