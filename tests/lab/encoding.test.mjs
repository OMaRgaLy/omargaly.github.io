import test from 'node:test';
import assert from 'node:assert/strict';
import {
  utf8ToBytes, bytesToUtf8, bytesToBase64, base64ToBytes, base64Encode, base64Decode,
  base64UrlEncode, hexEncode, hexToBytes, hexDecode, bytesToHex, urlEncode, urlDecode,
} from '../../assets/js/lab/lib/encoding.js';

const SAMPLES = ['hello', 'Привет, мир', 'Сәлем, Қазақстан ғұқ', 'emoji 🚀 ok', ''];

test('base64 round-trips unicode', () => {
  for (const s of SAMPLES) assert.equal(base64Decode(base64Encode(s)), s);
});

test('base64 known vector', () => {
  assert.equal(base64Encode('hello'), 'aGVsbG8=');
  assert.equal(base64Decode('aGVsbG8='), 'hello');
});

test('base64 decode accepts url alphabet, missing padding and whitespace', () => {
  assert.equal(base64Decode('aGVs bG8'), 'hello');
  assert.equal(base64Decode(base64UrlEncode('subjects?_d')), 'subjects?_d');
});

test('base64url output has no +, / or =', () => {
  assert.doesNotMatch(base64UrlEncode('???>>>~~~'), /[+/=]/);
});

test('base64 rejects garbage with a clear error', () => {
  assert.throws(() => base64Decode('!!!not base64!!!'), /Not valid Base64/);
});

test('base64 decode into invalid UTF-8 throws instead of returning mojibake', () => {
  assert.throws(() => base64Decode(bytesToBase64(new Uint8Array([0xff, 0xfe, 0xfd]))));
});

test('hex round-trips unicode and accepts 0x, spaces and upper case', () => {
  for (const s of SAMPLES) assert.equal(hexDecode(hexEncode(s)), s);
  assert.deepEqual([...hexToBytes('0xDE AD be ef')], [0xde, 0xad, 0xbe, 0xef]);
  assert.equal(bytesToHex(new Uint8Array([1, 171])), '01ab');
});

test('hex rejects odd length and non-hex characters', () => {
  assert.throws(() => hexToBytes('abc'), /Not valid hex/);
  assert.throws(() => hexToBytes('zz'), /Not valid hex/);
});

test('url encode/decode round-trip and form-style plus', () => {
  for (const s of SAMPLES) assert.equal(urlDecode(urlEncode(s)), s);
  assert.equal(urlDecode('a%20b+c'), 'a b c');
  assert.throws(() => urlDecode('%E0%A4%A'), /Not valid URL encoding/);
});

test('utf8 helpers agree', () => {
  assert.equal(bytesToUtf8(utf8ToBytes('Қазақ')), 'Қазақ');
  assert.deepEqual([...base64ToBytes('AQID')], [1, 2, 3]);
});
