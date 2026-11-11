
// Задача: таймер.
setTimeout(() => console.log("setTimeout"), 0);

// Окрема черга Node.
process.nextTick(() => console.log("process.nextTick"));

// Мікрозадача: функція з then.
Promise.resolve().then(() => console.log("then"));

console.log("кінець файла");