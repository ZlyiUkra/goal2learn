const started = performance.now();
const at = () => Math.round((performance.now() - started) / 1) * 1;
const refuseLater = (ms, text) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(text)), ms));

// Цей проміс працює 150 мс і друкує рядок, коли закінчить.
const slow = new Promise((resolve) => {
  setTimeout(() => {
    console.log(at(), "мс: повільний проміс усе одно завершився");
    resolve("повільний");
  }, 150);
});

try {
  // Promise.all стане відхиленим, щойно відхилиться перший проміс зі списку.
  await Promise.all([refuseLater(50, "збій"), slow]);
} catch (error) {
  console.log(at(), "мс: Promise.all відхилено:", error.message);
}