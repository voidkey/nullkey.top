import { parseCommand, type ParsedCommand } from '~/lib/commands';

const input = document.getElementById('terminal-input') as HTMLInputElement | null;
const summon = document.getElementById('summon');
if (!input || !summon) {
  throw new Error('terminal: missing #terminal-input or #summon');
}

const history: string[] = [];
let historyIdx = -1;

function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function getTemplate(id: string): DocumentFragment | null {
  const tpl = document.getElementById(id) as HTMLTemplateElement | null;
  return tpl ? (tpl.content.cloneNode(true) as DocumentFragment) : null;
}

function summonPanel(id: string) {
  const frag = getTemplate(id);
  if (!frag) return;
  summon!.replaceChildren(frag);
  summon!.scrollTop = summon!.scrollHeight;
  emit('terminal:summon', { id });
}

function dispatch(parsed: ParsedCommand) {
  switch (parsed.kind) {
    case 'noop':
      return;
    case 'clear':
      summon!.replaceChildren();
      return;
    case 'panel': {
      if (parsed.name === 'projects' && parsed.arg) {
        summonPanel(`panel-projects-${parsed.arg}`);
      } else {
        summonPanel(`panel-${parsed.name}`);
      }
      return;
    }
    case 'easter':
      summonPanel(`panel-${parsed.name}`);
      if (parsed.name === 'pet') emit('terminal:pet');
      return;
    case 'unknown':
      summonPanel('panel-unknown');
      emit('terminal:unknown', { input: parsed.input });
      return;
  }
}

function runRaw(raw: string) {
  if (raw.trim() !== '') {
    history.push(raw);
    historyIdx = history.length;
  }
  dispatch(parseCommand(raw));
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    runRaw(value);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length === 0) return;
    historyIdx = Math.max(0, historyIdx - 1);
    input.value = history[historyIdx] ?? '';
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (history.length === 0) return;
    historyIdx = Math.min(history.length, historyIdx + 1);
    input.value = history[historyIdx] ?? '';
  } else if (e.key === 'Escape') {
    e.preventDefault();
    summon!.replaceChildren();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const candidates = ['about', 'now', 'projects', 'uses', 'contact', 'help', 'clear', 'whoami'];
    const match = candidates.find((c) => c.startsWith(input.value.toLowerCase()));
    if (match) input.value = match;
  }
});

input.addEventListener('input', () => emit('terminal:type'));

// Refocus input on any click outside selection (and outside interactive elements)
document.addEventListener('click', (e) => {
  const sel = window.getSelection();
  if (sel && sel.toString().length > 0) return;
  const target = e.target as HTMLElement;
  if (target.closest('button, a, [tabindex="0"], input')) return;
  input.focus();
});

// Clickable hint buttons in promptline
document.querySelectorAll<HTMLButtonElement>('#promptline button[data-hint]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.hint!;
    runRaw(cmd);
    input.focus();
  });
});

// Contact row copy-on-Enter (event-delegated since rows are added dynamically)
summon.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const target = e.target as HTMLElement;
  const row = target.closest<HTMLElement>('.contact-row');
  if (!row) return;
  const value = row.dataset.copy;
  if (!value) return;
  navigator.clipboard?.writeText(value);
  const old = row.innerHTML;
  row.innerHTML = `<span class="text-ok">copied ✓</span>`;
  setTimeout(() => { row.innerHTML = old; }, 1500);
});

input.focus();
