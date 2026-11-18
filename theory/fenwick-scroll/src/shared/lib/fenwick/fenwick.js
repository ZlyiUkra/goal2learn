// Дерево Фенвіка для розмірів рядків або стовпців. Чистий JavaScript, без React і без DOM,
// тому файл запускається і в браузері, і через node (див. fenwick.test.js).
//
// Задача. Є n елементів, у кожного свій розмір у пікселях (висота рядка або ширина стовпця).
// Віртуальному скролу постійно потрібні дві відповіді:
//   1. offsetOf(i): де починається елемент i, тобто сума розмірів елементів 0..i-1;
//   2. indexAt(x): який елемент стоїть на позиції x пікселів від початку.
// Звичайний масив відповідає на перше питання за O(n), бо треба скласти всі розміри перед i.
// Масив готових сум відповідає за O(1), але зміна одного розміру змушує переписати всі суми
// після нього, а це знову O(n). Дерево Фенвіка робить і відповідь, і зміну за O(log n).
//
// Як воно влаштоване. Масив tree має n + 1 комірку, комірка 0 не використовується.
// Комірка k зберігає суму розмірів відрізка, який закінчується на елементі k (рахуючи з 1),
// а довжина відрізка дорівнює найменшому біту числа k: lowBit(k) = k & -k.
// Приклад для k = 6 (двійкове 110): найменший біт 2, тож tree[6] = розмір5 + розмір6.
// Для k = 8 (1000) найменший біт 8, тож tree[8] = сума розмірів 1..8.

const lowBit = (k) => k & -k;

export class FenwickTree {
  // sizes: масив розмірів, sizes[i] - розмір елемента i (рахуючи з 0).
  constructor(sizes) {
    this.count = sizes.length;
    this.sizes = Float64Array.from(sizes);
    this.tree = new Float64Array(this.count + 1);
    // Побудова за O(n): кожна комірка віддає свою суму "батьку" k + lowBit(k),
    // відрізок якого містить її відрізок.
    for (let k = 1; k <= this.count; k += 1) {
      this.tree[k] += this.sizes[k - 1];
      const parent = k + lowBit(k);
      if (parent <= this.count) this.tree[parent] += this.tree[k];
    }
    // Найбільший степінь двійки, що не перевищує count. Потрібен для indexAt.
    this.topBit = 1;
    while (this.topBit * 2 <= this.count) this.topBit *= 2;
  }

  // Створює дерево з функції getSize(i), щоб не будувати проміжний масив вручну.
  static fromFunction(count, getSize) {
    return new FenwickTree(Array.from({ length: count }, (_, i) => getSize(i)));
  }

  get(i) {
    return this.sizes[i];
  }

  // Змінює розмір елемента i. Різниця додається до кожної комірки, чий відрізок містить i:
  // від k = i + 1 вгору через k += lowBit(k). Таких комірок не більше log2(n) + 1.
  set(i, size) {
    const delta = size - this.sizes[i];
    if (delta === 0) return;
    this.sizes[i] = size;
    for (let k = i + 1; k <= this.count; k += lowBit(k)) this.tree[k] += delta;
  }

  // Сума розмірів елементів 0..i-1, тобто позиція, де починається елемент i.
  // Йдемо вниз через k -= lowBit(k): кожен крок знімає найменший біт і додає ще один відрізок.
  // Приклад для i = 7 (111): tree[7] + tree[6] + tree[4] = (7) + (5..6) + (1..4).
  offsetOf(i) {
    let sum = 0;
    for (let k = i; k > 0; k -= lowBit(k)) sum += this.tree[k];
    return sum;
  }

  // Повна довжина всіх елементів: розмір прокручуваного вмісту.
  total() {
    return this.offsetOf(this.count);
  }

  // Скільки елементів від початку повністю вміщаються у відрізок [0, x]: найбільше p,
  // для якого offsetOf(p) <= x. Двійковий підйом: пробуємо стрибнути вперед на
  // step = topBit, topBit / 2, ..., 1. Стрибок можливий, коли весь відрізок tree[pos + step]
  // уміщається в залишок x. Кожен стрибок додає до pos цілий відрізок елементів, тому
  // пошук займає O(log n) кроків.
  // Приклад: розміри 30, 30, 30, x = 70. Перші два елементи займають 60 <= 70, а три - 90,
  // тож відповідь 2. Розкладка лінійками так шукає, де лінійка ламається.
  countWithin(x) {
    if (x < 0) return 0;
    let pos = 0;
    let rest = x;
    for (let step = this.topBit; step > 0; step = Math.floor(step / 2)) {
      const next = pos + step;
      if (next <= this.count && this.tree[next] <= rest) {
        pos = next;
        rest -= this.tree[next];
      }
    }
    return pos;
  }

  // Індекс елемента, який містить позицію x: такий i, що offsetOf(i) <= x < offsetOf(i + 1).
  // Це те саме p з countWithin: p елементів лежать повністю перед x, тож x лежить в елементі p.
  // Позиції за межами вмісту зсуваються до першого або останнього елемента.
  indexAt(x) {
    if (this.count === 0) return -1;
    if (x <= 0) return 0;
    return Math.min(this.countWithin(x), this.count - 1);
  }
}

// Які елементи осі видно у вікні. scroll - позиція прокрутки (scrollTop або scrollLeft),
// viewport - розмір вікна по цій осі, overscan - скільки елементів домалювати з кожного боку,
// щоб під час швидкого скролу на краях не з'являлися порожні місця.
// Повертає { start, end } включно з обох боків.
export function visibleRange(tree, scroll, viewport, overscan = 0) {
  if (tree.count === 0) return { start: 0, end: -1 };
  const first = tree.indexAt(scroll);
  // Остання видима точка - scroll + viewport - 1: піксель scroll + viewport вже за вікном.
  const last = tree.indexAt(scroll + Math.max(viewport - 1, 0));
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(tree.count - 1, last + overscan),
  };
}
