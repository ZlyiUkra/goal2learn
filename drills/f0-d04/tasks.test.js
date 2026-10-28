// Приклади для tasks.js. Задачі для прикладів — TASK_A, TASK_B, TASK_C з data.js (їхні due і
// hours видно там); вираховуйте очікуване на папері, не запускаючи функцію.
import { test } from "node:test";
import assert from "node:assert";
import { sortByDue, totalHours, filterByTitle, onlyOpen } from "./tasks.js";
import { TASK_A, TASK_B, TASK_C } from "./data.js";

//  щонайменше по два приклади для sortByDue, totalHours і filterByTitle, кожен —
// test("ім'я: ...", ...). Серед них — крайній випадок: порожній масив.

test("sortByDue: TASK_A, TASK_B, TASK_C", () => {
  assert.deepStrictEqual(sortByDue([TASK_A, TASK_B, TASK_C]), [TASK_B, TASK_C, TASK_A]);
});

test("sortByDue: порожній масив", () => {
  assert.deepStrictEqual(sortByDue([]), []);
});

test("totalHours: TASK_A, TASK_B, TASK_C", () => {
  assert.deepStrictEqual(totalHours([TASK_A, TASK_B, TASK_C]), 6);
});

test("totalHours: порожній масив", () => {
  assert.deepStrictEqual(totalHours([]), 0);
});

test("filterByTitle: TASK_A, TASK_B, TASK_C, pattern 'Задача ?'", () => {
  assert.deepStrictEqual(filterByTitle([TASK_A, TASK_B, TASK_C], "Задача ?"), [TASK_A, TASK_B, TASK_C]);
});

test("filterByTitle: TASK_A, TASK_B, TASK_C, pattern 'Задача {1,2}'", () => {
  assert.deepStrictEqual(filterByTitle([TASK_A, TASK_B, TASK_C], "Задача {1,2}"), [TASK_A, TASK_B]);
});

test("onlyOpen: TASK_A, TASK_B, TASK_C", () => {
  assert.deepStrictEqual(onlyOpen([TASK_A, TASK_B, TASK_C]), [TASK_B, TASK_C]);
});

test("onlyOpen: порожній масив", () => {
  assert.deepStrictEqual(onlyOpen([]), []);
});