import React from 'react';
import { flushSync } from 'react-dom';
import { VirtualFlow } from '@/shared/ui/virtual-flow';
import { ResizableFrame } from '@/shared/ui/resizable-frame';
import { demo, tileAt, tilesAreaFor, mosaicWidthFor } from '../model/tiles.js';
import { useDemo, useBuildTime } from '../model/demo-context.js';
import { afterPaint } from '../lib/after-paint.js';
import { BuildLoader } from './BuildLoader.jsx';

// Режими лінійок і мозаїки: side x side плиток у VirtualFlow.
// Сторінка дає компоненту key з режимом і стороною, тому зміна будь-чого з них створює
// розкладку заново, а збільшені плитки скидаються.
export function FlowView({ mode }) {
  const { side, frame, setFrame, layoutFrame, relayout, onResizeEnd, buildMs } = useDemo();
  // У "Скомбіновано" мозаїка перекладається, коли змінюється layoutFrame; цей час теж міряємо.
  useBuildTime(mode === 'combined' ? layoutFrame : null);
  const count = side * side;
  const horizontal = mode === 'horizontal';
  const [grown, setGrown] = React.useState(() => new Set());
  const [range, setRange] = React.useState({
    lineCount: 0,
    firstLine: 0,
    lastLine: -1,
    startLine: 0,
    endLine: -1,
    itemCount: 0,
    total: 0,
    crossFrom: 0,
    crossTo: 0,
  });

  // Площа потрібна лише мозаїці без фіксованої ширини; для мільйона плиток це мільйон кроків,
  // тому рахуємо її один раз на кількість плиток.
  const area = React.useMemo(() => (mode === 'combined' ? tilesAreaFor(count) : 0), [mode, count]);
  const mosaicWidth = mosaicWidthFor(mode, layoutFrame, area);

  // Розмір плитки з урахуванням клацань: плитка, по якій клацнули, удвічі більша.
  const sizeOf = (i) => {
    const factor = grown.has(i) ? demo.growFactor : 1;
    const tile = tileAt(i);
    return { width: tile.width * factor, height: tile.height * factor };
  };

  // Оцінка для розкладки до першого виміру: розмір плитки плюс відступи з обох боків.
  const estimateSize = (i) => {
    const tile = tileAt(i);
    return { width: tile.width + demo.gap * 2, height: tile.height + demo.gap * 2 };
  };

  const packed = mode === 'combined' || mode === 'fixed';
  // regrowing - плитку клацнули, і мозаїка перекладається під її новий розмір.
  const [regrowing, setRegrowing] = React.useState(false);

  const toggleGrown = (i) => {
    setGrown((previous) => {
      const next = new Set(previous);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  // У лінійках новий розмір плитки перекладає лише її лінійку і ті, що нижче, - це швидко.
  // У мозаїці новий розмір перекладає всю мозаїку заново (для мільйона плиток - хвилина),
  // тому спершу з'являється лоудер поверх поля, і лише потім плитка змінює розмір:
  //   1. afterPaint чекає, поки лоудер з'явиться на екрані.
  //   2. flushSync одразу записує новий розмір плитки в DOM. Браузер міряє плитку перед
  //      малюванням наступного кадру, і VirtualFlow перекладає мозаїку в ResizeObserver.
  //   3. Другий afterPaint спрацьовує після цього кадру, тобто вже після перекладання,
  //      і прибирає лоудер.
  const toggle = (i) => {
    if (!packed) {
      toggleGrown(i);
      return;
    }
    setRegrowing(true);
    afterPaint(() => {
      flushSync(() => toggleGrown(i));
      afterPaint(() => setRegrowing(false));
    });
  };

  const lines = horizontal ? 'колонки' : 'рядки';
  const sides = horizontal ? 'зліва і справа' : 'зверху і знизу';

  return (
    <>
      <p className="callout status">
        Вікно {Math.round(frame.width)} x {Math.round(frame.height)} px. Усього {range.lineCount} {lines}. У вікні видно {lines} {range.firstLine}..{range.lastLine}. У
        DOM {lines} {range.startLine}..{range.endLine} (запас {demo.overscan} {sides}
        {mosaicWidth ? ` і ${demo.overscan} плитки зліва і справа в кожному рядку` : ''}), у них {range.itemCount}{' '}
        плиток з {count}.
        {mosaicWidth
          ? ` Мозаїка ${mosaicWidth} x ${range.total} px, вікно показує x = ${range.crossFrom}..${range.crossTo}.`
          : ` Довжина вмісту ${range.total} px.`}
        {buildMs === null ? '' : ` Поле побудовано за ${(buildMs / 1000).toFixed(2)} с.`}
      </p>
      <div className="stage">
        <ResizableFrame rect={frame} onResize={setFrame} onResizeEnd={onResizeEnd}>
          <VirtualFlow
            count={count}
            estimateSize={estimateSize}
            horizontal={horizontal}
            packed={packed}
            lineLength={mosaicWidth}
            width={frame.width}
            height={frame.height}
            overscan={demo.overscan}
            onRangeChange={setRange}
            renderItem={(i) => {
              const { width, height } = sizeOf(i);
              return (
                <button
                  type="button"
                  className="tile"
                  style={{ width, height, background: tileAt(i).color, margin: demo.gap }}
                  title={`#${i}: ${width} x ${height} px`}
                  onClick={() => toggle(i)}
                >
                  {i}
                </button>
              );
            }}
          />
        </ResizableFrame>
        {relayout || regrowing ? <BuildLoader side={side} overlay /> : null}
      </div>
    </>
  );
}
