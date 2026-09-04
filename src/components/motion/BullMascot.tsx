/**
 * A small flat-illustrated bull that strolls across the horizon — a playful,
 * hand-drawn counterpoint to the data-driven UI. Pure SVG + CSS keyframes
 * (walk cycle, tail swish, idle bob, blink): no external art, no JS.
 */
export default function BullMascot({
  id,
  bottom = "6px",
  scale = 1,
  duration = 26,
  opacity = 1,
  delay = 0,
}: {
  id: string;
  bottom?: string;
  scale?: number;
  duration?: number;
  opacity?: number;
  delay?: number;
}) {
  const grad = `bull-grad-${id}`;

  return (
    <div
      className="mascot-root mascot-walk pointer-events-none absolute"
      style={{
        bottom,
        width: `${118 * scale}px`,
        opacity,
        animationDuration: `${duration}s`,
        animationDelay: `${-delay}s`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 140 96" className="bull-bob w-full overflow-visible">
        <defs>
          <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#e879f9" />
          </linearGradient>
        </defs>

        {/* rear-outer leg */}
        <g className="leg-swing-a" style={{ transformOrigin: "46px 58px" }}>
          <rect x="42" y="58" width="9" height="24" rx="4" fill={`url(#${grad})`} />
          <rect x="40.5" y="79" width="12" height="6" rx="2.2" fill="#100f1c" />
        </g>
        {/* rear-inner leg */}
        <g className="leg-swing-b" style={{ transformOrigin: "58px 58px" }}>
          <rect x="54" y="58" width="9" height="24" rx="4" fill={`url(#${grad})`} opacity="0.92" />
          <rect x="52.5" y="79" width="12" height="6" rx="2.2" fill="#100f1c" opacity="0.92" />
        </g>

        {/* body */}
        <ellipse cx="70" cy="50" rx="32" ry="19" fill={`url(#${grad})`} stroke="#100f1c" strokeWidth="2" />

        {/* front-inner leg */}
        <g className="leg-swing-a" style={{ transformOrigin: "82px 60px" }}>
          <rect x="78" y="60" width="9" height="24" rx="4" fill={`url(#${grad})`} opacity="0.92" />
          <rect x="76.5" y="81" width="12" height="6" rx="2.2" fill="#100f1c" opacity="0.92" />
        </g>
        {/* front-outer leg */}
        <g className="leg-swing-b" style={{ transformOrigin: "94px 60px" }}>
          <rect x="90" y="60" width="9" height="24" rx="4" fill={`url(#${grad})`} />
          <rect x="88.5" y="81" width="12" height="6" rx="2.2" fill="#100f1c" />
        </g>

        {/* tail */}
        <g className="tail-swish" style={{ transformOrigin: "38px 50px" }}>
          <path d="M38,50 Q24,56 28,72" stroke={`url(#${grad})`} strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="28" cy="75" rx="4.5" ry="5.5" fill="#100f1c" />
        </g>

        {/* head */}
        <circle cx="104" cy="38" r="16" fill={`url(#${grad})`} stroke="#100f1c" strokeWidth="2" />
        {/* ear */}
        <ellipse cx="93" cy="28" rx="5" ry="7.5" fill={`url(#${grad})`} stroke="#100f1c" strokeWidth="1.5" transform="rotate(-25 93 28)" />
        {/* horns */}
        <path d="M99,24 Q92,10 80,12" stroke="#f4c04d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M104,22 Q100,9 90,9" stroke="#f4c04d" strokeWidth="4.5" strokeLinecap="round" fill="none" opacity="0.85" />
        {/* muzzle */}
        <ellipse cx="118" cy="44" rx="8.5" ry="6.5" fill="#f3eefc" stroke="#100f1c" strokeWidth="1.5" />
        <circle cx="115" cy="44" r="1.1" fill="#100f1c" />
        <circle cx="121" cy="44" r="1.1" fill="#100f1c" />
        {/* eye */}
        <g className="mascot-blink" style={{ transformOrigin: "108px 33px" }}>
          <circle cx="108" cy="33" r="3.2" fill="#fdfdff" />
          <circle cx="109" cy="33" r="1.5" fill="#100f1c" />
        </g>
      </svg>
    </div>
  );
}
