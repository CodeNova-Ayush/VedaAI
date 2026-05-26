interface Props {
  size?: number;
}

export default function Logo({ size = 36 }: Props): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="VedaAI"
    >
      <defs>
        <linearGradient id="vedaTile" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F58A2E" />
          <stop offset="55%" stopColor="#C13E1F" />
          <stop offset="100%" stopColor="#3A1010" />
        </linearGradient>
        <radialGradient id="vedaTileShine" cx="80%" cy="10%" r="80%">
          <stop offset="0%" stopColor="#FFD8A8" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#FFD8A8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vedaWhite" x1="20%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#vedaTile)" />
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#vedaTileShine)" />

      {/* V mark with blue outline + white fill */}
      <path
        d="M14 18
           Q14 16 16 16
           L23 16
           Q24.6 16 25.2 17.5
           L32 35
           L38.8 17.5
           Q39.4 16 41 16
           L48 16
           Q50 16 50 18
           L50 19
           Q50 19.6 49.7 20.2
           L36 47
           Q35.2 48.6 33.4 48.6
           L30.6 48.6
           Q28.8 48.6 28 47
           L14.3 20.2
           Q14 19.6 14 19
           Z"
        fill="url(#vedaWhite)"
        stroke="#1E90FF"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
