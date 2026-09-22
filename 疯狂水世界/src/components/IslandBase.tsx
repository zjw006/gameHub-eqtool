import { BUILDINGS, islandSlots } from '@/data/gameData'
import type { PlacedBuilding } from '@/types/game'
import { BuildingArt } from './art'

// 单个建筑格（普通格 / 地标位共用）
function BuildingCell({ b, onSelect, landmark }: { b: PlacedBuilding; onSelect: () => void; landmark?: boolean }) {
  const def = BUILDINGS.find(d => d.id === b.buildingId)!
  const full = !b.pending && def.intervalSec && (b.progress ?? 0) >= 1
  return (
    <button onClick={onSelect}
      className={`rounded-xl relative flex flex-col items-center justify-center overflow-hidden active:scale-95 ${landmark ? 'w-full h-full' : 'aspect-square'}`}
      style={{
        background: landmark ? 'linear-gradient(180deg,#ffe9b0,#f0d489)' : '#f0e5c4',
        border: landmark ? '3px solid #a8722a' : '3px solid #1c2a4a',
      }}>
      <BuildingArt id={b.buildingId} size={landmark ? 44 : 52} />
      {def.intervalSec && !b.pending && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: '#1c2a4a33' }}>
          <div className="h-full transition-all duration-1000" style={{ width: `${(b.progress ?? 0) * 100}%`, background: full ? '#e8734a' : '#5cb86e' }} />
        </div>
      )}
      <span className="absolute top-0.5 left-1 text-[10px] font-black" style={{ color: '#1c2a4a' }}>{def.name}</span>
      <span className="absolute top-0.5 right-1 text-[9px] font-black px-1 rounded-full text-white"
        style={{ background: '#4b8fe8', border: '1.5px solid #1c2a4a' }}>Lv{b.level}</span>
      {(b.count || 1) > 1 && (
        <span className="absolute bottom-1.5 left-1 text-[9px] font-black px-1 rounded-full text-white"
          style={{ background: '#9b59c8', border: '1.5px solid #1c2a4a' }}>×{b.count}</span>
      )}
      {b.pending && (
        <span className="absolute bottom-1.5 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white build-pulse"
          style={{ background: '#e8b04b', border: '2px solid #1c2a4a' }}>收</span>
      )}
      {full && (
        <span className="absolute bottom-1.5 right-1 px-1 rounded-full text-[9px] font-black text-white"
          style={{ background: '#e8734a', border: '2px solid #1c2a4a' }}>满仓</span>
      )}
    </button>
  )
}

// 浮岛基地：地标位（广播站/指挥中心）+ 木筏平台格子（随基地等级扩建）
export function IslandBase({ buildings, level, onOpenBuild, onSelectBuilding }: {
  buildings: PlacedBuilding[]
  level: number
  onOpenBuild: () => void
  onSelectBuilding: (b: PlacedBuilding) => void
}) {
  const cap = islandSlots(level)
  const gridBuildings = buildings.filter(b => b.slot >= 0)
  const slots = Array.from({ length: cap }, (_, i) => gridBuildings.find(b => b.slot === i))
  const nextEmpty = slots.findIndex(b => !b)
  const landmarkDefs = BUILDINGS.filter(d => d.landmark)

  return (
    <div className="relative w-full" style={{ zIndex: 20 }}>
      {/* 地标位：广播站 / 指挥中心（不占普通格子） */}
      <div className="mx-3 grid grid-cols-2 gap-1.5">
        {landmarkDefs.map(def => {
          const b = buildings.find(x => x.buildingId === def.id)
          if (b) return <BuildingCell key={def.id} b={b} landmark onSelect={() => onSelectBuilding(b)} />
          return (
            <div key={def.id} className="h-14 rounded-xl flex flex-col items-center justify-center"
              style={{ background: 'rgba(20,35,70,.35)', border: '3px dashed rgba(240,210,130,.5)' }}>
              <span className="text-[10px] font-black" style={{ color: '#f0d282' }}>🏛️ {def.name}·地标位</span>
              <span className="text-[9px] font-bold" style={{ color: '#cfe6ff' }}>基地 Lv{def.unlockLevel} 解锁</span>
            </div>
          )
        })}
      </div>
      {/* 木筏平台 */}
      <div className="mx-3 mt-2 relative">
        <svg viewBox="0 0 400 30" className="w-full absolute -bottom-3 left-0" preserveAspectRatio="none" style={{ height: 26 }}>
          <path d="M4 6 L396 6 L388 26 L12 26 Z" fill="#8a5a30" stroke="#1c2a4a" strokeWidth="4" strokeLinejoin="round" />
          {[40, 90, 140, 190, 240, 290, 340].map(x => (
            <line key={x} x1={x} y1="7" x2={x - 4} y2="25" stroke="#6b4020" strokeWidth="2.5" />
          ))}
          <path d="M4 6 L396 6 L393 14 L7 14 Z" fill="#d9a066" opacity=".8" />
        </svg>
        <div className="rounded-2xl px-2 pt-2 pb-4"
          style={{
            background: 'linear-gradient(180deg,#e8d5a8 0%,#d9c08f 100%)',
            border: '4px solid #1c2a4a',
            boxShadow: '0 6px 0 rgba(20,35,70,.45)',
          }}>
          <div className="grid grid-cols-4 gap-1.5">
            {slots.map((b, i) => {
              if (!b) {
                const isNext = i === nextEmpty
                return (
                  <button key={i} onClick={isNext ? onOpenBuild : undefined}
                    className={`aspect-square rounded-xl flex items-center justify-center relative ${isNext ? 'cursor-pointer build-pulse' : 'opacity-60'}`}
                    style={{
                      background: isNext ? '#c9b184' : '#bfaa7e',
                      border: `3px dashed ${isNext ? '#1c2a4a' : '#8a7a58'}`,
                    }}>
                    {isNext && <span className="text-2xl font-black" style={{ color: '#1c2a4a' }}>＋</span>}
                  </button>
                )
              }
              return <BuildingCell key={b.uid} b={b} onSelect={() => onSelectBuilding(b)} />
            })}
          </div>
          <div className="text-center text-[10px] font-bold mt-1.5" style={{ color: '#7a6844' }}>
            岛屿格子 {gridBuildings.length}/{cap} · 基地升级可扩建
          </div>
        </div>
      </div>
    </div>
  )
}
