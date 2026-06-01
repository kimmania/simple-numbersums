import type { CellMark, GameState, InputMode, PuzzleRecord } from './types';
import { STORAGE_KEY } from './types';

interface SavedGame {
  puzzleId: string;
  difficulty: PuzzleRecord['difficulty'];
  puzzle: PuzzleRecord;
  marks: CellMark[];
  selected: number | null;
  inputMode: InputMode;
  status: GameState['status'];
}

export function saveGame(state: GameState): void {
  const saved: SavedGame = {
    puzzleId: state.puzzle.id,
    difficulty: state.puzzle.difficulty,
    puzzle: state.puzzle,
    marks: state.marks,
    selected: state.selected,
    inputMode: state.inputMode,
    status: state.status,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage full or unavailable.
  }
}

export function loadSavedGame(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as SavedGame;
    return {
      puzzle: saved.puzzle,
      marks: saved.marks,
      selected: saved.selected,
      inputMode: saved.inputMode,
      status: saved.status,
    };
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
