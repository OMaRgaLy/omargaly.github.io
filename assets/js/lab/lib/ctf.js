import { digest } from './hash.js';
import { utf8ToBytes } from './encoding.js';

export async function verifyFlag(input, sha256) {
  const candidate = input.trim();
  if (!candidate) return false;
  return (await digest('SHA-256', utf8ToBytes(candidate))) === sha256;
}

export function parseSolved(raw) {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export const markSolved = (ids, id) => (ids.includes(id) ? ids : [...ids, id]);

export function progress(solved, challenges) {
  const known = new Set(challenges.map((c) => c.id));
  return { solved: new Set(solved.filter((id) => known.has(id))).size, total: challenges.length };
}
