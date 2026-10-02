import { $, $$, initLabPage, copyText, showError, setupTabs } from './common.js';
import {
  base64Encode, base64Decode, base64UrlEncode, hexEncode, hexDecode, urlEncode, urlDecode,
} from './lib/encoding.js';
import { decodeJwt } from './lib/jwt.js';
import { parseTimestamp, relativeTime } from './lib/time.js';
import { uuidv4, uuidv7 } from './lib/uuid.js';

initLabPage();
setupTabs(document);

// --- JWT ---------------------------------------------------------------
const jwtIn = $('#jwt-in');
function renderJwt() {
  const value = jwtIn.value;
  $('#jwt-out').hidden = true;
  $('#jwt-meta').textContent = '';
  if (!value.trim()) return showError($('#jwt-err'), null);
  try {
    const r = decodeJwt(value);
    $('#jwt-header').textContent = JSON.stringify(r.header, null, 2);
    $('#jwt-payload').textContent = JSON.stringify(r.payload, null, 2);
    $('#jwt-out').hidden = false;
    if (r.expiresAt) $('#jwt-meta').textContent = `Expires ${r.expiresAt} (${r.expired ? 'expired' : 'still valid'}).`;
    showError($('#jwt-err'), null);
  } catch (err) {
    showError($('#jwt-err'), err);
  }
}
jwtIn.addEventListener('input', renderJwt);

// --- Base64 / URL / hex -----------------------------------------------
const TRANSFORMS = {
  base64: { encode: (s, root) => ($('[data-urlsafe]', root).checked ? base64UrlEncode(s) : base64Encode(s)), decode: base64Decode },
  url: { encode: urlEncode, decode: urlDecode },
  hex: { encode: hexEncode, decode: hexDecode },
};

$$('[data-transform]').forEach((root) => {
  const t = TRANSFORMS[root.dataset.transform];
  const input = $('[data-in]', root);
  const out = $('[data-out]', root);
  const err = $('[data-err]', root);
  root.addEventListener('click', (ev) => {
    const act = ev.target instanceof HTMLElement ? ev.target.dataset.act : null;
    if (!act) return;
    if (act === 'copy') return copyText(out.textContent, ev.target);
    try {
      out.textContent = t[act](input.value, root);
      showError(err, null);
    } catch (e) {
      out.textContent = '';
      showError(err, e);
    }
  });
});

// --- UUID --------------------------------------------------------------
const uuidOut = $('#uuid-out');
function generate(make) {
  const n = Math.min(50, Math.max(1, Number($('#uuid-count').value) || 1));
  uuidOut.textContent = Array.from({ length: n }, () => make()).join('\n');
}
$('#uuid-v4').addEventListener('click', () => generate(uuidv4));
$('#uuid-v7').addEventListener('click', () => generate(() => uuidv7()));
$('#uuid-copy').addEventListener('click', (ev) => copyText(uuidOut.textContent, ev.target));
generate(uuidv4);

// --- Timestamp ---------------------------------------------------------
const timeIn = $('#time-in');
function renderTime() {
  const table = $('#time-table');
  table.hidden = true;
  if (!timeIn.value.trim()) return showError($('#time-err'), null);
  try {
    const r = parseTimestamp(timeIn.value);
    $('#t-sec').textContent = String(r.seconds);
    $('#t-ms').textContent = String(r.milliseconds);
    $('#t-iso').textContent = r.iso;
    $('#t-local').textContent = new Date(r.milliseconds).toString();
    $('#t-rel').textContent = relativeTime(r.milliseconds);
    table.hidden = false;
    showError($('#time-err'), null);
  } catch (err) {
    showError($('#time-err'), err);
  }
}
timeIn.addEventListener('input', renderTime);
$('#time-now').addEventListener('click', () => {
  timeIn.value = String(Math.floor(Date.now() / 1000));
  renderTime();
});
