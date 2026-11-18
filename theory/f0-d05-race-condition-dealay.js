const DELAYS = { к: 500, ка: 100 };
const search = (text) =>
    new Promise((resolve) =>
        setTimeout(() => resolve("результати для «" + text + "»"), DELAYS[text]),
    );

let screen = "порожньо";
let lastRequest = 0;

async function onInput(text) {
    lastRequest += 1;
    const thisRequest = lastRequest;
    const result = await search(text);
    if (thisRequest !== lastRequest) {
        console.log("відкинуто застарілу відповідь:", result);
        return;
    }
    screen = result;
    console.log("на екрані:", screen);
}

onInput("к");
setTimeout(() => onInput("ка"), 50);