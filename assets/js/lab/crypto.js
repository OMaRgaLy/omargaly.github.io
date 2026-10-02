import { $, initLabPage, copyText, showError, setupTabs } from './common.js';
import { utf8ToBytes } from './lib/encoding.js';
import { OPS, OP_GROUPS, runChain, bytesToDisplay } from './lib/chain.js';
import {
  caesar, rot13, atbash, caesarCrack, vigenere, vigenereCrack, morseEncode, morseDecode,
} from './lib/ciphers.js';
import { HASH_ALGOS, digest, hmac } from './lib/hash.js';
import { detectEncodings } from './lib/detect.js';

initLabPage();
setupTabs(document);

// --- Chain: click an operation to add it as a step --------------------------
const steps = []; // { op, params }
const stepsEl = $('#chain-steps');

function buildPalette() {
  const palette = $('#chain-palette');
  for (const group of OP_GROUPS) {
    const wrap = document.createElement('div');
    const label = document.createElement('p');
    label.className = 'palette__label';
    label.textContent = group;
    const buttons = document.createElement('div');
    buttons.className = 'palette__buttons';
    for (const [id, def] of Object.entries(OPS)) {
      if (def.group !== group) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn--sm';
      b.textContent = def.label;
      b.addEventListener('click', () => addStep(id));
      buttons.appendChild(b);
    }
    wrap.append(label, buttons);
    palette.appendChild(wrap);
  }
}

function addStep(op) {
  const params = {};
  for (const p of OPS[op].params) params[p.name] = p.default;
  steps.push({ op, params });
  renderSteps();
  runCurrentChain();
}

function iconButton(text, label, onClick, disabled = false) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn btn--sm';
  b.textContent = text;
  b.setAttribute('aria-label', label);
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function move(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= steps.length) return;
  [steps[i], steps[j]] = [steps[j], steps[i]];
  renderSteps();
  runCurrentChain();
}

function renderSteps() {
  stepsEl.replaceChildren();
  $('#chain-empty').hidden = steps.length > 0;
  steps.forEach((step, i) => {
    const row = document.createElement('div');
    row.className = 'step';
    const label = document.createElement('strong');
    label.textContent = `${i + 1}. ${OPS[step.op].label}`;
    row.appendChild(label);
    for (const p of OPS[step.op].params) {
      const input = document.createElement('input');
      input.type = p.type === 'number' ? 'number' : 'text';
      input.value = step.params[p.name] ?? p.default;
      input.setAttribute('aria-label', p.label);
      input.placeholder = p.label;
      input.addEventListener('input', () => {
        step.params[p.name] = input.value;
        runCurrentChain();
      });
      row.appendChild(input);
    }
    row.append(
      iconButton('↑', `Move step ${i + 1} up`, () => move(i, -1), i === 0),
      iconButton('↓', `Move step ${i + 1} down`, () => move(i, 1), i === steps.length - 1),
      iconButton('Remove', `Remove step ${i + 1}`, () => {
        steps.splice(i, 1);
        renderSteps();
        runCurrentChain();
      }),
    );
    stepsEl.appendChild(row);
  });
}

function runCurrentChain() {
  const result = runChain(utf8ToBytes($('#chain-in').value), steps);
  const shown = bytesToDisplay(result.output);
  $('#chain-out').textContent = shown.text;
  $('#chain-note').textContent = shown.isText ? '' : 'The output is not valid text, so it is shown as hex.';
  showError($('#chain-err'), result.error ? new Error(`Step ${result.error.step + 1}: ${result.error.message}`) : null);
}

buildPalette();
renderSteps();
$('#chain-in').addEventListener('input', runCurrentChain);
$('#chain-clear').addEventListener('click', () => {
  steps.length = 0;
  renderSteps();
  runCurrentChain();
});
$('#chain-example').addEventListener('click', () => {
  $('#chain-in').value = 'Hello, world!';
  steps.length = 0;
  steps.push({ op: 'rot13', params: {} }, { op: 'base64-encode', params: {} }, { op: 'hex-encode', params: {} });
  renderSteps();
  runCurrentChain();
});
$('#chain-copy').addEventListener('click', (ev) => copyText($('#chain-out').textContent, ev.target));

// --- Classical ciphers: live ---------------------------------------------------
const cipherSel = $('#cipher');
const cipherKey = $('#cipher-key');
const cipherIn = $('#cipher-in');
const cipherOut = $('#cipher-out');
const cipherTable = $('#cipher-table');
const cipherMode = () => $('input[name="cipher-mode"]:checked').value;

