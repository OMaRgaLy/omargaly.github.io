import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (l) => JSON.parse(readFileSync(new URL(`../i18n/${l}.json`, import.meta.url), 'utf8'));

// flatten to { 'a.b': 'string' | '[n]' } where arrays are leaves described by length
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out[p] = `[${v.length}]`;
    else if (v && typeof v === 'object') flatten(v, p, out);
    else out[p] = v;
  }
  return out;
}

const en = flatten(load('en'));

for (const lang of ['ru', 'kz']) {
  test(`${lang} has exactly the same keys and array lengths as en`, () => {
    const other = flatten(load(lang));
    assert.deepEqual(Object.keys(other).sort(), Object.keys(en).sort());
    for (const k of Object.keys(en)) {
      if (en[k].startsWith?.('[')) assert.equal(other[k], en[k], `array length differs at ${k}`);
    }
  });
}

for (const lang of ['en', 'ru', 'kz']) {
  test(`${lang} has no empty strings`, () => {
    for (const [k, v] of Object.entries(flatten(load(lang)))) {
      assert.ok(String(v).trim().length > 0, `${lang}: empty value at ${k}`);
    }
  });
}

test('site.json lists a start date for every current experience', () => {
  const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'));
  for (const x of site.experience) assert.match(x.start, /^\d{4}-\d{2}-\d{2}$/);
});
