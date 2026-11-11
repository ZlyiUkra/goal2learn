const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

later(10, "користувач")
  .then((user) => {
    //return later(50, user + " і його замовлення");
    later(50, user + " і його замовлення");
  })
  .then((orders) => {
    console.log("наступний then отримав:", orders);
  });