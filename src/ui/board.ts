import type { GameState } from '../numbersums/types';
import { indexToRowCol } from '../numbersums/types';
import {
  isColSatisfied,
  isRegionSatisfied,
  isRowSatisfied,
} from '../numbersums/validate';

const REGION_PALETTE = [
  'region-0',
  'region-1',
  'region-2',
  'region-3',
  'region-4',
  'region-5',
  'region-6',
  'region-7',
  'region-8',
  'region-9',
  'region-10',
  'region-11',
  'region-12',
  'region-13',
];

export type BoardElements = {
  wrapper: HTMLElement;
  cells: HTMLElement[];
  colClues: HTMLElement[];
  rowClues: HTMLElement[];
  regionBadges: HTMLElement[];
  puzzleId: string | null;
};

/** Top-leftmost cell in a region — where the target badge is shown. */
function anchorCellForRegion(cells: number[], cols: number): number {
  let anchor = cells[0];
  for (const index of cells) {
    const { row, col } = indexToRowCol(index, cols);
    const { row: ar, col: ac } = indexToRowCol(anchor, cols);
    if (row < ar || (row === ar && col < ac)) anchor = index;
  }
  return anchor;
}

export function createBoard(container: HTMLElement): BoardElements {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'board-wrapper';
  container.appendChild(wrapper);

  return { wrapper, cells: [], colClues: [], rowClues: [], regionBadges: [], puzzleId: null };
}

function buildBoard(board: BoardElements, state: GameState): void {
  const { puzzle, marks, selected } = state;
  const { rows, cols, values, rowTargets, colTargets, regionIds } = puzzle;

  board.wrapper.innerHTML = '';
  board.cells = [];
  board.colClues = [];
  board.rowClues = [];
  board.regionBadges = [];
  board.puzzleId = puzzle.id;

  board.wrapper.style.setProperty('--cols', String(cols));
  board.wrapper.style.setProperty('--rows', String(rows));

  const corner = document.createElement('div');
  corner.className = 'board-corner';
  board.wrapper.appendChild(corner);

  for (let c = 0; c < cols; c++) {
    const clue = document.createElement('div');
    clue.className = 'clue clue-col';
    clue.textContent = String(colTargets[c]);
    clue.dataset.col = String(c);
    clue.classList.toggle('clue-satisfied', isColSatisfied(puzzle, marks, c));
    board.wrapper.appendChild(clue);
    board.colClues[c] = clue;
  }

  for (let r = 0; r < rows; r++) {
    const rowClue = document.createElement('div');
    rowClue.className = 'clue clue-row';
    rowClue.textContent = String(rowTargets[r]);
    rowClue.dataset.row = String(r);
    rowClue.classList.toggle('clue-satisfied', isRowSatisfied(puzzle, marks, r));
    board.wrapper.appendChild(rowClue);
    board.rowClues[r] = rowClue;

    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.index = String(index);

      const regionId = regionIds[index];
      const regionClass = REGION_PALETTE[regionId % REGION_PALETTE.length];
      cell.classList.add(regionClass);

      const { row: nr, col: nc } = indexToRowCol(index, cols);
      if (nr > 0 && regionIds[index - cols] !== regionId) cell.classList.add('region-top');
      if (nc > 0 && regionIds[index - 1] !== regionId) cell.classList.add('region-left');

      cell.classList.toggle('selected', selected === index);
      cell.classList.toggle('included', marks[index] === 'included');
      cell.classList.toggle('excluded', marks[index] === 'excluded');

      const valueEl = document.createElement('span');
      valueEl.className = 'cell-value';
      valueEl.textContent = String(values[index]);
      cell.appendChild(valueEl);

      board.wrapper.appendChild(cell);
      board.cells[index] = cell;
    }
  }

  for (let ri = 0; ri < puzzle.regions.length; ri++) {
    const region = puzzle.regions[ri];
    const satisfied = isRegionSatisfied(puzzle, marks, ri);

    const anchor = anchorCellForRegion(region.cells, cols);
    const anchorCell = board.cells[anchor];
    if (anchorCell) {
      const badge = document.createElement('span');
      badge.className = 'region-target';
      badge.textContent = String(region.target);
      badge.setAttribute('aria-label', `Region sum ${region.target}`);
      if (satisfied) badge.classList.add('clue-satisfied');
      const valueEl = anchorCell.querySelector('.cell-value');
      if (valueEl) anchorCell.insertBefore(badge, valueEl);
      else anchorCell.appendChild(badge);
      anchorCell.classList.add('has-region-target');
      board.regionBadges[ri] = badge;
    }

    if (satisfied) {
      for (const idx of region.cells) {
        board.cells[idx]?.classList.add('region-satisfied');
      }
    }
  }
}

function updateBoard(board: BoardElements, state: GameState): void {
  const { puzzle, marks, selected } = state;
  const { rows, cols } = puzzle;

  for (let c = 0; c < cols; c++) {
    board.colClues[c].classList.toggle('clue-satisfied', isColSatisfied(puzzle, marks, c));
  }

  for (let r = 0; r < rows; r++) {
    board.rowClues[r].classList.toggle('clue-satisfied', isRowSatisfied(puzzle, marks, r));
  }

  for (let i = 0; i < board.cells.length; i++) {
    const cell = board.cells[i];
    cell.classList.toggle('selected', selected === i);
    cell.classList.toggle('included', marks[i] === 'included');
    cell.classList.toggle('excluded', marks[i] === 'excluded');
  }

  for (let ri = 0; ri < puzzle.regions.length; ri++) {
    const region = puzzle.regions[ri];
    const satisfied = isRegionSatisfied(puzzle, marks, ri);

    const badge = board.regionBadges[ri];
    if (badge) {
      badge.classList.toggle('clue-satisfied', satisfied);
    }

    for (const idx of region.cells) {
      board.cells[idx]?.classList.toggle('region-satisfied', satisfied);
    }
  }
}

export function renderBoard(board: BoardElements, state: GameState): void {
  const { rows, cols, id } = state.puzzle;
  const expectedCells = rows * cols;

  if (board.cells.length !== expectedCells || board.puzzleId !== id) {
    buildBoard(board, state);
  } else {
    updateBoard(board, state);
  }
}

export function bindBoardClick(
  board: BoardElements,
  onCellClick: (index: number) => void,
): void {
  board.wrapper.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (!target) return;
    const index = parseInt(target.dataset.index ?? '', 10);
    if (Number.isNaN(index)) return;
    onCellClick(index);
  });
}
