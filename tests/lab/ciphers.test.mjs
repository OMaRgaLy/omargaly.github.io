import test from 'node:test';
import assert from 'node:assert/strict';
import {
  caesar, rot13, atbash, chiSquared, caesarCrack, vigenere, vigenereCrack, morseEncode, morseDecode,
} from '../../assets/js/lab/lib/ciphers.js';

const ENGLISH =
  'It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, ' +
  'it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, ' +
  'it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us';

test('caesar shifts letters, keeps case and punctuation, handles negative shifts', () => {
  assert.equal(caesar('Hello, World!', 3), 'Khoor, Zruog!');
  assert.equal(caesar('Khoor, Zruog!', -3), 'Hello, World!');
  assert.equal(caesar('abc', 29), 'def');
  assert.equal(caesar('Привет 123', 5), 'Привет 123');
});

test('rot13 and atbash are involutions', () => {
  assert.equal(rot13(rot13('Why did the chicken?')), 'Why did the chicken?');
  assert.equal(atbash('Hello'), 'Svool');
  assert.equal(atbash(atbash('Round Trip')), 'Round Trip');
});

test('chiSquared prefers English over gibberish and is Infinity without letters', () => {
  assert.ok(chiSquared('the quick brown fox jumps over the lazy dog') < chiSquared('zxqjkvwpzxqjkvwp'));
  assert.equal(chiSquared('1234 !!'), Infinity);
});

test('caesarCrack ranks the true shift first', () => {
  const cipher = caesar(ENGLISH, 11);
  const [best] = caesarCrack(cipher);
  assert.equal(best.shift, 11);
  assert.equal(best.plaintext, ENGLISH);
  assert.equal(caesarCrack(cipher).length, 26);
});

test('vigenere known vector and round trip', () => {
  assert.equal(vigenere('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR');
  assert.equal(vigenere('LXFOPVEFRNHR', 'LEMON', true), 'ATTACKATDAWN');
  assert.equal(vigenere('Hello, World', 'key', true).length, 12);
});

test('vigenere key must contain a letter; non-letters in the text do not advance the key', () => {
  assert.throws(() => vigenere('abc', '123'), /at least one letter/);
  assert.equal(vigenere('a b', 'bc'), 'b d');
});

test('vigenereCrack recovers a short key from English text', () => {
  const cipher = vigenere(ENGLISH, 'LEMON');
  const r = vigenereCrack(cipher);
  assert.equal(r.key, 'lemon');
  assert.equal(r.keyLength, 5);
  assert.equal(r.plaintext, ENGLISH);
});

test('vigenereCrack copes with text that has no letters', () => {
  assert.doesNotThrow(() => vigenereCrack('1234 5678'));
});

test('morse encodes and decodes with word separators', () => {
  assert.equal(morseEncode('SOS'), '... --- ...');
  assert.equal(morseEncode('hi mom'), '.... .. / -- --- --');
  assert.equal(morseDecode('.... .. / -- --- --'), 'HI MOM');
  assert.equal(morseEncode('a#'), '.- ?');
  assert.equal(morseDecode('.- ......-'), 'A?');
});
