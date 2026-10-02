import { runCommand, createKonami } from './terminal-core.js';
import { setTheme, toggleTheme } from './theme.js';
import { langPath, setLangPref } from './lang.js';

export function initTerminal() {
  const root = document.getElementById('terminal');
  const dataEl = document.getElementById('terminal-data');
  if (!root || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const out = root.querySelector('#terminal-out');
  const form = root.querySelector('#terminal-form');
  const input = root.querySelector('#terminal-input');
  const closeBtn = root.querySelector('[data-terminal-close]');
  const history = [];
  let cursor = 0;
  let lastFocus = null;

  const print = (lines, className) => {
    for (const line of lines) {
      const p = document.createElement('p');
      p.textContent = line;
      if (className) p.className = className;
      out.appendChild(p);
    }
    out.scrollTop = out.scrollHeight;
  };

  const isOpen = () => !root.hidden;

  const open = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.body.classList.add('no-scroll');
    if (!out.children.length) print([data.i18n.hint], 'terminal__hint');
    input.focus();
  };

  const close = () => {
    if (!isOpen()) return;
    root.hidden = true;
    document.body.classList.remove('no-scroll');
    lastFocus?.focus?.();
  };

  const handleAction = (action) => {
    switch (action.type) {
      case 'clear':
        out.replaceChildren();
        break;
      case 'close':
        close();
        break;
      case 'theme':
        if (action.value === 'toggle') toggleTheme();
        else setTheme(action.value);
        break;
      case 'lang':
        setLangPref(action.value);
        setTimeout(() => {
          location.href = langPath(action.value);
        }, 400);
        break;
      case 'goto':
        setTimeout(() => {
          location.href = action.value;
        }, 300);
        break;
    }
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const value = input.value;
    input.value = '';
    print([`${data.i18n.prompt} ${value}`], 'terminal__echo');
    if (value.trim()) {
      history.push(value);
      cursor = history.length;
    }
    const result = runCommand(value, data);
    print(result.lines);
    if (result.action) handleAction(result.action);
  });

  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowUp' && history.length) {
      ev.preventDefault();
      cursor = Math.max(0, cursor - 1);
      input.value = history[cursor];
    } else if (ev.key === 'ArrowDown' && history.length) {
      ev.preventDefault();
      cursor = Math.min(history.length, cursor + 1);
      input.value = history[cursor] ?? '';
    }
  });

  root.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Tab') return;
    ev.preventDefault();
    const order = [closeBtn, input];
    const i = order.indexOf(document.activeElement);
    order[(i + (ev.shiftKey ? -1 : 1) + order.length) % order.length].focus();
  });

  root.addEventListener('click', (ev) => {
    if (ev.target === root) close();
  });
  closeBtn.addEventListener('click', close);
  document.querySelectorAll('[data-terminal-open]').forEach((b) => b.addEventListener('click', open));

  const konami = createKonami(open);
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      close();
      return;
    }
    const target = ev.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (typing || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === '`') {
      ev.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (!isOpen()) konami(ev.key);
  });
}
