const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const total = later(10, 42);
console.log(total + 1);

const list = later(10, ["чай"]);
try {
  list.map((x) => x);
} catch (error) {
  console.log(error.name + ":", error.message);
}