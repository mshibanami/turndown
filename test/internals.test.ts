import { describe, it, expect } from 'vitest';
import { edgeWhitespace } from '../dist/index.cjs';

function ews(
  leadingAscii: string,
  leadingNonAscii: string,
  trailingNonAscii: string,
  trailingAscii: string
) {
  return {
    leading: leadingAscii + leadingNonAscii,
    leadingAscii,
    leadingNonAscii,
    trailing: trailingNonAscii + trailingAscii,
    trailingNonAscii,
    trailingAscii
  };
}

const WS = '\r\n \t';
const TEST_CASES = [
  [`${WS}HELLO WORLD${WS}`, ews(WS, '', '', WS)],
  [`${WS}H${WS}`, ews(WS, '', '', WS)],
  [`${WS}\xa0${WS}HELLO${WS}WORLD${WS}\xa0${WS}`, ews(WS, `\xa0${WS}`, `${WS}\xa0`, WS)],
  [`\xa0${WS}HELLO${WS}WORLD${WS}\xa0`, ews('', `\xa0${WS}`, `${WS}\xa0`, '')],
  [`\xa0${WS}\xa0`, ews('', `\xa0${WS}\xa0`, '', '')],
  [`${WS}\xa0${WS}`, ews(WS, `\xa0${WS}`, '', '')],
  [`${WS}\xa0`, ews(WS, '\xa0', '', '')],
  ['HELLO WORLD', ews('', '', '', '')],
  ['', ews('', '', '', '')],
  [`TEST${Array(32768).join(' ')}END`, ews('', '', '', '')] // performance check
];

describe('edge whitespace detection', () => {
  TEST_CASES.forEach((c, i) => {
    it(`case ${i + 1}`, () => {
      expect(edgeWhitespace(c[0])).toEqual(c[1]);
    });
  });
});
