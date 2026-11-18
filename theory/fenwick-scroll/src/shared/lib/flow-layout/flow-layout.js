// Розкладка елементів лінійками, як слова в тексті. Чистий JavaScript, без React і без DOM,
// тому перевіряється через node (flow-layout.test.js).
//
// Дві осі:
//   - поперечна вісь (cross) - уздовж лінійки. У вертикальному режимі це ширина: елементи
//     йдуть зліва направо, поки лінійка не заповниться до довжини lineLength;
//   - головна вісь (main) - уздовж скролу. У вертикальному режимі це висота: лінійки
//     йдуть зверху вниз, і кожна наступна починається під найвищим елементом попередньої.
// У горизонтальному режимі осі міняються місцями: елементи йдуть згори вниз, а колонки
// одна за одною праворуч. Сама розкладка про режим не знає: їй дають розміри по двох осях.
//
// Два дерева Фенвіка:
//   1. crossTree - розміри елементів по поперечній осі. Воно за O(log n) каже, скільки елементів
//      від початку лінійки вміщаються в lineLength (countWithin), тобто де лінійка ламається.
//      Розбиття на L лінійок коштує O(L log n), а не прохід по всіх елементах.
//   2. lineTree - розміри лінійок по головній осі (висота найвищого елемента в лінійці). Воно
//      дає скролу те саме, що раніше давало дерево елементів: де починається лінійка і яка
//      лінійка стоїть на позиції скролу.
//
// Що скільки коштує:
//   - елемент змінив розмір по головній осі (став вищим): лінійки не ламаються по-новому,
//     перераховується лише найвищий елемент його лінійки, і lineTree оновлюється за O(log L);
//   - елемент змінив розмір по поперечній осі (став ширшим чи вужчим): лінійки можуть ламатися
//     інакше, починаючи з лінійки перед ним, тож розбиття перераховується від неї до кінця;
//   - змінилася довжина лінійки (вікно стало ширшим): розбиття перераховується повністю.
//   В обох останніх випадках lineTree будується заново, бо номери лінійок зсуваються.
import { FenwickTree, visibleRange } from '../fenwick/index.js';

export class FlowLayout {
  // crossSizes[i] і mainSizes[i] - розміри елемента i по двох осях, lineLength - довжина лінійки.
  constructor(crossSizes, mainSizes, lineLength) {
    this.count = crossSizes.length;
    this.crossTree = new FenwickTree(crossSizes);
    this.mainSizes = Float64Array.from(mainSizes);
    this.lineLength = lineLength;
    // lineStarts[k] - номер першого елемента лінійки k; lineSizes[k] - розмір лінійки по головній осі.
    this.lineStarts = [];
    this.lineSizes = [];
    this.lineTree = new FenwickTree([]);
    this.relayout(0);
  }

  get lineCount() {
    return this.lineStarts.length;
  }

  // Номер елемента, що стоїть одразу після лінійки k.
  lineEnd(k) {
    return k + 1 < this.lineStarts.length ? this.lineStarts[k + 1] : this.count;
  }

