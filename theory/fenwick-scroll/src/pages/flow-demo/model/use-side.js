// Сторона квадрата: що набрано в полі і за якою стороною будується поле плиток.
//
// text - те, що зараз у полі; side - сторона, за якою будується поле плиток.
// Побудова для 300 x 300 плиток триває помітний час. Якби поле будувалось на кожну цифру,
// то, щоб ввести 300, довелось би чекати побудову для 3, потім для 30, і лише потім для 300.
// Тому side змінюється тільки тоді, коли поле вводу простояло без змін demo.inputDelay
// мілісекунд. Поки чекаємо, waiting = true, і сторінка показує лоудер замість поля плиток.
import React from 'react';
import { demo } from '../config/demo.js';

// Число з поля, якщо воно ціле і від 1 до demo.maxSide; інакше null.
export const parseSide = (text) => {
  const value = Number(text);
  return Number.isInteger(value) && value >= 1 && value <= demo.maxSide ? value : null;
};

export const useSide = () => {
  const [side, setSide] = React.useState(demo.defaultSide);
  const [text, setText] = React.useState(String(demo.defaultSide));
  const [waiting, setWaiting] = React.useState(false);
  const timerRef = React.useRef(null);

  React.useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const change = (nextText) => {
    setText(nextText);
    setWaiting(true);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      // Обидва оновлення потрапляють в один рендер: лоудер, уже намальований на екрані,
      // лишається там, поки будується нове поле, і зникає разом із появою поля.
      // Якщо в полі неправильне число, повертається поле плиток з попередньою стороною.
      const value = parseSide(nextText);
      if (value !== null) setSide(value);
      setWaiting(false);
    }, demo.inputDelay);
  };

  // Повертає сторону до початкової одразу, без очікування: поле з такою стороною будується швидко.
  // Якщо зараз будується велика мозаїка, вона зникає разом зі старим полем, і її побудова
  // зупиняється (відписка у VirtualFlow).
  const reset = () => {
    window.clearTimeout(timerRef.current);
    setText(String(demo.defaultSide));
    setSide(demo.defaultSide);
    setWaiting(false);
  };

  // Скільки плиток буде: за числом у полі, якщо воно правильне, інакше за побудованим полем.
  const shownSide = parseSide(text) ?? side;

  return { side, text, shownSide, waiting, change, reset };
};
