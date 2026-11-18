import React from 'react';
import { VirtualFlow } from '@/shared/ui/virtual-flow';
import { ResizableFrame } from '@/shared/ui/resizable-frame';
import { demo } from '../config/demo.js';
import { tileAt, tilesAreaFor, mosaicWidthFor } from '../model/tiles.js';
import { useDemo } from '../model/demo-context.js';
import { BuildLoader } from './BuildLoader.jsx';

// Режими лінійок і мозаїки: side x side плиток у VirtualFlow.
// Сторінка дає компоненту key з режимом і стороною, тому зміна будь-чого з них створює
// розкладку заново, а збільшені плитки скидаються.
export function FlowView({ mode }) {
  // Відлік часу побудови. mountedAt - перший рендер: з нього починається перша побудова.
  // startRef - початок побудови мозаїки, що йде зараз; null, коли вона не йде.
  const [mountedAt] = React.useState(() => performance.now());
  const startRef = React.useRef(mountedAt);
  const { side, frame, setFrame, layoutFrame, onResizeEnd, buildMs, setBuildMs } = useDemo();
  const packed = mode === 'combined' || mode === 'fixed';
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

  // Лінійки будуються одразу, тому їхній час - від першого рендеру до появи в DOM.
  React.useLayoutEffect(() => {
    if (!packed) setBuildMs(performance.now() - mountedAt);
  }, [packed, setBuildMs, mountedAt]);

  // Мозаїку VirtualFlow будує частинами і каже, коли почав і закінчив (busy). Поки busy,
  // поверх поля стоїть лоудер. built - мозаїку вже хоч раз побудовано: далі лоудер каже не
  // "будую", а "перекладаю" (після кліку по плитці або нових пропорцій вікна).
  const [busy, setBusy] = React.useState(packed);
  const [built, setBuilt] = React.useState(false);
  const handleBusyChange = React.useCallback(
    (nowBusy) => {
      setBusy(nowBusy);
      if (nowBusy) {
        if (startRef.current === null) startRef.current = performance.now();
        return;
      }
      if (startRef.current !== null) setBuildMs(performance.now() - startRef.current);
      startRef.current = null;
      setBuilt(true);
    },
    [setBuildMs],
  );

  const toggle = (i) => {
    setGrown((previous) => {
      const next = new Set(previous);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
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
        {buildMs === null || busy ? '' : ` Поле побудовано за ${(buildMs / 1000).toFixed(2)} с.`}
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
            onBusyChange={handleBusyChange}
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
        {busy ? (
          <BuildLoader
            overlay
            text={`${built ? 'Перекладаю мозаїку' : 'Будую мозаїку'} ${side} x ${side} плиток...`}
          />
        ) : null}
      </div>
    </>
  );
}
