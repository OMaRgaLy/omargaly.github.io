import { $, initLabPage, copyText, showError } from './common.js';
import { jsonToGo, goToJson } from './lib/json2go.js';

initLabPage();

const input = $('#in');
const output = $('#out');
const err = $('#err');

const EXAMPLE_JSON = JSON.stringify(
  {
    id: 42,
    user_id: 7,
    html_url: 'https://example.com',
    name: 'Omar',
    score: 9.5,
    active: true,
    tags: ['go', 'ai'],
    address: { city: 'Semey', zip: null },
    items: [{ id: 1 }, { id: 2, label: 'x' }],
  },
  null,
  2,
);

const MODES = {
  json2go: {
    inLabel: 'Input: JSON',
    outLabel: 'Output: Go',
    placeholder: '{"user_id": 1, "name": "Omar", "tags": ["go", "ai"]}',
    note: 'Fields that are missing in some array items get omitempty. Numbers become int or float64, null becomes interface{}.',
    convert: (text) => jsonToGo(text, { rootName: $('#root-name').value.trim() || 'Root' }),
    example: () => EXAMPLE_JSON,
  },
  go2json: {
    inLabel: 'Input: Go',
    outLabel: 'Output: JSON',
    placeholder: 'type Root struct {\n\tID   int    `json:"id"`\n\tName string `json:"name"`\n}',
    note: 'Understands plain structs: strings, numbers, bools, slices, maps, pointers, time.Time and nested struct types. Fields tagged json:"-" are skipped.',
    convert: goToJson,
    example: () => jsonToGo(EXAMPLE_JSON),
  },
};

const mode = () => $('input[name="mode"]:checked').value;

function convert() {
  const m = MODES[mode()];
  if (!input.value.trim()) {
    output.value = '';
    return showError(err, null);
  }
  try {
    output.value = m.convert(input.value);
    showError(err, null);
  } catch (e) {
    output.value = '';
    showError(err, e);
  }
}

function syncUi() {
  const m = MODES[mode()];
  $('#in-label').textContent = m.inLabel;
  $('#out-label').textContent = m.outLabel;
  input.placeholder = m.placeholder;
  $('#note').textContent = m.note;
  $('#root-wrap').hidden = mode() !== 'json2go';
}

document.querySelectorAll('input[name="mode"]').forEach((r) =>
  r.addEventListener('change', () => {
    syncUi();
    convert();
  }),
);
input.addEventListener('input', convert);
$('#root-name').addEventListener('input', convert);

$('#swap').addEventListener('click', () => {
  const result = output.value;
  const next = mode() === 'json2go' ? 'go2json' : 'json2go';
  $(`input[name="mode"][value="${next}"]`).checked = true;
  syncUi();
  input.value = result;
  convert();
});

$('#example').addEventListener('click', () => {
  input.value = MODES[mode()].example();
  convert();
});

$('#copy').addEventListener('click', (ev) => copyText(output.value, ev.target));

syncUi();
