import test from 'node:test';
import assert from 'node:assert/strict';
import { monthsBetween, formatDuration } from '../assets/js/duration.js';

const day = (s) => new Date(`${s}T12:00:00Z`);

test('month is not counted before its day-of-month', () => {
  assert.equal(monthsBetween('2025-03-17', day('2026-10-03')), 18);
});

test('month is counted on the anniversary day', () => {
  assert.equal(monthsBetween('2025-03-17', day('2026-10-17')), 19);
});

test('a start date in the future yields 0', () => {
  assert.equal(monthsBetween('2027-01-01', day('2026-10-03')), 0);
});

test('start on the 31st only counts whole months', () => {
  assert.equal(monthsBetween('2025-01-31', day('2025-02-28')), 0);
  assert.equal(monthsBetween('2025-01-31', day('2025-03-31')), 2);
});

test('formats English durations', () => {
  assert.equal(formatDuration(18, 'en'), '1 yr 6 mos');
  assert.equal(formatDuration(12, 'en'), '1 yr');
  assert.equal(formatDuration(25, 'en'), '2 yrs 1 mo');
  assert.equal(formatDuration(7, 'en'), '7 mos');
  assert.equal(formatDuration(0, 'en'), '< 1 mo');
});

test('formats Russian and Kazakh durations', () => {
  assert.equal(formatDuration(18, 'ru'), '1 г. 6 мес.');
  assert.equal(formatDuration(18, 'kz'), '1 жыл 6 ай');
});

test('unknown language falls back to English', () => {
  assert.equal(formatDuration(18, 'xx'), '1 yr 6 mos');
});
