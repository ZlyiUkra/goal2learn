const assert = require("node:assert");


// Три слова, які зустрічаються далі:
//  • замикання — функція, яка пам'ятає змінні з місця, де її створили, і бачить їх, навіть коли викликана пізніше;
//  • setTimeout(f, ms) — не зупиняє програму, а лише просить: «викличи f приблизно через ms мілісекунд»; увесь
//    поточний код при цьому спершу доходить до кінця, а f викликається потім;
//  • show — функція, яку вам передадуть перевірки. Вона нічого не вигадує: лише записує число, з яким її викликали.
//    У справжній кнопці на її місці був би alert або console.log.


// Крок 1. Лічильник на замиканні.
// makeCounter() повертає функцію. Кожен виклик цієї функції дає наступне число: 1, потім 2, потім 3 і так далі.
// Число зберігайте у змінній всередині makeCounter, не поза нею: тоді кожен лічильник, створений окремим викликом
// makeCounter(), матиме свою змінну й не залежатиме від інших.
function makeCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}

// Крок 2а. «Кнопка» зі спільною змінною. Кнопки тут немає: «натиснути» означає поставити таймер.
// Функція робить по порядку: оголошує змінну count зі значенням 0 (через let); ставить таймер, який через delayMs
// викличе show(count); і не чекаючи таймера тричі змінює count: спершу на 1, потім на 2, потім на 3.
// (У плані затримка три секунди; ми беремо коротшу, щоб не чекати, delayMs передають перевірки.)
function sharedCountDemo(show, delayMs) {
  let count = 0;
  setTimeout(() => show(count), delayMs);
  count += 1;
  count += 1;
  count += 1;
}

// Крок 2б. Те саме, але «як у React»: кожен «рендер» має власну змінну count.
// У React компонент — це функція, яку викликають заново на кожне оновлення, і кожен виклик має свою змінну count.
// Тут «рендер» — це один виклик makeSnapshotHandler(count, show, delayMs). Він повертає функцію-обробник; коли
// обробник викликають («клік»), він ставить таймер, який через delayMs викличе show(count) із тим count, з яким
// створено обробник.
function makeSnapshotHandler(count, show, delayMs) {
  return function(){
    setTimeout(() => show(count), delayMs);
  }
}

// Крок 3а. Цикл із var. Лічильник циклу оголошено через var (i = 0, 1, 2: три проходи). На кожному проході
// поставте таймер із затримкою 0, який викличе show(i).
function loopWithVar(show) {
  for (var i = 0; i < 3; i++) {
    setTimeout(() => show(i), 0);
  }
}

// Крок 3б. Те саме, але лічильник циклу оголошено через let.
function loopWithLet(show) {
  for (let i = 0; i < 3; i++) {
    setTimeout(() => show(i), 0);
  }
}
// ── Перевірки (нічого не змінюйте нижче цього рядка) ──
// Крок 1
const counterA = makeCounter();
assert.strictEqual(typeof counterA, "function", "makeCounter() має повернути функцію");
assert.strictEqual(counterA(), 1, "перший виклик лічильника має дати 1");
assert.strictEqual(counterA(), 2, "другий виклик лічильника має дати 2");
assert.strictEqual(counterA(), 3, "третій виклик лічильника має дати 3");
const counterB = makeCounter();
// Другий лічильник починає з 1, бо в нього своя змінна. Якщо число лежить поза makeCounter, лічильники ділять його.
assert.strictEqual(counterB(), 1, "новий лічильник має починати з 1: у кожного makeCounter() своя змінна");
assert.strictEqual(counterA(), 4, "лічильник A не мав зачепити лічильник B і має дати 4");

// Кроки 2 і 3: запускаємо всі чотири досліди й збираємо, що показали таймери.
// recorder(list) повертає функцію show, яка дописує в list кожне число, з яким її викликали.
const recorder = (list) => (value) => {
  list.push(value);
};
const shownShared = [];
const shownSnapshot = [];
const shownVar = [];
const shownLet = [];

sharedCountDemo(recorder(shownShared), 20);

// Чотири «рендери» з count = 0, 1, 2 і 3: кожен виклик makeSnapshotHandler повертає свій обробник.
// «Клікаємо» по всіх чотирьох: кожен має показати count свого рендеру.
const handlers = [0, 1, 2, 3].map((count) => makeSnapshotHandler(count, recorder(shownSnapshot), 20));
assert.strictEqual(typeof handlers[0], "function", "makeSnapshotHandler має повернути функцію-обробник");
handlers.forEach((handler) => handler());

loopWithVar(recorder(shownVar));
loopWithLet(recorder(shownLet));

// Поки код не дійшов до кінця, жоден таймер ще не спрацював, тож show ніхто не мав викликати.
assert.deepStrictEqual(
  [shownShared, shownSnapshot, shownVar, shownLet],
  [[], [], [], []],
  "show не має викликатися одразу: його викликає таймер, коли код уже дійшов до кінця"
);

// Таймери спрацюють пізніше. Цей останній таймер (100 мс) спрацює після всіх інших, тут і порівнюємо.
setTimeout(() => {
  console.log("sharedCountDemo показав:", shownShared);
  console.log("обробники чотирьох рендерів показали:", shownSnapshot);
  console.log("цикл із var показав:", shownVar);
  console.log("цикл із let показав:", shownLet);

  // Чи правильно написані функції (assert.deepStrictEqual порівнює вміст масивів).
  assert.deepStrictEqual(
    shownShared,
    [3],
    `sharedCountDemo: таймер мав показати одне число 3 (значення count на мить спрацювання), а показав ${JSON.stringify(shownShared)}`
  );
  assert.deepStrictEqual(
    shownSnapshot,
    [0, 1, 2, 3],
    `makeSnapshotHandler: кожен обробник мав показати count свого рендеру, [0, 1, 2, 3], а показали ${JSON.stringify(shownSnapshot)}`
  );
  assert.deepStrictEqual(
    shownVar,
    [3, 3, 3],
    `loopWithVar: з лічильником var і таймерами 0 мс мало вийти [3, 3, 3], а вийшло ${JSON.stringify(shownVar)}`
  );
  assert.deepStrictEqual(
    shownLet,
    [0, 1, 2],
    `loopWithLet: з лічильником let і таймерами 0 мс мало вийти [0, 1, 2], а вийшло ${JSON.stringify(shownLet)}`
  );

  console.log("Усі перевірки пройдені");
}, 100);