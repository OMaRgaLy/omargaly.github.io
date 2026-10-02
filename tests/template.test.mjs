import test from 'node:test';
import assert from 'node:assert/strict';
import { render, escapeHtml, lookup } from '../src/lib/template.mjs';

test('escapeHtml escapes markup characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

test('lookup follows dotted paths', () => {
  assert.equal(lookup({ a: { b: 'c' } }, 'a.b'), 'c');
  assert.equal(lookup({ a: {} }, 'a.b.c'), undefined);
});

test('render inserts escaped strings', () => {
  assert.equal(render('<p>{{a.b}}</p>', { a: { b: '<b>' } }), '<p>&lt;b&gt;</p>');
});

test('render inserts raw fragments verbatim', () => {
  assert.equal(render('<p>{{{x}}}</p>', {}, { x: '<b>ok</b>' }), '<p><b>ok</b></p>');
});

test('render throws on a missing string', () => {
  assert.throws(() => render('{{a.b}}', { a: {} }), /Missing string: a\.b/);
});

test('render throws on a non-string value', () => {
  assert.throws(() => render('{{a}}', { a: ['x'] }), /Missing string: a/);
});

test('render throws on a missing raw fragment', () => {
  assert.throws(() => render('{{{x}}}', {}, {}), /Missing raw fragment: x/);
});

test('inserted raw fragments are not scanned for placeholders again', () => {
  assert.equal(render('{{{x}}}', { a: '1' }, { x: '{{a}}' }), '{{a}}');
});
