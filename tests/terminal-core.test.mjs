import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCommand, createKonami } from '../assets/js/terminal-core.js';

const en = JSON.parse(readFileSync(new URL('../i18n/en.json', import.meta.url), 'utf8'));
const data = {
  i18n: en.terminal,
  stack: { main: ['Go', 'PostgreSQL'], hobby: ['Elixir'] },
  links: [{ label: 'GitHub', href: 'https://github.com/OMaRgaLy' }],
};

test('empty and whitespace-only input produce no output', () => {
  assert.deepEqual(runCommand('', data), { lines: [] });
  assert.deepEqual(runCommand('   ', data), { lines: [] });
});

test('commands are case-insensitive and trimmed', () => {
  assert.deepEqual(runCommand('  WHOAMI  ', data).lines, en.terminal.whoami);
});

test('help lists the commands', () => {
  assert.deepEqual(runCommand('help', data).lines, en.terminal.help);
});

test('stack prints both groups', () => {
  assert.deepEqual(runCommand('stack', data).lines, ['daily: Go, PostgreSQL', 'on the side: Elixir']);
});

test('contact prints label and url', () => {
  assert.deepEqual(runCommand('contact', data).lines, ['GitHub    https://github.com/OMaRgaLy']);
});

test('lab navigates to the lab page', () => {
  const r = runCommand('lab', data);
  assert.deepEqual(r.lines, en.terminal.lab);
  assert.deepEqual(r.action, { type: 'goto', value: '/lab/' });
});

test('unknown command echoes the input as plain text', () => {
  const r = runCommand('<img src=x onerror=alert(1)>', data);
  assert.deepEqual(r.lines, ['command not found: <img. Try "help".']);
  assert.equal(r.action, undefined);
});

test('theme validates its argument', () => {
  assert.deepEqual(runCommand('theme', data).lines, [en.terminal.usage_theme]);
  assert.deepEqual(runCommand('theme blue', data).lines, [en.terminal.usage_theme]);
  assert.deepEqual(runCommand('theme LIGHT', data).action, { type: 'theme', value: 'light' });
  assert.deepEqual(runCommand('theme toggle', data).action, { type: 'theme', value: 'toggle' });
});

test('lang validates its argument', () => {
  assert.deepEqual(runCommand('lang', data).lines, [en.terminal.usage_lang]);
  assert.deepEqual(runCommand('lang de', data).lines, [en.terminal.usage_lang]);
  assert.deepEqual(runCommand('lang ru', data).action, { type: 'lang', value: 'ru' });
});

test('clear, exit and quit return actions', () => {
  assert.deepEqual(runCommand('clear', data).action, { type: 'clear' });
  assert.deepEqual(runCommand('exit', data).action, { type: 'close' });
  assert.deepEqual(runCommand('quit', data).action, { type: 'close' });
});

test('runCommand does not hand out the shared i18n arrays', () => {
  const r = runCommand('help', data);
  r.lines.push('mutated');
  assert.equal(en.terminal.help.includes('mutated'), false);
});

test('konami fires once after the full sequence and resets', () => {
  let hits = 0;
  const feed = createKonami(() => hits++);
  const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  seq.forEach(feed);
  assert.equal(hits, 1);
  seq.forEach(feed);
  assert.equal(hits, 2);
});

test('konami ignores a broken sequence and accepts upper-case letters', () => {
  let hits = 0;
  const feed = createKonami(() => hits++);
  ['ArrowUp', 'ArrowUp', 'x', 'ArrowDown'].forEach(feed);
  assert.equal(hits, 0);
  ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'].forEach(feed);
  assert.equal(hits, 1);
});
