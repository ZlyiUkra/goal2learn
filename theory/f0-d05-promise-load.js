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

const stock = load("залишки", 200);
const price = load("ціна", 400);
console.log(now(), "мс: обидва запити вже йдуть, Promise.all ще не викликано");

const result = await Promise.all([stock, price]);
console.log(now(), "мс:", result);