import React from 'react';
import { VirtualTable, useGridLayout } from '@/shared/ui/virtual-table';
import { ResizableFrame } from '@/shared/ui/resizable-frame';
import { demo } from '../config/demo.js';
import { tableTileAt, tableRowSize, tableColSize } from '../model/table.js';
import { useDemo, useBuildTime } from '../model/demo-context.js';

// Режим "Таблиця": side рядків x side колонок, плитка у кожній клітинці.
// Сторінка дає компоненту key зі стороною, тому нова сторона будує таблицю заново.
export function TableView() {
  useBuildTime();
  const { side, frame, setFrame, onResizeEnd, buildMs } = useDemo();
  const grid = useGridLayout(
    side,
    side,
    (row) => tableRowSize(row, side),
    (col) => tableColSize(col, side),
  );
  const [grown, setGrown] = React.useState(() => new Set());
  const [range, setRange] = React.useState(null);

  // Клацання збільшує плитку удвічі або повертає назад. Рядок і колонка плитки отримують новий
  // розмір через дерева Фенвіка (setRowSize, setColSize), кожен за O(log side).
  const toggle = (row, col) => {
    const i = row * side + col;
    const next = new Set(grown);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setGrown(next);
    grid.setRowSize(row, tableRowSize(row, side, next));
    grid.setColSize(col, tableColSize(col, side, next));
  };

  return (
    <>
      <p className="callout status">
        Вікно {Math.round(frame.width)} x {Math.round(frame.height)} px.{' '}
        {range === null
          ? ''
          : `Таблиця ${side} x ${side} = ${side * side} плиток, ${range.width} x ${range.height} px. ` +
            `У вікні видно рядки ${range.rowsSeen.start}..${range.rowsSeen.end} і колонки ` +
            `${range.colsSeen.start}..${range.colsSeen.end}. У DOM рядки ${range.rowsInDom.start}..${range.rowsInDom.end} ` +
            `і колонки ${range.colsInDom.start}..${range.colsInDom.end} (запас ${demo.overscan} з кожного боку), ` +
            `це ${range.cellCount} плиток.`}
        {buildMs === null ? '' : ` Таблицю побудовано за ${(buildMs / 1000).toFixed(2)} с.`}
      </p>
      <div className="stage">
        <ResizableFrame rect={frame} onResize={setFrame} onResizeEnd={onResizeEnd}>
          <VirtualTable
            grid={grid}
            width={frame.width}
            height={frame.height}
            overscan={demo.overscan}
            onRangeChange={setRange}
            renderCell={(row, col) => {
              const tile = tableTileAt(row, col, side);
              const factor = grown.has(row * side + col) ? demo.growFactor : 1;
              const width = tile.width * factor;
              const height = tile.height * factor;
              return (
                <button
                  type="button"
                  className="tile"
                  style={{ width, height, background: tile.color, margin: demo.gap }}
                  title={`${row}:${col}: ${width} x ${height} px`}
                  onClick={() => toggle(row, col)}
                >
                  {row}:{col}
                </button>
              );
            }}
          />
        </ResizableFrame>
      </div>
    </>
  );
}
