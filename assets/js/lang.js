import { writeStored } from './storage.js';

const PATHS = { en: '/', ru: '/ru/', kz: '/kz/' };

export const langPath = (l) => PATHS[l] ?? PATHS.en;

export function setLangPref(l) {
  if (l in PATHS) writeStored('lang', l);
}

export function initLang() {
  document.querySelectorAll('[data-lang-link]').forEach((a) => {
    a.addEventListener('click', () => setLangPref(a.dataset.langLink));
  });
}
