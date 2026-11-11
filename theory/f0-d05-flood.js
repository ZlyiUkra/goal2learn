const start = performance.now();

setTimeout(() => {
  console.log("таймер спрацював через", Math.round(performance.now() - start), "мс");
}, 0);

// Кожен виклик ставить у чергу мікрозадач новий виклик, аж поки не минуть 300 мс.
function flood() {
  if (performance.now() - start < 300) {
    queueMicrotask(flood);
  }
}
flood();