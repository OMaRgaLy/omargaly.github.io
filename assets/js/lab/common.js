import { initTheme } from '../theme.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function initLabPage() {
  initTheme();
}

function flash(btn, message) {
  if (!btn) return;
  if (btn.dataset.label === undefined) btn.dataset.label = btn.textContent;
  btn.textContent = message;
  setTimeout(() => {
    btn.textContent = btn.dataset.label;
  }, 1200);
}

export async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    flash(btn, 'Copied');
  } catch {
    flash(btn, 'Copy failed');
  }
}

export function showError(el, err) {
  el.textContent = err ? String(err.message ?? err) : '';
  el.hidden = !err;
}

export function setupTabs(root = document) {
  const tabs = $$('[role="tab"]', root);
  const panels = $$('[role="tabpanel"]', root);
  const select = (id, focus = false) => {
    tabs.forEach((t) => {
      const on = t.dataset.tab === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach((p) => {
      p.hidden = p.dataset.panel !== id;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      select(t.dataset.tab);
      history.replaceState(null, '', `#${t.dataset.tab}`);
    });
    t.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      ev.preventDefault();
      const next = tabs[(i + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      select(next.dataset.tab, true);
    });
  });
  const wanted = location.hash.slice(1);
  select(tabs.some((t) => t.dataset.tab === wanted) ? wanted : tabs[0].dataset.tab);
}
