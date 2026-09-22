// 手绘卡通风格 SVG 资产：粗描边 + 高饱和配色，对齐参考截图
const O = '#1c2a4a' // 统一描边色
const SW = 3.5      // 统一描边宽

export function WoodPlank({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <g transform="rotate(-18 24 24)">
        <rect x="6" y="16" width="36" height="14" rx="3" fill="#d9a066" stroke={O} strokeWidth={SW} />
        <rect x="6" y="16" width="36" height="5" rx="2" fill="#e8bc85" />
        <line x1="14" y1="23" x2="34" y2="23" stroke={O} strokeWidth="1.6" opacity=".5" />
        <circle cx="11" cy="23" r="1.6" fill={O} opacity=".6" />
        <circle cx="37" cy="23" r="1.6" fill={O} opacity=".6" />
      </g>
    </svg>
  )
}

export function Barrel({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <ellipse cx="24" cy="40" rx="14" ry="4" fill="#16336b" opacity=".5" />
      <path d="M12 14 Q8 24 12 36 L36 36 Q40 24 36 14 Z" fill="#b06a3b" stroke={O} strokeWidth={SW} />
      <rect x="10" y="19" width="28" height="4" rx="2" fill="#8a4f28" stroke={O} strokeWidth="2" />
      <rect x="10" y="29" width="28" height="4" rx="2" fill="#8a4f28" stroke={O} strokeWidth="2" />
      <path d="M14 16 Q12 24 14 34" stroke="#e8bc85" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Chest({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <ellipse cx="24" cy="41" rx="16" ry="4" fill="#16336b" opacity=".5" />
      <rect x="8" y="20" width="32" height="18" rx="3" fill="#a5673a" stroke={O} strokeWidth={SW} />
      <path d="M8 23 Q8 10 24 10 Q40 10 40 23 Z" fill="#c98a4b" stroke={O} strokeWidth={SW} />
      <rect x="21" y="18" width="6" height="10" rx="2" fill="#f0c93f" stroke={O} strokeWidth="2" />
      <line x1="8" y1="27" x2="40" y2="27" stroke={O} strokeWidth="2" />
    </svg>
  )
}

export function Bottle({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <g transform="rotate(24 24 24)">
        <rect x="19" y="6" width="10" height="6" rx="2" fill="#e8734a" stroke={O} strokeWidth="2.5" />
        <path d="M20 12 L28 12 L30 20 L30 38 Q30 42 26 42 L22 42 Q18 42 18 38 L18 20 Z" fill="#f0946a" stroke={O} strokeWidth={SW} />
        <path d="M21 22 L21 36" stroke="#ffd9c4" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export function Cloth({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path d="M10 16 Q20 8 26 14 Q36 10 38 20 Q42 28 34 32 Q36 40 26 40 Q16 42 12 34 Q4 28 10 16 Z"
        fill="#e8b04b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M16 20 Q22 18 26 22" stroke={O} strokeWidth="1.8" fill="none" opacity=".5" />
      <path d="M18 30 Q24 32 30 28" stroke={O} strokeWidth="1.8" fill="none" opacity=".5" />
    </svg>
  )
}

export function Cone({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <g transform="rotate(12 24 24)">
        <path d="M24 8 L34 38 L14 38 Z" fill="#e8734a" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M19 24 L29 24 L31 30 L17 30 Z" fill="#fff" stroke={O} strokeWidth="2" />
        <rect x="10" y="38" width="28" height="4" rx="2" fill="#c9572e" stroke={O} strokeWidth="2.5" />
      </g>
    </svg>
  )
}

export function SharkFin({ size = 54 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 40">
      <path d="M6 34 Q14 30 20 32 Q22 14 34 6 Q32 20 38 30 Q48 30 54 34"
        fill="#3a4a6b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M4 36 Q16 32 26 35 M34 36 Q46 32 58 36" stroke="#dfeaf5" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function FishIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path d="M8 24 Q18 12 30 16 Q38 19 40 24 Q38 29 30 32 Q18 36 8 24 Z" fill="#6ec6e8" stroke={O} strokeWidth={SW} />
      <path d="M8 24 L2 17 L4 24 L2 31 Z" fill="#4ba8d0" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="33" cy="22" r="2" fill={O} />
      <path d="M18 20 Q22 24 18 28" stroke={O} strokeWidth="1.8" fill="none" opacity=".5" />
    </svg>
  )
}

// ============ 建筑插画 ============
export function BuildingArt({ id, size = 72 }: { id: string; size?: number }) {
  const s = size
  switch (id) {
    case 'fishing_chair':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="10" y="44" width="30" height="8" rx="2" fill="#d9a066" stroke={O} strokeWidth={SW} />
          <rect x="14" y="52" width="4" height="8" fill="#b06a3b" stroke={O} strokeWidth="2" />
          <rect x="32" y="52" width="4" height="8" fill="#b06a3b" stroke={O} strokeWidth="2" />
          <rect x="12" y="26" width="8" height="18" rx="2" fill="#e8734a" stroke={O} strokeWidth="2.5" />
          <path d="M40 46 L54 12" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <path d="M54 12 Q58 26 50 30" stroke="#7fd4e8" strokeWidth="2" fill="none" />
          <circle cx="50" cy="32" r="3" fill="#f0c93f" stroke={O} strokeWidth="2" />
        </svg>
      )
    case 'salvage_boat':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <path d="M8 40 L56 40 L50 54 L14 54 Z" fill="#c9572e" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <rect x="22" y="26" width="20" height="14" rx="2" fill="#e8b04b" stroke={O} strokeWidth="2.5" />
          <path d="M42 26 L54 14" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <circle cx="55" cy="13" r="4" fill="#9aa7b8" stroke={O} strokeWidth="2.5" />
          <path d="M6 58 Q16 54 26 58 M34 58 Q46 54 58 58" stroke="#7fd4e8" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'dive_dock':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="10" y="40" width="44" height="10" rx="3" fill="#d9a066" stroke={O} strokeWidth={SW} />
          <circle cx="32" cy="26" r="14" fill="#e8b04b" stroke={O} strokeWidth={SW} />
          <circle cx="32" cy="26" r="7" fill="#7fd4e8" stroke={O} strokeWidth="2.5" />
          <circle cx="30" cy="24" r="2" fill="#fff" />
          <path d="M46 26 L54 26" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <circle cx="12" cy="58" r="2" fill="#7fd4e8" opacity=".8" />
          <circle cx="20" cy="60" r="1.5" fill="#7fd4e8" opacity=".8" />
        </svg>
      )
    case 'sawmill':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="8" y="30" width="34" height="24" rx="3" fill="#c98a4b" stroke={O} strokeWidth={SW} />
          <path d="M6 32 L25 16 L44 32 Z" fill="#a5673a" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx="48" cy="40" r="10" fill="#c0c8d4" stroke={O} strokeWidth={SW} />
          <circle cx="48" cy="40" r="3" fill={O} />
          {[0, 60, 120, 180, 240, 300].map(a => (
            <line key={a} x1="48" y1="40" x2={48 + 9 * Math.cos(a * Math.PI / 180)} y2={40 + 9 * Math.sin(a * Math.PI / 180)} stroke={O} strokeWidth="2" />
          ))}
          <rect x="14" y="42" width="16" height="6" rx="2" fill="#d9a066" stroke={O} strokeWidth="2" />
        </svg>
      )
    case 'furnace':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <path d="M14 54 L14 26 Q14 14 32 14 Q50 14 50 26 L50 54 Z" fill="#8a4f5a" stroke={O} strokeWidth={SW} />
          <rect x="26" y="8" width="12" height="10" rx="2" fill="#6b3a44" stroke={O} strokeWidth="2.5" />
          <path d="M24 54 L24 40 Q24 34 32 34 Q40 34 40 40 L40 54 Z" fill="#f0c93f" stroke={O} strokeWidth="2.5" />
          <path d="M28 54 L28 44 Q28 40 32 40 Q36 40 36 44 L36 54 Z" fill="#e8734a" />
        </svg>
      )
    case 'food_factory':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="10" y="28" width="44" height="26" rx="3" fill="#5cb86e" stroke={O} strokeWidth={SW} />
          <path d="M8 30 L32 14 L56 30 Z" fill="#e8b04b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <circle cx="32" cy="41" r="8" fill="#fff" stroke={O} strokeWidth="2.5" />
          <path d="M28 41 Q32 36 36 41" stroke="#e8734a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="46" y="18" width="6" height="10" fill="#c9572e" stroke={O} strokeWidth="2" />
        </svg>
      )
    case 'radio':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="16" y="30" width="32" height="24" rx="4" fill="#4b8fe8" stroke={O} strokeWidth={SW} />
          <line x1="40" y1="30" x2="52" y2="10" stroke={O} strokeWidth="3" strokeLinecap="round" />
          <circle cx="52" cy="9" r="3" fill="#e8734a" stroke={O} strokeWidth="2" />
          <circle cx="26" cy="42" r="7" fill="#dfeaf5" stroke={O} strokeWidth="2.5" />
          <circle cx="26" cy="42" r="3" fill={O} />
          <rect x="38" y="36" width="7" height="3" rx="1.5" fill={O} />
          <rect x="38" y="42" width="7" height="3" rx="1.5" fill={O} />
          <rect x="38" y="48" width="7" height="3" rx="1.5" fill={O} />
        </svg>
      )
    case 'command':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="12" y="24" width="40" height="30" rx="3" fill="#6b7a9b" stroke={O} strokeWidth={SW} />
          <path d="M10 26 L32 12 L54 26 Z" fill="#3a4a6b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <rect x="20" y="32" width="10" height="8" rx="1" fill="#7fd4e8" stroke={O} strokeWidth="2" />
          <rect x="36" y="32" width="10" height="8" rx="1" fill="#7fd4e8" stroke={O} strokeWidth="2" />
          <rect x="27" y="44" width="10" height="10" rx="1" fill="#e8b04b" stroke={O} strokeWidth="2" />
          <line x1="32" y1="12" x2="32" y2="4" stroke={O} strokeWidth="2.5" />
          <path d="M32 4 L44 7 L32 10 Z" fill="#e8734a" stroke={O} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      )
    case 'warehouse':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="8" y="26" width="48" height="28" rx="3" fill="#9aa7b8" stroke={O} strokeWidth={SW} />
          <path d="M5 28 L32 12 L59 28 Z" fill="#6b7a9b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <rect x="16" y="34" width="14" height="12" rx="2" fill="#c98a4b" stroke={O} strokeWidth="2.5" />
          <rect x="34" y="38" width="14" height="12" rx="2" fill="#d9a066" stroke={O} strokeWidth="2.5" />
          <rect x="22" y="22" width="20" height="6" rx="2" fill="#f0c93f" stroke={O} strokeWidth="2" />
          <line x1="20" y1="40" x2="26" y2="40" stroke={O} strokeWidth="1.8" opacity=".6" />
          <line x1="38" y1="44" x2="44" y2="44" stroke={O} strokeWidth="1.8" opacity=".6" />
        </svg>
      )
    case 'residence':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64">
          <rect x="12" y="30" width="40" height="24" rx="3" fill="#d9a066" stroke={O} strokeWidth={SW} />
          <path d="M8 32 L32 14 L56 32 Z" fill="#c9572e" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
          <rect x="27" y="40" width="11" height="14" rx="2" fill="#8a5a30" stroke={O} strokeWidth="2.5" />
          <circle cx="42" cy="38" r="4" fill="#7fd4e8" stroke={O} strokeWidth="2" />
          <rect x="44" y="16" width="6" height="12" fill="#9aa7b8" stroke={O} strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}

