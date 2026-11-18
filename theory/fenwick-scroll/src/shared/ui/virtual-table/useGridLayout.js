import React from 'react';
import { GridLayout } from '@/shared/lib/grid-layout';

// Тримає розкладку таблиці між рендерами. rowSize(r) і colSize(c) читаються лише при першому
// рендері; щоб перебудувати таблицю з іншою кількістю рядків чи колонок, компоненту дають новий key.
//
// Розкладка змінюється на місці: setRowSize і setColSize коштують O(log n), а копія дерева
// на кожну зміну коштувала б O(n). React такої зміни не помічає, тому обидві функції ще й
// збільшують version: новий стан змушує React перемалювати таблицю, а VirtualTable за зміною
// version розуміє, що розміри змінилися, і ставить якір на місце.
export function useGridLayout(rowCount, colCount, rowSize, colSize) {
  const [layout] = React.useState(
    () =>
      new GridLayout(
        Array.from({ length: rowCount }, (_, r) => rowSize(r)),
        Array.from({ length: colCount }, (_, c) => colSize(c)),
      ),
  );
  const [version, setVersion] = React.useState(0);

  const setRowSize = React.useCallback(
    (row, size) => {
      if (layout.setRowSize(row, size)) setVersion((v) => v + 1);
    },
    [layout],
  );

  const setColSize = React.useCallback(
    (col, size) => {
      if (layout.setColSize(col, size)) setVersion((v) => v + 1);
    },
    [layout],
  );

  return { layout, version, setRowSize, setColSize };
}
