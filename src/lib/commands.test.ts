import { describe, it, expect } from 'vitest';
import { tokenize } from './commands';

describe('tokenize', () => {
  it('splits cmd and args', () => {
    expect(tokenize('projects 2')).toEqual({ cmd: 'projects', args: ['2'] });
  });

  it('lowercases the command but preserves arg case', () => {
    expect(tokenize('  ECHO Hi There  ')).toEqual({ cmd: 'echo', args: ['Hi', 'There'] });
  });

  it('returns empty cmd for empty input', () => {
    expect(tokenize('')).toEqual({ cmd: '', args: [] });
    expect(tokenize('   ')).toEqual({ cmd: '', args: [] });
  });

  it('handles a single word command', () => {
    expect(tokenize('about')).toEqual({ cmd: 'about', args: [] });
  });

  it('collapses multiple spaces between tokens', () => {
    expect(tokenize('echo   foo    bar')).toEqual({ cmd: 'echo', args: ['foo', 'bar'] });
  });
});
