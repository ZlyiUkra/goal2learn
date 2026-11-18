import React from 'react';
import { demo } from '../config/demo.js';
import { modes } from '../model/tiles.js';
import { DemoContext } from '../model/demo-context.js';
import { useSide } from '../model/use-side.js';
import { afterPaint } from '../lib/after-paint.js';
import { BuildLoader } from './BuildLoader.jsx';
import { SideForm } from './SideForm.jsx';
import { FlowView } from './FlowView.jsx';
import { TableView } from './TableView.jsx';
import './FlowDemoPage.css';

// Сторінка режимів. Зліва - форма з полем сторони квадрата (SideForm, стан у model/use-side.js):
// плиток сторона x сторона, у таблиці сторона рядків і сторона колонок. Праворуч - назва
// режиму, пояснення, рядок стану і вікно з плитками, яке тягнуть за краї й кути.
// mode приходить з меню. Сторінка лишається змонтованою, коли режим змінюється, тож сторона
// і розмір вікна зберігаються; розкладку плиток перебудовує key у FlowView і TableView.
// Сторону, вікно і час побудови FlowView і TableView беруть з DemoContext (model/demo-context.js).

export function FlowDemoPage({ mode }) {
  const [frame, setFrame] = React.useState(demo.frame);
  const { side, text: sideText, shownSide, waiting, change: changeSide, reset: resetSide } = useSide();
  const [buildMs, setBuildMs] = React.useState(null);

  // layoutFrame - вікно, з якого мозаїка "Скомбіновано" бере пропорції. Поки вікно тягнуть,
  // мозаїка не перекладається: для мільйона плиток це хвилина, а не мить. Коли край відпустили,
  // layoutFrame наздоганяє frame, і мозаїка перекладається частинами під лоудером.
  const [layoutFrame, setLayoutFrame] = React.useState(demo.frame);

  const context = React.useMemo(
    () => ({ side, frame, setFrame, layoutFrame, onResizeEnd: () => setLayoutFrame(frame), buildMs, setBuildMs }),
    [side, frame, layoutFrame, buildMs],
  );

  // builtMode - режим, для якого зараз будується поле плиток. Поки він не дорівнює mode з меню,
  // на місці поля стоїть лоудер. null означає, що сторінку щойно відкрили і поля ще немає.
  // Після кліку по меню React може виконати ефект ще до того, як браузер намалює кадр, тому
  // поле для нового режиму будується лише після afterPaint.
  const [builtMode, setBuiltMode] = React.useState(null);
  const switching = builtMode !== mode;

  React.useEffect(() => {
    if (!switching) return undefined;
    return afterPaint(() => setBuiltMode(mode));
  }, [mode, switching]);

  const { label, description } = modes.find(({ value }) => value === mode);

  return (
    <div className="demo">
      <aside className="demo-aside">
        <SideForm text={sideText} shownSide={shownSide} onChange={changeSide} onReset={resetSide} />
      </aside>
      <main className="demo-main">
        <h1>{label}</h1>
        <p className="demo-lead">{description}</p>
        <DemoContext value={context}>
          {waiting || switching ? (
            <BuildLoader text={`Будую поле ${shownSide} x ${shownSide} плиток...`} />
          ) : mode === 'table' ? (
            <TableView key={side} />
          ) : (
            <FlowView key={`${mode}:${side}`} mode={mode} />
          )}
        </DemoContext>
      </main>
    </div>
  );
}
