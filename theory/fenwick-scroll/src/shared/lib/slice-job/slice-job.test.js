// Перевірки роботи частинами. Запуск: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sliceJob } from './slice-job.js';

// Node обробляє повідомлення MessageChannel підряд, тому тут шматки плануються через setTimeout.
const timeoutScheduler = () => ({ next: (run) => setTimeout(run, 0), close() {} });
const options = { sliceMs: 1, scheduler: timeoutScheduler };

// Генератор, що робить count кроків і записує, скільки встиг.
const counter = (count, log) =>
  function* steps() {
    for (let i = 0; i < count; i += 1) {
      log.done = i + 1;
      yield;
    }
  };

test('робота доходить до кінця, і приходить onDone', async () => {
  const log = { done: 0 };
  await new Promise((resolve) => sliceJob(counter(100_000, log), options).subscribe(resolve));
  assert.equal(log.done, 100_000);
});

test('між шматками інші задачі встигають виконатися', async () => {
  const log = { done: 0 };
  let finished = false;
  sliceJob(counter(3_000_000, log), options).subscribe(() => {
    finished = true;
  });
  // Якби робота йшла одним шматком, цей таймер спрацював би лише після її кінця.
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(finished, false);
  assert.ok(log.done > 0, 'робота вже почалась');
  await new Promise(function wait(resolve) {
    if (finished) resolve();
    else setTimeout(() => wait(resolve), 5);
  });
  assert.equal(log.done, 3_000_000);
});

test('відписка зупиняє роботу, і onDone не приходить', async () => {
  const log = { done: 0 };
  let finished = false;
  const unsubscribe = sliceJob(counter(10_000_000, log), options).subscribe(() => {
    finished = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  unsubscribe();
  const stoppedAt = log.done;
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(finished, false);
  assert.equal(log.done, stoppedAt);
  assert.ok(stoppedAt < 10_000_000);
});
