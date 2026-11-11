// Запуск у терміналі: node theory/f0-d05-blocked-timer.js
// Запуск у браузері: відкрийте f0-d05-blocked-timer.html, вивід у консолі (F12).

const start = performance.now();
setTimeout(() => {
  console.log("таймер спрацював через", Math.round(performance.now() - start), "мс");
}, 100);

while (performance.now() - start < 500) {
  // нічого не робимо, лише займаємо єдиний потік
}
console.log("цикл закінчився через", Math.round(performance.now() - start), "мс");
