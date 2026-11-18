// Викликає callback, коли браузер уже намалював поточний кадр. requestAnimationFrame
// спрацьовує перед малюванням кадру, а setTimeout усередині нього - вже після.
// Так лоудер встигає з'явитися на екрані раніше, ніж почнеться довга побудова.
// Повертає функцію, що скасовує виклик.
export const afterPaint = (callback) => {
  let timer;
  const frameId = window.requestAnimationFrame(() => {
    timer = window.setTimeout(callback, 0);
  });
  return () => {
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(timer);
  };
};
