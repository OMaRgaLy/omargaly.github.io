// The only place with plaintext flags. Change them here, then run `npm run ctf` and `npm run build`.
// The repository is public: this CTF is a game for friends, not a secure system.
export const FLAGS = {
  source: 'flag{view-source-is-a-superpower}',
  console: 'flag{the-console-never-lies}',
  terminal: 'flag{rot13-is-not-encryption}',
  robots: 'flag{robots-keep-no-secrets}',
};

export const rot13 = (s) =>
  s.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
