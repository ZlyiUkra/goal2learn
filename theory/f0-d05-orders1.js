console.log("старт");

setTimeout(() => {
  console.log("таймер 1");
  Promise.resolve().then(() => console.log("мікрозадача всередині таймера 1"));
}, 0);

setTimeout(() => console.log("таймер 2"), 0);

Promise.resolve().then(() => {
  console.log("мікрозадача А");
  queueMicrotask(() => console.log("мікрозадача Б, поставлена з А"));
});

console.log("кінець файла");