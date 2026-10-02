import test from 'node:test';
import assert from 'node:assert/strict';

function setup(initialTheme) {
  const writes = [];
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => { writes.push([k, v]); mem.set(k, v); } };
  globalThis.document = {
    documentElement: { dataset: initialTheme ? { theme: initialTheme } : {} },
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  return writes;
}

test('initTheme does not persist the OS-derived theme', async () => {
  const writes = setup('light');
  const { initTheme } = await import('../assets/js/theme.js');
  initTheme();
  assert.deepEqual(writes, []);
});

test('setTheme persists an explicit choice', async () => {
  const writes = setup('dark');
  const { setTheme } = await import('../assets/js/theme.js');
  setTheme('light');
  assert.deepEqual(writes, [['theme', 'light']]);
  assert.equal(globalThis.document.documentElement.dataset.theme, 'light');
});
