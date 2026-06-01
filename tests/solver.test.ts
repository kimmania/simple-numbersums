import { describe, expect, it } from 'vitest';
import { countSolutions, puzzleFromRecord } from '../src/numbersums/solver';
import type { PuzzleRecord } from '../src/numbersums/types';
import { createEmptyMarks, isComplete } from '../src/numbersums/validate';
import { createGameState, pickRandomPuzzle, resetGameState } from '../src/numbersums/puzzle';

const MINI: PuzzleRecord = {
  id: 'test-mini',
  difficulty: 'easy',
  rows: 2,
  cols: 2,
  values: [3, 1, 2, 4],
  rowTargets: [3, 4],
  colTargets: [3, 4],
  regions: [{ target: 7, cells: [0, 1, 2, 3] }],
  regionIds: [0, 0, 0, 0],
  solution: [1, 0, 0, 1],
};

describe('countSolutions', () => {
  it('finds exactly one solution for mini puzzle', () => {
    const puzzle = puzzleFromRecord(MINI);
    expect(countSolutions(puzzle)).toBe(1);
  });
});

describe('game flow', () => {
  it('detects a completed correct marking', () => {
    const state = createGameState(MINI);
    state.marks = ['included', 'excluded', 'excluded', 'included'];
    expect(isComplete(MINI, state.marks)).toBe(true);
  });

  it('reset clears marks', () => {
    const state = createGameState(MINI);
    state.marks[0] = 'included';
    resetGameState(state);
    expect(state.marks.every((m) => m === 'unknown')).toBe(true);
  });

  it('pickRandomPuzzle avoids recent ids when possible', () => {
    const puzzles: PuzzleRecord[] = [
      { ...MINI, id: 'easy-001' },
      { ...MINI, id: 'easy-002' },
      { ...MINI, id: 'easy-003' },
    ];
    sessionStorage.setItem('simple-numbersums-recent-easy', JSON.stringify(['easy-001']));
    const picked = pickRandomPuzzle(puzzles, 'easy');
    expect(picked.id).not.toBe('easy-001');
  });

  it('starts with all unknown marks', () => {
    const state = createGameState(MINI);
    expect(state.marks).toEqual(createEmptyMarks(4));
  });
});
