import { base64ToBytes, bytesToUtf8 } from './encoding.js';

function part(segment, name) {
  try {
    return JSON.parse(bytesToUtf8(base64ToBytes(segment)));
  } catch {
    throw new Error(`The ${name} is not valid Base64URL-encoded JSON`);
  }
}

export function decodeJwt(token, now = Date.now()) {
  const parts = token.trim().replace(/^Bearer\s+/i, '').split('.');
  if (parts.length !== 3) throw new Error('A JWT has three dot-separated parts');
  const header = part(parts[0], 'header');
  const payload = part(parts[1], 'payload');
  const expMs = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  return {
    header,
    payload,
    signature: parts[2],
    expiresAt: expMs === null ? null : new Date(expMs).toISOString(),
    expired: expMs === null ? null : expMs < now,
  };
}
