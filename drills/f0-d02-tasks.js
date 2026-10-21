"use strict";
// Рядок вище вмикає «суворий режим». У ньому спроба змінити заморожений об'єкт кидає TypeError, а без
// нього Node мовчки пропускає таку зміну, і перевірки нічого не помітять. Не видаляйте його.
const assert = require("node:assert");

// Крок 1 (вже зроблено за вас). Задачі вигадані: makeTasks(count) повертає масив із count об'єктів-задач.
// Кожна задача має п'ять полів:
//   id    — номер задачі;
//   title — назва, наприклад "Задача 7";
//   done  — чи виконана (true або false);
//   due   — крайній термін, рядок "РРРР-ММ-ДД", наприклад "2026-02-07". Такі рядки можна порівнювати
//           звичайними < і >: рядок з раннішою датою стоїть раніше, тож окремо перетворювати їх на Date не треба;
//   hours — скільки годин займе задача (від 1 до 5).
// Терміни навмисно розкидані, а не йдуть по порядку: задача 2 має 7 лютого, задача 3 — 16 березня тощо.
function makeTasks(count) {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const day = (i * 37) % 365;
    tasks.push({
      id: i + 1,
      title: "Задача " + (i + 1),
      done: i % 3 === 0,
      due: new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10),
      hours: (i % 5) + 1,
    });
  }
  return tasks;
}

// Крок 2. «Заморозити» дані: після цього будь-яка спроба їх змінити кидає TypeError.
// Заморозьте сам масив tasks І кожну задачу в ньому, поверніть той самий масив.
// Підказка: Object.freeze(x) заморожує лише сам x, а не те, що в ньому лежить.
function freezeAll(tasks) {
  Object.freeze(tasks);
  for (const task of tasks) {
    Object.freeze(task);
  }
  return tasks;
}
// Крок 3а. Лише незавершені задачі (done === false). Результат — новий масив.
function onlyOpen(tasks) {
    return tasks.filter((task) => task.done === false);
}

// Крок 3б. Усі задачі, впорядковані за полем due від раннього терміну до пізнього. Результат — новий масив.
// Підказка: sort() змінює сам масив, тож його не можна викликати на tasks напряму. Є toSorted (новий масив)
// або спершу зробити копію масиву.
function sortByDue(tasks) {
    // tasks.toSorted((a, b) => a.due.localeCompare(b.due));
    return [...tasks].sort((a, b) => a.due.localeCompare(b.due));
}

// Крок 3в. Перейменувати поле: у кожній задачі title стає text, решта полів лишається. Результат — новий масив
// НОВИХ об'єктів (старі заморожені, їх змінювати не можна).
function renameTitleToText(tasks) {
    return tasks.map((task) => {
        const { title, ...rest } = task;
        return { ...rest, text: title };
    });
}

// Крок 3г. Сума годин (поле hours) усіх задач із масиву. Для порожнього масиву — 0.
function totalHours(tasks) {
    return tasks.reduce((sum, task) => sum + task.hours, 0);
}


// ── Перевірки (нічого не змінюйте нижче цього рядка) ──
// Запускає перетворення над замороженими даними. Якщо воно кинуло TypeError — пише, яка саме функція.
function run(name, transform) {
  try {
    return transform();
  } catch (error) {
    if (error instanceof TypeError) {
      assert.fail(
        `${name} кинула TypeError: «${error.message}». Якщо там є «read only», «not extensible» або ` +
          `«Cannot delete» — функція намагалася змінити заморожені дані; їй треба повертати нове.`
      );
    }
    throw error;
  }
}

const tasks = makeTasks(1000);
assert.strictEqual(tasks.length, 1000, "makeTasks(1000) має дати 1000 задач");

// Крок 2
freezeAll(tasks);
assert.ok(Object.isFrozen(tasks), "сам масив tasks має бути замороженим");
assert.ok(
  tasks.every((task) => Object.isFrozen(task)),
  "кожна задача в масиві теж має бути замороженою: Object.freeze(масив) елементи сам не заморожує"
);

// Контрольні спроби: заморожене справді захищається (і саме TypeError, бо вгорі файлу є "use strict").
assert.throws(() => tasks.push({}), TypeError, "tasks.push({}) мав кинути TypeError: масив не заморожений");
assert.throws(
  () => {
    tasks[0].done = false;
  },
  TypeError,
  "tasks[0].done = false мав кинути TypeError: або задачі не заморожені, або з файлу зник рядок \"use strict\""
);

