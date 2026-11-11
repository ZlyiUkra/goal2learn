const refuse = () => Promise.reject(new Error("сервер не відповів"));

refuse()
  .then(() => console.log("цей then пропущено"))
  .catch((error) => {
    console.log("catch:", error.message);
    return "значення за замовчуванням";
  })
  .then((value) => console.log("після catch:", value));