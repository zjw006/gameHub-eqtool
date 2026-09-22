import { NAV_ITEMS, type NavId } from '@/data/gameData'
import { NavIcon } from './art'

export function BottomNav({ level, active, onSelect, dots }: {
  level: number
  active: NavId | null
  onSelect: (id: NavId) => void
  dots?: Partial<Record<NavId, boolean>>
}) {
  return (
    <div className="relative flex items-end justify-around px-1 pt-1 pb-2"
      style={{
        zIndex: 40,
        background: 'linear-gradient(180deg,#2a3f6e,#1c2a4a)',
        borderTop: '4px solid #0e1a35',
      }}>
      {NAV_ITEMS.map(item => {
        const locked = level < item.unlockLevel
        const isActive = active === item.id
        return (
          <button key={item.id}
            onClick={() => !locked && onSelect(item.id)}
            className="flex flex-col items-center gap-0.5 px-1 transition-transform active:scale-90"
            style={{ opacity: locked ? 0.75 : 1 }}>
            <div className="rounded-xl p-1 transition-all relative"
              style={{
                background: isActive ? '#f0c93f' : 'transparent',
                transform: isActive ? 'translateY(-6px) scale(1.08)' : 'none',
                border: isActive ? '3px solid #1c2a4a' : '3px solid transparent',
              }}>
              <NavIcon id={item.icon} locked={locked} />
              {dots?.[item.id] && !locked && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full build-pulse"
                  style={{ background: '#e83a2a', border: '2px solid #fff' }} />
              )}
            </div>
            <span className="text-[10px] font-black"
              style={{ color: isActive ? '#f0c93f' : locked ? '#6b7a9b' : '#dfeaf5' }}>
              {item.name}{locked ? ` Lv${item.unlockLevel}` : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
