import React from 'react';
import { FlowLayout } from '@/shared/lib/flow-layout';
import { SkylineLayout } from '@/shared/lib/skyline-layout';
import { sliceJob } from '@/shared/lib/slice-job';
import './VirtualFlow.css';

// Віртуальний скрол елементів, розкладених лінійками.
// Вертикально (horizontal = false): елементи йдуть зліва направо, лінійки - зверху вниз, скрол вниз.
// Горизонтально (horizontal = true): елементи йдуть згори вниз, колонки - зліва направо, скрол вправо.
// packed = false: рівні лінійки, кожна починається під найбільшим елементом попередньої
// (shared/lib/flow-layout). packed = true: ламані лінійки, кожен елемент підтягується до
// елементів під ним (shared/lib/skyline-layout). Обидві розкладки мають однакові методи,
// тому решта компонента про різницю не знає.
// У DOM лежать лише лінійки, які видно у вікні, плюс overscan лінійок з кожного боку.
//
// Як це працює:
//   1. Зовнішній блок має фіксований розмір і overflow: auto. Він і є вікном скролу.
//   2. Довжина лінійки - внутрішній розмір вікна поперек скролу (clientWidth або clientHeight).
//      Коли вікно розтягують, розкладка ламає лінійки заново під нову довжину.
//   3. Внутрішній блок має повну довжину вмісту, яку дає розкладка (total).
//   4. На кожну подію scroll компонент запам'ятовує позицію скролу. Розкладка (visibleItems)
//      каже, які елементи потрапили у вікно і де кожен стоїть.
//   5. ResizeObserver міряє кожен показаний елемент і передає виміри розкладці. Спершу
//      розкладка знає лише оцінки (estimateSize), справжні розміри приходять від браузера.
//   6. Перед кожною зміною розкладки компонент запам'ятовує якір (елемент на краю вікна), а після
//      перемальовування ставить скрол так, щоб цей елемент лишився на тому самому місці вікна.
//
// Напрямок і packed читаються лише при створенні: щоб змінити їх, компоненту дають новий key.
// estimateSize(i) повертає { width, height } - оцінку розміру елемента i разом із відступами.
// lineLength - стала довжина лінійки (лише для packed). Без неї довжина лінійки дорівнює
// розміру вікна поперек скролу, і розкладка перекладається, коли вікно розтягують. З нею
// мозаїка має сталу ширину, вікно лише показує її частину і прокручується в усі чотири боки.
// onRangeChange повідомляє, які лінійки видно, які лежать у DOM, скільки там елементів
// і яку частину вмісту вікно показує поперек скролу (crossFrom..crossTo).
//
// Мозаїка (packed) будується частинами. Для мільйона елементів побудова триває від секунд
// до хвилини, і одним шматком вона заморозила б сторінку: ні клік по меню, ні нове число
// в полі не спрацювали б до її кінця. Тому розкладка мозаїки створюється з deferred: true,
// а класти елементи компонент доручає sliceJob (shared/lib/slice-job): компонент
// підписується на побудову і зберігає функцію відписки в jobRef.
//   - Відписка зупиняє побудову. Вона спрацьовує, коли компонент зникає (інший режим, нова
//     сторона), і перед кожною новою побудовою: стара вже не потрібна.
//   - Поки побудова йде, розкладка лишається старою, а якір не ставиться: його поставлять,
//     коли побудова закінчиться.
//   - onBusyChange(true / false) повідомляє, що побудова почалась і закінчилась; на цей
//     час сторінка показує поверх поля лоудер.
export function VirtualFlow({
  count,
  estimateSize,
  renderItem,
  width,
  height,
  horizontal = false,
  packed = false,
  lineLength,
  overscan = 3,
  onRangeChange,
  onBusyChange,
}) {
  const [layout] = React.useState(() => {
    const sizes = Array.from({ length: count }, (_, i) => estimateSize(i));
    const Layout = packed ? SkylineLayout : FlowLayout;
    return new Layout(
      sizes.map((size) => (horizontal ? size.height : size.width)),
      sizes.map((size) => (horizontal ? size.width : size.height)),
      Math.max(1, lineLength ?? (horizontal ? height : width)),
      { deferred: true },
    );
  });
  // Розкладка змінюється на місці, і React цього не помічає. Лічильник version змушує
  // React перемалювати компонент після кожної зміни розкладки.
  const [, setVersion] = React.useState(0);
  const rerender = React.useCallback(() => setVersion((v) => v + 1), []);
  // main - позиція скролу вздовж лінійок (головна вісь), cross - поперек них.
  const [scroll, setScroll] = React.useState({ main: 0, cross: 0 });
  const viewportRef = React.useRef(null);
  const observerRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  // Фокус на клікнутому елементі. Клік часто змінює розмір елемента, і після нового розбиття
  // елемент може перескочити на інший рядок, навіть на початок наступного. Тому в мить кліку
  // компонент запам'ятовує елемент і де він стояв відносно вікна (focusRef), а коли розкладка
  // зміниться, ставить скрол так, щоб елемент стояв на тому самому місці вікна, і повертає
  // на нього фокус (focusIndexRef).
  const focusRef = React.useRef(null);
  const focusIndexRef = React.useRef(null);
  // Позиція, яку скрол отримав від самого компонента: подія scroll з цією позицією - не від людини.
  const ownScrollRef = React.useRef(null);
  const [itemNodes] = React.useState(() => new Set());

  // Побудова мозаїки частинами: jobRef - функція відписки від поточної побудови, busy - чи вона йде.
  const jobRef = React.useRef(null);
  const [busy, setBusy] = React.useState(layout.deferred === true);
  const startPlacing = React.useCallback(() => {
    jobRef.current?.();
    setBusy(true);
    jobRef.current = sliceJob(() => layout.placeSteps()).subscribe(() => {
      jobRef.current = null;
      setBusy(false);
    });
  }, [layout]);

  React.useEffect(() => {
    if (layout.deferred) startPlacing();
    return () => {
      jobRef.current?.();
      jobRef.current = null;
    };
  }, [layout, startPlacing]);

  React.useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // Позиція скролу по головній осі і по обох осях.
  const readScroll = React.useCallback((box) => (horizontal ? box.scrollLeft : box.scrollTop), [horizontal]);
  const readBoth = React.useCallback(
    (box) => ({ main: readScroll(box), cross: horizontal ? box.scrollTop : box.scrollLeft }),
    [horizontal, readScroll],
  );

  // Спостерігач створюється в ефекті, бо це зовнішній ресурс: функція очищення його вимикає.
  // Колбеки ref елементів спрацьовують раніше за ефект, тому елементи першого рендера
  // чекають у itemNodes, і ефект підписує їх усіх одразу.
  React.useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const changes = entries.map((entry) => {
        const { inlineSize, blockSize } = entry.borderBoxSize[0];
        return {
          index: Number(entry.target.dataset.index),
          cross: Math.ceil(horizontal ? blockSize : inlineSize),
          main: Math.ceil(horizontal ? inlineSize : blockSize),
        };
      });
      const box = viewportRef.current;
      // Якір беремо до зміни, поки розкладка ще стара. Після кліку якір - клікнутий елемент.
      const anchor = box === null ? null : layout.anchor(readScroll(box));
      if (!layout.applySizes(changes)) return;
      if (focusRef.current !== null) anchorRef.current = { focus: focusRef.current };
      else if (anchorRef.current === null) anchorRef.current = anchor;
      focusRef.current = null;
      if (layout.deferred) startPlacing();
      rerender();
    });
    observerRef.current = observer;
    for (const node of itemNodes) observer.observe(node);
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [layout, itemNodes, horizontal, readScroll, rerender, startPlacing]);

  // Колбек ref однаковий на всіх рендерах (useCallback). Тому React викликає його лише тоді,
  // коли елемент з'являється в DOM, а функцію очищення - коли елемент зникає.
  const measureItem = React.useCallback(
    (node) => {
      itemNodes.add(node);
      observerRef.current?.observe(node);
      return () => {
        itemNodes.delete(node);
        observerRef.current?.unobserve(node);
      };
    },
    [itemNodes],
  );

  // Після кожного рендера, до того як браузер намалює кадр:
  //   1. Якщо довжина лінійки не стала (lineLength не задано) і внутрішній розмір вікна
  //      поперек скролу змінився, ламаємо лінійки заново
  //      і просимо ще один рендер. Якір ставимо вже після нього, коли вміст має нову довжину:
  //      інакше браузер обрізав би позицію скролу за старою довжиною вмісту.
  //   2. Якщо є якір, ставимо скрол так, щоб лінійка з елементом-якорем лишилася на місці.
  //      Якщо якір - клікнутий елемент, на місці лишається сам елемент, по обох осях.
  //   3. Якщо чекає фокус, а елемент уже в DOM, фокус іде на нього.
  React.useLayoutEffect(() => {
    const box = viewportRef.current;
    if (box === null) return;
    if (focusIndexRef.current !== null) {
      const node = box.querySelector(`.flow-item[data-index="${focusIndexRef.current}"]`);
      if (node !== null) {
        node.firstElementChild?.focus?.({ preventScroll: true });
        focusIndexRef.current = null;
      }
    }
    const wanted = lineLength ?? (horizontal ? box.clientHeight : box.clientWidth);
    if (wanted > 0 && wanted !== layout.lineLength) {
      if (anchorRef.current === null) anchorRef.current = layout.anchor(readScroll(box));
      layout.setLineLength(wanted);
      if (layout.deferred) startPlacing();
      rerender();
      return;
    }
    // Мозаїка ще будується: розкладка стара, тож якір чекає кінця побудови.
    if (jobRef.current !== null) return;
    const anchor = anchorRef.current;
    if (anchor === null) return;
    anchorRef.current = null;
    if (anchor.focus) {
      const { index, main, cross } = anchor.focus;
      const position = layout.positionOf(index);
      const mainTarget = position.main - main;
      const crossTarget = position.cross - cross;
      box.scrollTop = horizontal ? crossTarget : mainTarget;
      box.scrollLeft = horizontal ? mainTarget : crossTarget;
      const now = readBoth(box);
      ownScrollRef.current = now;
      focusIndexRef.current = index;
      setScroll(now);
      return;
    }
    const target = layout.scrollFor(anchor);
    if (readScroll(box) === target) return;
    if (horizontal) box.scrollLeft = target;
    else box.scrollTop = target;
    setScroll(readBoth(box));
  });

  const handleScroll = (event) => {
    const now = readBoth(event.currentTarget);
    const own = ownScrollRef.current;
    // Людина прокрутила сама: клік, що чекав на зміну розмірів, більше не тримає вікно.
    if (own === null || own.main !== now.main || own.cross !== now.cross) focusRef.current = null;
    ownScrollRef.current = null;
    setScroll(now);
  };

  // Клік ловимо на фазі перехоплення, ще до того, як сторінка змінить розмір елемента:
  // запам'ятовуємо елемент і його місце відносно вікна.
  const handleClickCapture = (event) => {
    const node = event.target.closest('.flow-item');
    const box = viewportRef.current;
    if (node === null || box === null) return;
    const index = Number(node.dataset.index);
    const position = layout.positionOf(index);
    const now = readBoth(box);
    focusRef.current = { index, main: position.main - now.main, cross: position.cross - now.cross };
  };

  // view.items - елементи для DOM з позиціями; firstLine..lastLine - лінійки, які справді видно
  // у вікні; startLine..endLine - ті, що лежать у DOM разом із запасом overscan з кожного боку
  // (зверху і знизу вертикально, зліва і справа горизонтально).
  const crossViewport = horizontal ? height : width;
  const view = layout.visibleItems(scroll.main, horizontal ? width : height, overscan, scroll.cross, crossViewport);
  const total = layout.total();
  const crossFrom = Math.round(scroll.cross);
  const crossTo = Math.round(scroll.cross + crossViewport);

  React.useEffect(() => {
    onRangeChange?.({
      lineCount: layout.lineCount,
      firstLine: view.firstLine,
      lastLine: view.lastLine,
      startLine: view.startLine,
      endLine: view.endLine,
      itemCount: view.items.length,
      total,
      crossFrom,
      crossTo,
    });
  }, [
    onRangeChange,
    layout,
    view.firstLine,
    view.lastLine,
    view.startLine,
    view.endLine,
    view.items.length,
    total,
    crossFrom,
    crossTo,
  ]);

  // Поперек скролу вміст займає все вікно, а при сталій довжині лінійки - рівно її.
  const crossSize = lineLength ?? '100%';
  const contentStyle = horizontal ? { width: total, height: crossSize } : { height: total, width: crossSize };

  const items = view.items.map(({ index, main, cross }) => (
    <div
      key={index}
      ref={measureItem}
      className="flow-item"
      data-index={index}
      style={horizontal ? { left: main, top: cross } : { top: main, left: cross }}
    >
      {renderItem(index)}
    </div>
  ));

  return (
    <div ref={viewportRef} className="flow-viewport" style={{ width, height }} onScroll={handleScroll}>
      <div className="flow-content" style={contentStyle} onClickCapture={handleClickCapture}>
        {items}
      </div>
    </div>
  );
}
