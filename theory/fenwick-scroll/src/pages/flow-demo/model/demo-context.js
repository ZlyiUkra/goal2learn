// Спільний стан сторінки режимів, переданий через React Context.
// Стан живе у FlowDemoPage, бо сторінка лишається змонтованою, коли змінюються режим і сторона.
// FlowView і TableView, навпаки, щоразу створюються заново. Через контекст вони беруть
// сторону і вікно і записують, скільки тривала їхня побудова, без передачі props через сторінку.
// Що лежить у контексті:
//   - side - сторона квадрата, за якою будується поле плиток;
//   - frame і setFrame - положення і розмір вікна, яке тягнуть за краї;
//   - layoutFrame - вікно, з якого мозаїка "Скомбіновано" бере пропорції; воно наздоганяє frame,
//     коли край вікна відпустили (onResizeEnd);
//   - relayout - мозаїка зараз перекладається під нові пропорції, поверх поля стоїть лоудер;
//   - buildMs і setBuildMs - скільки мілісекунд тривала остання побудова поля плиток.
import React from 'react';

export const DemoContext = React.createContext(null);

export const useDemo = () => {
  const value = React.useContext(DemoContext);
  if (value === null) throw new Error('useDemo must be called inside DemoContext');
  return value;
};

// Міряє побудову компонента: від рендеру до миті, коли React поставив результат у DOM.
// Сюди входить побудова розкладки (дерева Фенвіка, мозаїка) і створення видимих плиток.
// Перший замір - при появі компонента. Новий замір починається, коли змінюється key:
// так міряється перекладання мозаїки під нові пропорції вікна.
// Хук має стояти в компоненті раніше за побудову розкладки, тоді вона потрапляє в замір.
// Якщо key змінився, setMark під час рендеру змушує React одразу повторити рендер компонента
// з новою міткою часу - так React радить зберігати те, що залежить від попереднього рендеру.
export const useBuildTime = (key = null) => {
  const { setBuildMs } = useDemo();
  const [mark, setMark] = React.useState(() => ({ key, at: performance.now() }));
  if (mark.key !== key) setMark({ key, at: performance.now() });
  React.useLayoutEffect(() => {
    setBuildMs(performance.now() - mark.at);
  }, [setBuildMs, mark]);
};
