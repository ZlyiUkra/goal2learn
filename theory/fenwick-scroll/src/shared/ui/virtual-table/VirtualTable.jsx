import React from 'react';
import './VirtualTable.css';

// Віртуальна таблиця: скрол у чотири боки, у DOM лише клітинки у вікні плюс overscan рядків
// і колонок з кожного боку. Позиції дає GridLayout (shared/lib/grid-layout) з двома деревами
// Фенвіка; сама таблиця нічого не рахує, лише показує.
//
// Як це працює:
//   1. Зовнішній блок має розмір вікна і overflow: auto, внутрішній - повний розмір таблиці
//      (сума ширин колонок x сума висот рядків). Браузер малює обидві смуги прокрутки.
//   2. На кожну подію scroll компонент запам'ятовує scrollTop і scrollLeft, а розкладка
//      каже, які клітинки потрапили у вікно і де кожна стоїть.
//   3. Після кожного рендера компонент запам'ятовує якір - клітинку в лівому верхньому куті
//      вікна. Коли version розкладки змінилася (рядок чи колонка змінили розмір), він ставить
//      скрол так, щоб ця клітинка лишилася на місці. useLayoutEffect робить це до того, як
//      браузер намалює кадр.
//
// grid - результат useGridLayout. renderCell(row, col) повертає вміст клітинки.
// onRangeChange повідомляє, які рядки й колонки видно, які лежать у DOM і скільки там клітинок.
export function VirtualTable({ grid, width, height, overscan = 3, renderCell, onRangeChange }) {
  const { layout, version } = grid;
  const [scroll, setScroll] = React.useState({ top: 0, left: 0 });
  const viewportRef = React.useRef(null);
  const anchorRef = React.useRef(null);
  const versionRef = React.useRef(version);

  React.useLayoutEffect(() => {
    const box = viewportRef.current;
    if (box === null) return;
    if (versionRef.current !== version) {
      versionRef.current = version;
      if (anchorRef.current !== null) {
        const target = layout.scrollFor(anchorRef.current);
        if (box.scrollTop !== target.top || box.scrollLeft !== target.left) {
          box.scrollTop = target.top;
          box.scrollLeft = target.left;
          setScroll({ top: box.scrollTop, left: box.scrollLeft });
        }
      }
    }
    // Якір для наступної зміни: розкладка вже нова, а вікно стоїть там, де треба.
    anchorRef.current = layout.anchor(box.scrollTop, box.scrollLeft);
  });

  const handleScroll = (event) => {
    const box = event.currentTarget;
    setScroll({ top: box.scrollTop, left: box.scrollLeft });
  };

  const view = layout.visibleCells(scroll.top, height, scroll.left, width, overscan);
  const tableWidth = layout.width();
  const tableHeight = layout.height();

  React.useEffect(() => {
    onRangeChange?.({
      rowsSeen: view.rowsSeen,
      rowsInDom: view.rowsInDom,
      colsSeen: view.colsSeen,
      colsInDom: view.colsInDom,
      cellCount: view.cells.length,
      width: tableWidth,
      height: tableHeight,
    });
    // Діапазони - нові об'єкти на кожному рендері, тому залежності - їхні числа.
  }, [
    onRangeChange,
    view.rowsSeen.start,
    view.rowsSeen.end,
    view.rowsInDom.start,
    view.rowsInDom.end,
    view.colsSeen.start,
    view.colsSeen.end,
    view.colsInDom.start,
    view.colsInDom.end,
    view.cells.length,
    tableWidth,
    tableHeight,
  ]);

  return (
    <div ref={viewportRef} className="table-viewport" style={{ width, height }} onScroll={handleScroll}>
      <div className="table-content" style={{ width: tableWidth, height: tableHeight }}>
        {view.cells.map(({ row, col, top, left, width: cellWidth, height: cellHeight }) => (
          <div key={`${row}:${col}`} className="table-cell" style={{ top, left, width: cellWidth, height: cellHeight }}>
            {renderCell(row, col)}
          </div>
        ))}
      </div>
    </div>
  );
}
