const start = performance.now();
const now = () => Math.round((performance.now() - start) / 1) * 1;

function load(name, ms) {
  console.log(now(), "мс: старт", name);
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(now(), "мс: готово", name);
      resolve(name);
    }, ms);
  });
}
// Другий виклик load відбудеться лише після відповіді на перший.
const a = await load("залишки", 200);
const b = await load("ціна", 400);
console.log(now(), "мс:", [a, b]);