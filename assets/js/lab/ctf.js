import { $, initLabPage } from './common.js';
import { readStored, writeStored } from '../storage.js';
import { verifyFlag, parseSolved, markSolved, progress } from './lib/ctf.js';

initLabPage();

const challenges = JSON.parse($('#ctf-data').textContent);
const KEY = 'ctf:solved';
let solved = parseSolved(readStored(KEY));

function renderProgress() {
  const p = progress(solved, challenges);
  $('#ctf-progress').textContent = `${p.solved} / ${p.total} flags found${p.solved === p.total ? ' — all done, nice work!' : ''}`;
}

function renderList() {
  const list = $('#ctf-list');
  list.replaceChildren();
  for (const c of challenges) {
    const box = document.createElement('div');
    box.className = 'challenge';
    box.dataset.id = c.id;
    const h = document.createElement('h2');
    h.tabIndex = -1;
    h.textContent = `${solved.includes(c.id) ? '✓ ' : ''}${c.title}`;
    const hint = document.createElement('p');
    hint.className = 'muted';
    hint.textContent = c.hint;
    box.append(h, hint);

    if (!solved.includes(c.id)) {
      const row = document.createElement('form');
      row.className = 'row';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'flag{...}';
      input.setAttribute('aria-label', `Flag for ${c.title}`);
      input.autocomplete = 'off';
      input.spellcheck = false;
      const btn = document.createElement('button');
      btn.type = 'submit';
      btn.className = 'btn btn--sm btn--primary';
      btn.textContent = 'Check';
      const msg = document.createElement('p');
      msg.className = 'err';
      msg.setAttribute('role', 'alert');
      msg.hidden = true;
      row.append(input, btn);
      row.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (await verifyFlag(input.value, c.sha256)) {
          solved = markSolved(solved, c.id);
          writeStored(KEY, JSON.stringify(solved));
          renderAll();
          $(`.challenge[data-id="${c.id}"] h2`)?.focus();
        } else {
          msg.textContent = 'Not quite. Keep looking.';
          msg.hidden = false;
        }
      });
      box.append(row, msg);
    }
    list.appendChild(box);
  }
}

function renderAll() {
  renderProgress();
  renderList();
}

$('#ctf-reset').addEventListener('click', () => {
  solved = [];
  writeStored(KEY, JSON.stringify(solved));
  renderAll();
});

renderAll();
