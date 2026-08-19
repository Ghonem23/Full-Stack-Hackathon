/**
 * Robot-doctor illustration, drawn inline so it needs no image asset
 * and picks up the brand palette directly.
 */
export default function DoctorRobot({ className }) {
  return (
    <svg
      viewBox="0 0 300 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a robot wearing a doctor's coat and stethoscope"
      className={className}
    >
      <defs>
        <linearGradient id="dr-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d7e4f3" />
        </linearGradient>
        <linearGradient id="dr-shell" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#f7fafe" />
          <stop offset="100%" stopColor="#c3d6ea" />
        </linearGradient>
        <linearGradient id="dr-visor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d375d" />
          <stop offset="100%" stopColor="#08202f" />
        </linearGradient>
        <radialGradient id="dr-halo">
          <stop offset="0%" stopColor="#45b8cd" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#45b8cd" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind the figure */}
      <ellipse cx="150" cy="165" rx="145" ry="150" fill="url(#dr-halo)" />

      {/* Antenna */}
      <path d="M150 62V44" stroke="#c3d6ea" strokeWidth="5" strokeLinecap="round" />
      <circle cx="150" cy="32" r="13" fill="#45b8cd" opacity="0.35" className="animate-pulse-slow" />
      <circle cx="150" cy="32" r="7" fill="#0493ae" />

      {/* Ear pieces */}
      <rect x="72" y="96" width="16" height="38" rx="8" fill="#c3d6ea" />
      <rect x="212" y="96" width="16" height="38" rx="8" fill="#c3d6ea" />

      {/* Head */}
      <rect x="86" y="58" width="128" height="110" rx="38" fill="url(#dr-shell)" />
      <rect
        x="87"
        y="59"
        width="126"
        height="108"
        rx="37"
        stroke="#ffffff"
        strokeOpacity="0.7"
        strokeWidth="2"
      />

      {/* Visor / face screen */}
      <rect x="99" y="78" width="102" height="70" rx="29" fill="url(#dr-visor)" />

      {/* Eyes + smile */}
      <rect x="121" y="99" width="17" height="26" rx="8.5" fill="#5fdcf2" />
      <rect x="162" y="99" width="17" height="26" rx="8.5" fill="#5fdcf2" />
      <path
        d="M133 134q17 11 34 0"
        stroke="#5fdcf2"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Neck */}
      <rect x="134" y="163" width="32" height="22" rx="9" fill="#c3d6ea" />

      {/* Lab coat */}
      <path
        d="M118 187 150 216 182 187c34 15 54 55 54 107v46H64v-46c0-52 20-92 54-107Z"
        fill="url(#dr-coat)"
      />

      {/* Lapels */}
      <path d="M118 187 150 216 132 238Z" fill="#cbdcee" />
      <path d="M182 187 150 216 168 238Z" fill="#cbdcee" />

      {/* Sleeve seams */}
      <path d="M108 213c-14 24-22 62-22 127" stroke="#c3d6ea" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M192 213c14 24 22 62 22 127" stroke="#c3d6ea" strokeWidth="2.5" strokeLinecap="round" />

      {/* Stethoscope */}
      <path
        d="M126 192c-14 42-4 76 18 88"
        stroke="#0493ae"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path d="M176 192c12 34 8 60 0 74" stroke="#0493ae" strokeWidth="6" strokeLinecap="round" />
      <circle cx="176" cy="272" r="6" fill="#0493ae" />
      <circle cx="146" cy="292" r="15" fill="#0493ae" />
      <circle cx="146" cy="292" r="7.5" fill="#86d3e2" />

      {/* Chest badge with a pulse trace */}
      <rect x="182" y="232" width="44" height="28" rx="9" fill="#046dd6" />
      <path
        d="M190 246h5l3.5-8 4.5 16 3.5-8h11"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
