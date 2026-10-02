export const HASH_ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

function check(algo) {
  if (!HASH_ALGOS.includes(algo)) throw new Error(`Unsupported algorithm: ${algo}`);
}

export async function digest(algo, bytes) {
  check(algo);
  return toHex(await crypto.subtle.digest(algo, bytes));
}

export async function hmac(algo, keyBytes, msgBytes) {
  check(algo);
  if (keyBytes.length === 0) throw new Error('HMAC needs a non-empty key');
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: algo }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, msgBytes));
}
