const assert = require("node:assert");

// Крок 1. Додати елемент у масив, не змінюючи вхідний масив.
// addItem([1, 2], 3) має повернути [1, 2, 3], а вхідний [1, 2] лишитися [1, 2].
function addItem(list, item) {
  return [...list, item];
}

// Крок 2. 
const a = {n: 1};
const b = {n: 1};

const c = a;
// 1)
console.log(1, a === b); // false
// 2)
console.log(2, a === c); // true
// 3) 
console.log(3, ({...a}) === a); // false
// 4)
console.log(4, [1,2] === [1,2]); // false
// 5)
console.log(5, 1 === 1); // true

// Крок 3. Повернути НОВОГО користувача з новим містом, не змінюючи вхідного.
// Підказка: треба розгорнути два рівні: сам user і вкладений user.address.
function moveUser(user, newCity) {
    const copy = structuredClone(user);
    copy.address.city = newCity;
    return copy;
}

// ── Перевірки (нічого не змінюйте нижче цього рядка) ──
const list = [1, 2];
const result = addItem(list, 3);
// deepStrictEqual порівнює ВМІСТ масивів. Звичайне === для двох різних масивів завжди дає
// false, навіть коли вміст однаковий, бо порівнює посилання, а не вміст.
assert.deepStrictEqual(result, [1, 2, 3], "addItem має повернути [1, 2, 3]");
assert.deepStrictEqual(list, [1, 2], "вхідний масив не мав змінитися");
// notStrictEqual перевіряє посилання: result і list мають бути РІЗНИМИ масивами.
assert.notStrictEqual(result, list, "має бути НОВИЙ масив, а не той самий");

const user = { name: "Оля", address: { city: "Київ" } };
const moved = moveUser(user, "Львів");
assert.strictEqual(moved.address.city, "Львів", "у новому об'єкті місто має бути Львів");
assert.strictEqual(user.address.city, "Київ", "оригінал не мав змінитися");
assert.notStrictEqual(moved.address, user.address, "address має бути новим об'єктом");
assert.strictEqual(moved.name, "Оля", "решта полів має лишитися");

// Крок 4, пастка: проста копія { ...user } ділить address з оригіналом
const shallow = { ...user };
assert.notStrictEqual(shallow, user);              // сам об'єкт новий
assert.strictEqual(shallow.address, user.address); // а address той самий
shallow.address.city = "Одеса";
assert.strictEqual(user.address.city, "Одеса");    // зміна «копії» зачепила оригінал



console.log("Усі перевірки пройдені");