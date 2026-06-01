export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type CellMark = 'unknown' | 'included' | 'excluded';

export type InputMode = 'circle' | 'erase';

export type GameStatus = 'playing' | 'won';

export interface RegionDef {
  target: number;
  cells: number[];
}

export interface PuzzleRecord {
  id: string;
  difficulty: Difficulty;
  rows: number;
  cols: number;
  values: number[];
  rowTargets: number[];
  colTargets: number[];
  regions: RegionDef[];
  regionIds: number[];
  solution: number[];
}

export interface GameState {
  puzzle: PuzzleRecord;
  marks: CellMark[];
  selected: number | null;
  inputMode: InputMode;
  status: GameStatus;
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export const GRID_SIZES: Record<Difficulty, { rows: number; cols: number }[]> = {
  easy: [
    { rows: 5, cols: 4 },
    { rows: 5, cols: 6 },
  ],
  medium: [
    { rows: 5, cols: 5 },
    { rows: 5, cols: 7 },
  ],
  hard: [
    { rows: 6, cols: 6 },
    { rows: 7, cols: 6 },
  ],
  expert: [{ rows: 7, cols: 7 }],
};

export const REGION_COUNT: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 4, max: 6 },
  medium: { min: 6, max: 8 },
  hard: { min: 8, max: 10 },
  expert: { min: 10, max: 14 },
};

export const RECENT_PUZZLE_COUNT = 20;

export const STORAGE_KEY = 'simple-numbersums-save';

export function cellIndex(cols: number, row: number, col: number): number {
  return row * cols + col;
}

export function indexToRowCol(
  index: number,
  cols: number,
): { row: number; col: number } {
  return { row: Math.floor(index / cols), col: index % cols };
}
