import React from 'react';
import { Logo } from './Logo.jsx';
import { ThemeIcon } from './ThemeIcon.jsx';
import './AppLayout.css';

// Каркас застосунку: шапка з логотипом, меню і перемикачем теми, під нею - сторінка.
// items - пункти меню { value, label }, current - обраний пункт, onSelect(value) - вибір.
export function AppLayout({ items, current, onSelect, theme, onToggleTheme, children }) {
  // Перемикач теми нахиляється на 22.5° при наведенні і на 45° поки його натиснуто.
  // Клацання (воно спрацьовує, коли кнопку відпускають) міняє тему, тож на місце стає вже
  // інша іконка. Щоб нова іконка стала рівно, нахил при наведенні вимикається, доки
  // вказівник не покине кнопку: rested = true.
  const [rested, setRested] = React.useState(false);
  const handleThemeClick = () => {
    setRested(true);
    onToggleTheme();
  };
  const themeLabel = theme === 'dark' ? 'Темна тема. Клацніть, щоб увімкнути світлу' : 'Світла тема. Клацніть, щоб увімкнути темну';

  return (
    <div className="app">
      <header className="app-header">
        <button type="button" className="app-brand" onClick={() => onSelect(items[0].value)}>
          <Logo />
          <span className="app-brand-text">
            <span className="app-brand-name">Фенвік</span>
            <span className="app-brand-sub">віртуальний скрол</span>
          </span>
        </button>
        <nav className="app-menu" aria-label="Розділи">
          {items.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className="app-menu-item"
              aria-current={value === current ? 'page' : undefined}
              onClick={() => onSelect(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className={rested ? 'app-theme app-theme-rested' : 'app-theme'}
          aria-label={themeLabel}
          title={themeLabel}
          onClick={handleThemeClick}
          onPointerLeave={() => setRested(false)}
        >
          <ThemeIcon theme={theme} />
        </button>
      </header>
      {children}
    </div>
  );
}
