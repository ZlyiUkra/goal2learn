const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const refuseLater = (ms, text) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(text)), ms));

async function loadRate() {
  try {
    return await refuseLater(50, "курс недоступний");
    //return refuseLater(50, "курс недоступний");
  } catch (error) {
    console.log("перехоплено:", error.message);
    return await later(50, 41.5);
  } finally {
    console.log("finally виконується в будь-якому разі");
  }
}

console.log("курс:", await loadRate());