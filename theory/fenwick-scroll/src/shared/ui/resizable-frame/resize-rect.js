// Розрахунок нового прямокутника вікна під час перетягування краю чи кута.
// Чистий JavaScript, без React і без DOM, тому перевіряється через node (resize-rect.test.js).
//
// rect - прямокутник на момент натискання: { left, top, width, height } у пікселях.
// handle - за що тягнуть: сторони світу 'n' (верх), 's' (низ), 'w' (ліво), 'e' (право)
// або кути 'nw', 'ne', 'sw', 'se'. Кут - це дві сторони одразу.
// dx, dy - на скільки зсунувся вказівник від точки натискання.
// minSize - найменша ширина й висота вікна.
//
// Правий і нижній краї просто змінюють ширину чи висоту. Лівий і верхній краї рухають
// саму сторону, а протилежна сторона стоїть на місці: тягнемо лівий край ліворуч -
// left зменшується, а width росте на стільки ж. Вікно не виходить за лівий і верхній
// край сцени (left і top не менші за 0).
export function resizeRect(rect, handle, dx, dy, minSize) {
  let { left, top, width, height } = rect;

  if (handle.includes('e')) width = Math.max(minSize, rect.width + dx);
  if (handle.includes('s')) height = Math.max(minSize, rect.height + dy);

  if (handle.includes('w')) {
    const right = rect.left + rect.width;
    left = Math.min(Math.max(0, rect.left + dx), right - minSize);
    width = right - left;
  }
  if (handle.includes('n')) {
    const bottom = rect.top + rect.height;
    top = Math.min(Math.max(0, rect.top + dy), bottom - minSize);
    height = bottom - top;
  }

  return { left, top, width, height };
}
