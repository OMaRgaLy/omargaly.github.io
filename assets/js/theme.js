import { writeStored } from './storage.js';

const META_COLOR = { dark: '#0a0c10', light: '#f7f8fa' };

export function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme, { persist = true } = {}) {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  if (persist) writeStored('theme', t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLOR[t]);
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(t === 'light')));
}

export function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme() {
  setTheme(getTheme(), { persist: false });
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.addEventListener('click', toggleTheme));
}
