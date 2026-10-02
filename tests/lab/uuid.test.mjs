import test from 'node:test';
import assert from 'node:assert/strict';
import { uuidv4, uuidv7 } from '../../assets/js/lab/lib/uuid.js';

test('uuidv4 has the v4 layout and is random', () => {
  const a = uuidv4();
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(a, uuidv4());
});

test('uuidv7 embeds the timestamp and has the v7 layout', () => {
  const u = uuidv7(0x018f6b2c4d5e);
  assert.match(u, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.ok(u.startsWith('018f6b2c-4d5e-'));
});

test('uuidv7 values created later sort later', () => {
  assert.ok(uuidv7(1_000_000_000_000) < uuidv7(1_000_000_000_001));
});
