import { WAVES } from '../game/data'

interface Props {
  wave: number
  time: number
  speed: number
  paused: boolean
  onToggleSpeed: () => void
  onTogglePause: () => void
  onQuit: () => void
}

function fmt(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function HUD({ wave, time, speed, paused, onToggleSpeed, onTogglePause, onQuit }: Props) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-start justify-between px-3 pt-2">
        <div className="flex gap-2 pointer-events-auto">
          <button
            onClick={onTogglePause}
            className="w-10 h-10 rounded-lg bg-black/50 text-white font-bold text-lg active:scale-90"
          >
            {paused ? '▶' : '⏸'}
          </button>
          <button
            onClick={onToggleSpeed}
            className="h-10 px-3 rounded-lg bg-black/50 text-amber-300 font-bold text-sm active:scale-90"
          >
            x{speed}
          </button>
        </div>
        <div className="text-center">
          <div
            className="text-2xl font-black tracking-wider"
            style={{ color: '#ffe14a', textShadow: '0 2px 0 #7a5b10, 0 0 12px rgba(0,0,0,0.6)' }}
          >
            第{wave}/{WAVES.length}波
          </div>
          <div className="text-white/80 text-xs font-mono">{fmt(time)}</div>
        </div>
        <button
          onClick={onQuit}
          className="h-10 px-3 rounded-lg bg-black/50 text-white/80 text-sm pointer-events-auto active:scale-90"
        >
          退出
        </button>
      </div>
    </div>
  )
}
