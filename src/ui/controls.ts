import type { Difficulty, InputMode } from '../numbersums/types';

export function getDifficultySelect(): HTMLSelectElement {
  return document.getElementById('difficulty') as HTMLSelectElement;
}

export function getSelectedDifficulty(): Difficulty {
  return getDifficultySelect().value as Difficulty;
}

export function setDifficulty(difficulty: Difficulty): void {
  getDifficultySelect().value = difficulty;
}

export function updatePuzzleId(id: string): void {
  const label = id ? `#${id}` : '';
  document.getElementById('puzzle-id')?.replaceChildren(document.createTextNode(label));
  document.getElementById('puzzle-id-footer')?.replaceChildren(document.createTextNode(label));
}

export function setInputMode(mode: InputMode): void {
  const circle = document.getElementById('mode-circle');
  const erase = document.getElementById('mode-erase');
  circle?.classList.toggle('active', mode === 'circle');
  erase?.classList.toggle('active', mode === 'erase');
  circle?.setAttribute('aria-pressed', String(mode === 'circle'));
  erase?.setAttribute('aria-pressed', String(mode === 'erase'));
}

export function setUndoEnabled(enabled: boolean): void {
  const btn = document.getElementById('undo') as HTMLButtonElement | null;
  if (btn) btn.disabled = !enabled;
}

export function showWinBanner(show: boolean): void {
  const banner = document.getElementById('win-banner');
  if (banner) banner.classList.toggle('hidden', !show);
}

export function bindControlHandlers(handlers: {
  onNewGame: () => void;
  onReset: () => void;
  onUndo: () => void;
  onModeCircle: () => void;
  onModeErase: () => void;
  onDifficultyChange: () => void;
}): void {
  document.getElementById('new-game')?.addEventListener('click', handlers.onNewGame);
  document.getElementById('reset')?.addEventListener('click', handlers.onReset);
  document.getElementById('undo')?.addEventListener('click', handlers.onUndo);
  document.getElementById('mode-circle')?.addEventListener('click', handlers.onModeCircle);
  document.getElementById('mode-erase')?.addEventListener('click', handlers.onModeErase);
  getDifficultySelect().addEventListener('change', handlers.onDifficultyChange);
}
