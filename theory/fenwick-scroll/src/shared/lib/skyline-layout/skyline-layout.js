// Розкладка "скомбіновано" (мозаїка): елементи йдуть лінійками, як у flow-layout, але кожен
// елемент притискається вгору і вліво, наскільки дозволяють уже покладені елементи.
// Лінійки стають ламаними, а елемент може зайти в дірку під сусідом.
// Чистий JavaScript, без React і без DOM, перевіряється через node (skyline-layout.test.js).
// Нижче "вгору" і "вліво" - це головна і поперечна осі вертикального режиму; у горизонтальному
// вони міняються місцями, але розкладка про режим не знає.
//
// Як лягає елемент (по черзі, у порядку номерів):
//   1. Старт - його місце в лінійці з FlowLayout: дерево Фенвіка ламає лінійки і дає відступ
//      від початку лінійки (cross).
//   2. Вгору. Елемент підіймається, поки не впреться в найнижчий елемент над собою. Дерево
//      відрізків SegmentTree тримає "лінію горизонту" - для кожного пікселя по горизонталі низ
//      найнижчого покладеного елемента - і дає це місце за O(log lineLength).
//   3. Вліво. Елемент їде вліво, поки не впреться в елемент, що стоїть на тій самій висоті.
//   4. Знову вгору: зліва над ним може бути вільне місце. Потім знову вліво. Кроки 3-4
//      повторюються, доки елемент рухається. Кожен крок лише зменшує x або y, тому цикл скінченний.
// Для кроків 3-4 потрібні сусіди, а перебирати всі покладені елементи на кожному кроці
// дорого. Тому елементи лежать у "смугах" по bandSize пікселів за координатою свого низу,
// і крок дивиться лише в кілька смуг поруч.
//
// Що скільки коштує: будь-яка зміна розміру або довжини лінійки перекладає всі елементи
// заново. Місце елемента залежить від усіх, хто ліг раніше, тому частково перекласти не вийде.
// Для 10 000 елементів це кілька десятків мілісекунд.
//
// Пошук видимих. Верхи елементів не зростають по порядку: елемент 5 може лежати
// вище за елемент 4. Тому замість дерева Фенвіка - два масиви, які зростають завжди:
//   - lowestBottom[i] - найнижчий низ серед елементів 0..i;
//   - highestTop[i] - найвищий верх серед елементів i..n-1.
// Перший елемент, якого може бути видно, - перший i з lowestBottom[i] > scroll: усі до нього
// закінчуються вище вікна. Останній - останній i з highestTop[i] < scroll + viewport: усі
// після нього починаються нижче вікна. Обидва шукаються двійковим пошуком за O(log n).
import { FlowLayout } from '../flow-layout/index.js';
import { SegmentTree } from '../segment-tree/index.js';

// Перший індекс i у неспадному масиві values, для якого passes(values[i]) істинне;
// values.length, якщо такого немає. passes має бути "спершу хибне, потім істинне".
const firstWhere = (values, passes) => {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (passes(values[middle])) high = middle;
    else low = middle + 1;
  }
  return low;
};

const bandSize = 256;

export class SkylineLayout {
  constructor(crossSizes, mainSizes, lineLength) {
    this.flow = new FlowLayout(crossSizes, mainSizes, lineLength);
    this.count = crossSizes.length;
    this.mains = new Float64Array(this.count);
    this.crosses = new Float64Array(this.count);
    // Розмір кожного елемента по поперечній осі, щоб не питати дерево Фенвіка щоразу.
    this.crossSizes = new Float64Array(this.count);
    this.lowestBottom = new Float64Array(this.count);
    this.highestTop = new Float64Array(this.count);
    this.place();
  }

  get lineLength() {
    return this.flow.lineLength;
  }

  get lineCount() {
    return this.flow.lineCount;
  }

