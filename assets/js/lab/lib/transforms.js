import { base64ToBytes, hexToBytes } from './encoding.js';
import { bytesToDisplay } from './chain.js';

// Decodes Base64 or hex input. Valid UTF-8 comes back as text; any other bytes come back as hex.
export function decodeToDisplay(kind, input) {
  let bytes;
  if (kind === 'base64') bytes = base64ToBytes(input);
  else if (kind === 'hex') bytes = hexToBytes(input);
  else throw new Error(`Unknown decoder: ${kind}`);
  return bytesToDisplay(bytes);
}
