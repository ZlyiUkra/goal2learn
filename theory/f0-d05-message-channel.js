const a = new MessageChannel();
const b = new MessageChannel();

// Обробник на кожному з чотирьох портів.
a.port1.onmessage = (e) => console.log("a.port1 отримав:", e.data);
a.port2.onmessage = (e) => console.log("a.port2 отримав:", e.data);
b.port1.onmessage = (e) => console.log("b.port1 отримав:", e.data);
b.port2.onmessage = (e) => console.log("b.port2 отримав:", e.data);

a.port2.postMessage("від a.port2");
a.port1.postMessage("від a.port1");

// Закриваємо порти, інакше Node не завершить програму: відкритий порт з обробником тримає її живою.
setTimeout(() => {
  a.port1.close();
  b.port1.close();
  console.log("кінець");
}, 100);