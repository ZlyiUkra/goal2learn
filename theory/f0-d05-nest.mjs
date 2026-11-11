// Наші заглушки. Аргумент запуску вибирає, який крок зламається.
const broken = process.argv[2];
const step = (name) => (input) => {
  console.log("крок", name);
  return broken === name
    ? Promise.reject(new Error(name + " зламався"))
    : Promise.resolve(name + " готово");
};


const doSomethingCritical = step("critical");
const doSomethingOptional = step("optional");
const doSomethingExtraNice = step("extraNice");
const moreCriticalStuff = step("moreCritical");

doSomethingCritical()
  .then((result) =>
    doSomethingOptional(result)
      .then((optionalResult) => doSomethingExtraNice(optionalResult))
      .catch((e) => { }),
  ) // Ignore if optional stuff fails; proceed.
  .then(() => moreCriticalStuff())
  .catch((e) => console.error(`Critical failure: ${e.message}`));