import React from 'react';
import { demo, modes } from '../model/tiles.js';
import { DemoContext } from '../model/demo-context.js';
import { afterPaint } from '../lib/after-paint.js';
import { BuildLoader } from './BuildLoader.jsx';
import { FlowView } from './FlowView.jsx';
import { TableView } from './TableView.jsx';
import './FlowDemoPage.css';

// Сторінка режимів. Зліва - форма з полем сторони квадрата: плиток сторона x сторона,
// у таблиці сторона рядків і сторона колонок. Праворуч - назва режиму, пояснення,
// рядок стану і вікно з плитками, яке тягнуть за краї й кути.
// mode приходить з меню. Сторінка лишається змонтованою, коли режим змінюється, тож сторона
// і розмір вікна зберігаються; розкладку плиток перебудовує key у FlowView і TableView.
// Сторону, вікно і час побудови FlowView і TableView беруть з DemoContext (model/demo-context.js).

const parseSide = (text) => {
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= demo.maxSide ? value : null;
};

export function FlowDemoPage({ mode }) {
  const [frame, setFrame] = React.useState(demo.frame);
  // sideText - те, що зараз у полі; side - сторона, за якою побудоване поле плиток.
  // Побудова для 300 x 300 плиток триває помітний час і на цей час зупиняє сторінку. Якби поле
  // будувалось на кожну цифру, то, щоб ввести 300, довелось би чекати побудову для 3, потім
  // для 30, і лише потім для 300. Тому поле плиток будується тільки тоді, коли поле вводу
  // простояло без змін demo.inputDelay мілісекунд. До того замість поля плиток стоїть лоудер.
  const [side, setSide] = React.useState(demo.defaultSide);
  const [sideText, setSideText] = React.useState(String(demo.defaultSide));
  const [waiting, setWaiting] = React.useState(false);
  const [buildMs, setBuildMs] = React.useState(null);
  const timerRef = React.useRef(null);

  // layoutFrame - вікно, з якого мозаїка "Скомбіновано" бере пропорції. Поки вікно тягнуть,
  // мозаїка не перекладається: для мільйона плиток це хвилина, а не мить. Коли край відпустили,
  // поверх поля з'являється лоудер (relayout), і вже під ним мозаїка перекладається.
  // В інших режимах ширина мозаїки від вікна не залежить, тому layoutFrame оновлюється одразу.
  const [layoutFrame, setLayoutFrame] = React.useState(demo.frame);
  const [relayout, setRelayout] = React.useState(false);

  const handleResizeEnd = () => {
    const sameShape = frame.width * layoutFrame.height === frame.height * layoutFrame.width;
    if (mode === 'combined' && !sameShape) setRelayout(true);
    else setLayoutFrame(frame);
  };

  React.useEffect(() => {
    if (!relayout) return undefined;
    // Обидва оновлення в одному рендері: лоудер лишається на екрані, поки мозаїка перекладається.
    return afterPaint(() => {
      setLayoutFrame(frame);
      setRelayout(false);
    });
  }, [relayout, frame]);

  const context = React.useMemo(
    () => ({ side, frame, setFrame, layoutFrame, relayout, onResizeEnd: handleResizeEnd, buildMs, setBuildMs }),
    // handleResizeEnd читає лише frame, layoutFrame і mode, тож оновлюється разом з ними.
    [side, frame, layoutFrame, relayout, mode, buildMs],
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

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleSideChange = (event) => {
    const text = event.target.value;
    setSideText(text);
    setWaiting(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      // Обидва оновлення потрапляють в один рендер: лоудер, уже намальований на екрані,
      // лишається там, поки будується нове поле, і зникає разом із появою поля.
      // Якщо в полі неправильне число, повертається поле плиток з попередньою стороною.
      const value = parseSide(text);
      if (value !== null) setSide(value);
      setWaiting(false);
    }, demo.inputDelay);
  };

  const { label, description } = modes.find(({ value }) => value === mode);
  // Скільки плиток буде: за числом у полі, якщо воно правильне, інакше за побудованим полем.
  const shownSide = parseSide(sideText) ?? side;

  return (
    <div className="demo">
      <aside className="demo-aside">
        <form className="demo-form" onSubmit={(event) => event.preventDefault()}>
          <h3>Поле плиток</h3>
          <label className="demo-field">
            <span>Сторона квадрата</span>
            <input type="number" min={1} max={demo.maxSide} value={sideText} onChange={handleSideChange} />
          </label>
          <p className="demo-count">
            {shownSide} x {shownSide} = <strong>{shownSide * shownSide}</strong> плиток
          </p>
          <p className="demo-hint">
            Від 1 до {demo.maxSide}. Поле плиток праворуч перебудовується, коли число не змінювалось{' '}
            {demo.inputDelay} мс, і щоразу, коли в меню обрано інший режим. Поки поле будується, на його
            місці лоудер. У таблиці сторона - це кількість рядків і колонок.
          </p>
          <p className="demo-hint">
            Тягніть вікно за будь-який край або кут. Клацніть плитку, щоб збільшити її вдвічі або повернути назад.
          </p>
        </form>
      </aside>
      <main className="demo-main">
        <h1>{label}</h1>
        <p className="demo-lead">{description}</p>
        <DemoContext value={context}>
          {waiting || switching ? (
            <BuildLoader side={shownSide} />
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
