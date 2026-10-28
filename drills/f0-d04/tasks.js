// Чи підходить назва під шаблон — знання бібліотеки, а не ваша робота (htdp.org, 3.3 Domain
// Knowledge: друга форма знань — функції бібліотек мови). Після `npm install minimatch`
// розкоментуйте наступний рядок. minimatch("Задача 7", "Задача ?") дає true (? — рівно один
// будь-який символ). Імпорт у фігурних дужках, бо пакет віддає іменований експорт.
import { minimatch } from "minimatch";

// День 2, функції з drills/f0-d02-tasks.js за рецептом. Класи Task і Task[] — у data.js.

// number -> Task[]
// Масив із count вигаданих задач з номерами від 1 до count.
export function makeTasks(count) {
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

// Перенесіть сюди зі свого файлу дня 2 ще три функції, кожну з export перед function:
// freezeAll, onlyOpen, renameTitleToText. Тіла лишаються ваші, а над кожною допишіть сигнатуру й
// призначення. Для готового коду це список побажань книжки (htdp.org, 3.4 From Functions to
// Programs): ім'я, сигнатура, призначення.

// Завдання: задачі від раннього терміну due до пізнього; НОВИЙ масив, вхідний не змінювати.
// Task[] -> Task[]
// Призначення: повернути новий масив задач, впорядкованих за полем due від раннього терміну до пізнього.
export function sortByDue(tasks) {
    return [...tasks].sort((a, b) => a.due.localeCompare(b.due));
}

// Завдання: сума hours усіх задач; для порожнього масиву 0.
// Task[] -> number
// Призначення: повернути суму годин усіх задач.
export function totalHours(tasks) {
    return tasks.reduce((sum, task) => sum + task.hours, 0);
}

// Завдання: ті задачі (у тому ж порядку), чий title підходить під шаблон pattern. Шаблон
// "Задача 1?" дає задачі 10–19 (але не «Задача 1»), "Задача {1,2}" — задачі 1 і 2.
// Тіло — після npm install minimatch.
// Task[], string -> Task[]
// Призначення: повернути новий масив задач, чий title підходить під шаблон pattern.
export function filterByTitle(tasks, pattern) {
    return tasks.filter((task) => minimatch(task.title, pattern)); // [];
}

// Завдання: заморозити масив і всі задачі в ньому; повернути той самий масив.
// Task[] -> Task[]
// Призначення: повернути той самий масив, заморожений разом із усіма задачами в ньому.
export function freezeAll(tasks) {
    Object.freeze(tasks);
    for (const task of tasks) {
        Object.freeze(task);
    }
    return tasks;
}

// Завдання: лише незавершені задачі (done === false); новий масив.
// Task[] -> Task[]
// Призначення: повернути новий масив лише незавершених задач
export function onlyOpen(tasks) {
    return tasks.filter((task) => !task.done);
}

// Завдання: перейменувати поле title на text; новий масив НОВИХ об'єктів.
// Task[] -> Task[]
// Призначення: повернути новий масив, де у кожній задачі title перейменовано на text.
export function renameTitleToText(tasks) {
    return tasks.map((task) => {
        const { title, ...rest } = task;
        return { ...rest, text: title };
    });
}