// 底部导航手绘图标
export function NavIcon({ id, locked }: { id: string; locked?: boolean }) {
  const c = locked ? '#6b7a9b' : O
  const f = locked ? '#3a4a6b' : '#e8b04b'
  const common = { stroke: c, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }
  return (
    <svg width="40" height="40" viewBox="0 0 48 48">
      {id === 'base' && <><path d="M8 36 L40 36 L36 24 L12 24 Z" fill={f} {...common} /><rect x="18" y="12" width="12" height="12" fill={locked ? '#3a4a6b' : '#c9572e'} {...common} /></>}
      {id === 'hero' && <><circle cx="24" cy="18" r="9" fill={f} {...common} /><path d="M10 42 Q14 30 24 30 Q34 30 38 42" fill={locked ? '#3a4a6b' : '#4b8fe8'} {...common} /></>}
      {id === 'bag' && <><rect x="12" y="18" width="24" height="22" rx="4" fill={f} {...common} /><path d="M18 18 Q18 10 24 10 Q30 10 30 18" fill="none" {...common} /></>}
      {id === 'battle' && <><path d="M12 12 L30 30 M30 30 L34 40 L26 34" fill="none" {...common} /><path d="M36 12 L18 30 M18 30 L14 40 L22 34" fill="none" {...common} /><circle cx="12" cy="10" r="3" fill={f} {...common} /><circle cx="36" cy="10" r="3" fill={f} {...common} /></>}
      {id === 'order' && <><rect x="12" y="8" width="24" height="32" rx="3" fill={locked ? '#3a4a6b' : '#dfeaf5'} {...common} /><line x1="17" y1="17" x2="31" y2="17" {...common} strokeWidth="2.5" /><line x1="17" y1="24" x2="31" y2="24" {...common} strokeWidth="2.5" /><path d="M17 31 L20 34 L26 28" fill="none" stroke={locked ? c : '#5cb86e'} strokeWidth="3" strokeLinecap="round" /></>}
      {id === 'map' && <><path d="M8 14 L20 10 L32 14 L42 10 L42 34 L32 38 L20 34 L8 38 Z" fill={locked ? '#3a4a6b' : '#dfeaf5'} {...common} /><path d="M26 18 Q30 16 32 20 Q34 24 30 26" fill="none" stroke={locked ? c : '#e8734a'} strokeWidth="2.5" /><circle cx="30" cy="27" r="1.5" fill={locked ? c : '#e8734a'} /></>}
      {locked && (
        <g>
          <rect x="17" y="22" width="14" height="12" rx="2" fill="#9aa7b8" stroke={O} strokeWidth="2.5" />
          <path d="M20 22 L20 18 Q20 14 24 14 Q28 14 28 18 L28 22" fill="none" stroke={O} strokeWidth="2.5" />
        </g>
      )}
    </svg>
  )
}

