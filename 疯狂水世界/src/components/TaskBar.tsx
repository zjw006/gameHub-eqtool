import { TASKS } from '@/data/gameData'
import type { GameState } from '@/types/game'

function RedDot() {
  return (
    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full build-pulse"
      style={{ background: '#e83a2a', border: '2px solid #fff' }} />
  )
}

export function TaskBar({ state, dot, onOpen }: { state: GameState; dot: boolean; onOpen: () => void }) {
  const task = TASKS[state.taskIndex]
  if (!task) {
    return (
      <button onClick={onOpen} className="mx-3 mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2 relative active:scale-[.98]"
        style={{ background: '#1c2a4add', border: '3px solid #0e1a35' }}>
        <span className="text-lg relative">📋{dot && <RedDot />}</span>
        <span className="text-xs font-bold" style={{ color: '#5cb86e' }}>所有引导任务已完成，自由经营吧！</span>
      </button>
    )
  }
  const pct = Math.min(100, (state.taskProgress / task.target) * 100)
  return (
    <button onClick={onOpen} className="mx-3 mb-1.5 flex items-center gap-2 rounded-xl px-3 py-2 relative active:scale-[.98] text-left"
      style={{ background: '#1c2a4add', border: '3px solid #0e1a35', boxShadow: '0 3px 0 rgba(0,0,0,.3)' }}>
      <span className="text-lg relative">📋{dot && <RedDot />}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-white truncate">{task.text(task.target)}</div>
        <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: '#0e1a35' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: '#5cb86e' }} />
        </div>
      </div>
      <span className="text-xs font-black shrink-0" style={{ color: '#f0c93f' }}>
        {Math.min(state.taskProgress, task.target)}/{task.target}
      </span>
    </button>
  )
}
