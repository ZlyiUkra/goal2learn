// Приклади для closures.js. Приклад типу Counter — це виклик makeCounter(), а очікуване —
// числа, які повертатимуть його виклики.
import { test } from "node:test";
import assert from "node:assert";
import makeCounter from "./closures.js";

// щонайменше два приклади makeCounter, кожен — test("makeCounter: ...", ...). Один із них:
// два лічильники, створені окремо, не заважають один одному.

test("makeCounter: два лічильники, створені окремо, не заважають один одному", () => {
    const counter1 = makeCounter();
    const counter2 = makeCounter();
    assert.strictEqual(counter1(), 1);
    assert.strictEqual(counter1(), 2);
    assert.strictEqual(counter2(), 1);
    assert.strictEqual(counter2(), 2);
});

test("makeCounter: три виклики одного лічильника", () => {
    const counter = makeCounter();
    assert.strictEqual(counter(), 1);
    assert.strictEqual(counter(), 2);
    assert.strictEqual(counter(), 3);
});