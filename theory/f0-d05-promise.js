console.log("до конструктора");
const order = new Promise((resolve) => {
  console.log("функція всередині конструктора працює одразу");
  setTimeout(() => resolve("замовлення № 41"), 100);
});
console.log("після конструктора", order);

order.then((value) => {
  console.log("значення:", value);
  console.log("після виконання", order);
});