export function AvatarFace({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect x="2" y="2" width="60" height="60" rx="10" fill="#2a3f6e" stroke={O} strokeWidth={SW} />
      <circle cx="32" cy="36" r="17" fill="#f0c8a0" stroke={O} strokeWidth={SW} />
      <path d="M15 32 Q12 14 30 12 Q46 10 49 26 Q44 18 38 22 Q40 14 32 16 Q24 12 20 22 Q14 22 15 32 Z" fill="#4a3728" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="26" cy="36" r="2.2" fill={O} />
      <circle cx="39" cy="36" r="2.2" fill={O} />
      <path d="M28 44 Q32 47 37 44" stroke={O} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function StarIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2 L15 9 L22 9.5 L16.8 14 L18.5 21 L12 17 L5.5 21 L7.2 14 L2 9.5 L9 9 Z"
        fill="#f0c93f" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function CoinIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#f0c93f" stroke={O} strokeWidth="2.5" />
      <circle cx="12" cy="12" r="6" fill="#ffe89a" stroke={O} strokeWidth="1.5" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill={O}>$</text>
    </svg>
  )
}

export function DiamondIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M7 3 L17 3 L22 9 L12 21 L2 9 Z" fill="#7fd4f0" stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M2 9 L22 9 M7 3 L10 9 L12 21 M17 3 L14 9 L12 21" stroke={O} strokeWidth="1.4" fill="none" />
    </svg>
  )
}
