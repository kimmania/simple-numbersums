# Simple Number Sums

A mobile-first Number Sums puzzle game built with vanilla TypeScript and Vite. Circle numbers so each row, column, and colored region matches its target sum. Four difficulty levels use rectangular grids from 5×4 up to 7×7.

**Play online:** [https://kimmania.github.io/simple-numbersums/](https://kimmania.github.io/simple-numbersums/) (after GitHub Pages is enabled)

## Features

- **Difficulty levels:** Easy, Medium, Hard, Expert (grid size increases per tier)
- **Colored regions:** Irregular regions with their own sum targets
- **Circle / Erase modes:** Toggle how taps affect cells
- **Reset:** Clear marks and restart the current puzzle
- **Undo:** Revert the last mark change (button or ⌘/Ctrl+Z)
- **Random puzzles:** 100 puzzles per difficulty with session anti-repeat
- **Resume game:** Progress saved to local storage
- **Installable PWA:** Add to Home Screen for offline play (puzzle banks cached)

## Development

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173/simple-numbersums/`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests |
| `npm run generate-puzzles` | Regenerate puzzle JSON banks (100 per tier) |

## GitHub Pages

Pushes to `main` deploy automatically via GitHub Actions.

1. Enable **GitHub Pages** → Source: **GitHub Actions**
2. Live site: `https://<user>.github.io/simple-numbersums/`

## License

MIT
