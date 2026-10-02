import { copyFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

const FILES = [
  ['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-cyrillic-wght-normal.woff2'],
  ['@fontsource-variable/inter', 'inter-cyrillic-ext-wght-normal.woff2'],
  ['@fontsource-variable/jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2'],
  ['@fontsource-variable/jetbrains-mono', 'jetbrains-mono-cyrillic-wght-normal.woff2'],
];

await mkdir('assets/fonts', { recursive: true });
for (const [pkg, file] of FILES) {
  const from = join('node_modules', pkg, 'files', file);
  try {
    await access(from);
  } catch {
    throw new Error(`Missing ${from}. List node_modules/${pkg}/files and fix the name in FILES.`);
  }
  await copyFile(from, join('assets/fonts', file));
  console.log('copied', file);
}
