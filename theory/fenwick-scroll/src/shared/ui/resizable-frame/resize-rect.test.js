// Перевірки перетягування країв і кутів. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resizeRect } from './resize-rect.js';

const rect = { left: 100, top: 100, width: 300, height: 200 };

test('правий і нижній краї змінюють лише розмір', () => {
  assert.deepEqual(resizeRect(rect, 'e', 50, 999, 80), { left: 100, top: 100, width: 350, height: 200 });
  assert.deepEqual(resizeRect(rect, 's', 999, -30, 80), { left: 100, top: 100, width: 300, height: 170 });
});

test('лівий і верхній краї рухаються, протилежна сторона стоїть', () => {
  assert.deepEqual(resizeRect(rect, 'w', -40, 0, 80), { left: 60, top: 100, width: 340, height: 200 });
  assert.deepEqual(resizeRect(rect, 'n', 0, 30, 80), { left: 100, top: 130, width: 300, height: 170 });
});

test('кут змінює дві сторони одразу', () => {
  assert.deepEqual(resizeRect(rect, 'nw', -20, -10, 80), { left: 80, top: 90, width: 320, height: 210 });
  assert.deepEqual(resizeRect(rect, 'se', 10, 20, 80), { left: 100, top: 100, width: 310, height: 220 });
});

test('вікно не менше за minSize і не виходить за лівий і верхній край', () => {
  // Тягнемо правий край далеко ліворуч: ширина зупиняється на 80.
  assert.equal(resizeRect(rect, 'e', -1000, 0, 80).width, 80);
  // Тягнемо лівий край далеко праворуч: правий край на 400, тож left = 400 - 80.
  assert.deepEqual(resizeRect(rect, 'w', 1000, 0, 80), { left: 320, top: 100, width: 80, height: 200 });
  // Тягнемо верхній край вище сцени: top зупиняється на 0, нижній край лишається на 300.
  assert.deepEqual(resizeRect(rect, 'n', 0, -500, 80), { left: 100, top: 0, width: 300, height: 300 });
});