// Крок 3а
const open = run("onlyOpen", () => onlyOpen(tasks));
assert.ok(Array.isArray(open), "onlyOpen має повернути масив");
assert.strictEqual(
  open.length,
  666,
  `серед 1000 задач незавершених (done === false) має бути 666, а в результаті ${open.length}`
);
assert.ok(
  open.every((task) => task.done === false),
  "у результаті onlyOpen є завершені задачі"
);

// Крок 3б
const byDue = run("sortByDue", () => sortByDue(tasks));
assert.ok(Array.isArray(byDue), "sortByDue має повернути масив");
assert.strictEqual(byDue.length, 1000, `після сортування має лишитися 1000 задач, а лишилось ${byDue.length}`);
// notStrictEqual перевіряє посилання: byDue і tasks мають бути РІЗНИМИ масивами. sort() же повертає ТОЙ САМИЙ.
assert.notStrictEqual(byDue, tasks, "sortByDue має повернути НОВИЙ масив, а не той самий tasks");
for (let i = 1; i < byDue.length; i++) {
  assert.ok(
    byDue[i - 1].due <= byDue[i].due,
    `задачі на позиціях ${i - 1} і ${i} стоять не за датою: ${byDue[i - 1].due} і ${byDue[i].due}`
  );
}
assert.strictEqual(byDue[0].due, "2026-01-01", "перша задача має мати найраніший термін 2026-01-01");
assert.strictEqual(byDue[999].due, "2026-12-31", "остання задача має мати найпізніший термін 2026-12-31");
assert.strictEqual(new Set(byDue.map((task) => task.id)).size, 1000, "після сортування задачі загубилися");
assert.strictEqual(tasks[1].due, "2026-02-07", "початковий масив tasks не мав змінити порядок");

// Крок 3в
const renamed = run("renameTitleToText", () => renameTitleToText(tasks));
assert.ok(Array.isArray(renamed), "renameTitleToText має повернути масив");
assert.strictEqual(renamed.length, 1000, "після перейменування має лишитися 1000 задач");
// deepStrictEqual порівнює ВМІСТ об'єктів: має бути рівно ці п'ять полів, а title — зникнути (а не стати undefined).
assert.deepStrictEqual(
  renamed[0],
  { id: 1, text: "Задача 1", done: true, due: "2026-01-01", hours: 1 },
  "перша задача має бути { id: 1, text: 'Задача 1', done: true, due: '2026-01-01', hours: 1 }, без поля title"
);
assert.notStrictEqual(renamed[0], tasks[0], "у масиві мають бути нові об'єкти, а не ті самі задачі");
assert.strictEqual(tasks[0].title, "Задача 1", "у вихідній задачі поле title мало лишитися");

// Крок 3г
const total = run("totalHours", () => totalHours(tasks));
assert.strictEqual(
  total,
  3000,
  `сума hours усіх 1000 задач має бути 3000 (200 разів по 1+2+3+4+5), а функція повернула ${String(total).slice(0, 40)}`
);
assert.strictEqual(totalHours(open), 1998, "сума hours 666 незавершених задач має бути 1998");
assert.strictEqual(totalHours([]), 0, "для порожнього масиву сума має бути 0 (reduce потребує початкового значення)");
// Усі перетворення разом: кожне повертає масив, тож їх можна вставляти одне в одне.
assert.strictEqual(
  run("ланцюжок", () => totalHours(sortByDue(onlyOpen(tasks)))),
  1998,
  "totalHours(sortByDue(onlyOpen(tasks))) має дати 1998"
);

// Пастка з плану: sort() змінює сам масив і повертає ТОЙ САМИЙ масив, а не новий.
const plain = [3, 1, 2];
const sortedPlain = plain.sort();
assert.strictEqual(sortedPlain, plain); // повернувся той самий масив
assert.deepStrictEqual(plain, [1, 2, 3]); // і сам масив, який передали, уже відсортований
// На замороженому масиві така зміна перетворюється на TypeError (навіть у режимі без "use strict")
assert.throws(() => tasks.sort(), TypeError);
assert.throws(() => tasks.reverse(), TypeError);
// Пастка заморожування: Object.freeze(масив) НЕ заморожує елементи, і зміна елемента проходить
const onlyArrayFrozen = Object.freeze([{ n: 1 }]);
onlyArrayFrozen[0].n = 2;
assert.strictEqual(onlyArrayFrozen[0].n, 2);

console.log(`Незавершених задач: ${open.length}, їхніх годин: ${totalHours(open)}`);
console.log("Усі перевірки пройдені");
