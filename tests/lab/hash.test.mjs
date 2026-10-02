import test from 'node:test';
import assert from 'node:assert/strict';
import { HASH_ALGOS, digest, hmac } from '../../assets/js/lab/lib/hash.js';
import { utf8ToBytes } from '../../assets/js/lab/lib/encoding.js';

test('lists the SHA family', () => {
  assert.deepEqual(HASH_ALGOS, ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
});

test('digest matches known vectors', async () => {
  assert.equal(await digest('SHA-1', utf8ToBytes('abc')), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(
    await digest('SHA-256', utf8ToBytes('abc')),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('hmac matches a known vector', async () => {
  assert.equal(
    await hmac('SHA-256', utf8ToBytes('key'), utf8ToBytes('The quick brown fox jumps over the lazy dog')),
    'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
  );
});

test('unsupported algorithms and empty HMAC keys give clear errors', async () => {
  await assert.rejects(() => digest('MD5', utf8ToBytes('x')), /Unsupported algorithm/);
  await assert.rejects(() => hmac('SHA-256', new Uint8Array(), utf8ToBytes('x')), /non-empty key/);
});
