import { useState } from 'react'
import { ACHIEVEMENTS, BUILDINGS, DAILY_CHEST_REWARD, DAILY_POOL, RES, TASKS, WEEKLY_POOL, islandSlots, type SideTaskDef } from '@/data/gameData'
import type { BuildingId, GameState, ResourceId } from '@/types/game'

const O = '#1c2a4a'

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-end" style={{ zIndex: 60, background: 'rgba(10,20,45,.55)' }} onClick={onClose}>
      <div className="w-full max-h-[72%] flex flex-col rounded-t-3xl overflow-hidden sheet-up"
        style={{ background: 'linear-gradient(180deg,#f5edd6,#e8d5a8)', border: '4px solid #1c2a4a', borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ background: O, borderBottom: '3px solid #0e1a35' }}>
          <span className="font-black text-white text-base tracking-wide">{title}</span>
          <button onClick={onClose} className="w-7 h-7 rounded-full font-black text-sm active:scale-90"
            style={{ background: '#e8734a', color: '#fff', border: '2.5px solid #0e1a35' }}>✕</button>
        </div>
        <div className="overflow-y-auto p-3 flex-1">{children}</div>
      </div>
    </div>
  )
}

function RewardTags({ reward }: { reward: SideTaskDef['reward'] }) {
  return (
    <div className="flex gap-1 mt-1 flex-wrap">
      {Object.entries(reward).map(([k, v]) => (
        <span key={k} className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: '#fff8', color: O, border: '2px solid #1c2a4a44' }}>
          {k === 'xp' ? '✨' : k === 'hourglass' ? '⏳' : RES[k as ResourceId].icon}{v}
        </span>
      ))}
    </div>
  )
}

// 任务状态文本（对齐 task_tip_logic.progress_tip.state_text）
type TaskState = 'not_accept' | 'ongoing' | 'finished_wait_claim' | 'claimed'
const STATE_TEXT: Record<TaskState, { label: string; color: string }> = {
  not_accept: { label: '未接取', color: '#6b7a9b' },
  ongoing: { label: '进行中', color: '#4b8fe8' },
  finished_wait_claim: { label: '待领取', color: '#e8734a' },
  claimed: { label: '已完成', color: '#5cb86e' },
}

function StateBadge({ st }: { st: TaskState }) {
  const s = STATE_TEXT[st]
  return (
    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white shrink-0"
      style={{ background: s.color, border: `2px solid ${O}` }}>{s.label}</span>
  )
}

