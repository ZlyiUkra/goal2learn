const started = performance.now();
const at = () => (Math.round((performance.now() - started) / 100) / 10).toFixed(1) + " с";

// Повільний проміс виконується через 2 секунди.
const slow = new Promise((resolve) => setTimeout(() => resolve("повільний"), 2000));
// Швидкий проміс відхиляється через 1 секунду.
const fast = new Promise((_, reject) => setTimeout(() => reject(new Error("швидкий зламався")), 1000));

try {
    console.log(at(), "чекаємо на slow");
    console.log(at(), await slow);
    console.log(at(), "чекаємо на fast");
    console.log(at(), await fast);
} catch (error) {
    console.log(at(), "catch перехопив:", error.message);
}
