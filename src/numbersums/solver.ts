/** 0 = unknown, 1 = included, 2 = excluded */
export type SolverMark = 0 | 1 | 2;

export interface SolverPuzzle {
  rows: number;
  cols: number;
  values: number[];
  rowTargets: number[];
  colTargets: number[];
  regions: { target: number; cells: number[] }[];
}

function rowIndices(cols: number, row: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < cols; c++) out.push(row * cols + c);
  return out;
}

function colIndices(rows: number, cols: number, col: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < rows; r++) out.push(r * cols + col);
  return out;
}

function lineBounds(
  indices: number[],
  values: number[],
  marks: SolverMark[],
  target: number,
): { valid: boolean; complete: boolean } {
  let includedSum = 0;
  let unknownCount = 0;
  let unknownSum = 0;

  for (const i of indices) {
    const mark = marks[i];
    if (mark === 1) {
      includedSum += values[i];
    } else if (mark === 0) {
      unknownCount++;
      unknownSum += values[i];
    }
  }

  if (includedSum > target) return { valid: false, complete: false };
  if (includedSum + unknownSum < target) return { valid: false, complete: false };

  if (unknownCount === 0) {
    return { valid: includedSum === target, complete: true };
  }

  return { valid: true, complete: false };
}

function allLinesValid(puzzle: SolverPuzzle, marks: SolverMark[]): boolean {
  const { rows, cols, rowTargets, colTargets, regions } = puzzle;

  for (let r = 0; r < rows; r++) {
    const { valid } = lineBounds(rowIndices(cols, r), puzzle.values, marks, rowTargets[r]);
    if (!valid) return false;
  }
  for (let c = 0; c < cols; c++) {
    const { valid } = lineBounds(colIndices(rows, cols, c), puzzle.values, marks, colTargets[c]);
    if (!valid) return false;
  }
  for (const region of regions) {
    const { valid } = lineBounds(region.cells, puzzle.values, marks, region.target);
    if (!valid) return false;
  }
  return true;
}

function isComplete(puzzle: SolverPuzzle, marks: SolverMark[]): boolean {
  if (marks.some((m) => m === 0)) return false;
  return allLinesValid(puzzle, marks);
}

function findUnknown(marks: SolverMark[]): number {
  return marks.findIndex((m) => m === 0);
}

export function countSolutions(puzzle: SolverPuzzle, limit = 2): number {
  const marks: SolverMark[] = Array(puzzle.values.length).fill(0);
  let count = 0;

  function dfs(): void {
    if (count >= limit) return;

    if (!allLinesValid(puzzle, marks)) return;

    const idx = findUnknown(marks);
    if (idx === -1) {
      if (isComplete(puzzle, marks)) count++;
      return;
    }

    marks[idx] = 2;
    dfs();
    if (count >= limit) return;

    marks[idx] = 1;
    dfs();
    marks[idx] = 0;
  }

  dfs();
  return count;
}

export function solutionToMarks(solution: number[]): SolverMark[] {
  return solution.map((bit) => (bit === 1 ? 1 : 2)) as SolverMark[];
}

export function marksToSolution(marks: SolverMark[]): number[] {
  return marks.map((m) => (m === 1 ? 1 : 0));
}

export function puzzleFromRecord(record: {
  rows: number;
  cols: number;
  values: number[];
  rowTargets: number[];
  colTargets: number[];
  regions: { target: number; cells: number[] }[];
}): SolverPuzzle {
  return {
    rows: record.rows,
    cols: record.cols,
    values: record.values,
    rowTargets: record.rowTargets,
    colTargets: record.colTargets,
    regions: record.regions,
  };
}
