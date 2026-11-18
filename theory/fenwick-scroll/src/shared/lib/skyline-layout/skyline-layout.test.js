// Перевірки мозаїки проти простого перебору всіх покладених елементів. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SkylineLayout } from './skyline-layout.js';

const randomSizes = (count, from, to) =>
  Array.from({ length: count }, () => from + Math.floor(Math.random() * (to - from + 1)));

// Те саме правило без дерев і смуг: кожен крок перебирає всі покладені прямокутники.
const naivePlace = (cross, main, lineLength) => {
  const rects = [];
  let flowX = 0;
  for (let i = 0; i < cross.length; i += 1) {
    const w = cross[i];
    const h = main[i];
    if (flowX > 0 && flowX + w > lineLength) flowX = 0;
    const overlapsX = (r, x) => r.x < x + w && r.x + r.w > x;
    let x = flowX;
    let top = Math.max(0, ...rects.filter((r) => overlapsX(r, x)).map((r) => r.y + r.h));
    for (;;) {
      const left = Math.max(
        0,
        ...rects.filter((r) => r.y + r.h > top && r.y < top + h && r.x + r.w <= x).map((r) => r.x + r.w),
      );
      const up = Math.max(0, ...rects.filter((r) => r.y + r.h <= top && overlapsX(r, left)).map((r) => r.y + r.h));
      if (left === x && up === top) break;
      x = left;
      top = up;
    }
    rects.push({ x, y: top, w, h });
    flowX += w;
  }
  return rects;
};

const assertNoOverlaps = (layout, cross, main) => {
  for (let a = 0; a < cross.length; a += 1) {
    for (let b = a + 1; b < cross.length; b += 1) {
      const apart =
        layout.crosses[a] + cross[a] <= layout.crosses[b] ||
        layout.crosses[b] + cross[b] <= layout.crosses[a] ||
        layout.mains[a] + main[a] <= layout.mains[b] ||
        layout.mains[b] + main[b] <= layout.mains[a];
      assert.ok(apart, `елементи ${a} і ${b} перекриваються`);
    }
  }
};

test('на числах: елемент 3 підіймається і їде вліво під елемент 2', () => {
  // Лінійка 100. Елементи 0 (50 x 10) і 1 (50 x 40) - перша лінійка, 2 (50 x 20) і 3 (50 x 20) - друга.
  const layout = new SkylineLayout([50, 50, 50, 50], [10, 40, 20, 20], 100);
  // Елемент 2 стає під елемент 0: верх 10. Елемент 3 стартує під елементом 1 (верх 40),
  // їде вліво (на висоті 40..60 зліва нікого: елемент 2 закінчується на 30) до краю,
  // потім підіймається до низу елемента 2: верх 30.
  assert.deepEqual([...layout.crosses], [0, 50, 0, 0]);
  assert.deepEqual([...layout.mains], [0, 0, 10, 30]);
  assert.equal(layout.total(), 50);
});

test('збігається з простим перебором і нічого не перекривається, також після змін', () => {
  const cross = randomSizes(300, 20, 120);
  const main = randomSizes(300, 20, 120);
  const layout = new SkylineLayout(cross, main, 500);
  const check = () => {
    const expected = naivePlace(cross, main, layout.lineLength);
    assert.deepEqual([...layout.crosses], expected.map((r) => r.x));
    assert.deepEqual([...layout.mains], expected.map((r) => r.y));
    assertNoOverlaps(layout, cross, main);
  };
  check();
  for (let n = 0; n < 20; n += 1) {
    const index = Math.floor(Math.random() * 300);
    cross[index] = 20 + Math.floor(Math.random() * 101);
    main[index] = 20 + Math.floor(Math.random() * 101);
    layout.applySizes([{ index, cross: cross[index], main: main[index] }]);
    check();
  }
  layout.setLineLength(777);
  check();
});

test('visibleItems містить кожен елемент, що перетинає вікно', () => {
  const cross = randomSizes(400, 20, 120);
  const main = randomSizes(400, 20, 120);
  const layout = new SkylineLayout(cross, main, 600);
  for (let scroll = 0; scroll < layout.total(); scroll += 97) {
    const view = layout.visibleItems(scroll, 300, 0);
    const shown = new Set(view.items.map((item) => item.index));
    for (let i = 0; i < 400; i += 1) {
      const top = layout.mains[i];
      if (top < scroll + 300 && top + main[i] > scroll) assert.ok(shown.has(i), `елемент ${i} на ${scroll}`);
    }
  }
});

test('якір тримає той самий елемент на тій самій відстані від краю вікна', () => {
  // Лінійка 100, по два елементи шириною 50, висоти 10, 40, 20, 20, 30, 30.
  // Верхи: 0 і 1 - 0; 2 під 0 - 10; 3 доїжджає вліво під 2 - 30; 4 під 3 - 50; 5 під 1 - 40.
  const layout = new SkylineLayout([50, 50, 50, 50, 50, 50], [10, 40, 20, 20, 30, 30], 100);
  assert.deepEqual([...layout.mains], [0, 0, 10, 30, 50, 40]);
  // scroll = 65: елементи 0..3 закінчуються не нижче 50, тож якір - елемент 4, на 15 px нижче його верху.
  const anchor = layout.anchor(65);
  assert.deepEqual(anchor, { item: 4, inside: 15 });
  // Елемент 0 виріс до 40: тепер 2 починається з 40, 3 стоїть поруч (50, 40), 4 - з 60.
  layout.applySizes([{ index: 0, cross: 50, main: 40 }]);
  assert.deepEqual([...layout.mains], [0, 0, 40, 40, 60, 60]);
  assert.equal(layout.scrollFor(anchor), 75);
});

test('visibleItems з вікном по обох осях: кожен елемент у вікні є, далекі по горизонталі - ні', () => {
  const cross = randomSizes(2000, 20, 120);
  const main = randomSizes(2000, 20, 120);
  const layout = new SkylineLayout(cross, main, 3000);
  for (let scroll = 0; scroll < layout.total(); scroll += 211) {
    for (let crossScroll = 0; crossScroll < 3000; crossScroll += 373) {
      const view = layout.visibleItems(scroll, 300, 0, crossScroll, 400);
      const shown = new Set(view.items.map((item) => item.index));
      for (let i = 0; i < cross.length; i += 1) {
        const inMain = layout.mains[i] < scroll + 300 && layout.mains[i] + main[i] > scroll;
        const inCross = layout.crosses[i] < crossScroll + 400 && layout.crosses[i] + cross[i] > crossScroll;
        if (inMain && inCross) assert.ok(shown.has(i), `елемент ${i} у вікні ${scroll}, ${crossScroll}`);
        // Без запасу в DOM ідуть лише елементи, що перетинають вікно поперек.
        if (shown.has(i)) assert.ok(inCross, `елемент ${i} поза вікном поперек`);
      }
    }
  }
});
