import { $, initLabPage, copyText, showError } from './common.js';
import { jsonToGo, goToJson } from './lib/json2go.js';

initLabPage();

const jsonBox = $('#j-in');
const goBox = $('#g-in');
const err = $('#err');

const EXAMPLE = JSON.stringify(
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

function toGo() {
  try {
    goBox.value = jsonToGo(jsonBox.value, { rootName: $('#root-name').value.trim() || 'Root' });
    showError(err, null);
  } catch (e) {
    showError(err, e);
  }
}

function toJson() {
  try {
    jsonBox.value = goToJson(goBox.value);
    showError(err, null);
  } catch (e) {
    showError(err, e);
  }
}

$('#to-go').addEventListener('click', toGo);
$('#to-json').addEventListener('click', toJson);
$('#copy-go').addEventListener('click', (ev) => copyText(goBox.value, ev.target));
$('#copy-json').addEventListener('click', (ev) => copyText(jsonBox.value, ev.target));
$('#example').addEventListener('click', () => {
  jsonBox.value = EXAMPLE;
  toGo();
});
jsonBox.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') toGo();
});
