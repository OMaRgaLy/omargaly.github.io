import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeToDisplay } from '../../assets/js/lab/lib/transforms.js';
import { bytesToBase64, bytesToHex } from '../../assets/js/lab/lib/encoding.js';

test('decoding valid UTF-8 shows the text', () => {
  assert.deepEqual(decodeToDisplay('base64', 'aGk='), { text: 'hi', isText: true });
  assert.deepEqual(decodeToDisplay('hex', '6869'), { text: 'hi', isText: true });
});

test('decoding bytes that are not text falls back to hex instead of failing', () => {
  const bytes = new Uint8Array([0xff, 0xfe]);
  assert.deepEqual(decodeToDisplay('base64', bytesToBase64(bytes)), { text: 'fffe', isText: false });
  assert.deepEqual(decodeToDisplay('hex', bytesToHex(bytes)), { text: 'fffe', isText: false });
});

test('invalid input is still an error and unknown kinds are rejected', () => {
  assert.throws(() => decodeToDisplay('base64', '!!!'), /Not valid Base64/);
  assert.throws(() => decodeToDisplay('hex', 'zz'), /Not valid hex/);
  assert.throws(() => decodeToDisplay('nope', 'x'), /Unknown/);
});
