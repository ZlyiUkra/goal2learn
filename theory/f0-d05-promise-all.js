function busy(ms) {
  const start = performance.now();
  while (performance.now() - start < ms) { }
}

async function heavy() {
  busy(300);
}

const started = performance.now();
await Promise.all([heavy(), heavy()]);
console.log(Math.round((performance.now() - started) / 100) * 100, "мс");