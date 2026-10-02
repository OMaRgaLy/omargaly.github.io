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
  const activate = (tab, focus = false) => {
    select(tab.dataset.tab, focus);
    history.replaceState(null, '', `#${tab.dataset.tab}`);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (ev) => {
      let next;
      if (ev.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (ev.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (ev.key === 'Home') next = tabs[0];
      else if (ev.key === 'End') next = tabs[tabs.length - 1];
      else return;
      ev.preventDefault();
      activate(next, true);
    });
  });
  const wanted = location.hash.slice(1);
  select(tabs.some((t) => t.dataset.tab === wanted) ? wanted : tabs[0].dataset.tab);
}
