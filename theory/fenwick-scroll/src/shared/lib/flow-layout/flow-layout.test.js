// Перевірки розкладки лінійками проти простого розкладання циклом. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FlowLayout } from './flow-layout.js';

// Розкладає елементи так само, але прямим проходом по всіх: додаємо елемент у лінійку,
// поки він уміщається; елемент, ширший за лінійку, стоїть сам.
const naiveLines = (cross, main, lineLength) => {
  const starts = [];
  const sizes = [];
  let i = 0;
  while (i < cross.length) {
    const start = i;
    let used = cross[i];
    let size = main[i];
    i += 1;
    while (i < cross.length && used + cross[i] <= lineLength) {
      used += cross[i];
      size = Math.max(size, main[i]);
      i += 1;
    }
    starts.push(start);
    sizes.push(size);
  }
  return { starts, sizes };
};

const randomSizes = (count, from, to) =>
  Array.from({ length: count }, () => from + Math.floor(Math.random() * (to - from + 1)));

const assertSameAsNaive = (layout, cross, main) => {
  const expected = naiveLines(cross, main, layout.lineLength);
  assert.deepEqual(layout.lineStarts, expected.starts);
  assert.deepEqual(layout.lineSizes, expected.sizes);
  assert.equal(layout.total(), expected.sizes.reduce((a, b) => a + b, 0));
};

test('лінійки на числах: довжина 100, ширини 40, 50, 30, 80, 120', () => {
  const layout = new FlowLayout([40, 50, 30, 80, 120], [10, 20, 30, 40, 50], 100);
  // 40 + 50 = 90 <= 100, а + 30 = 120 > 100: перша лінійка - елементи 0 і 1.
  // 30 + 80 = 110 > 100: елемент 2 сам. Елемент 3 сам. Елемент 4 ширший за лінійку - теж сам.
  assert.deepEqual(layout.lineStarts, [0, 2, 3, 4]);
  assert.deepEqual(layout.lineSizes, [20, 30, 40, 50]);
  assert.deepEqual(layout.positionOf(1), { main: 0, cross: 40 });
  assert.deepEqual(layout.positionOf(3), { main: 50, cross: 0 });
});

test('збігається з простим розкладанням за різної довжини лінійки', () => {
  const cross = randomSizes(300, 20, 120);
  const main = randomSizes(300, 20, 120);
  const layout = new FlowLayout(cross, main, 400);
  for (const lineLength of [400, 250, 1000, 60, 333]) {
    layout.setLineLength(lineLength);
    assertSameAsNaive(layout, cross, main);
  }
});

test('після змін розмірів збігається з простим розкладанням', () => {
  const cross = randomSizes(300, 20, 120);
  const main = randomSizes(300, 20, 120);
  const layout = new FlowLayout(cross, main, 400);
  for (let n = 0; n < 100; n += 1) {
    const changes = randomSizes(3, 0, 299).map((index) => {
      // Інколи міняємо лише висоту, щоб пройти й короткий шлях без нового розбиття.
      if (Math.random() < 0.5) cross[index] = 20 + Math.floor(Math.random() * 101);
      main[index] = 20 + Math.floor(Math.random() * 101);
      return { index, cross: cross[index], main: main[index] };
    });
    layout.applySizes(changes);
    assertSameAsNaive(layout, cross, main);
  }
});

test('якір тримає лінійку з тим самим елементом на краю вікна', () => {
  // 10 елементів 50 x 30, лінійка 100: по два в лінійці, лінійки по 30 px.
  const layout = new FlowLayout(Array(10).fill(50), Array(10).fill(30), 100);
  // scroll = 75: край вікна в лінійці 2 (елементи 4 і 5), на 15 px нижче її початку.
  const anchor = layout.anchor(75);
  assert.deepEqual(anchor, { item: 4, inside: 15 });
  // Елемент 0 став удвічі вищим: лінійка 0 росте на 30, і лінійка з елементом 4 опускається на 30.
  layout.applySizes([{ index: 0, cross: 50, main: 60 }]);
  assert.equal(layout.scrollFor(anchor), 105);
  // Лінійка стала довшою: по три елементи, елемент 4 тепер у лінійці 1 (елементи 3, 4, 5).
  layout.setLineLength(150);
  assert.equal(layout.lineOf(4), 1);
  assert.equal(layout.scrollFor(anchor), 60 + 15);
});

test('visibleItems: лінійки у вікні і позиції їхніх елементів', () => {
  // 10 елементів 50 x 30, лінійка 100: по два в лінійці, лінійки по 30 px.
  const layout = new FlowLayout(Array(10).fill(50), Array(10).fill(30), 100);
  // Вікно 45..104: видно лінійки 1, 2, 3 (30..59, 60..89, 90..119).
  const view = layout.visibleItems(45, 60, 1);
  assert.deepEqual([view.firstLine, view.lastLine, view.startLine, view.endLine], [1, 3, 0, 4]);
  assert.equal(view.items.length, 10);
  assert.deepEqual(view.items[3], { index: 3, main: 30, cross: 50 });
});
