import type { CellMark, GameState } from './types';
import { cloneMarks } from './validate';

export interface HistorySnapshot {
  marks: CellMark[];
  status: GameState['status'];
}

export function captureSnapshot(state: GameState): HistorySnapshot {
  return {
    marks: cloneMarks(state.marks),
    status: state.status,
  };
}

export function applySnapshot(state: GameState, snapshot: HistorySnapshot): void {
  state.marks = cloneMarks(snapshot.marks);
  state.status = snapshot.status;
}
