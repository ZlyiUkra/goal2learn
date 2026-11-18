// Спільний стан сторінки режимів, переданий через React Context.
// Стан живе у FlowDemoPage, бо сторінка лишається змонтованою, коли змінюються режим і сторона.
// FlowView і TableView, навпаки, щоразу створюються заново. Через контекст вони беруть
// сторону і вікно і записують, скільки тривала їхня побудова, без передачі props через сторінку.
// Що лежить у контексті:
//   - side - сторона квадрата, за якою будується поле плиток;
//   - frame і setFrame - положення і розмір вікна, яке тягнуть за краї;
//   - layoutFrame - вікно, з якого мозаїка "Скомбіновано" бере пропорції; воно наздоганяє frame,
//     коли край вікна відпустили (onResizeEnd);
//   - buildMs і setBuildMs - скільки мілісекунд тривала остання побудова поля плиток.
import React from 'react';

export const DemoContext = React.createContext(null);

export const useDemo = () => {
  const value = React.useContext(DemoContext);
  if (value === null) throw new Error('useDemo must be called inside DemoContext');
  return value;
};

// Міряє побудову компонента: від його першого рендеру до миті, коли React поставив його
// в DOM. Сюди входить побудова розкладки (дерева Фенвіка) і створення видимих плиток.
// Хук має стояти першим у компоненті: тоді відлік починається раніше, ніж будується розкладка.
// Мозаїка будується частинами вже після появи в DOM, тому FlowView міряє її сам.
export const useBuildTime = () => {
  const { setBuildMs } = useDemo();
  const [startedAt] = React.useState(() => performance.now());
  React.useLayoutEffect(() => {
    setBuildMs(performance.now() - startedAt);
  }, [setBuildMs, startedAt]);
};
