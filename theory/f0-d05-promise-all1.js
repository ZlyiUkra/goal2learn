const started = performance.now();
const at = () => Math.round((performance.now() - started) / 1) * 1;
const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const results = await Promise.all(
  [300, 100, 200].map(async (ms) => {
    const value = await later(ms, ms);
    console.log(at(), "мс: прийшла відповідь", value);
    return value;
  }),
);
console.log(at(), "мс: масив", results);