import { base64ToBytes } from './base64';

function expectMatchesBuffer(input: string) {
  const expected = Uint8Array.from(Buffer.from(input, 'base64'));
  expect(Array.from(base64ToBytes(input))).toEqual(Array.from(expected));
}

describe('base64ToBytes', () => {
  it('décode une chaîne base64 sans padding', () => {
    // "man" en ASCII encode en base64 sans padding nécessaire.
    expectMatchesBuffer(Buffer.from('man').toString('base64'));
  });

  it('décode une chaîne avec un caractère de padding "="', () => {
    expectMatchesBuffer(Buffer.from('ma').toString('base64'));
  });

  it('décode une chaîne avec deux caractères de padding "=="', () => {
    expectMatchesBuffer(Buffer.from('m').toString('base64'));
  });

  it('décode des octets binaires arbitraires (simule un fragment JPEG)', () => {
    const bytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const base64 = Buffer.from(bytes).toString('base64');
    expect(Array.from(base64ToBytes(base64))).toEqual(Array.from(bytes));
  });

  it('renvoie un tableau vide pour une chaîne vide', () => {
    expect(base64ToBytes('')).toHaveLength(0);
  });

  it('ignore les retours à la ligne (base64 parfois formaté sur plusieurs lignes)', () => {
    const base64 = Buffer.from('hello world').toString('base64');
    const withNewlines = `${base64.slice(0, 4)}\n${base64.slice(4)}`;
    expectMatchesBuffer(base64);
    expect(Array.from(base64ToBytes(withNewlines))).toEqual(Array.from(base64ToBytes(base64)));
  });
});
