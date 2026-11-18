// Довга робота частинами, з підпискою і відпискою.
//
// Навіщо. JavaScript у браузері виконується в одному потоці зі сторінкою. Поки працює одна
// довга функція, браузер не обробляє кліків і не малює кадрів, тобто сторінка замерзає.
// Якщо ту саму роботу записати генератором, який зупиняється (yield) через кожні кілька
// сотень кроків, її можна виконувати шматками приблизно по sliceMs мілісекунд. Між шматками
// браузер встигає обробити кліки, прокрутку і намалювати кадр.
//
// Як користуватися:
//   const job = sliceJob(() => layout.placeSteps());
//   const unsubscribe = job.subscribe(() => { ...робота закінчилась... });
//   unsubscribe(); // зупинити роботу: наступний шматок уже не почнеться, onDone не прийде
//
// Робота починається в мить підписки, і кожна підписка запускає свій генератор.
// Шматки плануються через MessageChannel: повідомлення самому собі - це нова задача браузера,
// і перед нею браузер може обробити події. setTimeout(0) для цього гірший: після кількох
// вкладених викликів браузер робить між ними паузу щонайменше 4 мс.
// Планувальник шматків для браузера: next(run) ставить run у чергу задач, close() звільняє канал.
const messageScheduler = () => {
  const channel = new MessageChannel();
  let pending = null;
  channel.port1.onmessage = () => {
    const run = pending;
    pending = null;
    run?.();
  };
  return {
    next(run) {
      pending = run;
      channel.port2.postMessage(null);
    },
    close() {
      channel.port1.onmessage = null;
      channel.port1.close();
      channel.port2.close();
    },
  };
};

// scheduler - фабрика планувальника. Її підміняють у тестах: Node обробляє повідомлення
// MessageChannel підряд, не пропускаючи таймерів, тож там шматки плануються через setTimeout.
export const sliceJob = (makeSteps, { sliceMs = 12, scheduler = messageScheduler } = {}) => ({
  subscribe(onDone) {
    const steps = makeSteps();
    const queue = scheduler();
    let stopped = false;

    const stop = () => {
      if (stopped) return;
      stopped = true;
      queue.close();
    };

    const runSlice = () => {
      if (stopped) return;
      const end = performance.now() + sliceMs;
      while (performance.now() < end) {
        if (steps.next().done) {
          stop();
          onDone();
          return;
        }
      }
      queue.next(runSlice);
    };
    queue.next(runSlice);

    return stop;
  },
});
