import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimestamp, relativeTime, formatLocalInput } from '../../assets/js/lab/lib/time.js';

test('seconds, milliseconds and ISO strings agree', () => {
  const a = parseTimestamp('1700000000');
  const b = parseTimestamp('1700000000000');
  const c = parseTimestamp('2023-11-14T22:13:20Z');
  for (const r of [a, b, c]) {
    assert.equal(r.iso, '2023-11-14T22:13:20.000Z');
    assert.equal(r.seconds, 1700000000);
    assert.equal(r.milliseconds, 1700000000000);
  }
});

test('handles negative and fractional seconds', () => {
  assert.equal(parseTimestamp('-1').iso, '1969-12-31T23:59:59.000Z');
  assert.equal(parseTimestamp('1700000000.5').milliseconds, 1700000000500);
});

test('rejects empty and unparseable input', () => {
  assert.throws(() => parseTimestamp('   '), /Enter a timestamp/);
  assert.throws(() => parseTimestamp('not a date'), /Could not parse/);
});

test('rejects numbers beyond the Date range', () => {
  assert.throws(() => parseTimestamp('99999999999999999999'), /Could not parse/);
});

test('relative time reads naturally in both directions', () => {
  const now = Date.UTC(2026, 9, 3, 12);
  assert.equal(relativeTime(now + 3 * 3600 * 1000, now), 'in 3 hours');
  assert.equal(relativeTime(now - 2 * 86400 * 1000, now), '2 days ago');
  assert.equal(relativeTime(now, now), 'now');
});

test('formatLocalInput renders a datetime-local value for a given UTC offset', () => {
  // 2023-11-14T22:13:20Z seen from UTC+5 (getTimezoneOffset = -300) is 2023-11-15 03:13
  assert.equal(formatLocalInput(1700000000000, -300), '2023-11-15T03:13');
  assert.equal(formatLocalInput(1700000000000, 0), '2023-11-14T22:13');
  assert.equal(formatLocalInput(1700000000000, 480), '2023-11-14T14:13');
});
