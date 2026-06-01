import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Difficulty, RegionDef } from '../src/numbersums/types';
import {
  GRID_SIZES,
  REGION_COUNT,
  cellIndex,
} from '../src/numbersums/types';
import { countSolutions, puzzleFromRecord } from '../src/numbersums/solver';

interface GeneratedPuzzle {
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

const TARGETS: Record<Difficulty, number> = {
  easy: 100,
  medium: 100,
  hard: 100,
  expert: 100,
};

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function neighbors(
  index: number,
  rows: number,
  cols: number,
): number[] {
  const { row, col } = { row: Math.floor(index / cols), col: index % cols };
  const out: number[] = [];
  if (row > 0) out.push(index - cols);
  if (row < rows - 1) out.push(index + cols);
  if (col > 0) out.push(index - 1);
  if (col < cols - 1) out.push(index + 1);
  return out;
}

function generateRegionIds(
  rows: number,
  cols: number,
  difficulty: Difficulty,
): number[] {
  const n = rows * cols;
  const range = REGION_COUNT[difficulty];
  const targetCount = randomInt(range.min, range.max);
  const regionIds = Array<number>(n).fill(-1);
  const seeds = shuffle(Array.from({ length: n }, (_, i) => i)).slice(0, targetCount);

  for (let s = 0; s < seeds.length; s++) {
    regionIds[seeds[s]] = s;
  }

  const queue = [...seeds];
  while (queue.length > 0) {
    const idx = queue.shift()!;
    for (const nb of neighbors(idx, rows, cols)) {
      if (regionIds[nb] === -1) {
        regionIds[nb] = regionIds[idx];
        queue.push(nb);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (regionIds[i] !== -1) continue;
    const adj = neighbors(i, rows, cols).filter((nb) => regionIds[nb] !== -1);
    regionIds[i] = adj.length > 0 ? regionIds[adj[0]] : 0;
  }

  return regionIds;
}

function buildRegions(
  regionIds: number[],
): { regions: RegionDef[]; byId: Map<number, number[]> } {
  const byId = new Map<number, number[]>();
  for (let i = 0; i < regionIds.length; i++) {
    const id = regionIds[i];
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id)!.push(i);
  }

  const regions: RegionDef[] = [];
  for (const cells of byId.values()) {
    regions.push({ target: 0, cells: [...cells] });
  }
  return { regions, byId };
}

function generateSolutionMask(
  rows: number,
  cols: number,
  regionIds: number[],
  difficulty: Difficulty,
): number[] {
  const n = rows * cols;
  const mask = Array<number>(n).fill(0);

  for (let r = 0; r < rows; r++) {
    const colsInRow: number[] = [];
    for (let c = 0; c < cols; c++) colsInRow.push(cellIndex(cols, r, c));
    mask[colsInRow[randomInt(0, colsInRow.length - 1)]] = 1;
  }

  for (let c = 0; c < cols; c++) {
    const indices: number[] = [];
    for (let r = 0; r < rows; r++) indices.push(cellIndex(cols, r, c));
    if (indices.some((i) => mask[i] === 1)) continue;
    mask[indices[randomInt(0, indices.length - 1)]] = 1;
  }

  const regionCells = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const id = regionIds[i];
    if (!regionCells.has(id)) regionCells.set(id, []);
    regionCells.get(id)!.push(i);
  }
  for (const cells of regionCells.values()) {
    if (cells.some((i) => mask[i] === 1)) continue;
    mask[cells[randomInt(0, cells.length - 1)]] = 1;
  }

  const density =
    difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.4 : difficulty === 'hard' ? 0.45 : 0.5;

  for (let i = 0; i < n; i++) {
    if (mask[i] === 1) continue;
    if (Math.random() < density) mask[i] = 1;
  }

  const maxIncluded = Math.floor(n * 0.65);
  let included = mask.filter((v) => v === 1).length;
  if (included > maxIncluded) {
    const ones = mask.map((v, i) => (v === 1 ? i : -1)).filter((i) => i >= 0);
    shuffle(ones);
    for (const idx of ones) {
      if (included <= maxIncluded) break;
      mask[idx] = 0;
      included--;
    }
  }

  return mask;
}

function assignValues(mask: number[]): number[] {
  return mask.map(() => randomInt(1, 9));
}

function computeTargets(
  rows: number,
  cols: number,
  values: number[],
  mask: number[],
  regions: RegionDef[],
): { rowTargets: number[]; colTargets: number[] } {
  const rowTargets = Array<number>(rows).fill(0);
  const colTargets = Array<number>(cols).fill(0);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = cellIndex(cols, r, c);
      if (mask[i] !== 1) continue;
      rowTargets[r] += values[i];
      colTargets[c] += values[i];
    }
  }

  for (const region of regions) {
    region.target = 0;
    for (const i of region.cells) {
      if (mask[i] === 1) region.target += values[i];
    }
  }

  return { rowTargets, colTargets };
}

function puzzleKey(puzzle: GeneratedPuzzle): string {
  return JSON.stringify({
    v: puzzle.values,
    r: puzzle.rowTargets,
    c: puzzle.colTargets,
    g: puzzle.regionIds,
  });
}

function tryGenerateOne(
  difficulty: Difficulty,
  size: { rows: number; cols: number },
): GeneratedPuzzle | null {
  const { rows, cols } = size;
  const regionIds = generateRegionIds(rows, cols, difficulty);
  const { regions } = buildRegions(regionIds);
  const mask = generateSolutionMask(rows, cols, regionIds, difficulty);
  const values = assignValues(mask);
  const { rowTargets, colTargets } = computeTargets(rows, cols, values, mask, regions);

  const solverInput = puzzleFromRecord({
    rows,
    cols,
    values,
    rowTargets,
    colTargets,
    regions,
  });

  if (countSolutions(solverInput) !== 1) return null;

  return {
    id: '',
    difficulty,
    rows,
    cols,
    values,
    rowTargets,
    colTargets,
    regions,
    regionIds,
    solution: mask,
  };
}

function generateForDifficulty(difficulty: Difficulty): GeneratedPuzzle[] {
  const puzzles: GeneratedPuzzle[] = [];
  const seen = new Set<string>();
  const target = TARGETS[difficulty];
  const sizes = GRID_SIZES[difficulty];
  const idWidth = String(target).length;
  let attempts = 0;
  const maxAttempts = target * 500;

  while (puzzles.length < target && attempts < maxAttempts) {
    attempts++;
    const size = sizes[attempts % sizes.length];
    const candidate = tryGenerateOne(difficulty, size);
    if (!candidate) continue;

    const key = puzzleKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);

    candidate.id = `${difficulty}-${String(puzzles.length + 1).padStart(idWidth, '0')}`;
    puzzles.push(candidate);

    if (puzzles.length % 25 === 0) {
      console.log(`  ${difficulty}: ${puzzles.length}/${target}`);
    }
  }

  if (puzzles.length < target) {
    console.warn(`  ${difficulty}: only generated ${puzzles.length}/${target}`);
  }

  return puzzles;
}

const outDir = join(process.cwd(), 'public', 'puzzles');
mkdirSync(outDir, { recursive: true });

for (const difficulty of ['easy', 'medium', 'hard', 'expert'] as Difficulty[]) {
  console.log(`Generating ${difficulty}...`);
  const started = Date.now();
  const puzzles = generateForDifficulty(difficulty);
  const path = join(outDir, `${difficulty}.json`);
  writeFileSync(path, JSON.stringify(puzzles));
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Wrote ${path} (${puzzles.length} puzzles, ${seconds}s)`);
}

console.log('Done.');
