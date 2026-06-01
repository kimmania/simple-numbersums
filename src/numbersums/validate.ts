import type { CellMark, GameState, PuzzleRecord } from './types';
import { cellIndex } from './types';

function sumIncluded(
  indices: number[],
  values: number[],
  marks: CellMark[],
): number {
  let total = 0;
  for (const i of indices) {
    if (marks[i] === 'included') total += values[i];
  }
  return total;
}

export function isLineSatisfied(
  indices: number[],
  puzzle: PuzzleRecord,
  marks: CellMark[],
  target: number,
): boolean {
  return sumIncluded(indices, puzzle.values, marks) === target;
}

export function getRowIndices(puzzle: PuzzleRecord, row: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < puzzle.cols; c++) {
    out.push(cellIndex(puzzle.cols, row, c));
  }
  return out;
}

export function getColIndices(puzzle: PuzzleRecord, col: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    out.push(cellIndex(puzzle.cols, r, col));
  }
  return out;
}

export function isRowSatisfied(puzzle: PuzzleRecord, marks: CellMark[], row: number): boolean {
  return isLineSatisfied(getRowIndices(puzzle, row), puzzle, marks, puzzle.rowTargets[row]);
}

export function isColSatisfied(puzzle: PuzzleRecord, marks: CellMark[], col: number): boolean {
  return isLineSatisfied(getColIndices(puzzle, col), puzzle, marks, puzzle.colTargets[col]);
}

export function isRegionSatisfied(
  puzzle: PuzzleRecord,
  marks: CellMark[],
  regionIndex: number,
): boolean {
  const region = puzzle.regions[regionIndex];
  return isLineSatisfied(region.cells, puzzle, marks, region.target);
}

export function isComplete(puzzle: PuzzleRecord, marks: CellMark[]): boolean {
  if (marks.some((m) => m === 'unknown')) return false;

  for (let r = 0; r < puzzle.rows; r++) {
    if (!isRowSatisfied(puzzle, marks, r)) return false;
  }
  for (let c = 0; c < puzzle.cols; c++) {
    if (!isColSatisfied(puzzle, marks, c)) return false;
  }
  for (let i = 0; i < puzzle.regions.length; i++) {
    if (!isRegionSatisfied(puzzle, marks, i)) return false;
  }
  return true;
}

export function isWon(state: GameState): boolean {
  return isComplete(state.puzzle, state.marks);
}

export function createEmptyMarks(length: number): CellMark[] {
  return Array.from({ length }, () => 'unknown');
}

export function cloneMarks(marks: CellMark[]): CellMark[] {
  return [...marks];
}
