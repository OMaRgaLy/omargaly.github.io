import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeJwt } from '../../assets/js/lab/lib/jwt.js';
import { base64UrlEncode } from '../../assets/js/lab/lib/encoding.js';

const make = (h, p, sig = 'sig') => `${base64UrlEncode(JSON.stringify(h))}.${base64UrlEncode(JSON.stringify(p))}.${sig}`;

test('decodes header, payload and signature', () => {
  const t = make({ alg: 'HS256', typ: 'JWT' }, { sub: '123', name: 'Омар' }, 'abc');
  const r = decodeJwt(t);
  assert.deepEqual(r.header, { alg: 'HS256', typ: 'JWT' });
  assert.deepEqual(r.payload, { sub: '123', name: 'Омар' });
  assert.equal(r.signature, 'abc');
  assert.equal(r.expiresAt, null);
  assert.equal(r.expired, null);
});

test('reports expiry relative to now', () => {
  const t = make({ alg: 'none' }, { exp: 1700000000 });
  assert.equal(decodeJwt(t, 1700000001000).expired, true);
  assert.equal(decodeJwt(t, 1699999999000).expired, false);
  assert.equal(decodeJwt(t, 0).expiresAt, '2023-11-14T22:13:20.000Z');
});

test('strips a Bearer prefix and surrounding whitespace', () => {
  const t = make({ alg: 'none' }, { a: 1 });
  assert.deepEqual(decodeJwt(`  Bearer ${t}\n`).payload, { a: 1 });
});

test('accepts an unsigned token with an empty signature', () => {
  assert.equal(decodeJwt(make({ alg: 'none' }, { a: 1 }, '')).signature, '');
});

test('rejects tokens that are not three parts', () => {
  assert.throws(() => decodeJwt('abc.def'), /three dot-separated parts/);
  assert.throws(() => decodeJwt(''), /three dot-separated parts/);
});

test('rejects parts that are not Base64URL JSON', () => {
  assert.throws(() => decodeJwt('!!!.e30.sig'), /header is not valid/);
  assert.throws(() => decodeJwt('e30.@@@.sig'), /payload is not valid/);
});

test('rejects a header or payload that is not a JSON object', () => {
  const part = (s) => base64UrlEncode(s);
  assert.throws(() => decodeJwt(`${part('{}')}.${part('null')}.x`), /payload is not a JSON object/);
  assert.throws(() => decodeJwt(`${part('{}')}.${part('[1]')}.x`), /payload is not a JSON object/);
  assert.throws(() => decodeJwt(`${part('"s"')}.${part('{}')}.x`), /header is not a JSON object/);
});

test('an exp outside the Date range does not crash', () => {
  const r = decodeJwt(make({ alg: 'none' }, { exp: 1e20 }));
  assert.equal(r.expiresAt, null);
  assert.equal(r.expired, false);
});
