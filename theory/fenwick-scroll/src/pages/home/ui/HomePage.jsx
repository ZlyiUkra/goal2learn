import React from 'react';
import {
  exampleSizes,
  exampleTree,
  treeCells,
  offsetSteps,
  indexSteps,
  setSteps,
  coverage,
  lineExample,
} from '../model/example.js';
import './HomePage.css';

// Числове поле з межами: поки введене число неправильне, приклад лишається на попередньому.
function NumberField({ label, value, min, max, onChange }) {
  const [text, setText] = React.useState(String(value));
  const handleChange = (event) => {
    setText(event.target.value);
    const next = Number(event.target.value);
    if (Number.isInteger(next) && next >= min && next <= max) onChange(next);
  };
  return (
    <label className="try-field">
      {label}
      <input type="number" min={min} max={max} value={text} onChange={handleChange} />
    </label>
  );
}

// Узгоджує слово з числом: 1 доданок, 2 доданки, 5 доданків.
const plural = (count, one, few, many) => {
  const tens = count % 100;
  const units = count % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
};

function Flourish() {
  return (
    <div className="flourish" aria-hidden="true">
      <span />
    </div>
  );
}

// Вступ: що таке віртуальний скрол, дерево Фенвіка на прикладі з числами і де воно
// працює в кожному режимі. modes - режими сторінки з плитками, onOpen(value) відкриває режим.
export function HomePage({ modes, onOpen }) {
  const [row, setRow] = React.useState(7);
  const [position, setPosition] = React.useState(230);
  const offset = offsetSteps(exampleTree, row);
  const search = indexSteps(exampleTree, position);
  const grownCells = setSteps(exampleTree, 1);
  const labelOf = (value) => modes.find((mode) => mode.value === value).label;
  const openMode = (value) => (
    <button type="button" className="open-mode" onClick={() => onOpen(value)}>
      Відкрити режим &laquo;{labelOf(value)}&raquo;
    </button>
  );

  return (
    <article className="book">
      <header className="book-head">
        <p className="book-kicker">Вступ</p>
        <h1>Віртуальний скрол на дереві Фенвіка</h1>
        <p className="book-lead">
          Ця сторінка пояснює, як показати десять тисяч, а то й мільйон плиток різного розміру так, щоб браузер не
          сповільнювався, і що робить у цьому дерево Фенвіка.
        </p>
      </header>

      <section>
        <h2>Навіщо віртуальний скрол</h2>
        <p>
          Браузер тримає кожен елемент сторінки в пам&apos;яті і перераховує його розмір і місце, коли на сторінці
          щось змінюється. Усі ці елементи разом називаються <em>DOM</em>. Якщо покласти в DOM десять тисяч
          плиток, браузер отримає десять тисяч елементів, і кожна прокрутка змушує його працювати з усіма ними.
        </p>
        <p>
          Віртуальний скрол кладе в DOM лише плитки, які зараз видно у вікні, і ще кілька з кожного боку про
          запас. Решта плиток існує тільки як числа: розмір і місце. Коли вікно прокручують, компонент прибирає
          плитки, що виїхали з вікна, і додає ті, що заїхали.
        </p>
        <p>
          Це схоже на книжку на десять тисяч сторінок. Читач бачить лише розгорнуту сторінку. Але щоб розгорнути
          книжку на потрібному місці, треба знати, на якій сторінці починається кожен розділ.
        </p>
      </section>

      <Flourish />

      <section>
        <h2>Два питання, які скрол ставить щоразу</h2>
        <p>Щоб покласти видимі плитки на місце, компонент на кожній прокрутці питає дві речі:</p>
        <ol>
          <li>
            <strong>Де починається рядок i?</strong> Відповідь - сума висот усіх рядків перед ним.
          </li>
          <li>
            <strong>Який рядок стоїть на позиції x?</strong> Позиція - це відстань у пікселях від початку вмісту,
            наприклад та, до якої прокрутили вікно.
          </li>
        </ol>
        <p className="callout">
          Простий масив відповідає на ці питання дорого. Якщо зберігати висоти, то щоб знайти, де починається
          рядок 9000, треба скласти 9000 чисел. Якщо зберігати готові суми, відповідь миттєва, але коли один рядок
          змінює висоту, треба переписати всі суми після нього, до 10 000 записів. Дерево Фенвіка відповідає на
          обидва питання і змінює висоту за кілька кроків: для 10 000 рядків їх не більше 14.
        </p>
      </section>

      <Flourish />

      <section>
        <h2>Дерево Фенвіка на прикладі</h2>
        <p>
          Візьмемо вісім рядків. Їхні висоти лежать у масиві <code>sizes</code>, і в коді він нумерується з нуля:{' '}
          {exampleSizes.map((size, index) => `sizes[${index}] = ${size}`).join(', ')}. Дерево - це окремий масив{' '}
          <code>tree</code>, і його комірки нумеруються з одиниці: від <code>tree[1]</code> до{' '}
          <code>tree[{exampleSizes.length}]</code>. Кожна комірка зберігає суму кількох елементів{' '}
          <code>sizes</code>, що стоять поруч.
        </p>

        <h3>Як сума прив&apos;язана до індексу масиву</h3>
        <p>
          Які саме елементи додає комірка, каже двійковий запис її номера. <em>Найменший біт</em> числа - це
          найправіша одиниця в його двійковому записі: у числа 6, двійкове 110, найменший біт дорівнює 2. У коді
          його дає вираз <code>k &amp; -k</code>. Комірка <code>tree[k]</code> зберігає суму стількох елементів,
          скільки дорівнює найменший біт <code>k</code>, і ця сума закінчується на елементі{' '}
          <code>sizes[k - 1]</code>. Отже, комірка 6 додає два елементи: <code>sizes[4]</code> і{' '}
          <code>sizes[5]</code>.
        </p>
        <div className="bits-table" role="table">
          <div className="bits-row bits-head" role="row">
            <span role="columnheader">комірка</span>
            <span role="columnheader">двійково</span>
            <span role="columnheader">найменший біт</span>
            <span role="columnheader">елементи масиву</span>
            <span role="columnheader">сума</span>
          </div>
          {treeCells(exampleTree).map(({ k, bits, low, from, to, sum }) => (
            <div key={k} className="bits-row" role="row">
              <code role="cell">tree[{k}]</code>
              <code role="cell">{bits}</code>
              <span role="cell">{low}</span>
              <code role="cell">{from === to ? `sizes[${to}]` : `sizes[${from}] .. sizes[${to}]`}</code>
              <span role="cell" className="bits-sum">{sum}</span>
            </div>
          ))}
        </div>
        <p>
          Чому комірки рахуються з одиниці, а масив з нуля? Кожен крок дерева рухається на найменший біт номера.
          У нуля немає жодної одиниці, тож <code>0 &amp; -0</code> дорівнює 0, і крок з нуля стояв би на місці
          вічно. Тому дерево зсуває нумерацію на одиницю: елемент <code>sizes[i]</code> вперше потрапляє в
          комірку <code>tree[i + 1]</code>.
        </p>

        <h3>Де починається рядок: сума перших елементів</h3>
        <p>
          Рядок <code>i</code> починається там, де закінчуються всі рядки перед ним. Отже, його початок - це
          сума перших <code>i</code> елементів: <code>sizes[0] + ... + sizes[i - 1]</code>. Дерево починає з
          комірки <code>k = i</code>: вона покриває елементи, що закінчуються на <code>sizes[i - 1]</code>.
          Потім номер зменшується на свій найменший біт, і наступна комірка покриває елементи одразу перед уже
          покритими. Коли номер стає нулем, кожен елемент від <code>sizes[0]</code> до{' '}
          <code>sizes[i - 1]</code> покрито рівно один раз. Спробуйте інший рядок:
        </p>
        <NumberField label="Рядок i" value={row} min={0} max={exampleSizes.length} onChange={setRow} />
        <div className="strip" aria-label="Які елементи масиву покриває кожен крок">
          {coverage(exampleTree, row).map((step, index) => (
            <div key={index} className={step < 0 ? 'strip-cell strip-out' : `strip-cell strip-step-${step}`}>
              <code>sizes[{index}]</code>
              <span>{exampleSizes[index]}</span>
            </div>
          ))}
        </div>
        <ol className="steps">
          {offset.steps.map(({ k, bits, value, from, to }, step) => (
            <li key={k}>
              <span className={`strip-mark strip-step-${step}`} /> Крок {step + 1}: <code>k = {k}</code> ({bits}),{' '}
              <code>tree[{k}]</code> = {from === to ? `sizes[${to}]` : `sizes[${from}] + ... + sizes[${to}]`} ={' '}
              {value}. Далі <code>k = {k} - {k & -k} = {k - (k & -k)}</code>.
            </li>
          ))}
        </ol>
        <p className="callout">
          {offset.steps.length === 0
            ? 'Рядок 0 починається з нуля: перед ним нічого немає, і сума порожня.'
            : `${offset.steps.map(({ k, value }) => `tree[${k}] = ${value}`).join(' + ')}; разом ${offset.total}. ` +
              `Рядок ${row} починається з ${offset.total} px, і для цього знадобилося ${offset.steps.length} ` +
              `${plural(offset.steps.length, 'доданок', 'доданки', 'доданків')} замість ${row}.`}
        </p>

        <h3>Який рядок стоїть на позиції</h3>
        <p>
          Дерево пробує стрибати вперед кроками 8, 4, 2 і 1. Стрибок вдається, коли сума в комірці, куди ми
          стрибаємо, не більша за відстань, що ще лишилася до позиції. Після всіх кроків ми стоїмо за останнім
          рядком, який повністю вмістився перед позицією.
        </p>
        <NumberField label="Позиція, px" value={position} min={0} max={exampleTree.total() - 1} onChange={setPosition} />
        <ol className="steps">
          {search.steps.map(({ step, next, value, jumped, restBefore }) => (
            <li key={step} className={jumped ? 'step-yes' : 'step-no'}>
              Крок {step}:{' '}
              {value === null
                ? `комірки ${next} немає, не стрибаємо.`
                : jumped
                  ? `tree[${next}] = ${value} не більше за ${restBefore}, стрибаємо; лишається ${restBefore - value}.`
                  : `tree[${next}] = ${value} більше за ${restBefore}, не стрибаємо.`}
            </li>
          ))}
        </ol>
        <p className="callout">
          На позиції {position} px стоїть рядок {search.index}, тобто елемент <code>sizes[{search.index}]</code>.
          Він займає{' '}
          {exampleTree.offsetOf(search.index)}..{exampleTree.offsetOf(search.index + 1) - 1} px.
        </p>

        <h3>Рядок змінив висоту</h3>
        <p>
          Коли <code>sizes[1]</code> виростає на 30 px, різниця додається лише до комірок, чия сума містить цей
          елемент. Дерево починає з комірки <code>1 + 1 = 2</code>, бо нумерація зсунута на одиницю, і щоразу
          додає до номера його найменший біт:{' '}
          {grownCells.map(({ k, bits }) => `tree[${k}] (${bits})`).join(' → ')}. Це {grownCells.length}{' '}
          {plural(grownCells.length, 'запис', 'записи', 'записів')} замість семи: рядки нижче зсуваються самі, бо
          їхні початки рахуються з цих комірок.
        </p>
      </section>

      <Flourish />

      <section>
        <h2>Як дерево працює в нашому проєкті</h2>

        <h3>Вертикально і горизонтально</h3>
        <p>
          Тут два дерева. <em>Дерево ширин плиток</em> ламає плитки на рядки. Воно вміє сказати, скільки плиток
          від самого початку вміщаються до заданої позиції. Межа рядка - це початок його першої плитки плюс
          довжина рядка. Ось як дерево ламає плитки шириною {lineExample.widths.join(', ')} на рядки довжиною{' '}
          {lineExample.lineLength}:
        </p>
        <ol className="steps">
          {lineExample.lines.map(({ start, limit, fit, items }) => (
            <li key={start}>
              Рядок з плитки {start}: межа {limit}, до неї вміщаються перші {fit} плитки, тож у рядку{' '}
              {items.length === 1 && fit <= start ? `плитка ${items[0]} сама: вона ширша за рядок` : `плитки ${items.join(', ')}`}.
            </li>
          ))}
        </ol>
        <p>
          <em>Дерево висот рядків</em> обслуговує скрол. Воно знаходить перший і останній рядок у вікні, дає
          місце першого з них і повну довжину вмісту для смуги прокрутки. Воно ж тримає якір: коли рядок над вікном
          змінює висоту, вікно зсувається на ту саму відстань, і вміст не стрибає.
        </p>
        {openMode('vertical')}

        <h3>Скомбіновано і Мозаїка 3000 px</h3>
        <p>
          У мозаїці плитка притискається вгору і вліво, тож її місце вже не сума висот рядків. Дерево ширин тут
          лише ламає плитки на рядки і дає кожній стартове місце. Вгору плитку піднімає <em>дерево відрізків</em>:
          воно знає найнижчий край плиток над будь-якою смугою, а це найбільше значення, а не сума, тож дерево
          Фенвіка тут не допоможе. Видимі плитки знаходить двійковий пошук.
        </p>
        {openMode('combined')}

        <h3>Таблиця</h3>
        <p>
          Таблиця 1000 x 1000 - це мільйон клітинок, але розмір клітинки визначають її рядок і колонка. Тому
          досить двох дерев по тисячі чисел: висоти рядків і ширини колонок. Щоб знайти видимі клітинки в будь-якому
          місці таблиці, треба чотири пошуки по десять кроків. Клацання по плитці збільшує її рядок і колонку,
          і кожна зміна - один запис у дерево.
        </p>
        {openMode('table')}
      </section>

      <Flourish />

      <section>
        <h2>Перевір себе</h2>
        <details>
          <summary>Чому в мозаїці не можна знайти видимі плитки через дерево висот рядків?</summary>
          <p>
            Бо верх плитки в мозаїці не дорівнює сумі висот рядків над ним: плитка піднімається в дірки під
            сусідами. Сума висот рядків покаже не те місце, де плитки справді лежать.
          </p>
        </details>
        <details>
          <summary>Що коштує дорожче: плитка стала вищою чи ширшою?</summary>
          <p>
            Ширшою. Від ширин залежить, де ламаються рядки, тому рядки перераховуються від попереднього до кінця.
            Висота змінює лише свій рядок, і дерево висот оновлює одну комірку на кожному рівні.
          </p>
        </details>
        <details>
          <summary>Скільки комірок змінить дерево з 1000 рядків, коли рядок 0 змінить висоту?</summary>
          <p>
            Десять: комірки 1, 2, 4, 8, 16, 32, 64, 128, 256 і 512. Кожен крок додає до номера його найменший біт,
            а 1024 вже більше за 1000.
          </p>
        </details>
      </section>
    </article>
  );
}