  // Лінійка, в якій стоїть елемент i: двійковий пошук останнього lineStarts[k] <= i.
  lineOf(i) {
    let low = 0;
    let high = this.lineStarts.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (this.lineStarts[middle] <= i) low = middle;
      else high = middle - 1;
    }
    return low;
  }

  // Де починається наступна лінійка, якщо поточна починається з елемента start.
  // Межа лінійки - позиція offsetOf(start) + lineLength на поперечній осі. countWithin
  // каже, скільки елементів від самого початку вміщаються до цієї межі; це і є номер першого
  // елемента наступної лінійки. Елемент, ширший за всю лінійку, стоїть у лінійці сам.
  nextLineStart(start) {
    const limit = this.crossTree.offsetOf(start) + this.lineLength;
    const next = this.crossTree.countWithin(limit);
    return next > start ? next : start + 1;
  }

  // Найбільший розмір по головній осі серед елементів from..to-1.
  maxMain(from, to) {
    let max = 0;
    for (let i = from; i < to; i += 1) if (this.mainSizes[i] > max) max = this.mainSizes[i];
    return max;
  }

  // Перераховує розбиття на лінійки, починаючи з лінійки fromLine. Лінійки перед нею не
  // змінюються: їхні елементи ті самі, тож і межі ті самі.
  relayout(fromLine) {
    let start = fromLine < this.lineStarts.length ? this.lineStarts[fromLine] : 0;
    if (fromLine >= this.lineStarts.length) fromLine = 0;
    this.lineStarts.length = fromLine;
    this.lineSizes.length = fromLine;
    while (start < this.count) {
      const next = this.nextLineStart(start);
      this.lineStarts.push(start);
      this.lineSizes.push(this.maxMain(start, next));
      start = next;
    }
    this.lineTree = new FenwickTree(this.lineSizes);
  }

  setLineLength(lineLength) {
    if (lineLength === this.lineLength) return false;
    this.lineLength = lineLength;
    this.relayout(0);
    return true;
  }

  // Приймає нові виміри елементів: масив { index, cross, main }. Повертає true, якщо щось змінилося.
  applySizes(changes) {
    let firstBroken = Infinity;
    const taller = new Set();
    for (const { index, cross, main } of changes) {
      if (this.crossTree.get(index) !== cross) {
        this.crossTree.set(index, cross);
        // Перераховуємо з попередньої лінійки: якщо елемент стоїть першим у своїй лінійці
        // і став вужчим, він може тепер уміститися в кінець попередньої.
        firstBroken = Math.min(firstBroken, Math.max(0, this.lineOf(index) - 1));
      }
      if (this.mainSizes[index] !== main) {
        this.mainSizes[index] = main;
        taller.add(this.lineOf(index));
      }
    }
    if (firstBroken !== Infinity) this.relayout(firstBroken);
    for (const k of taller) {
      // Лінійки від firstBroken уже перераховані разом із розмірами.
      if (k >= firstBroken) continue;
      this.lineSizes[k] = this.maxMain(this.lineStarts[k], this.lineEnd(k));
      this.lineTree.set(k, this.lineSizes[k]);
    }
    return firstBroken !== Infinity || taller.size > 0;
  }

  // Позиція елемента: main - початок його лінійки, cross - відступ від початку лінійки.
  positionOf(i) {
    const k = this.lineOf(i);
    return {
      main: this.lineTree.offsetOf(k),
      cross: this.crossTree.offsetOf(i) - this.crossTree.offsetOf(this.lineStarts[k]),
    };
  }

  total() {
    return this.lineTree.total();
  }

  // Які елементи покласти в DOM, коли вікно стоїть на позиції scroll і має довжину viewport.
  // Повертає елементи з позиціями { index, main, cross } і номери лінійок: видимих
  // (firstLine..lastLine) і покладених у DOM разом із запасом overscan (startLine..endLine).
  // Початок першої лінійки шукаємо в дереві один раз (O(log L)), далі додаємо розміри
  // лінійок по одному. Усередині лінійки елемент стоїть там, де скінчився попередній.
  visibleItems(scroll, viewport, overscan) {
    const visible = visibleRange(this.lineTree, scroll, viewport, 0);
    const range = visibleRange(this.lineTree, scroll, viewport, overscan);
    const items = [];
    let main = this.lineTree.offsetOf(range.start);
    for (let k = range.start; k <= range.end; k += 1) {
      let cross = 0;
      for (let i = this.lineStarts[k]; i < this.lineEnd(k); i += 1) {
        items.push({ index: i, main, cross });
        cross += this.crossTree.get(i);
      }
      main += this.lineSizes[k];
    }
    return { items, firstLine: visible.start, lastLine: visible.end, startLine: range.start, endLine: range.end };
  }

  // Якір скролу. Коли розміри змінюються, лінійки можуть зсунутися або зламатися інакше,
  // і вміст у вікні "стрибає". Перед зміною запам'ятовуємо якір: перший елемент лінійки на
  // краю вікна і скільки пікселів вікно вже зайшло в цю лінійку. Номер лінійки не годиться,
  // бо після нового розбиття на лінійки той самий номер може належати іншим елементам.
  anchor(scroll) {
    if (this.lineCount === 0) return null;
    const k = this.lineTree.indexAt(scroll);
    return { item: this.lineStarts[k], inside: scroll - this.lineTree.offsetOf(k) };
  }

  // Після змін повертає позицію скролу, за якої лінійка з елементом-якорем стоїть там, де стояла.
  // Якщо лінійка зменшилася і inside більше за її новий розмір, край стає на кінець лінійки.
  scrollFor(anchor) {
    const k = this.lineOf(anchor.item);
    return this.lineTree.offsetOf(k) + Math.min(anchor.inside, this.lineSizes[k]);
  }
}
