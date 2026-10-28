import assert from "node:assert";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
// Три види import, які тут зустрінуться:
//   import { a, b } from "./x.js"   — іменовані експорти, за іменами в фігурних дужках;
//   import a from "./x.js"          — типовий експорт (export default), без дужок, ім'я довільне;
//   import * as ns from "./x.js"    — усе, що модуль експортує, одним об'єктом ns (ns.a, ns.default).
import { USER_OLYA } from "./data.js";
import { addItem, moveUser } from "./lists.js";
import { makeTasks, sortByDue, totalHours, filterByTitle } from "./tasks.js";
import * as tasksModule from "./tasks.js";
import makeCounter, * as closuresModule from "./closures.js";

// Залежності: впишіть відповідь замість "TODO".

// Після `npm install minimatch` запустіть `npm ls --all` (без --all npm покаже лише пакети з
// вашого package.json, а їхніх залежностей не покаже). Під minimatch стоїть пакет, від якого
// він залежить напряму. Впишіть його ім'я так, як надрукував npm ls (без номера версії).
const DEPENDENCY_OF_MINIMATCH = "brace-expansion";


// ── Перевірки (нічого не змінюйте нижче цього рядка) ──
// Модулі. Якщо import вище впав із ERR_MODULE_NOT_FOUND чи SyntaxError, читайте текст помилки:
// він називає файл і ім'я, яких не вистачає.
const source = (name) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

// Опис даних: data.js без TODO, приклад USER_OLYA заморожено на обох рівнях.
assert.ok(!source("data.js").includes("TODO"), "data.js: лишилися TODO в описі User");
assert.deepStrictEqual(
    USER_OLYA,
    { name: "Оля", address: { city: "Київ" } },
    'USER_OLYA має бути { name: "Оля", address: { city: "Київ" } }',
);
assert.ok(
    Object.isFrozen(USER_OLYA) && Object.isFrozen(USER_OLYA.address),
    "USER_OLYA: заморозьте і сам об'єкт, і address",
);

// Сигнатура й призначення: рядки коментаря одразу над export (без порожнього рядка між ними).
// Сигнатура — рядок зі стрілкою ->, призначення — речення без стрілки, не «Завдання: ...».
function recipeHeader(file, name) {
    const lines = source(file).split("\n");
    const at = lines.findIndex((line) =>
        new RegExp(`^export\\s+(default\\s+)?(async\\s+)?(function\\s*\\*?\\s*|const\\s+|let\\s+)${name}\\b`).test(line),
    );
    assert.ok(at >= 0, `${file}: не знайдено export ${name} (export function ${name} чи export const ${name})`);
    const block = [];
    for (let i = at - 1; i >= 0 && lines[i].trim().startsWith("//"); i--) {
        block.unshift(lines[i].trim().replace(/^\/\/\s?/, ""));
    }
    assert.ok(!block.some((line) => line.includes("TODO")), `${file}: над ${name} лишилося TODO`);
    assert.ok(
        block.some((line) => line.includes("->")),
        `${file}: над ${name} немає сигнатури — рядка коментаря зі стрілкою, наприклад «Task[] -> number»`,
    );
    assert.ok(
        block.some((line) => !line.includes("->") && !line.startsWith("Завдання") && line.split(/\s+/).length >= 3),
        `${file}: над ${name} немає призначення — речення про те, що функція обчислює`,
    );
}
for (const name of ["addItem", "moveUser"]) recipeHeader("lists.js", name);
for (const name of ["makeTasks", "freezeAll", "onlyOpen", "sortByDue", "renameTitleToText", "totalHours", "filterByTitle"]) {
    assert.strictEqual(typeof tasksModule[name], "function", `tasks.js не віддає ${name}: перенесіть її з дня 2`);
    recipeHeader("tasks.js", name);
}
for (const name of ["makeCounter", "sharedCountDemo", "makeSnapshotHandler", "loopWithVar", "loopWithLet"]) {
    if (name !== "makeCounter") {
        assert.strictEqual(typeof closuresModule[name], "function", `closures.js не віддає ${name}: перенесіть її з дня 3`);
    }
    recipeHeader("closures.js", name);
}

// Приклади: щонайменше два test("ім'я: ...") на кожну функцію, яку ви проєктуєте сьогодні.
const examples = { "lists.test.js": ["addItem", "moveUser"], "tasks.test.js": ["sortByDue", "totalHours", "filterByTitle"], "closures.test.js": ["makeCounter"] };
for (const [file, names] of Object.entries(examples)) {
    const text = source(file);
    for (const name of names) {
        const found = text.match(new RegExp(`\\btest\\(\\s*["'\`]${name}:`, "g"))?.length ?? 0;
        assert.ok(found >= 2, `${file}: прикладів для ${name} ${found}, а треба щонайменше два, кожен — test("${name}: ...", ...)`);
    }
}

