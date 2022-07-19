import { exactly } from '../src/index';

describe('exactly', () => {
  it('works', () => {
    console.log(exactly`foo`);
    console.log(exactly('foo'));
  });
});
