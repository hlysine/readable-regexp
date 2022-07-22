import { captureAs, exactly, lineStart, oneOrMore, word } from '../src/index';

describe('integration test', () => {
  it('validates URLs', () => {
    const protocol = captureAs`protocol`.oneOf(exactly`http`.maybe`s`)`smtp``ftp`;
    const domain = captureAs`domain`(oneOrMore.charIn(word, '-').oneOrMore(exactly`.`.oneOrMore.charIn(word, '-')));
    const port = exactly`:`.captureAs`port`.oneOrMore.digit;
    const path = exactly`/`.captureAs`path`(
      oneOrMore.charIn(word, '-.').zeroOrMore(exactly`/`.oneOrMore.charIn(word, '-.'))
    );
    const query = exactly`?`.captureAs`query`.zeroOrMore.char;
    const regex = lineStart.match(protocol).exactly`://`.match(domain).maybe(port).maybe(path).maybe(query).lineEnd;

    expect(regex.toString()).toBe(
      '^(?<protocol>https?|smtp|ftp):\\/\\/(?<domain>[\\w\\-]+(?:\\.[\\w\\-]+)+)(?::(?<port>\\d+))?(?:\\/(?<path>[\\w\\-.]+(?:\\/[\\w\\-.]+)*))?(?:\\?(?<query>.*))?$'
    );

    const regexObj = regex.toRegExp();
    expect(regexObj.test('http://example.com')).toBe(true);
    expect(regexObj.test('http:/./example.com')).toBe(false);
  });
  it('parse logs', () => {
    const regex = exactly`[`.captureAs`timestamp`.oneOrMore.char.exactly`] `.captureAs`category`.oneOrMore.char
      .exactly`: `.captureAs`message`.oneOrMore.char;

    expect(regex.toString()).toBe('\\[(?<timestamp>.+)\\]\\ (?<category>.+):\\ (?<message>.+)');

    const regexObj = regex.toRegExp();
    expect(regexObj.test('[2020.06.10 08:40:44] App Info: reading settings...')).toBe(true);
  });
});
