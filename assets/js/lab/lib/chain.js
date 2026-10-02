import {
  utf8ToBytes, bytesToUtf8, bytesToBase64, base64ToBytes, hexToBytes, bytesToHex, urlEncode, urlDecode,
} from './encoding.js';
import { caesar, rot13, atbash, morseEncode, morseDecode } from './ciphers.js';

const text = (bytes) => bytesToUtf8(bytes);
const fromText = (s) => utf8ToBytes(s);

function keyBytes(key) {
  if (!key) throw new Error('The XOR key must not be empty');
  return /^0x[0-9a-f]+$/i.test(key) ? hexToBytes(key) : utf8ToBytes(key);
}

export const OP_GROUPS = ['Encode / decode', 'Ciphers', 'Text'];

export const OPS = {
  'base64-encode': { label: 'Base64 encode', group: 'Encode / decode', params: [], run: (b) => fromText(bytesToBase64(b)) },
  'base64-decode': { label: 'Base64 decode', group: 'Encode / decode', params: [], run: (b) => base64ToBytes(text(b)) },
  'hex-encode': { label: 'Hex encode', group: 'Encode / decode', params: [], run: (b) => fromText(bytesToHex(b)) },
  'hex-decode': { label: 'Hex decode', group: 'Encode / decode', params: [], run: (b) => hexToBytes(text(b)) },
  'url-encode': { label: 'URL encode', group: 'Encode / decode', params: [], run: (b) => fromText(urlEncode(text(b))) },
  'url-decode': { label: 'URL decode', group: 'Encode / decode', params: [], run: (b) => fromText(urlDecode(text(b))) },
  'binary-encode': { label: 'Binary encode', group: 'Encode / decode', params: [], run: (b) => fromText([...b].map((x) => x.toString(2).padStart(8, '0')).join(' ')) },
  'binary-decode': {
    label: 'Binary decode', group: 'Encode / decode',
    params: [],
    run: (b) => {
      const groups = text(b).trim().split(/\s+/).filter(Boolean);
      if (!groups.length || groups.some((g) => !/^[01]{1,8}$/.test(g))) throw new Error('Not valid binary (use groups of 0 and 1)');
      return Uint8Array.from(groups, (g) => parseInt(g, 2));
    },
  },
  rot13: { label: 'ROT13', group: 'Ciphers', params: [], run: (b) => fromText(rot13(text(b))) },
  caesar: {
    label: 'Caesar shift', group: 'Ciphers',
    params: [{ name: 'shift', label: 'Shift', type: 'number', default: 3 }],
    run: (b, p) => fromText(caesar(text(b), Number(p.shift ?? 3))),
  },
  atbash: { label: 'Atbash', group: 'Ciphers', params: [], run: (b) => fromText(atbash(text(b))) },
  reverse: { label: 'Reverse', group: 'Text', params: [], run: (b) => fromText([...text(b)].reverse().join('')) },
  upper: { label: 'Upper case', group: 'Text', params: [], run: (b) => fromText(text(b).toUpperCase()) },
  lower: { label: 'Lower case', group: 'Text', params: [], run: (b) => fromText(text(b).toLowerCase()) },
  xor: {
    label: 'XOR with key', group: 'Ciphers',
    params: [{ name: 'key', label: 'Key (text or 0x hex)', type: 'text', default: '' }],
    run: (b, p) => {
      const k = keyBytes(p.key);
      return Uint8Array.from(b, (x, i) => x ^ k[i % k.length]);
    },
  },
  'morse-encode': { label: 'Morse encode', group: 'Encode / decode', params: [], run: (b) => fromText(morseEncode(text(b))) },
  'morse-decode': { label: 'Morse decode', group: 'Encode / decode', params: [], run: (b) => fromText(morseDecode(text(b))) },
};

export function runChain(inputBytes, steps) {
  let current = inputBytes;
  const trace = [];
  for (let i = 0; i < steps.length; i++) {
    const { op, params = {} } = steps[i];
    try {
      const def = OPS[op];
      if (!def) throw new Error(`Unknown operation: ${op}`);
      current = def.run(current, params);
      trace.push({ op, ok: true });
    } catch (err) {
      trace.push({ op, ok: false, error: err.message });
      return { output: current, trace, error: { step: i, message: err.message } };
    }
  }
  return { output: current, trace, error: null };
}

export function bytesToDisplay(bytes) {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), isText: true };
  } catch {
    return { text: bytesToHex(bytes), isText: false };
  }
}
