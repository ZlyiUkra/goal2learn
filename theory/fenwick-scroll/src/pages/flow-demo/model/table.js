// Дані режиму "Таблиця": розміри рядків і колонок, плитка у клітинці та її колір.
import { demo } from '../config/demo.js';
import { goldenAngle, oklchFor } from './tiles.js';

// Базова висота рядка і ширина колонки, від 40 до 200 px. Плитка у клітинці трохи менша
// за базу (на 0..24 px), тож у кожної плитки свій розмір, а клітинка вміщає будь-який з них.
const rowBase = (row) => 40 + ((row * 37) % 161);
const colBase = (col) => 40 + ((col * 53) % 161);

export const tableTileAt = (row, col, side) => {
  const i = row * side + col;
  // Колір у двох вимірах. Відтінок робить крок на золотий кут (137.5°) уздовж рядка і на
  // половину золотого кута (68.75°) уздовж колонки. Тоді сусід праворуч, знизу і обидва
  // діагональні відрізняються щонайменше на 68.75°. Якби відтінок брався з номера i, як
  // для плиток у режимах лінійок, сусід знизу (i + 1000) відрізнявся б лише на 12°.
  return {
    width: colBase(col) - ((i * 7) % 25),
    height: rowBase(row) - ((i * 11) % 25),
    color: oklchFor(i, col * goldenAngle + (row * goldenAngle) / 2),
  };
};

// Висота рядка: база плюс відступи. Якщо в рядку є збільшені плитки (grown - номери
// row * side + col), рядок росте до найбільшого з них.
export const tableRowSize = (row, side, grown = new Set()) => {
  let size = rowBase(row);
  for (const i of grown) {
    if (Math.floor(i / side) === row) size = Math.max(size, tableTileAt(row, i % side, side).height * demo.growFactor);
  }
  return size + demo.gap * 2;
};

export const tableColSize = (col, side, grown = new Set()) => {
  let size = colBase(col);
  for (const i of grown) {
    if (i % side === col) size = Math.max(size, tableTileAt(Math.floor(i / side), col, side).width * demo.growFactor);
  }
  return size + demo.gap * 2;
};
