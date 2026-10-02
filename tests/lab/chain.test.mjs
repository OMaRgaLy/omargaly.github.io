import test from 'node:test';
import assert from 'node:assert/strict';
import { OPS, runChain, bytesToDisplay } from '../../assets/js/lab/lib/chain.js';
import { utf8ToBytes } from '../../assets/js/lab/lib/encoding.js';

const run = (text, steps) => runChain(utf8ToBytes(text), steps);

test('every op has a label, params and a run function', () => {
  for (const [id, op] of Object.entries(OPS)) {
    assert.ok(op.label && Array.isArray(op.params) && typeof op.run === 'function', id);
  }
});

test('chains operations in order', () => {
  const r = run('hi', [{ op: 'base64-encode' }, { op: 'hex-encode' }]);
  assert.equal(bytesToDisplay(r.output).text, '61476b3d');
  assert.equal(r.error, null);
  assert.equal(r.trace.length, 2);
});

test('decoding chains invert encoding chains, including unicode', () => {
  const enc = run('Қазақстан 🚀', [{ op: 'base64-encode' }, { op: 'hex-encode' }, { op: 'url-encode' }]);
  const dec = runChain(enc.output, [{ op: 'url-decode' }, { op: 'hex-decode' }, { op: 'base64-decode' }]);
  assert.equal(bytesToDisplay(dec.output).text, 'Қазақстан 🚀');
});

test('xor with the same key twice restores the input; non-text results show as hex', () => {
  const once = run('secret', [{ op: 'xor', params: { key: 'k' } }]);
  assert.equal(bytesToDisplay(once.output).isText, true);
  const bin = run('ÿ', [{ op: 'xor', params: { key: '\u0001' } }]);
  const twice = runChain(once.output, [{ op: 'xor', params: { key: 'k' } }]);
  assert.equal(bytesToDisplay(twice.output).text, 'secret');
  assert.equal(typeof bytesToDisplay(bin.output).text, 'string');
});

test('xor accepts a 0x hex key and rejects an empty key', () => {
  const r = run('A', [{ op: 'xor', params: { key: '0x01' } }]);
  assert.equal(bytesToDisplay(r.output).text, '@');
  const bad = run('A', [{ op: 'xor', params: { key: '' } }]);
  assert.equal(bad.error.step, 0);
});

test('caesar, rot13, atbash, reverse, case and morse ops work', () => {
  assert.equal(bytesToDisplay(run('abc', [{ op: 'caesar', params: { shift: 1 } }]).output).text, 'bcd');
  assert.equal(bytesToDisplay(run('abc', [{ op: 'rot13' }]).output).text, 'nop');
  assert.equal(bytesToDisplay(run('abc', [{ op: 'atbash' }]).output).text, 'zyx');
  assert.equal(bytesToDisplay(run('abc', [{ op: 'reverse' }]).output).text, 'cba');
  assert.equal(bytesToDisplay(run('abc', [{ op: 'upper' }]).output).text, 'ABC');
  assert.equal(bytesToDisplay(run('SOS', [{ op: 'morse-encode' }]).output).text, '... --- ...');
});

test('binary encode and decode', () => {
  const enc = run('Hi', [{ op: 'binary-encode' }]);
  assert.equal(bytesToDisplay(enc.output).text, '01001000 01101001');
  assert.equal(bytesToDisplay(runChain(enc.output, [{ op: 'binary-decode' }]).output).text, 'Hi');
});

test('an error stops the chain and names the failing step', () => {
  const r = run('!!!', [{ op: 'reverse' }, { op: 'base64-decode' }, { op: 'hex-encode' }]);
  assert.equal(r.error.step, 1);
  assert.match(r.error.message, /Base64/);
  assert.equal(r.trace[0].ok, true);
  assert.equal(r.trace[1].ok, false);
  assert.equal(r.trace.length, 2);
});

test('an unknown op is an error, an empty chain returns the input', () => {
  assert.equal(run('x', [{ op: 'nope' }]).error.step, 0);
  assert.equal(bytesToDisplay(run('x', []).output).text, 'x');
});

test('bytesToDisplay falls back to hex for invalid UTF-8', () => {
  const d = bytesToDisplay(new Uint8Array([0xff, 0xfe]));
  assert.equal(d.isText, false);
  assert.equal(d.text, 'fffe');
});
