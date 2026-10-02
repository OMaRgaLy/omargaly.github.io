import test from 'node:test';
import assert from 'node:assert/strict';
import { readStored, writeStored } from '../assets/js/storage.js';

function withStorage(value, fn) {
  Object.defineProperty(globalThis, 'localStorage', { value, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    delete globalThis.localStorage;
  }
}

test('returns null / false when localStorage is unavailable', () => {
  withStorage(undefined, () => {
    assert.equal(readStored('theme'), null);
    assert.equal(writeStored('theme', 'dark'), false);
  });
});

test('returns null / false when localStorage throws', () => {
  const throwing = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  withStorage(throwing, () => {
    assert.equal(readStored('theme'), null);
    assert.equal(writeStored('theme', 'dark'), false);
  });
});

test('reads and writes through a working localStorage', () => {
  const mem = new Map();
  const ok = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
  withStorage(ok, () => {
    assert.equal(writeStored('lang', 'ru'), true);
    assert.equal(readStored('lang'), 'ru');
    assert.equal(readStored('missing'), null);
  });
});
