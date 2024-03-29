import {
  capture,
  captureAs,
  charIn,
  exactly,
  lineStart,
  match,
  maybe,
  oneOrMore,
  word,
  zeroOrMore,
} from '../src/index';

describe('integration test', () => {
  it('parse point', () => {
    const num = capture.oneOf(oneOrMore.digit, zeroOrMore.digit.exactly`.`.oneOrMore.digit);
    const regExp = match(num).exactly`,`.maybe` `.match(num);

    expect(regExp.toString()).toBe('(\\d+|\\d*\\.\\d+)\\,\\ ?(\\d+|\\d*\\.\\d+)');

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('12.4, .56')).toBe(true);
    expect(regExpObj.test('12., 4.')).toBe(false);
  });
  it('validates URLs', () => {
    const protocol = captureAs`protocol`.oneOf(exactly`http`.maybe`s`)`smtp``ftp`;
    const domain = captureAs`domain`(oneOrMore.charIn(word, '-').oneOrMore(exactly`.`.oneOrMore.charIn(word, '-')));
    const port = exactly`:`.captureAs`port`.oneOrMore.digit;
    const path = exactly`/`.maybe.captureAs`path`(
      oneOrMore.charIn(word, '-.').zeroOrMore(exactly`/`.oneOrMore.charIn(word, '-.'))
    );
    const query = exactly`?`.captureAs`query`.zeroOrMore.char;
    const regExp = lineStart.match(protocol).exactly`://`.match(domain).maybe(port).maybe(path).maybe(query).lineEnd;

    expect(regExp.toString()).toBe(
      '^(?<protocol>https?|smtp|ftp):\\/\\/(?<domain>[\\w-]+(?:\\.[\\w-]+)+)(?::(?<port>\\d+))?(?:\\/(?<path>[\\w\\-.]+(?:\\/[\\w\\-.]+)*)?)?(?:\\?(?<query>.*))?$'
    );

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('http://example.com')).toBe(true);
    expect(regExpObj.test('ftp://www.amazingftp.net/path/to/your/file.txt')).toBe(true);
    expect(regExpObj.test('http://unsafe-website99.io:8080/index.html?password=pas$word')).toBe(true);
    expect(regExpObj.test('http:/./example.com')).toBe(false);
  });
  it('parse logs', () => {
    const regExp = exactly`[`.captureAs`timestamp`.oneOrMore.char.exactly`] `.captureAs`category`.oneOrMore.char
      .exactly`: `.captureAs`message`.oneOrMore.char;

    expect(regExp.toString()).toBe('\\[(?<timestamp>.+)\\]\\ (?<category>.+):\\ (?<message>.+)');

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('[2020.06.10 08:40:44] App Info: reading settings...')).toBe(true);
  });
  it('validate numbers', () => {
    const decimal = maybe`-`.oneOrMore.digit.maybe(exactly`.`.oneOrMore.digit);
    const separatedDecimal = zeroOrMore(oneOrMore.digit.exactly`,`).match(decimal);
    const scientific = match(decimal).exactly`e`.match(decimal);
    const hexadecimal = exactly`0x`.oneOrMore.charIn`0-9a-fA-F`;
    const regExp = lineStart.oneOf(separatedDecimal, scientific, hexadecimal).lineEnd;

    expect(regExp.toString()).toBe(
      '^(?:(?:\\d+\\,)*\\-?\\d+(?:\\.\\d+)?|\\-?\\d+(?:\\.\\d+)?e\\-?\\d+(?:\\.\\d+)?|0x[0-9a-fA-F]+)$'
    );

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('123,456.78')).toBe(true);
    expect(regExpObj.test('123.456')).toBe(true);
    expect(regExpObj.test('-12e-4')).toBe(true);
    expect(regExpObj.test('-32.5e-3')).toBe(true);
    expect(regExpObj.test('0x33492d')).toBe(true);
    expect(regExpObj.test('12E34')).toBe(false);
    expect(regExpObj.test('0x3kd3o5')).toBe(false);
    expect(regExpObj.test('123.456,123')).toBe(false);
  });
  it('validate dates', () => {
    const day = capture.oneOf(charIn`1-9`, charIn`1-2`.digit, exactly`3`.charIn`01`);
    const month = capture.oneOf(charIn`1-9`, exactly`1`.charIn`012`);
    const year = capture.repeat(4).digit;
    const regExp = lineStart.match(day).capture.oneOf`-``/`.match(month).ref(2).match(year).lineEnd;

    expect(regExp.toString()).toBe('^([1-9]|[1-2]\\d|3[01])(\\-|\\/)([1-9]|1[012])\\2(\\d{4})$');

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('31/12/2099')).toBe(true);
    expect(regExpObj.test('1/8/1934')).toBe(true);
    expect(regExpObj.test('31-12-2013')).toBe(true);
    expect(regExpObj.test('6/7/2020')).toBe(true);
    expect(regExpObj.test('12/31/2099')).toBe(false);
    expect(regExpObj.test('2-3/1946')).toBe(false);
    expect(regExpObj.test('33-1-2000')).toBe(false);
    expect(regExpObj.test('2/1-2000')).toBe(false);
  });
  it('validate emails', () => {
    const username = oneOrMore.word.zeroOrMore(exactly`.`.oneOrMore.word);
    const filter = exactly`+`.oneOrMore.word;
    const domain = oneOrMore.word.oneOrMore(exactly`.`.oneOrMore.word);
    const regExp = lineStart.capture(username).maybe(filter).exactly`@`.capture(domain).lineEnd;

    expect(regExp.toString()).toBe('^(\\w+(?:\\.\\w+)*)(?:\\+\\w+)?@(\\w+(?:\\.\\w+)+)$');

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('tom.e@mail.net')).toBe(true);
    expect(regExpObj.test('maryC092@mail.co.uk')).toBe(true);
    expect(regExpObj.test('tom.e+spam@mail.org')).toBe(true);
    expect(regExpObj.test('maryC092+filter@mail.co.uk')).toBe(true);
    expect(regExpObj.test('support @company.com')).toBe(false);
    expect(regExpObj.test('support@a bc.com')).toBe(false);
    expect(regExpObj.test('abc..def@mail.com')).toBe(false);
    expect(regExpObj.test('abc+fil ter@def.org')).toBe(false);
  });
  it('validate HTML tags', () => {
    const attribute = exactly` `
      .notAhead(exactly`class`) // leave the class attribute out
      .oneOrMore.word.maybe(exactly`="`.oneOrMore.charIn(word, `- `).exactly`"`);
    const classAttribute = exactly` class="`.capture.oneOrMore.charIn(word, `- `).exactly`"`;
    const regExp = lineStart.exactly`<`.capture.oneOrMore.word
      .zeroOrMore(attribute)
      .maybe(classAttribute)
      .zeroOrMore(attribute).exactly`>`.capture.zeroOrMore.char.exactly`</`.ref(1).exactly`>`.lineEnd;

    expect(regExp.toString()).toBe(
      '^<(\\w+)(?:\\ (?!class)\\w+(?:="[\\w\\- ]+")?)*(?:\\ class="([\\w\\- ]+)")?(?:\\ (?!class)\\w+(?:="[\\w\\- ]+")?)*>(.*)<\\/\\1>$'
    );

    const regExpObj = regExp.toRegExp();
    expect(regExpObj.test('<h1>Welcome!</h1>')).toBe(true);
    expect(regExpObj.test('<span class="regExp editor center"><b>Click</b></span>')).toBe(true);
    expect(
      regExpObj.test('<div contenteditable spellcheck="false" class="container"><div class="row"></div></div>')
    ).toBe(true);
    expect(regExpObj.test('<p hidden class="caption-large">Text</p>')).toBe(true);
    expect(regExpObj.test('<i>Tag mismatch</b>')).toBe(false);
    expect(regExpObj.test('<span class="xz>e">Invalid class</span>')).toBe(false);
    expect(regExpObj.test('<i>No end tag')).toBe(false);
    expect(regExpObj.test('No tag at all')).toBe(false);
  });
});
