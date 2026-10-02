import { $, initLabPage, copyText, showError, setupTabs } from './common.js';
import { utf8ToBytes } from './lib/encoding.js';
import { OPS, runChain, bytesToDisplay } from './lib/chain.js';
import {
  caesar, rot13, atbash, caesarCrack, vigenere, vigenereCrack, morseEncode, morseDecode,
} from './lib/ciphers.js';
import { HASH_ALGOS, digest, hmac } from './lib/hash.js';
import { detectEncodings } from './lib/detect.js';

initLabPage();
setupTabs(document);

// --- Chain ---------------------------------------------------------------
const steps = []; // { op, params }
const stepsEl = $('#chain-steps');
const addSelect = $('#chain-add-op');
for (const [id, def] of Object.entries(OPS)) {
  const o = document.createElement('option');
  o.value = id;
  o.textContent = def.label;
  addSelect.appendChild(o);
}

function renderSteps() {
  stepsEl.replaceChildren();
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
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn--sm';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      steps.splice(i, 1);
      renderSteps();
      runCurrentChain();
    });
    row.appendChild(remove);
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

$('#chain-in').addEventListener('input', runCurrentChain);
$('#chain-add').addEventListener('click', () => {
  const op = addSelect.value;
  const params = {};
  for (const p of OPS[op].params) params[p.name] = p.default;
  steps.push({ op, params });
  renderSteps();
  runCurrentChain();
});
$('#chain-clear').addEventListener('click', () => {
  steps.length = 0;
  renderSteps();
  runCurrentChain();
});
$('#chain-copy').addEventListener('click', (ev) => copyText($('#chain-out').textContent, ev.target));

// --- Classical ciphers ------------------------------------------------------
const cipherSel = $('#cipher');
const cipherKey = $('#cipher-key');
const cipherOut = $('#cipher-out');
const cipherTable = $('#cipher-table');

function syncCipherUi() {
  const c = cipherSel.value;
  const needsKey = c === 'caesar' || c === 'vigenere';
  $('#cipher-key-wrap').hidden = !needsKey;
  $('#cipher-key-label').textContent = c === 'caesar' ? 'Shift' : 'Key';
  if (c === 'caesar' && !/^-?\d+$/.test(cipherKey.value)) cipherKey.value = '3';
  if (c === 'vigenere' && /^-?\d+$/.test(cipherKey.value)) cipherKey.value = 'key';
  $('#cipher-crack').hidden = !needsKey;
  cipherTable.hidden = true;
}
cipherSel.addEventListener('change', syncCipherUi);
syncCipherUi();

function cipherApply(decrypt) {
  const text = $('#cipher-in').value;
  const key = cipherKey.value;
  switch (cipherSel.value) {
    case 'caesar': return caesar(text, (decrypt ? -1 : 1) * (parseInt(key, 10) || 0));
    case 'vigenere': return vigenere(text, key, decrypt);
    case 'atbash': return atbash(text);
    case 'rot13': return rot13(text);
    default: return decrypt ? morseDecode(text) : morseEncode(text);
  }
}

function cipherRun(decrypt) {
  cipherTable.hidden = true;
  try {
    cipherOut.textContent = cipherApply(decrypt);
    showError($('#cipher-err'), null);
  } catch (e) {
    cipherOut.textContent = '';
    showError($('#cipher-err'), e);
  }
}
$('#cipher-enc').addEventListener('click', () => cipherRun(false));
$('#cipher-dec').addEventListener('click', () => cipherRun(true));
$('#cipher-copy').addEventListener('click', (ev) => copyText(cipherOut.textContent, ev.target));

$('#cipher-crack').addEventListener('click', () => {
  const text = $('#cipher-in').value;
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
