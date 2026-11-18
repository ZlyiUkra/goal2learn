import React from 'react';
import { useTheme } from '@/shared/lib/theme';
import { HomePage } from '@/pages/home';
import { FlowDemoPage, modes } from '@/pages/flow-demo';
import { AppLayout } from '../layout/index.js';

// Корінь застосунку. Роутера немає: обраний пункт меню - це стан current.
// 'home' - вступ, решта - режими сторінки з плитками. Сторінка режимів лишається
// змонтованою, коли перемикаються режими, тож сторона квадрата і розмір вікна зберігаються.
const menuItems = [{ value: 'home', label: 'Вступ' }, ...modes.map(({ value, label }) => ({ value, label }))];

export function App() {
  const [current, setCurrent] = React.useState('home');
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayout items={menuItems} current={current} onSelect={setCurrent} theme={theme} onToggleTheme={toggleTheme}>
      {current === 'home' ? <HomePage modes={modes} onOpen={setCurrent} /> : <FlowDemoPage mode={current} />}
    </AppLayout>
  );
}
