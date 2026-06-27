import type { CellMark, GameState } from './numbersums/types';
import { applySnapshot, captureSnapshot, type HistorySnapshot } from './numbersums/history';
import { resetGameState, startNewGame } from './numbersums/puzzle';
import { clearSavedGame, loadSavedGame, saveGame } from './numbersums/storage';
import { isWon } from './numbersums/validate';
import { bindBoardClick, createBoard, renderBoard } from './ui/board';
import {
  bindControlHandlers,
  getSelectedDifficulty,
  setDifficulty,
  setInputMode,
  setUndoEnabled,
  showWinBanner,
  updatePuzzleId,
} from './ui/controls';
import { initHelp } from './ui/help';

export class NumberSumsApp {
  private state: GameState | null = null;
  private board = createBoard(document.getElementById('board')!);
  private loading = false;
  private undoSnapshot: HistorySnapshot | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  async init(): Promise<void> {
    initHelp();
    bindBoardClick(this.board, (index) => this.handleCellClick(index));
    bindControlHandlers({
      onNewGame: () => void this.newGame(),
      onReset: () => this.handleReset(),
      onUndo: () => this.handleUndo(),
      onModeCircle: () => this.setMode('circle'),
      onModeErase: () => this.setMode('erase'),
      onDifficultyChange: () => void this.newGame(),
    });

    document.getElementById('play-again')?.addEventListener('click', () => void this.newGame());

    document.addEventListener('keydown', (event) => this.handleKeydown(event));

    const saved = loadSavedGame();
    if (saved && saved.status === 'playing') {
      this.state = saved;
      setDifficulty(saved.puzzle.difficulty);
      this.clearUndo();
      this.refresh();
      return;
    }

    await this.newGame();
  }

  private async newGame(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    clearSavedGame();
    this.clearUndo();

    try {
      const difficulty = getSelectedDifficulty();
      this.state = await startNewGame(difficulty);
      this.refresh();
    } catch (error) {
      console.error(error);
      alert('Could not load a puzzle. Please try again.');
    } finally {
      this.loading = false;
    }
  }

  private handleReset(): void {
    if (!this.state) return;
    resetGameState(this.state);
    this.clearUndo();
    this.refresh();
  }

  private clearUndo(): void {
    this.undoSnapshot = null;
    setUndoEnabled(false);
  }

  private recordUndoPoint(): void {
    if (!this.state || this.state.status === 'won') return;
    this.undoSnapshot = captureSnapshot(this.state);
  }

  private setMode(mode: GameState['inputMode']): void {
    if (!this.state) return;
    this.state.inputMode = mode;
    setInputMode(mode);
    this.debouncedSaveGame();
  }

  private handleCellClick(index: number): void {
    if (!this.state || this.state.status === 'won') return;

    this.recordUndoPoint();
    this.state.selected = index;
    this.state.marks[index] = this.nextMark(this.state.marks[index], this.state.inputMode);

    if (isWon(this.state)) {
      this.state.status = 'won';
    }

    this.refresh();
  }

  private nextMark(current: CellMark, mode: GameState['inputMode']): CellMark {
    if (mode === 'circle') {
      if (current === 'unknown') return 'included';
      if (current === 'included') return 'unknown';
      return 'included';
    }
    if (current === 'unknown') return 'excluded';
    if (current === 'excluded') return 'unknown';
    return 'excluded';
  }

  private handleUndo(): void {
    if (!this.state || !this.undoSnapshot) return;
    applySnapshot(this.state, this.undoSnapshot);
    this.undoSnapshot = null;
    this.refresh();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.state || this.state.status === 'won') return;

    const target = event.target as HTMLElement;
    if (target.tagName === 'SELECT') return;

    if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
      event.preventDefault();
      this.handleUndo();
      return;
    }

    if (event.key === 'c' || event.key === 'C') {
      this.setMode('circle');
      return;
    }
    if (event.key === 'e' || event.key === 'E') {
      this.setMode('erase');
      return;
    }
    if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      void this.newGame();
      return;
    }

    const { rows, cols } = this.state.puzzle;
    let index = this.state.selected ?? 0;

    switch (event.key) {
      case 'ArrowUp':
        index = Math.max(0, index - cols);
        break;
      case 'ArrowDown':
        index = Math.min(rows * cols - 1, index + cols);
        break;
      case 'ArrowLeft':
        index = Math.max(0, index - 1);
        break;
      case 'ArrowRight':
        index = Math.min(rows * cols - 1, index + 1);
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.handleCellClick(index);
        return;
      default:
        return;
    }

    event.preventDefault();
    this.state.selected = index;
    this.board.cells[index]?.focus({ preventScroll: true });
    this.refresh();
  }

  private debouncedSaveGame(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      if (this.state && this.state.status === 'playing') {
        saveGame(this.state);
      }
    }, 250);
  }

  private refresh(): void {
    if (!this.state) return;

    renderBoard(this.board, this.state);
    updatePuzzleId(this.state.puzzle.id);
    setInputMode(this.state.inputMode);
    setUndoEnabled(this.undoSnapshot !== null);
    showWinBanner(this.state.status === 'won');

    if (this.state.status === 'playing') {
      this.debouncedSaveGame();
    } else {
      clearSavedGame();
    }
  }
}

export async function bootstrap(): Promise<void> {
  const app = new NumberSumsApp();
  await app.init();
}
