import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEncodings } from '../../assets/js/lab/lib/detect.js';

const top = (s) => detectEncodings(s)[0]?.id;

test('detects JWTs', () => {
  assert.equal(top('eyJhbGciOiJIUzI1NiJ9.eyJhIjoxfQ.c2ln'), 'jwt');
});

test('detects hash lengths ahead of plain hex', () => {
  assert.equal(top('5d41402abc4b2a76b9719d911017c592'), 'hash-32');
  assert.equal(top('a9993e364706816aba3e25717850c26c9cd0d89d'), 'hash-40');
  assert.equal(top('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'), 'hash-64');
});

test('detects base64, url, binary, morse and hex', () => {
  assert.equal(top('aGVsbG8gd29ybGQ='), 'base64');
  assert.equal(top('hello%20world'), 'url');
  assert.equal(top('01101000 01101001'), 'binary');
  assert.equal(top('... --- ...'), 'morse');
  assert.equal(top('48656c6c6f20'), 'hex');
});

test('blank and plain text input give no strong guess', () => {
  assert.deepEqual(detectEncodings('   '), []);
  assert.ok(!detectEncodings('hello world').some((c) => c.confidence > 0.5));
});

test('results are sorted by confidence descending', () => {
  const r = detectEncodings('5d41402abc4b2a76b9719d911017c592');
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].confidence >= r[i].confidence);
});
