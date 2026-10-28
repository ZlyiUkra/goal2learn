// День 1, функції з drills/f0-d01-tasks.js, тепер спроєктовані за рецептом книжки How to Design
// Programs (htdp.org, 3.1 Designing Functions). Над кожною функцією:
//   сигнатура   — рядок «що бере -> що повертає» у нотації з data.js;
//   призначення — одне речення: що функція обчислює.
// Під ними заголовок, export function з параметрами. Поки тіла немає, у ньому ЗАГЛУШКА: return
// будь-якого значення потрібного типу, щоб приклади-тести вже запускалися (і падали).
// addItem пройдено всіма кроками як зразок; moveUser — ваша.

// any[], any -> any[]
// Новий масив: усі елементи list, а за ними item; list не змінюється.
export function addItem(list, item) {
  // Інвентар: list — масив (може бути порожнім), item — будь-яке значення.
  // Заглушка була: return [];
  return [...list, item];
}

// Завдання: повернути НОВОГО користувача з містом newCity в address.city; вхідний user не змінювати.
// User, string -> User
// Призначення: повернути нового користувача з містом newCity в address.city; вхідний user не змінювати.
export function moveUser(user, newCity) {
  // Інвентар: user — об'єкт користувача, newCity — рядок.
  // Заглушка була: return {};
  return {
    ...user,
    address: {
      ...user.address,
      city: newCity
    }
  };
}