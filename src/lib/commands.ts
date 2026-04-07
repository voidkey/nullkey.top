export type ParsedCommand =
  | { kind: 'panel'; name: string; arg?: string }
  | { kind: 'clear' }
  | { kind: 'easter'; name: 'sudo' | 'pet' }
  | { kind: 'unknown'; input: string }
  | { kind: 'noop' };

const PANEL_NAMES = new Set([
  'whoami', 'about', 'now', 'projects', 'uses', 'contact', 'help',
]);

export function parseCommand(raw: string): ParsedCommand {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') return { kind: 'noop' };
  if (trimmed === 'clear') return { kind: 'clear' };
  if (trimmed === 'pet') return { kind: 'easter', name: 'pet' };
  if (trimmed.startsWith('sudo')) return { kind: 'easter', name: 'sudo' };

  const [head, ...rest] = trimmed.split(/\s+/);
  if (PANEL_NAMES.has(head)) {
    return rest.length > 0
      ? { kind: 'panel', name: head, arg: rest.join(' ') }
      : { kind: 'panel', name: head };
  }
  return { kind: 'unknown', input: raw.trim() };
}
