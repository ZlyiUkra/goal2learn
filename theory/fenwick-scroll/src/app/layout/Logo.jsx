// Логотип: квітка з плиток різного розміру, як мозаїка на сторінках режимів.
// Пелюстки - чотири прямокутники різних розмірів довкола серединки; кольори з тієї самої
// палітри oklch, що й плитки. Малюнок вбудований у сторінку, без окремого файлу.
export function Logo() {
  return (
    <svg className="logo" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect x="4" y="3" width="13" height="10" fill="oklch(0.78 0.11 0)" />
      <rect x="19" y="5" width="10" height="13" fill="oklch(0.80 0.09 300)" />
      <rect x="16" y="20" width="14" height="10" fill="oklch(0.80 0.08 150)" />
      <rect x="3" y="15" width="11" height="15" fill="oklch(0.82 0.09 40)" />
      <circle cx="16.5" cy="16.5" r="3" fill="var(--color-accent)" />
    </svg>
  );
}
