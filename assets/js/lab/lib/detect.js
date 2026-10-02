const HASHES = { 32: 'MD5 or NTLM', 40: 'SHA-1', 64: 'SHA-256', 96: 'SHA-384', 128: 'SHA-512' };

export function detectEncodings(input) {
  const s = input.trim();
  if (!s) return [];
  const out = [];
  const add = (id, label, confidence) => out.push({ id, label, confidence });

  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]*$/.test(s)) add('jwt', 'JSON Web Token', 0.95);
  if (/^[0-9a-f]+$/i.test(s) && HASHES[s.length]) add(`hash-${s.length}`, `${HASHES[s.length]} hash (${s.length} hex characters)`, 0.8);
  if (/^(0x)?(\s*[0-9a-f]{2})+\s*$/i.test(s)) add('hex', 'Hexadecimal bytes', 0.75);
  if (/^[01\s]+$/.test(s) && s.replace(/\s/g, '').length % 8 === 0 && s.replace(/\s/g, '').length >= 8) add('binary', 'Binary (8-bit groups)', 0.9);
  if (/^[.\-/\s]+$/.test(s) && /[.-]/.test(s)) add('morse', 'Morse code', 0.9);
  if (/%[0-9a-f]{2}/i.test(s)) add('url', 'URL (percent) encoding', 0.8);
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length >= 8 && s.length % 4 === 0) add('base64', 'Base64', 0.7);
  if (/^[A-Za-z0-9_-]+$/.test(s) && /[-_]/.test(s) && s.length >= 8) add('base64url', 'Base64URL', 0.6);

  return out.sort((x, y) => y.confidence - x.confidence);
}
