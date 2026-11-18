import { demo } from '../config/demo.js';

// Форма в лівій колонці: поле сторони квадрата, кнопка скидання, кількість плиток і підказки.
// text - що в полі; shownSide - сторона, яку показує лічильник плиток;
// onChange(text) - нове значення поля; onReset() - повернути початкову сторону.
export function SideForm({ text, shownSide, onChange, onReset }) {
  return (
    <form className="demo-form" onSubmit={(event) => event.preventDefault()}>
      <h3>Поле плиток</h3>
      <label className="demo-field">
        <span>Сторона квадрата</span>
        <input
          type="number"
          min={1}
          max={demo.maxSide}
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button type="button" className="demo-reset" onClick={onReset}>
        Скинути до {demo.defaultSide}
      </button>
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
  );
}
