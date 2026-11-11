// Запуск у браузері: відкрийте f0-d05-event-loop.html, вивід у консолі (F12).
// Запуск у терміналі: node theory/f0-d05-event-loop.js
// У Node немає сторінки: ні document, ні кнопки, ні MutationObserver. Тому частини з ними
// виконуються лише тоді, коли inBrowser дорівнює true, а решта коду однакова в обох місцях.
const inBrowser = typeof document !== "undefined";

let button;
let box;
if (inBrowser) {
  button = document.querySelector("#button");
  box = document.querySelector("#box");

  // Обробник клацання: виконається, коли кнопку клацнуть.
  button.addEventListener("click", () => console.log("обробник click"));

  // Спостерігач: браузер викличе цю функцію мікрозадачею після зміни атрибута блока.
  const observer = new MutationObserver(() => console.log("MutationObserver"));
  observer.observe(box, { attributes: true });
}

console.log("синхронний код: початок");

// Задача: таймер.
setTimeout(() => console.log("setTimeout"), 0);

// Задача: повідомлення між двома кінцями каналу.
const channel = new MessageChannel();
channel.port1.onmessage = () => {
  console.log("MessageChannel");
  // У Node відкритий канал не дає програмі завершитися, тому закриваємо його.
  channel.port1.close();
};
channel.port2.postMessage("привіт");

if (inBrowser) {
  // Частина оновлення екрана: браузер викличе цю функцію, коли наступного разу оновлюватиме екран.
  requestAnimationFrame(() => console.log("requestAnimationFrame"));
}

// Запит: прихід відповіді стане задачею, а функція з then виконається одразу після неї мікрозадачею.
// Адреса data: несе дані прямо в собі, тому ні файл, ні сервер не потрібні.
fetch('data:application/json,{"ok":true}')
  .then(() => console.log("then після fetch"))
  .catch((error) => console.log("fetch не вдався:", error.message));

// Мікрозадача: пряме прохання.
queueMicrotask(() => console.log("queueMicrotask"));

// Мікрозадача: функція з then.
Promise.resolve().then(() => console.log("then"));

// Мікрозадача: продовження async-функції після await.
async function run() {
  await null;
  console.log("після await");
}
run();

if (inBrowser) {
  // Зміна атрибута: саме тут спостерігач ставить свою мікрозадачу.
  box.setAttribute("data-state", "new");

  // Клацання з коду: обробник виконується прямо тут, а не в черзі.
  button.click();
  console.log("одразу після button.click()");
}

console.log("синхронний код: кінець");
