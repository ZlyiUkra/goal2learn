// Іконка теми з личком: сонечко для світлої теми, місяць для темної. Личко несиметричне
// (очі, усмішка, рум'янець), тож коли іконка нахиляється, це добре видно.
const faceInk = 'var(--color-icon-face)';

function Sun() {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    return {
      x1: 16 + Math.cos(angle) * 11,
      y1: 16 + Math.sin(angle) * 11,
      x2: 16 + Math.cos(angle) * 14.5,
      y2: 16 + Math.sin(angle) * 14.5,
    };
  });
  return (
    <>
      {rays.map((ray, i) => (
        <line key={i} {...ray} stroke="var(--color-icon-sun)" strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="16" cy="16" r="8.5" fill="var(--color-icon-sun)" />
      <circle cx="13.2" cy="14.6" r="1.1" fill={faceInk} />
      <circle cx="18.8" cy="14.6" r="1.1" fill={faceInk} />
      <path d="M12.8 18.2 Q16 21.4 19.2 18.2" fill="none" stroke={faceInk} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11.6" cy="17.8" r="1.3" fill="var(--color-icon-cheek)" />
      <circle cx="20.4" cy="17.8" r="1.3" fill="var(--color-icon-cheek)" />
    </>
  );
}

function Moon() {
  return (
    <>
      {/* Серп: велике коло, з якого маска вирізає менше коло праворуч угорі. */}
      <mask id="moon-cut">
        <rect width="32" height="32" fill="white" />
        <circle cx="22" cy="10" r="9" fill="black" />
      </mask>
      <circle cx="15" cy="17" r="12" fill="var(--color-icon-moon)" mask="url(#moon-cut)" />
      <path d="M8.6 16.4 Q10.4 18 12.2 16.4" fill="none" stroke={faceInk} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9.4 21.4 Q11.6 23.2 13.8 21.4" fill="none" stroke={faceInk} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="8.2" cy="19.4" r="1.2" fill="var(--color-icon-cheek)" />
      {/* Зірочка у вирізаній частині серпа, окремо від нього. */}
      <path d="M23 5 l1.1 2.4 l2.4 1.1 l-2.4 1.1 l-1.1 2.4 l-1.1 -2.4 l-2.4 -1.1 l2.4 -1.1 Z" fill="var(--color-icon-moon)" />
    </>
  );
}

export function ThemeIcon({ theme }) {
  return (
    <svg className="theme-icon" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      {theme === 'dark' ? <Moon /> : <Sun />}
    </svg>
  );
}
