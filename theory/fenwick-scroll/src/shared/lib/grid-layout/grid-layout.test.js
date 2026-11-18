// Перевірки розкладки таблицею. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GridLayout } from './grid-layout.js';

const randomSizes = (count, from, to) =>
  Array.from({ length: count }, () => from + Math.floor(Math.random() * (to - from + 1)));

test('на числах: позиції клітинок і розмір таблиці', () => {
  // Рядки 30, 50, 20; колонки 100, 40.
  const grid = new GridLayout([30, 50, 20], [100, 40]);
  assert.equal(grid.width(), 140);
  assert.equal(grid.height(), 100);
  // Вікно 60 x 40 у точці (110, 35): видно рядок 1 (30..79) і колонку 1 (100..139).
  const view = grid.visibleCells(35, 40, 110, 60, 0);
  assert.deepEqual(view.cells, [{ row: 1, col: 1, top: 30, left: 100, width: 40, height: 50 }]);
});

test('visibleCells містить кожну клітинку, що перетинає вікно, і жодної зайвої без запасу', () => {
  const rowSizes = randomSizes(300, 20, 120);
  const colSizes = randomSizes(300, 20, 120);
  const grid = new GridLayout(rowSizes, colSizes);
  const rowTops = rowSizes.map((_, r) => rowSizes.slice(0, r).reduce((a, b) => a + b, 0));
  const colLefts = colSizes.map((_, c) => colSizes.slice(0, c).reduce((a, b) => a + b, 0));
  for (const [top, left] of [[0, 0], [5000, 7000], [12345, 678], [grid.height() - 50, grid.width() - 50]]) {
    const view = grid.visibleCells(top, 400, left, 600, 0);
    const shown = new Set(view.cells.map((cell) => `${cell.row}:${cell.col}`));
    let expected = 0;
    for (let r = 0; r < 300; r += 1) {
      if (!(rowTops[r] < top + 400 && rowTops[r] + rowSizes[r] > top)) continue;
      for (let c = 0; c < 300; c += 1) {
        if (!(colLefts[c] < left + 600 && colLefts[c] + colSizes[c] > left)) continue;
        assert.ok(shown.has(`${r}:${c}`), `клітинка ${r}:${c}`);
        expected += 1;
      }
    }
    assert.equal(view.cells.length, expected);
  }
});

test('якір тримає клітинку в куті вікна, коли рядок вище і колонка лівіше виросли', () => {
  const grid = new GridLayout(Array(10).fill(30), Array(10).fill(100));
  // Вікно в точці (250, 45): клітинка (рядок 1, колонка 2), всередині на 15 і 50 px.
  const anchor = grid.anchor(45, 250);
  assert.deepEqual(anchor, { row: 1, rowInside: 15, col: 2, colInside: 50 });
  grid.setRowSize(0, 90);
  grid.setColSize(1, 160);
  assert.deepEqual(grid.scrollFor(anchor), { top: 105, left: 310 });
});
