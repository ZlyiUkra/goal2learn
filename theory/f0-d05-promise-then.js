const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

later(100, 5)
  .then((n) => n * 2)
  .then((n) => later(100, n + 1))
  .then((n) => {
    console.log("результат ланцюжка:", n);
  });