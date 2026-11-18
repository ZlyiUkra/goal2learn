import React from 'react';
import { resizeRect } from './resize-rect.js';
import './ResizableFrame.css';

// Вікно, розмір якого змінюють перетягуванням будь-якого з чотирьох країв або чотирьох кутів.
//
// Механізм:
//   1. Навколо вікна лежать вісім тонких захватів. Кожен знає свою сторону ('n', 'se', ...).
//   2. pointerdown на захваті запам'ятовує точку натискання і прямокутник вікна в цю мить,
//      а setPointerCapture каже браузеру надсилати всі наступні події цього вказівника
//      саме захвату. Тому перетягування не обривається, коли вказівник швидко виїжджає
//      за межі тонкого захвату.
//   3. pointermove рахує зсув від точки натискання, і resizeRect дає новий прямокутник.
//      Зсув рахується від початкового прямокутника, а не від попереднього кроку,
//      тому похибки кроків не накопичуються.
//   4. pointerup або pointercancel закінчує перетягування; захоплення браузер знімає сам.
//
// rect - прямокутник вікна { left, top, width, height }, onResize(rect) - новий прямокутник.
// onResizeEnd() - необов'язковий: перетягування закінчилось, край відпустили. Він потрібен тим,
// кому дорого перераховувати щось на кожен рух і досить зробити це один раз наприкінці.
// Вікно стоїть абсолютно, тому батьківський блок має бути position: relative.
const handles = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'];

export function ResizableFrame({ rect, onResize, onResizeEnd, minSize = 80, children }) {
  const dragRef = React.useRef(null);

  const handlePointerDown = (handle) => (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { handle, x: event.clientX, y: event.clientY, rect };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (drag === null) return;
    onResize(resizeRect(drag.rect, drag.handle, event.clientX - drag.x, event.clientY - drag.y, minSize));
  };

  const handlePointerEnd = () => {
    if (dragRef.current === null) return;
    dragRef.current = null;
    onResizeEnd?.();
  };

  return (
    <div className="frame" style={rect}>
      {children}
      {handles.map((handle) => (
        <div
          key={handle}
          className={`frame-handle frame-handle-${handle}`}
          onPointerDown={handlePointerDown(handle)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        />
      ))}
    </div>
  );
}
