// Дерево відрізків (segment tree) з двома операціями над масивом довжини size:
//   - max(l, r): найбільше значення на відрізку [l, r);
//   - raise(l, r, value): кожен елемент відрізка [l, r) стає більшим із двох - себе і value.
// Обидві операції коштують O(log size). Чистий JavaScript, перевіряється через node.
// Усі значення невід'ємні, на початку масив заповнений нулями.
//
// Навіщо. Розкладка "скомбіновано" кладе елемент на найнижчий край тих, що вже лежать
// у смузі його ширини. Масив тут - "лінія горизонту": для кожного пікселя по горизонталі
// він зберігає, де закінчується найнижчий покладений елемент. Елемент від x до x + w
// спершу стає на найбільше значення на відрізку [x, x + w), а коли ляже остаточно, відрізок
// його ширини піднімається до його низу. Саме "піднімається", а не "присвоюється": елемент,
// що заповнив дірку вище за інші, не повинен опустити горизонт під собою.
// Дерево Фенвіка рахує суми, а найбільше значення з такими оновленнями не вміє.
//
// Як влаштоване (за cp-algorithms, "Segment Tree", розділ "Adding on segments, querying for
// maximum", де додавання замінено на взяття більшого). Вузол v відповідає відрізку [tl, tr),
// його діти - 2v (ліва половина) і 2v + 1 (права). top[v] - найбільше значення на відрізку вузла.
// pending[v] - значення, до якого ще треба підняти обидві половини. Підняття цілого відрізка
// вузла не спускається в дітей, а лише записується в pending ("ліниве" оновлення). Перед тим як
// спуститися в дітей, push передає їм відкладене підняття.
export class SegmentTree {
  constructor(size) {
    this.size = size;
    this.top = new Float64Array(4 * size);
    this.pending = new Float64Array(4 * size);
  }

  push(v) {
    const value = this.pending[v];
    if (value === 0) return;
    for (const child of [2 * v, 2 * v + 1]) {
      this.top[child] = Math.max(this.top[child], value);
      this.pending[child] = Math.max(this.pending[child], value);
    }
    this.pending[v] = 0;
  }

  raise(l, r, value, v = 1, tl = 0, tr = this.size) {
    if (r <= tl || tr <= l) return;
    if (l <= tl && tr <= r) {
      this.top[v] = Math.max(this.top[v], value);
      this.pending[v] = Math.max(this.pending[v], value);
      return;
    }
    this.push(v);
    const tm = Math.floor((tl + tr) / 2);
    this.raise(l, r, value, 2 * v, tl, tm);
    this.raise(l, r, value, 2 * v + 1, tm, tr);
    this.top[v] = Math.max(this.top[2 * v], this.top[2 * v + 1]);
  }

  max(l, r, v = 1, tl = 0, tr = this.size) {
    if (r <= tl || tr <= l) return -Infinity;
    if (l <= tl && tr <= r) return this.top[v];
    this.push(v);
    const tm = Math.floor((tl + tr) / 2);
    return Math.max(this.max(l, r, 2 * v, tl, tm), this.max(l, r, 2 * v + 1, tm, tr));
  }
}
