const A = 65;
const a = 97;

export function caesar(text, shift) {
  const k = ((shift % 26) + 26) % 26;
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? A : a;
    return String.fromCharCode(((c.charCodeAt(0) - base + k) % 26) + base);
  });
}

export const rot13 = (text) => caesar(text, 13);

export function atbash(text) {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? A : a;
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
  });
}

const ENGLISH_FREQ = [
  8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406,
  6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.36, 0.15, 1.974, 0.074,
];

function letterCounts(text) {
  const counts = new Array(26).fill(0);
  let n = 0;
  for (const c of text.toLowerCase()) {
    const i = c.charCodeAt(0) - a;
    if (c.length === 1 && i >= 0 && i < 26) {
      counts[i] += 1;
      n += 1;
    }
  }
  return { counts, n };
}

export function chiSquared(text) {
  const { counts, n } = letterCounts(text);
  if (n === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < 26; i++) {
    const expected = (ENGLISH_FREQ[i] / 100) * n;
    sum += (counts[i] - expected) ** 2 / expected;
  }
  return sum;
}

export function caesarCrack(text) {
  return Array.from({ length: 26 }, (_, shift) => {
    const plaintext = caesar(text, -shift);
    return { shift, plaintext, score: chiSquared(plaintext) };
  }).sort((x, y) => x.score - y.score || x.shift - y.shift);
}

export function vigenere(text, key, decrypt = false) {
  const ks = [...key.toLowerCase()].filter((c) => c >= 'a' && c <= 'z').map((c) => c.charCodeAt(0) - a);
  if (!ks.length) throw new Error('Key must contain at least one letter');
  let i = 0;
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? A : a;
    const k = ks[i++ % ks.length] * (decrypt ? -1 : 1);
    return String.fromCharCode((((c.charCodeAt(0) - base + k) % 26) + 26) % 26 + base);
  });
}

function indexOfCoincidence(letters) {
  const { counts, n } = letterCounts(letters);
  if (n < 2) return 0;
  return counts.reduce((s, c) => s + c * (c - 1), 0) / (n * (n - 1));
}

export function vigenereCrack(text, maxKeyLength = 12) {
  const letters = [...text.toLowerCase()].filter((c) => c >= 'a' && c <= 'z').join('');
  if (letters.length < 2) return { key: '', keyLength: 0, plaintext: text };
  const columns = (len) => Array.from({ length: len }, (_, c) => [...letters].filter((_, i) => i % len === c).join(''));
  let bestLen = 1;
  let bestIoc = -1;
  let chosen = null;
  for (let len = 1; len <= Math.min(maxKeyLength, letters.length); len++) {
    const cols = columns(len);
    const ioc = cols.reduce((s, col) => s + indexOfCoincidence(col), 0) / len;
    if (ioc >= 0.055 && chosen === null) chosen = len;
    if (ioc > bestIoc) {
      bestIoc = ioc;
      bestLen = len;
    }
  }
  const keyLength = chosen ?? bestLen;
  const key = columns(keyLength)
    .map((col) => String.fromCharCode(a + caesarCrack(col)[0].shift))
    .join('');
  return { key, keyLength, plaintext: vigenere(text, key, true) };
}

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};
const MORSE_REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

export function morseEncode(text) {
  return text
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word].map((c) => MORSE[c] ?? '?').join(' '))
    .join(' / ');
}

export function morseDecode(code) {
  return code
    .trim()
    .split(/\s*\/\s*/)
    .map((word) => word.split(/\s+/).filter(Boolean).map((sym) => MORSE_REVERSE[sym] ?? '?').join(''))
    .join(' ');
}
