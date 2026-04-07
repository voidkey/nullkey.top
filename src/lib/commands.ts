export type Tokens = { cmd: string; args: string[] };

export function tokenize(raw: string): Tokens {
  const trimmed = raw.trim();
  if (trimmed === '') return { cmd: '', args: [] };
  const parts = trimmed.split(/\s+/);
  return { cmd: parts[0]!.toLowerCase(), args: parts.slice(1) };
}
