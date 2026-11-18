// Розкладка таблицею: рядки і колонки, кожен рядок має свою висоту, кожна колонка свою ширину.
// Чистий JavaScript, без React і без DOM, перевіряється через node (grid-layout.test.js).
//
// Два дерева Фенвіка, по одному на вісь:
//   - rows - висоти рядків: де починається рядок (offsetOf) і який рядок на позиції scrollTop (indexAt);
//   - cols - ширини колонок: те саме по горизонталі для scrollLeft.
// Клітинка (r, c) стоїть у точці (cols.offsetOf(c), rows.offsetOf(r)) і має розмір cols.get(c) x rows.get(r).
//
// Таблиця 1000 x 1000 - це мільйон клітинок, але дерева мають лише по 1000 елементів:
// розмір клітинки визначають її рядок і колонка. Тому вікно в будь-якому місці таблиці
// знаходиться за чотири пошуки indexAt, тобто O(log 1000) - близько 10 кроків на кожен.
// Зміна висоти одного рядка - один set, теж O(log 1000), і всі рядки нижче зсуваються самі.
import { FenwickTree, visibleRange } from '../fenwick/index.js';

export class GridLayout {
  constructor(rowSizes, colSizes) {
    this.rows = new FenwickTree(rowSizes);
    this.cols = new FenwickTree(colSizes);
  }

  width() {
    return this.cols.total();
  }

  height() {
    return this.rows.total();
  }

  // Повертають true, якщо розмір справді змінився.
  setRowSize(row, size) {
    if (this.rows.get(row) === size) return false;
    this.rows.set(row, size);
    return true;
  }

  setColSize(col, size) {
    if (this.cols.get(col) === size) return false;
    this.cols.set(col, size);
    return true;
  }

  // Клітинки для DOM, коли вікно стоїть у точці (left, top) і має розмір viewWidth x viewHeight.
  // rowsSeen і colsSeen - рядки й колонки, які справді видно; rowsInDom і colsInDom - разом
  // із запасом overscan з кожного боку. Початки першого рядка і першої колонки беремо з дерев
  // один раз, далі додаємо розміри по одному.
  visibleCells(top, viewHeight, left, viewWidth, overscan) {
    const rowsSeen = visibleRange(this.rows, top, viewHeight, 0);
    const rowsInDom = visibleRange(this.rows, top, viewHeight, overscan);
    const colsSeen = visibleRange(this.cols, left, viewWidth, 0);
    const colsInDom = visibleRange(this.cols, left, viewWidth, overscan);
    const colLefts = [];
    let x = this.cols.offsetOf(colsInDom.start);
    for (let c = colsInDom.start; c <= colsInDom.end; c += 1) {
      colLefts.push(x);
      x += this.cols.get(c);
    }
    const cells = [];
    let y = this.rows.offsetOf(rowsInDom.start);
    for (let r = rowsInDom.start; r <= rowsInDom.end; r += 1) {
      const height = this.rows.get(r);
      for (let c = colsInDom.start; c <= colsInDom.end; c += 1) {
        cells.push({ row: r, col: c, top: y, left: colLefts[c - colsInDom.start], width: this.cols.get(c), height });
      }
      y += height;
    }
    return { cells, rowsSeen, rowsInDom, colsSeen, colsInDom };
  }

  // Якір: клітинка в лівому верхньому куті вікна і скільки вікно зайшло в неї по обох осях.
  // Після зміни розмірів scrollFor ставить вікно так, щоб ця клітинка лишилася на місці,
  // навіть якщо рядки вище чи колонки лівіше стали більшими або меншими.
  anchor(top, left) {
    const row = this.rows.indexAt(top);
    const col = this.cols.indexAt(left);
    return { row, rowInside: top - this.rows.offsetOf(row), col, colInside: left - this.cols.offsetOf(col) };
  }

  scrollFor(anchor) {
    return {
      top: this.rows.offsetOf(anchor.row) + Math.min(anchor.rowInside, this.rows.get(anchor.row)),
      left: this.cols.offsetOf(anchor.col) + Math.min(anchor.colInside, this.cols.get(anchor.col)),
    };
  }
}
