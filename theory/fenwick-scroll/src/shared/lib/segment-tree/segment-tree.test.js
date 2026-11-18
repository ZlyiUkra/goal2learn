// Перевірки дерева відрізків проти звичайного масиву. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SegmentTree } from './segment-tree.js';

test('max і raise на числах', () => {
  const tree = new SegmentTree(8);
  assert.equal(tree.max(0, 8), 0);
  tree.raise(2, 5, 30);
  // Масив тепер 0 0 30 30 30 0 0 0.
  assert.equal(tree.max(0, 2), 0);
  assert.equal(tree.max(4, 6), 30);
  tree.raise(3, 8, 10);
  // 10 менше за 30, тож 30 лишаються: 0 0 30 30 30 10 10 10.
  assert.equal(tree.max(3, 5), 30);
  assert.equal(tree.max(5, 8), 10);
});

test('збігається зі звичайним масивом після випадкових операцій', () => {
  for (const size of [1, 7, 64, 333]) {
    const tree = new SegmentTree(size);
    const array = new Array(size).fill(0);
    for (let n = 0; n < 500; n += 1) {
      const l = Math.floor(Math.random() * size);
      const r = l + 1 + Math.floor(Math.random() * (size - l));
      if (Math.random() < 0.5) {
        const value = Math.floor(Math.random() * 1000);
        tree.raise(l, r, value);
        for (let i = l; i < r; i += 1) array[i] = Math.max(array[i], value);
      } else {
        assert.equal(tree.max(l, r), Math.max(...array.slice(l, r)));
      }
    }
  }
});
