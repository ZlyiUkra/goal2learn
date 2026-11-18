// Перевірки дерева Фенвіка проти простого підрахунку циклом. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FenwickTree, visibleRange } from './fenwick.js';

const naiveOffset = (sizes, i) => sizes.slice(0, i).reduce((a, b) => a + b, 0);

const naiveIndexAt = (sizes, x) => {
  if (x <= 0) return 0;
  let offset = 0;
  for (let i = 0; i < sizes.length; i += 1) {
    if (x < offset + sizes[i]) return i;
    offset += sizes[i];
  }
  return sizes.length - 1;
};

const randomSizes = (count) => Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 50));

test('offsetOf і total збігаються з підрахунком циклом', () => {
  for (const count of [1, 2, 7, 8, 9, 100]) {
    const sizes = randomSizes(count);
    const tree = new FenwickTree(sizes);
    for (let i = 0; i <= count; i += 1) assert.equal(tree.offsetOf(i), naiveOffset(sizes, i));
    assert.equal(tree.total(), naiveOffset(sizes, count));
  }
});

test('indexAt знаходить елемент на кожній позиції, включно з межами', () => {
  const sizes = randomSizes(37);
  const tree = new FenwickTree(sizes);
  for (let x = -5; x <= tree.total() + 5; x += 1) assert.equal(tree.indexAt(x), naiveIndexAt(sizes, x));
});

test('після set суми й пошук відповідають новим розмірам', () => {
  const sizes = randomSizes(64);
  const tree = new FenwickTree(sizes);
  for (let n = 0; n < 200; n += 1) {
    const i = Math.floor(Math.random() * sizes.length);
    sizes[i] = 1 + Math.floor(Math.random() * 120);
    tree.set(i, sizes[i]);
  }
  for (let i = 0; i <= sizes.length; i += 1) assert.equal(tree.offsetOf(i), naiveOffset(sizes, i));
  for (let x = 0; x < tree.total(); x += 7) assert.equal(tree.indexAt(x), naiveIndexAt(sizes, x));
});

test('visibleRange: вікно 100 px на рядках по 30 px', () => {
  const tree = new FenwickTree(Array(10).fill(30));
  // Рядок 0: 0..29, рядок 1: 30..59, ..., рядок 4: 120..149.
  assert.deepEqual(visibleRange(tree, 0, 100), { start: 0, end: 3 });
  assert.deepEqual(visibleRange(tree, 45, 100), { start: 1, end: 4 });
  assert.deepEqual(visibleRange(tree, 45, 100, 2), { start: 0, end: 6 });
  assert.deepEqual(visibleRange(tree, 280, 100), { start: 9, end: 9 });
});

test('countWithin: скільки елементів уміщається від початку', () => {
  const tree = new FenwickTree([30, 30, 30, 10]);
  assert.equal(tree.countWithin(-1), 0);
  assert.equal(tree.countWithin(0), 0);
  assert.equal(tree.countWithin(29), 0);
  assert.equal(tree.countWithin(60), 2);
  assert.equal(tree.countWithin(70), 2);
  assert.equal(tree.countWithin(100), 4);
  assert.equal(tree.countWithin(1000), 4);
});