  // Кладе всі елементи по черзі: лінійка за лінійкою, у лінійці - від початку до кінця.
  place() {
    const { flow } = this;
    const width = Math.max(1, Math.ceil(flow.lineLength));
    const skyline = new SegmentTree(width);
    const sizes = this.crossSizes;
    // bands[b] - номери покладених елементів, чий низ лежить у смузі b (від b * bandSize).
    const bands = [];
    let tallest = 0;

    const bottomOf = (j) => this.mains[j] + flow.mainSizes[j];
    const rightOf = (j) => this.crosses[j] + sizes[j];

    // Крок вліво: найправіший край серед елементів, що стоять на тій самій висоті
    // [top, top + height) і повністю лівіше за x. До нього елемент і доїде; 0, якщо таких немає.
    // Такі елементи мають низ нижче за top і верх вище за top + height, тож їхній низ лежить
    // між top і top + height + tallest - лише ці смуги й треба переглянути.
    const slideLeft = (x, top, height) => {
      let stop = 0;
      const last = Math.floor((top + height + tallest) / bandSize);
      for (let b = Math.floor(top / bandSize); b <= last && b < bands.length; b += 1) {
        for (const j of bands[b] ?? []) {
          if (bottomOf(j) > top && this.mains[j] < top + height && rightOf(j) <= x) stop = Math.max(stop, rightOf(j));
        }
      }
      return stop;
    };

    // Крок вгору: найнижчий низ серед елементів над смугою [x, x + w), що закінчуються не нижче top.
    // Смуги переглядаємо від top угору; перша смуга, де такий елемент знайшовся, дає відповідь,
    // бо в смугах вище всі низи ще вищі. 0, якщо над елементом нічого немає.
    const slideUp = (x, w, top) => {
      for (let b = Math.min(Math.floor(top / bandSize), bands.length - 1); b >= 0; b -= 1) {
        let stop = -1;
        for (const j of bands[b] ?? []) {
          const bottom = bottomOf(j);
          if (bottom <= top && this.crosses[j] < x + w && rightOf(j) > x) stop = Math.max(stop, bottom);
        }
        if (stop >= 0) return stop;
      }
      return 0;
    };

    for (let k = 0; k < flow.lineCount; k += 1) {
      let cross = 0;
      for (let i = flow.lineStarts[k]; i < flow.lineEnd(k); i += 1) {
        const size = flow.crossTree.get(i);
        const height = flow.mainSizes[i];
        sizes[i] = size;
        // Елемент, ширший за лінійку, стоїть у ній сам; горизонт обрізаємо по довжині лінійки.
        const span = (x) => [Math.min(x, width - 1), Math.max(Math.min(x, width - 1) + 1, Math.min(x + size, width))];
        // Крок 2: вгору до горизонту.
        let x = cross;
        let top = skyline.max(...span(x));
        // Кроки 3-4: вліво і вгору, поки елемент рухається.
        for (;;) {
          const left = slideLeft(x, top, height);
          const up = slideUp(left, size, top);
          if (left === x && up === top) break;
          x = left;
          top = up;
        }
        this.mains[i] = top;
        this.crosses[i] = x;
        skyline.raise(...span(x), top + height);
        const band = Math.floor((top + height) / bandSize);
        while (bands.length <= band) bands.push([]);
        bands[band].push(i);
        tallest = Math.max(tallest, height);
        cross += size;
      }
    }
    for (let i = 0; i < this.count; i += 1) {
      const bottom = this.mains[i] + this.flow.mainSizes[i];
      this.lowestBottom[i] = i === 0 ? bottom : Math.max(this.lowestBottom[i - 1], bottom);
    }
    for (let i = this.count - 1; i >= 0; i -= 1) {
      this.highestTop[i] = i === this.count - 1 ? this.mains[i] : Math.min(this.highestTop[i + 1], this.mains[i]);
    }
  }

  applySizes(changes) {
    if (!this.flow.applySizes(changes)) return false;
    this.place();
    return true;
  }

  setLineLength(lineLength) {
    if (!this.flow.setLineLength(lineLength)) return false;
    this.place();
    return true;
  }

  // Позиція елемента: main - верх, cross - відступ від початку лінійки.
  positionOf(i) {
    return { main: this.mains[i], cross: this.crosses[i] };
  }

  // Повна довжина вмісту: найнижчий низ серед усіх елементів.
  total() {
    return this.count === 0 ? 0 : this.lowestBottom[this.count - 1];
  }

  // Ті самі поля, що й у FlowLayout.visibleItems. Видимі лінійки - лінійки першого
  // і останнього елемента, яких може бути видно; у DOM ідуть лінійки плюс overscan.
  // crossScroll і crossViewport - вікно по поперечній осі. Вони потрібні, коли мозаїка ширша
  // за вікно і її прокручують ще й убік. Тоді з кожної лінійки беремо лише елементи, що
  // перетинають вікно по поперечній осі, плюс overscan сусідів за номером з кожного боку.
  // Без цих аргументів вікно поперек нескінченне, і лінійки йдуть у DOM цілими.
  visibleItems(scroll, viewport, overscan, crossScroll = 0, crossViewport = Infinity) {
    const first = firstWhere(this.lowestBottom, (bottom) => bottom > scroll);
    // Останній i з highestTop[i] < scroll + viewport - це перший i з highestTop[i] >= цієї межі, мінус один.
    const last = firstWhere(this.highestTop, (top) => top >= scroll + viewport) - 1;
    if (this.count === 0 || first > last) {
      return { items: [], firstLine: 0, lastLine: -1, startLine: 0, endLine: -1 };
    }
    const firstLine = this.flow.lineOf(first);
    const lastLine = this.flow.lineOf(last);
    const startLine = Math.max(0, firstLine - overscan);
    const endLine = Math.min(this.flow.lineCount - 1, lastLine + overscan);
    const items = [];
    for (let k = startLine; k <= endLine; k += 1) {
      const lineStart = this.flow.lineStarts[k];
      const lineEnd = this.flow.lineEnd(k);
      // Перший і останній за номером елементи лінійки, що перетинають вікно поперек.
      // Після з'їзду вліво елементи лінійки йдуть по x не в порядку номерів, тому елемент
      // з номером між firstSeen і lastSeen може стояти поза вікном: такі пропускаємо.
      const seen = (i) => this.crosses[i] < crossScroll + crossViewport && this.crosses[i] + this.crossSizes[i] > crossScroll;
      let firstSeen = -1;
      let lastSeen = -1;
      for (let i = lineStart; i < lineEnd; i += 1) {
        if (!seen(i)) continue;
        if (firstSeen < 0) firstSeen = i;
        lastSeen = i;
      }
      if (firstSeen < 0) continue;
      const from = Math.max(lineStart, firstSeen - overscan);
      const to = Math.min(lineEnd - 1, lastSeen + overscan);
      for (let i = from; i <= to; i += 1) {
        if (i < firstSeen || i > lastSeen || seen(i)) items.push({ index: i, main: this.mains[i], cross: this.crosses[i] });
      }
    }
    return { items, firstLine, lastLine, startLine, endLine };
  }

  // Якір: перший елемент, що не закінчується вище вікна, і скільки вікно зайшло нижче його верху.
  anchor(scroll) {
    if (this.count === 0) return null;
    const item = Math.min(
      firstWhere(this.lowestBottom, (bottom) => bottom > scroll),
      this.count - 1,
    );
    return { item, inside: scroll - this.mains[item] };
  }

  scrollFor(anchor) {
    return Math.max(0, this.mains[anchor.item] + anchor.inside);
  }
}
