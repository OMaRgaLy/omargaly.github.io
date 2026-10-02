import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSameKeys } from '../src/lib/i18n-check.mjs';

const en = { a: { b: 'x', c: ['1', '2'] }, d: 'y' };

test('accepts an identical key structure', () => {
  assert.doesNotThrow(() => assertSameKeys(en, { a: { b: 'q', c: ['3', '4'] }, d: 'z' }, 'ru'));
});

test('throws on a missing key', () => {
  assert.throws(() => assertSameKeys(en, { a: { c: ['1', '2'] }, d: 'y' }, 'kz'), /kz.*missing.*a\.b/i);
});

test('throws on an extra key', () => {
  assert.throws(() => assertSameKeys(en, { ...en, e: 'x' }, 'ru'), /ru.*extra.*e/i);
});

test('throws on a different array length', () => {
  assert.throws(() => assertSameKeys(en, { a: { b: 'x', c: ['1'] }, d: 'y' }, 'ru'), /a\.c/);
});
