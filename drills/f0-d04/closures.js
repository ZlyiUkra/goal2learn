// День 3, функції з drills/f0-d03-closures.js за рецептом. У цьому файлі і ТИПОВИЙ експорт, і
// іменовані. export default робить функцію головною річчю файлу: index.js імпортує її БЕЗ
// фігурних дужок (import makeCounter from "./closures.js"), і ім'я при імпорті можна обрати будь-яке.

// Завдання: повернути новий лічильник (опис Counter у data.js); лічильники з окремих викликів
// makeCounter() рахують незалежно (замикання).
// -> Counter
// Призначення: повернути новий лічильник.
export default function makeCounter() {
    // Інвентар: немає.
    // Заглушка була: return () => 0;
    let count = 0;
    return function () {
        return ++count;
    };
}

// Перенесіть сюди зі свого файлу дня 3 ще чотири функції, кожну з export (без default) перед
// function: sharedCountDemo, makeSnapshotHandler, loopWithVar, loopWithLet. Над кожною —
// сигнатура й призначення, як у tasks.js.

// Завдання: «кнопка» зі спільною змінною count; «натиснути» означає поставити таймер, який через delayMs
// sharedCountDemo викличе show(count); count змінюється тричі, але таймер бачить його лише після всіх змін. 
// function, number -> void
export function sharedCountDemo(show, delayMs) {
    let count = 0;
    setTimeout(() => show(count), delayMs);
    count += 1;
    count += 1;
    count += 1;
}

// Завдання: «кнопка» з «рендером» (замиканням) count; «натиснути» означає поставити таймер, який через delayMs
// викличе show(count) із тим count, з яким створено обробник. Кожен «рендер» має власну змінну count.
// number, function, number -> function
// Призначення: повернути функцію-обробник, яка при виклику ставить таймер, що через delayMs викликає show(count).
export function makeSnapshotHandler(count, show, delayMs) {
    return function () {
        setTimeout(() => show(count), delayMs);
    };
}

// Завдання: цикл із var; на кожному проході поставити таймер із затримкою 0, який викличе show(i).
// function -> void
// Призначення: поставити три таймери, які викличуть show(i) для i = 0, 1, 2; через var усі таймери бачать
export function loopWithVar(show) {
    for (var i = 0; i < 3; i++) {
        setTimeout(() => show(i), 0);
    }
}

// Завдання: цикл із let; на кожному проході поставити таймер із затримкою 0, який викличе show(i).
// function -> void
// Призначення: поставити три таймери, які викличуть show(i) для i = 0, 1, 2; через let кожен таймер бачить
export function loopWithLet(show) {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => show(i), 0);
    }
}