export function TaskPanel({ state, onClaim, onChest, onBuild, onClose }: {
  state: GameState
  onClaim: (scope: 'daily' | 'weekly', id: string) => void
  onChest: () => void
  onBuild: (id: BuildingId) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'main' | 'daily' | 'weekly' | 'ach'>('main')
  const dailyUnlocked = state.level >= 3
  const weeklyUnlocked = state.level >= 8
  const claimableCount = (scope: 'daily' | 'weekly', pool: SideTaskDef[]) =>
    state.side[scope].ids.filter(id => {
      const def = pool.find(t => t.id === id)!
      return !state.side[scope].claimed[id] && (state.side[scope].progress[id] ?? 0) >= def.target
    }).length
  const tabDot: Record<string, boolean> = {
    daily: claimableCount('daily', DAILY_POOL) > 0 || (!state.side.dailyChest && state.side.daily.ids.every(id => state.side.daily.claimed[id]) && state.side.daily.ids.length > 0),
    weekly: claimableCount('weekly', WEEKLY_POOL) > 0,
  }

  const renderSideTask = (scope: 'daily' | 'weekly', def: SideTaskDef) => {
    const st = state.side[scope]
    const prog = st.progress[def.id] ?? 0
    const done = prog >= def.target
    const claimed = st.claimed[def.id]
    const locked = def.needLevel != null && state.level < def.needLevel
    const taskState: TaskState = claimed ? 'claimed' : done ? 'finished_wait_claim' : 'ongoing'
    return (
      <div key={def.id} className="flex items-center gap-2 rounded-2xl p-2.5"
        style={{ background: locked ? '#c9bda0' : '#fffdf5', border: `3px solid ${O}`, opacity: locked ? .6 : 1 }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm" style={{ color: O }}>{def.name}</span>
            <StateBadge st={taskState} />
          </div>
          {locked
            ? <div className="text-[10px] font-bold mt-0.5" style={{ color: '#c93a1a' }}>🔒 基地 Lv{def.needLevel} 解锁</div>
            : <div className="text-[11px] font-bold mt-0.5" style={{ color: '#5a4a30' }}>进度 {Math.min(prog, def.target)}/{def.target}</div>}
          <RewardTags reward={def.reward} />
        </div>
        <button disabled={!done || claimed || locked} onClick={() => onClaim(scope, def.id)}
          className="shrink-0 px-3 py-2 rounded-xl font-black text-sm text-white active:scale-90 disabled:opacity-40"
          style={{ background: done && !claimed ? '#e8734a' : '#9aa7b8', border: `3px solid ${O}`, boxShadow: '0 3px 0 #0e1a35' }}>
          {claimed ? '已领' : '领取'}
        </button>
      </div>
    )
  }

  return (
    <Sheet title="📋 任务" onClose={onClose}>
      <div className="flex gap-1.5 mb-3">
        {([['main', '主线'], ['daily', '每日'], ['weekly', '每周'], ['ach', '成就']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-xl font-black text-xs active:scale-95 relative"
            style={{ background: tab === t ? O : '#fffdf5', color: tab === t ? '#f0c93f' : O, border: `3px solid ${O}` }}>
            {label}
            {tabDot[t] && tab !== t && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#e83a2a', border: '2px solid #fff' }} />
            )}
          </button>
        ))}
      </div>

      {tab === 'main' && (
        <div className="flex flex-col gap-2">
          {TASKS.map((t, i) => {
            const st: TaskState = i < state.taskIndex ? 'claimed' : i === state.taskIndex ? 'ongoing' : 'not_accept'
            return (
              <div key={t.id} className="flex items-center gap-2 rounded-2xl p-2.5"
                style={{ background: st === 'ongoing' ? '#fffdf5' : '#e8dcb8', border: `3px solid ${O}`, opacity: st === 'not_accept' ? .55 : 1 }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm" style={{ color: O }}>{t.text(t.target)}</span>
                    <StateBadge st={st} />
                  </div>
                  {st === 'ongoing' && (
                    <div className="text-[11px] font-bold mt-0.5" style={{ color: '#5a4a30' }}>
                      进度 {Math.min(state.taskProgress, t.target)}/{t.target}
                    </div>
                  )}
                  {/* 建造类主线：一键建造，直接落格无需再点岛上加号 */}
                  {st === 'ongoing' && t.metric.startsWith('build:') && (() => {
                    const bdef = BUILDINGS.find(b => b.id === t.metric.slice(6))!
                    const preName = bdef.precondition ? BUILDINGS.find(x => x.id === bdef.precondition)!.name : null
                    const preMissing = preName ? !state.buildings.some(x => x.buildingId === bdef.precondition) : false
                    const lvLocked = state.level < bdef.unlockLevel
                    const afford = Object.entries(bdef.cost).every(([k, v]) => state.resources[k as ResourceId] >= (v ?? 0))
                    const costText = Object.entries(bdef.cost).map(([k, v]) => `${RES[k as ResourceId].icon}${v}`).join(' ')
                    // 地标不占格；普通建筑格子满且未建过同类时不可一键建造
                    const gridFull = !bdef.landmark && !state.buildings.some(x => x.buildingId === bdef.id) &&
                      state.buildings.filter(x => !BUILDINGS.find(d => d.id === x.buildingId)!.landmark).length >= islandSlots(state.level)
                    if (lvLocked) return <div className="text-[10px] font-bold mt-1" style={{ color: '#c93a1a' }}>🔒 基地 Lv{bdef.unlockLevel} 解锁「{bdef.name}」</div>
                    if (preMissing) return <div className="text-[10px] font-bold mt-1" style={{ color: '#c93a1a' }}>🔒 需先建造「{preName}」</div>
                    if (gridFull) return <div className="text-[10px] font-bold mt-1" style={{ color: '#c93a1a' }}>🔒 岛屿格子已满，基地升级可扩建</div>
                    return (
                      <button disabled={!afford} onClick={() => onBuild(bdef.id)}
                        className="mt-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black text-white active:scale-90 disabled:opacity-50"
                        style={{ background: afford ? '#5cb86e' : '#9aa7b8', border: `2.5px solid ${O}`, boxShadow: '0 2px 0 #0e1a35' }}>
                        ⚒️ 立即建造（{costText}）{!afford && ' · 材料不足'}
                      </button>
                    )
                  })()}
                  {st === 'not_accept' && <div className="text-[10px] mt-0.5" style={{ color: '#5a4a30' }}>完成前置主线后解锁</div>}
                  <RewardTags reward={t.reward} />
                </div>
              </div>
            )
          })}
          {state.taskIndex >= TASKS.length && (
            <p className="text-center text-xs font-bold py-2" style={{ color: '#5cb86e' }}>🎉 主线已全部完成，更多章节敬请期待</p>
          )}
        </div>
      )}

      {tab === 'daily' && (
        !dailyUnlocked ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔒</div>
            <p className="font-black" style={{ color: O }}>基地 Lv3 解锁每日任务</p>
            <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>每日00:00刷新一组任务，全完成可领额外宝箱</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: '#e8dcb8', border: `2.5px solid ${O}` }}>
              <span className="text-[11px] font-bold" style={{ color: O }}>
                今日进度 {state.side.daily.ids.filter(id => state.side.daily.claimed[id]).length}/{state.side.daily.ids.length}
              </span>
              <button onClick={onChest}
                disabled={state.side.dailyChest || !state.side.daily.ids.every(id => state.side.daily.claimed[id])}
                className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white active:scale-90 disabled:opacity-40"
                style={{ background: '#f0c93f', color: O, border: `2.5px solid ${O}` }}>
                {state.side.dailyChest ? '宝箱已领' : `🧰 全完成宝箱（🪙${DAILY_CHEST_REWARD.gold} 📐${DAILY_CHEST_REWARD.blueprint}）`}
              </button>
            </div>
            {state.side.daily.ids.map(id => renderSideTask('daily', DAILY_POOL.find(t => t.id === id)!))}
          </div>
        )
      )}

      {tab === 'weekly' && (
        !weeklyUnlocked ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🔒</div>
            <p className="font-black" style={{ color: O }}>基地 Lv8 解锁每周任务</p>
            <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>周一00:00刷新，奖励比每日更丰厚</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {state.side.weekly.ids.map(id => renderSideTask('weekly', WEEKLY_POOL.find(t => t.id === id)!))}
          </div>
        )
      )}

      {tab === 'ach' && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-center" style={{ color: '#5a4a30' }}>成就无需接取，达成里程碑自动发放奖励</p>
          {ACHIEVEMENTS.map(a => {
            const done = state.side.claimedAch.includes(a.id)
            return (
              <div key={a.id} className="flex items-center gap-2 rounded-2xl p-2.5"
                style={{ background: done ? '#e8dcb8' : '#fffdf5', border: `3px solid ${done ? '#5cb86e' : O}` }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm" style={{ color: O }}>{a.name}</span>
                    <span className="text-[9px] font-bold px-1.5 rounded-full text-white" style={{ background: '#9b6ee8' }}>{a.group}</span>
                  </div>
                  <RewardTags reward={a.reward} />
                </div>
                <span className="text-[11px] font-black shrink-0" style={{ color: done ? '#5cb86e' : '#6b7a9b' }}>
                  {done ? '✓ 已领取' : '未达成'}
                </span>
              </div>
            )
          })}
          <div className="rounded-2xl p-2.5 text-center" style={{ background: '#c9bda0', border: `3px dashed ${O}`, opacity: .7 }}>
            <span className="text-xs font-black" style={{ color: '#6b7a9b' }}>🤝 联盟任务 · 基地 Lv16 解锁</span>
          </div>
        </div>
      )}
    </Sheet>
  )
}
