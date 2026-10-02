const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export const utf8ToBytes = (s) => encoder.encode(s);

export function bytesToUtf8(bytes) {
  try {
    return decoder.decode(bytes);
  } catch {
    throw new Error('The result is not valid UTF-8 text');
  }
}

export function bytesToBase64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function base64ToBytes(input) {
  const clean = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) throw new Error('Not valid Base64');
  let bin;
  try {
    bin = atob(padded);
  } catch {
    throw new Error('Not valid Base64');
  }
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export const base64Encode = (s) => bytesToBase64(utf8ToBytes(s));
export const base64Decode = (s) => bytesToUtf8(base64ToBytes(s));
export const base64UrlEncode = (s) => base64Encode(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const bytesToHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
export const hexEncode = (s) => bytesToHex(utf8ToBytes(s));

export function hexToBytes(input) {
  const clean = input.replace(/\s+/g, '').replace(/^0x/i, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) throw new Error('Not valid hex');
  return Uint8Array.from(clean.match(/../g) ?? [], (h) => parseInt(h, 16));
}
export const hexDecode = (s) => bytesToUtf8(hexToBytes(s));

export const urlEncode = (s) => encodeURIComponent(s);

export function urlDecode(s) {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    throw new Error('Not valid URL encoding');
  }
}