function syncCipherUi() {
  const c = cipherSel.value;
  const needsKey = c === 'caesar' || c === 'vigenere';
  $('#cipher-key-wrap').hidden = !needsKey;
  $('#cipher-key-label').textContent = c === 'caesar' ? 'Shift' : 'Key';
  if (c === 'caesar' && !/^-?\d+$/.test(cipherKey.value)) cipherKey.value = '3';
  if (c === 'vigenere' && /^-?\d+$/.test(cipherKey.value)) cipherKey.value = 'key';
  $('#cipher-crack').hidden = !needsKey;
  // Atbash and ROT13 undo themselves, so the direction switch would do nothing there.
  $('#cipher-mode-wrap').hidden = c === 'atbash' || c === 'rot13';
  $('#cipher-forward').textContent = c === 'morse' ? 'Text → Morse' : 'Encrypt';
  $('#cipher-backward').textContent = c === 'morse' ? 'Morse → text' : 'Decrypt';
}

function cipherApply() {
  const text = cipherIn.value;
  const key = cipherKey.value;
  const decrypt = cipherMode() === 'backward';
  switch (cipherSel.value) {
    case 'caesar': return caesar(text, (decrypt ? -1 : 1) * (parseInt(key, 10) || 0));
    case 'vigenere': return vigenere(text, key, decrypt);
    case 'atbash': return atbash(text);
    case 'rot13': return rot13(text);
    default: return decrypt ? morseDecode(text) : morseEncode(text);
  }
}

function cipherRun() {
  cipherTable.hidden = true;
  if (!cipherIn.value) {
    cipherOut.textContent = '';
    return showError($('#cipher-err'), null);
  }
  try {
    cipherOut.textContent = cipherApply();
    showError($('#cipher-err'), null);
  } catch (e) {
    cipherOut.textContent = '';
    showError($('#cipher-err'), e);
  }
}

cipherSel.addEventListener('change', () => {
  syncCipherUi();
  cipherRun();
});
for (const el of [cipherIn, cipherKey]) el.addEventListener('input', cipherRun);
document.querySelectorAll('input[name="cipher-mode"]').forEach((r) => r.addEventListener('change', cipherRun));
$('#cipher-copy').addEventListener('click', (ev) => copyText(cipherOut.textContent, ev.target));
syncCipherUi();

$('#cipher-crack').addEventListener('click', () => {
  const text = cipherIn.value;
  showError($('#cipher-err'), null);
  if (cipherSel.value === 'caesar') {
    const ranked = caesarCrack(text);
    cipherOut.textContent = `Best guess: shift ${ranked[0].shift}\n${ranked[0].plaintext}`;
    const body = $('tbody', cipherTable);
    body.replaceChildren();
    for (const r of ranked) {
      const tr = document.createElement('tr');
      const th = document.createElement('td');
      th.textContent = String(r.shift);
      const td = document.createElement('td');
      td.textContent = r.plaintext;
      tr.append(th, td);
      body.appendChild(tr);
    }
    cipherTable.hidden = false;
  } else {
    cipherTable.hidden = true;
    const r = vigenereCrack(text);
    cipherOut.textContent = r.key ? `Best guess: key "${r.key}" (length ${r.keyLength})\n${r.plaintext}` : 'Not enough letters to analyse.';
  }
});

// --- Hashes -------------------------------------------------------------------
$('#hash-run').addEventListener('click', async () => {
  const table = $('#hash-table');
  const body = $('tbody', table);
  body.replaceChildren();
  table.hidden = true;
  try {
    const bytes = utf8ToBytes($('#hash-in').value);
    const key = $('#hash-key').value;
    for (const algo of HASH_ALGOS) {
      const hex = key ? await hmac(algo, utf8ToBytes(key), bytes) : await digest(algo, bytes);
      const tr = document.createElement('tr');
      const a = document.createElement('td');
      a.textContent = key ? `HMAC-${algo}` : algo;
      const d = document.createElement('td');
      d.textContent = hex;
      tr.append(a, d);
      body.appendChild(tr);
    }
    table.hidden = false;
    showError($('#hash-err'), null);
  } catch (e) {
    showError($('#hash-err'), e);
  }
});

// --- Detect -------------------------------------------------------------------
$('#detect-in').addEventListener('input', () => {
  const list = $('#detect-out');
  list.replaceChildren();
  const results = detectEncodings($('#detect-in').value);
  $('#detect-empty').textContent = $('#detect-in').value.trim() && !results.length ? 'No known encoding matched. It may be plain text or a cipher.' : '';
  for (const r of results) {
    const li = document.createElement('li');
    li.textContent = `${r.label}: ${Math.round(r.confidence * 100)}%`;
    list.appendChild(li);
  }
});