// Ваші приклади мають проходити. node --test запускає всі файли *.test.js у цій теці.
const run = spawnSync(process.execPath, ["--test", "--test-reporter=spec"], {
    cwd: new URL(".", import.meta.url),
    encoding: "utf8",
});
if (run.status !== 0) {
    const failed = run.stdout.split("\n").filter((line) => line.startsWith("✖ ") && line !== "✖ failing tests:");
    console.log([...new Set(failed)].map((line) => line.replace(/ \([\d.]+ms\)$/, "")).join("\n"));
    assert.fail("ваші приклади не проходять (вище — які саме): запустіть node --test і читайте його вивід");
}

// Приховані приклади: ті самі функції на інших даних. Якщо ваші приклади пройшли, а ці ні,
// подумайте, якого випадку бракує вашим прикладам.
const list = [1, 2];
assert.deepStrictEqual(addItem(list, 3), [1, 2, 3], "addItem має повернути [1, 2, 3]");
assert.deepStrictEqual(list, [1, 2], "addItem не мав змінювати вхідний масив");

const user = { name: "Оля", address: { city: "Київ" } };
const moved = moveUser(user, "Львів");
assert.strictEqual(moved.address.city, "Львів", "moveUser: місто в новому об'єкті має бути Львів");
assert.strictEqual(user.address.city, "Київ", "moveUser не мав змінювати оригінал");

// 20 задач із дня 2; масив і кожна задача заморожені: спроба змінити їх кине
// TypeError (модулі ESM суворі).
const tasks = makeTasks(20);
tasks.forEach((task) => Object.freeze(task));
Object.freeze(tasks);
// ids дістає id із задач. Якщо функція ще нічого не повертає (TODO), віддає це «нічого» як є,
// і перевірка нижче скаже, що не так.
const ids = (arr) => (Array.isArray(arr) ? arr.map((task) => task.id) : arr);

const sorted = sortByDue(tasks);
assert.ok(Array.isArray(sorted), "sortByDue має повернути масив");
assert.notStrictEqual(sorted, tasks, "sortByDue має повернути НОВИЙ масив");
assert.strictEqual(sorted.length, 20, "після сортування має лишитися 20 задач");
for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i - 1].due <= sorted[i].due, `sortByDue: позиції ${i - 1} і ${i} стоять не за терміном`);
}
assert.strictEqual(tasks[1].due, "2026-02-07", "sortByDue не мав змінювати порядок у вхідному масиві");
assert.strictEqual(totalHours(tasks), 60, "totalHours(makeTasks(20)) має дати 60");
assert.strictEqual(totalHours([]), 0, "totalHours([]) має дати 0");

const counterA = makeCounter();
assert.strictEqual(typeof counterA, "function", "makeCounter має повертати функцію");
assert.strictEqual(counterA(), 1, "перший виклик лічильника має дати 1");
assert.strictEqual(counterA(), 2, "другий виклик лічильника має дати 2");
const counterB = makeCounter();
assert.strictEqual(counterB(), 1, "другий лічильник має рахувати незалежно від першого");
assert.strictEqual(closuresModule.default, makeCounter, "makeCounter має бути типовим експортом (export default)");

// Зовнішня бібліотека.
assert.deepStrictEqual(
    ids(filterByTitle(tasks, "Задача 1?")),
    [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    'шаблон "Задача 1?" має дати задачі 10–19',
);
// Фігурні дужки {a,b} у шаблоні розгортає пакет brace-expansion: саме він стоїть під
// minimatch в npm ls.
assert.deepStrictEqual(
    ids(filterByTitle(tasks, "Задача {1,2}")),
    [1, 2],
    'шаблон "Задача {1,2}" має дати задачі 1 і 2',
);

// package.json, package-lock.json і node_modules мають бути узгоджені.
// new URL("./package.json", import.meta.url) — адреса файлу поруч з index.js, з якої б теки
// ви не запускали.
const pkg = JSON.parse(source("package.json"));
const range = pkg.dependencies?.minimatch;
assert.ok(range, "у package.json немає minimatch у dependencies: виконайте npm install minimatch");
assert.match(range, /^\^\d+\.\d+\.\d+$/, `npm install записує діапазон із ^, а там стоїть «${range}»`);

let lock;
try {
    lock = JSON.parse(source("package-lock.json"));
} catch {
    assert.fail("немає package-lock.json: його створює npm install, і його треба закомітити");
}
const locked = lock.packages["node_modules/minimatch"];
const installed = JSON.parse(source("node_modules/minimatch/package.json")).version;
assert.strictEqual(installed, locked.version, "node_modules і package-lock.json розійшлися: виконайте npm ci");
assert.strictEqual(
    installed.split(".")[0],
    range.slice(1).split(".")[0],
    "версія в node_modules не вкладається в діапазон ^: мажорна цифра мусить збігатися",
);
// Залежності minimatch беремо з самого lock-файлу, тому перевірка не залежить від того,
// яка версія вийшла в день, коли ви її ставили.
assert.ok(
    Object.keys(locked.dependencies ?? {}).includes(DEPENDENCY_OF_MINIMATCH),
    `«${DEPENDENCY_OF_MINIMATCH}» — не пряма залежність minimatch: дивіться, що стоїть під ним в npm ls --all`,
);


console.log("Усі перевірки пройдені");