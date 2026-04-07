import { describe, it, expect } from 'vitest';
import { parseCommand } from './commands';

describe('parseCommand', () => {
  it('parses a known panel command', () => {
    expect(parseCommand('about')).toEqual({ kind: 'panel', name: 'about' });
  });

  it('trims whitespace and ignores case', () => {
    expect(parseCommand('  Projects  ')).toEqual({ kind: 'panel', name: 'projects' });
  });

  it('parses projects with index argument', () => {
    expect(parseCommand('projects 2')).toEqual({ kind: 'panel', name: 'projects', arg: '2' });
  });

  it('parses clear', () => {
    expect(parseCommand('clear')).toEqual({ kind: 'clear' });
  });

  it('parses help', () => {
    expect(parseCommand('help')).toEqual({ kind: 'panel', name: 'help' });
  });

  it('parses sudo as easter egg', () => {
    expect(parseCommand('sudo rm -rf /')).toEqual({ kind: 'easter', name: 'sudo' });
  });

  it('parses pet as easter egg', () => {
    expect(parseCommand('pet')).toEqual({ kind: 'easter', name: 'pet' });
  });

  it('returns unknown for nonsense', () => {
    expect(parseCommand('foobar')).toEqual({ kind: 'unknown', input: 'foobar' });
  });

  it('returns noop for empty input', () => {
    expect(parseCommand('')).toEqual({ kind: 'noop' });
    expect(parseCommand('   ')).toEqual({ kind: 'noop' });
  });
});
