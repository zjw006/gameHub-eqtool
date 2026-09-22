import { XP_PER_LEVEL } from '@/data/gameData'
import { popCap } from '@/hooks/useGameState'
import type { GameState } from '@/types/game'
import { AvatarFace, CoinIcon, DiamondIcon, StarIcon } from './art'

function Bar({ children, width }: { children: React.ReactNode; width?: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full pl-1 pr-2.5 h-7"
      style={{ background: '#1c2a4a', border: '2.5px solid #0e1a35', minWidth: width ?? 76, boxShadow: '0 2px 0 rgba(0,0,0,.3)' }}>
      {children}
    </div>
  )
}

export function Hud({ state }: { state: GameState }) {
  const xpPct = Math.min(100, (state.xp / XP_PER_LEVEL(state.level)) * 100)
  return (
    <div className="relative px-2 pt-2 pb-1 flex items-start gap-2" style={{ zIndex: 40 }}>
      <div className="relative shrink-0">
        <AvatarFace size={52} />
        <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full px-1.5"
          style={{ background: '#1c2a4a', border: '2px solid #0e1a35' }}>
          <StarIcon size={14} />
          <span className="text-[11px] font-black text-white">{state.level}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* 经验条 */}
        <div className="relative h-4 rounded-full overflow-hidden" style={{ background: '#1c2a4a', border: '2.5px solid #0e1a35' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg,#f0a93f,#f0c93f)' }} />
          <span className="absolute inset-0 text-center text-[10px] font-black text-white leading-4" style={{ textShadow: '0 1px 0 #000' }}>
            经验 {state.xp}/{XP_PER_LEVEL(state.level)}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Bar><CoinIcon size={16} /><span className="text-xs font-black text-white">{state.resources.gold}</span></Bar>
          <Bar><DiamondIcon size={16} /><span className="text-xs font-black text-white">{state.resources.diamond}</span></Bar>
          <Bar width={64}>
            <span className="text-sm">👥</span>
            <span className="text-xs font-black text-white">{state.population}/{popCap(state)}</span>
          </Bar>
          <Bar width={76}>
            <span className="text-sm">🍖</span>
            <div className="w-10 h-2.5 rounded-full overflow-hidden" style={{ background: '#0e1a35' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${state.satiety}%`,
                  background: state.satiety < 20 ? '#e8734a' : state.satiety < 60 ? '#e8b04b' : '#5cb86e',
                }} />
            </div>
          </Bar>
        </div>
      </div>
    </div>
  )
}
