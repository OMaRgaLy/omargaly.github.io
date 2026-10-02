import { base64ToBytes, bytesToUtf8 } from './encoding.js';

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function part(segment, name) {
  let value;
  try {
    value = JSON.parse(bytesToUtf8(base64ToBytes(segment)));
  } catch {
    throw new Error(`The ${name} is not valid Base64URL-encoded JSON`);
  }
  if (!isObject(value)) throw new Error(`The ${name} is not a JSON object`);
  return value;
}

export function decodeJwt(token, now = Date.now()) {
  const parts = token.trim().replace(/^Bearer\s+/i, '').split('.');
  if (parts.length !== 3) throw new Error('A JWT has three dot-separated parts');
  const header = part(parts[0], 'header');
  const payload = part(parts[1], 'payload');
  const expMs = typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  const date = expMs === null ? null : new Date(expMs);
  return {
    header,
    payload,
    signature: parts[2],
    expiresAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    expired: expMs === null ? null : expMs < now,
  };
}
