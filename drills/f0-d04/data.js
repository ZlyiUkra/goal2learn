// Крок рецепта «Опис даних» (ідея з htdp.org, 3.1 Designing Functions). Опис даних — це
// коментар: як інформацію з життя записано даними JavaScript і як ці дані читати назад.
// Модуль віддає ПРИКЛАДИ даних: з них складаються приклади-тести у файлах *.test.js.
//
// Запис сигнатур у цьому дні (у дні 9 він стане типами TypeScript):
//   number, string, boolean   — типи значень, як їх показує typeof;
//   any                       — будь-яке значення;
//   Task, User, Counter       — описи даних нижче;
//   Task[]                    — масив, кожен елемент якого Task;
//   Task[], number -> Task[]  — функція: бере масив задач і число, повертає масив задач;
//   -> Counter                — функція без аргументів, що повертає Counter.

// Task — задача зі списку справ, об'єкт { id, title, done, due, hours }:
//   id    — number, номер задачі: 1, 2, 3, ...;
//   title — string, назва, наприклад "Задача 7";
//   done  — boolean, true, якщо задачу виконано;
//   due   — string "РРРР-ММ-ДД", крайній термін; такі рядки порівнюються як дати;
//   hours — number, скільки годин займе, від 1 до 5.
// Приклади заморожено (Object.freeze, день 2): функція, що спробує змінити вхідну задачу,
// впаде на прикладі з TypeError.
export const TASK_A = Object.freeze({ id: 1, title: "Задача 1", done: true, due: "2026-03-10", hours: 2 });
export const TASK_B = Object.freeze({ id: 2, title: "Задача 2", done: false, due: "2026-01-05", hours: 3 });
export const TASK_C = Object.freeze({ id: 3, title: "Задача 3", done: false, due: "2026-02-20", hours: 1 });

// User — користувач, об'єкт { name, address }.
//   name    — string, ім'я користувача;
//   address — об'єкт { city }, де city — string, місто користувача.
export const USER_OLYA = Object.freeze({ name: "Оля", address: Object.freeze({ city: "Київ" }) });

// Counter — функція без аргументів; кожен її виклик повертає наступне ціле число: 1, 2, 3, ...
// Приклад цього типу не записати значенням: його дає виклик makeCounter() із closures.js.