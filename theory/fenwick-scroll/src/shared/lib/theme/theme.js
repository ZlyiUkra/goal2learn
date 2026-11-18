import React from 'react';

// Тема сторінки: світла ('light') або темна ('dark').
// Поки людина не обрала тему сама, сторінка бере тему системи (prefers-color-scheme).
// Обрана тема записується в localStorage і ставиться атрибутом data-theme на <html>;
// стилі в app/styles читають цей атрибут.
// localStorage може бути недоступний (приватне вікно, заборонені дані сайту), тому
// кожне звернення до нього загорнуте в try/catch: без нього тема просто не запам'ятається.
const storageKey = 'fenwick-scroll-theme';

const readStored = () => {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

const systemTheme = () => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

export function useTheme() {
  const [theme, setTheme] = React.useState(() => readStored() ?? systemTheme());

  React.useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Тема діє до перезавантаження сторінки, просто не запам'ятовується.
    }
  };

  return { theme, toggleTheme };
}
