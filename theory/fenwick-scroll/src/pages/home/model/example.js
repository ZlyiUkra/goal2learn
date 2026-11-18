// Приклади для вступу. Числа рахує справжнє дерево з shared/lib/fenwick, а кроки пошуку
// читаються прямо з його комірок (tree.tree), тож текст завжди збігається з кодом.
import { FenwickTree } from '@/shared/lib/fenwick';
import { FlowLayout } from '@/shared/lib/flow-layout';

// Найменший біт числа k: розряд, де стоїть найправіша одиниця. 6 = 110, тож lowBit(6) = 2.
export const lowBit = (k) => k & -k;

// Двійковий запис числа з нулями попереду до потрібної ширини: binary(6, 4) = '0110'.
export const binary = (k, width) => k.toString(2).padStart(width, '0');

// Вісім рядків з різними висотами.
export const exampleSizes = [30, 50, 20, 40, 60, 10, 70, 30];
export const exampleTree = new FenwickTree(exampleSizes);

// Ширина двійкового запису найбільшого номера комірки: для 8 комірок це 4 розряди (1000).
export const bitWidth = (tree) => tree.count.toString(2).length;

// Комірки дерева. tree[k] (k рахується з 1) - сума елементів масиву sizes (рахується з 0)
// з індексами від k - lowBit(k) до k - 1: lowBit(k) елементів, що закінчуються на sizes[k - 1].
export const treeCells = (tree) =>
  Array.from({ length: tree.count }, (_, index) => {
    const k = index + 1;
    return { k, bits: binary(k, bitWidth(tree)), low: lowBit(k), from: k - lowBit(k), to: k - 1, sum: tree.tree[k] };
  });

// offsetOf(i): сума перших i елементів, sizes[0] + ... + sizes[i - 1], - це початок рядка i.
// Кожен крок бере комірку k і знімає з номера найменший біт. Комірка k покриває індекси
// від k - lowBit(k) до k - 1, тож кроки покривають масив справа наліво без дірок і без повторів.
export const offsetSteps = (tree, i) => {
  const steps = [];
  for (let k = i; k > 0; k -= lowBit(k)) {
    steps.push({ k, bits: binary(k, bitWidth(tree)), value: tree.tree[k], from: k - lowBit(k), to: k - 1 });
  }
  return { steps, total: steps.reduce((sum, step) => sum + step.value, 0) };
};

// Який крок суми покриває кожен елемент масиву: номер кроку або -1, якщо елемент не входить у суму.
export const coverage = (tree, i) => {
  const owner = new Array(tree.count).fill(-1);
  offsetSteps(tree, i).steps.forEach(({ from, to }, step) => {
    for (let index = from; index <= to; index += 1) owner[index] = step;
  });
  return owner;
};

// indexAt(x): стрибки вперед на 8, 4, 2, 1 - які вдалися, а які ні.
export const indexSteps = (tree, x) => {
  const steps = [];
  let pos = 0;
  let rest = x;
  for (let step = tree.topBit; step > 0; step = Math.floor(step / 2)) {
    const next = pos + step;
    const value = next <= tree.count ? tree.tree[next] : null;
    const jumped = value !== null && value <= rest;
    steps.push({ step, next, value, jumped, restBefore: rest });
    if (jumped) {
      pos = next;
      rest -= value;
    }
  }
  return { steps, index: tree.indexAt(x) };
};

// set(i, size): комірки, які отримують різницю. Елемент sizes[i] вперше з'являється в комірці
// i + 1, а далі в кожній, до номера якої додано її найменший біт.
export const setSteps = (tree, i) => {
  const cells = [];
  for (let k = i + 1; k <= tree.count; k += lowBit(k)) cells.push({ k, bits: binary(k, bitWidth(tree)) });
  return cells;
};

// Розбиття на рядки дерева ширин: рядок довжиною 100, плитки шириною 40, 50, 30, 80, 120.
export const lineExample = (() => {
  const widths = [40, 50, 30, 80, 120];
  const layout = new FlowLayout(widths, [10, 10, 10, 10, 10], 100);
  const lines = layout.lineStarts.map((start, k) => {
    const limit = layout.crossTree.offsetOf(start) + layout.lineLength;
    return {
      start,
      limit,
      fit: layout.crossTree.countWithin(limit),
      items: widths.slice(start, layout.lineEnd(k)),
    };
  });
  return { widths, lineLength: layout.lineLength, lines };
})();
