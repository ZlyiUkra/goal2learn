// Крок рецепта «Приклади» (htdp.org, 3.1 Designing Functions): ще до тіла функції візьміть по
// значенню кожного типу з її сигнатури і САМІ вирахуйте, що має повернутися. Так записані
// приклади й стають тестами. Запуск усіх файлів *.test.js у теці: node --test
// test("ім'я: що перевіряємо", () => { ... }) — один приклад; node index.js рахує приклади за
// назвою, тому назва починається з імені функції і двокрапки.
// assert.deepStrictEqual порівнює масиви й об'єкти за вмістом (=== порівнює посилання, день 1).
import { test } from "node:test";
import assert from "node:assert";
import { addItem, moveUser } from "./lists.js";
import { USER_OLYA } from "./data.js";

test("addItem: до порожнього масиву", () => {
  assert.deepStrictEqual(addItem([], 1), [1]);
});

test("addItem: у кінець, а вхідний масив той самий", () => {
  const list = [1, 2];
  assert.deepStrictEqual(addItem(list, 3), [1, 2, 3]);
  assert.deepStrictEqual(list, [1, 2]);
});

//  щонайменше два приклади moveUser на USER_OLYA. Що має бути в address.city результату?
// А в USER_OLYA після виклику?

test("moveUser: нове місто", () => {
    const newCity = "Львів";
    const newUser = moveUser(USER_OLYA, newCity);
    assert.deepStrictEqual(newUser.address.city, newCity);
})

test("moveUser: USER_OLYA не змінюється", () => {
    const newCity = "Одеса";
    const newUser = moveUser(USER_OLYA, newCity);
    assert.deepStrictEqual(USER_OLYA.address.city, "Київ");
})