import { useEffect, useMemo, useState } from 'react'
import { useGameState, orderDot, taskDot } from '@/hooks/useGameState'
import { TASKS, RES, MINIGAMES, type NavId } from '@/data/gameData'
import type { MiniGameDef } from '@/data/gameData'
import type { PlacedBuilding, ResourceId } from '@/types/game'
import { FishingGame, MinigamePanel, SalvageGame, TapGame } from '@/components/Minigames'
import { OceanScene } from '@/components/OceanScene'
import { IslandBase } from '@/components/IslandBase'
import { Hud } from '@/components/Hud'
import { TaskBar } from '@/components/TaskBar'
import { BottomNav } from '@/components/BottomNav'
import { TaskPanel } from '@/components/TaskPanel'
import { BagPanel, BattlePanel, BuildPanel, BuildingSheet, HeroPanel, MapPanel, OrderPanel } from '@/components/panels'

type PanelId = NavId | 'build' | 'task'

// 悬浮提示：按优先级（可领取奖励 > 优质订单 > 主线目标）给一句话提示 +【前往】
interface FloatTipData { id: string; text: string; target: PanelId | 'minigames' | null; tab?: 'order' | 'job' }
function floatTip(state: ReturnType<typeof useGameState>['state']): FloatTipData | null {
  if (state.popTip) return null
  if (taskDot(state)) return { id: 'claim', text: '有任务奖励待领取，别忘领！', target: 'task' }
  if (orderDot(state)) return { id: 'fine', text: '订单列表刷出了优质订单，奖励×1.6！', target: 'order' }
  const t = TASKS[state.taskIndex]
  if (!t) return null
  if (t.metric.startsWith('build:')) return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'build' }
  if (t.metric.startsWith('assign:')) return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'order', tab: 'job' }
  if (t.metric === 'order') return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'order' }
  if (t.metric === 'stage') return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'battle' }
  if (t.metric === 'recruit') return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'hero' }
  if (t.metric === 'fish') return { id: t.id, text: `主线：${t.text(t.target)}`, target: 'minigames' }
  return null
}

// 一次性弹窗内容
interface PopData { icon: string; title: string; desc: string; rewards?: [string, number][]; nextText?: string }
function popContent(popTip: string): PopData {
  if (popTip.startsWith('done:')) {
    // 主线完成奖励结算
    const t = TASKS.find(x => x.id === popTip.slice(5))
    if (t) {
      const next = TASKS[TASKS.indexOf(t) + 1]
      return {
        icon: '🎉', title: '任务完成！', desc: t.text(t.target),
        rewards: Object.entries(t.reward) as [string, number][],
        nextText: next ? `下一任务：${next.text(next.target)}` : '🏆 主线已全部完成！',
      }
    }
  }
  if (popTip.startsWith('sys:')) {
    const id = popTip.slice(4)
    if (id === 'radio') return { icon: '📻', title: '广播站建成！', desc: '英雄招募与海域闯关已解锁，去组建你的小队吧' }
    if (id === 'command') return { icon: '🗼', title: '指挥中心建成！', desc: '英雄委任已解锁，派驻英雄获得生产加成' }
    if (id === 'warehouse') return { icon: '📦', title: '仓库建成！', desc: '资源存储上限提升，升级仓库可继续扩容' }
  }
  const t = TASKS.find(x => x.id === popTip)
  if (t) return { icon: '🎯', title: '新主线任务', desc: t.text(t.target) }
  return { icon: '🎯', title: '新任务', desc: popTip }
}

export default function Home() {
  const { state, toasts, collectDebris, build, upgradeBuilding, collectBuilding, submitOrder, refreshOrders, recruit, teamPower, fight, assignJob, assignHero, unassignHero, replenish, startMinigame, finishMinigame, useFlare, claimSideTask, claimDailyChest, dismissPop } = useGameState()
  const [panel, setPanel] = useState<PanelId | null>(null)
  const [showMinigames, setShowMinigames] = useState(false)
  const [activeGame, setActiveGame] = useState<MiniGameDef | null>(null)
  const [selectedUid, setSelectedUid] = useState<number | null>(null)
  const [dismissedTip, setDismissedTip] = useState<string | null>(null)
  const [orderInitTab, setOrderInitTab] = useState<'order' | 'job'>('order')
  const selected = state.buildings.find(b => b.uid === selectedUid) ?? null

  const tip = useMemo(() => floatTip(state), [state])
  useEffect(() => { setDismissedTip(null) }, [tip?.id]) // 提示内容变化时重新显示

  const startGame = (def: MiniGameDef) => {
    startMinigame(def.id, def.cdSec)
    setShowMinigames(false)
    setActiveGame(def)
  }

  const onSelectBuilding = (b: PlacedBuilding) => {
    setSelectedUid(b.uid) // 统一打开详情：待收取时在详情内一键收取，也方便升级
  }

  const goTip = (target: FloatTipData['target']) => {
    if (tip?.tab) setOrderInitTab(tip.tab)
    if (target === 'minigames') setShowMinigames(true)
    else if (target) setPanel(target)
    setDismissedTip(tip?.id ?? null)
  }

  const pop = state.popTip ? popContent(state.popTip) : null

  // 调试直达：?mg=MG002 直接开局对应小游戏；?mlist=1 打开小游戏面板（便于测试）
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const mg = q.get('mg')
    if (mg) {
      const def = MINIGAMES.find(m => m.id === mg)
      if (def) startGame(def)
    } else if (q.get('mlist')) {
      setShowMinigames(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: '#0c1830' }}>
      {/* 手机画框 */}
      <div className="relative w-full max-w-[430px] h-dvh flex flex-col overflow-hidden"
        style={{ fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
        <Hud state={state} />
        <IslandBase buildings={state.buildings} level={state.level} onOpenBuild={() => setPanel('build')} onSelectBuilding={onSelectBuilding} />
        {/* 海洋区域 */}
        <div className="relative flex-1 mt-3">
          <OceanScene onCollect={collectDebris} />
          {/* 操作提示 */}
          {state.debrisCollected < 5 && (
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 pointer-events-none text-center" style={{ zIndex: 25 }}>
              <div className="text-3xl hand-tap">👆</div>
              <div className="text-xs font-black text-white mt-1" style={{ textShadow: '0 2px 0 #1c2a4a' }}>点击漂浮物打捞资源</div>
            </div>
          )}
          {/* 小游戏入口 */}
          <button onClick={() => setShowMinigames(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-2 rounded-2xl font-black text-xs text-white active:scale-90"
            style={{ zIndex: 30, background: 'linear-gradient(180deg,#9b6ee8,#7a4ec9)', border: '3px solid #1c2a4a', boxShadow: '0 3px 0 #0e1a35' }}>
            🎮 小游戏
          </button>
        </div>
        {/* 悬浮任务提示 */}
        {tip && dismissedTip !== tip.id && (
          <div className="mx-3 mb-1.5 flex items-center gap-2 rounded-xl px-3 py-1.5 sheet-up"
            style={{ background: '#f0c93fee', border: '3px solid #1c2a4a' }}>
            <span className="text-sm">💡</span>
            <span className="flex-1 min-w-0 text-[11px] font-black truncate" style={{ color: '#1c2a4a' }}>{tip.text}</span>
            {tip.target && (
              <button onClick={() => goTip(tip.target)}
                className="shrink-0 px-2.5 py-0.5 rounded-lg text-[11px] font-black text-white active:scale-90"
                style={{ background: '#4b8fe8', border: '2px solid #1c2a4a' }}>前往</button>
            )}
            <button onClick={() => setDismissedTip(tip.id)}
              className="shrink-0 text-[11px] font-black px-1" style={{ color: '#1c2a4a' }}>✕</button>
          </div>
        )}
        <TaskBar state={state} dot={taskDot(state)} onOpen={() => setPanel('task')} />
        <BottomNav level={state.level} active={panel as NavId | null}
          dots={{ order: orderDot(state) }}
          onSelect={id => { setOrderInitTab('order'); setPanel(p => (p === id ? null : id)) }} />

        {/* 面板 */}
        {panel === 'build' && <BuildPanel state={state} onBuild={build} onClose={() => setPanel(null)} />}
        {panel === 'task' && <TaskPanel state={state} onClaim={claimSideTask} onChest={claimDailyChest} onBuild={build} onClose={() => setPanel(null)} />}
        {panel === 'bag' && <BagPanel state={state} onClose={() => setPanel(null)} />}
        {panel === 'order' && <OrderPanel state={state} initTab={orderInitTab} onSubmit={submitOrder} onAssignJob={assignJob} onReplenish={replenish} onRefresh={refreshOrders} onClose={() => setPanel(null)} />}
        {panel === 'hero' && <HeroPanel state={state} onRecruit={recruit} onAssignHero={assignHero} onUnassign={unassignHero} onClose={() => setPanel(null)} />}
        {panel === 'battle' && <BattlePanel state={state} teamPower={teamPower()} onFight={fight} onClose={() => setPanel(null)} />}
        {panel === 'map' && <MapPanel onClose={() => setPanel(null)} />}
        {selected && (
          <BuildingSheet state={state} pb={selected}
            onUpgrade={uid => upgradeBuilding(uid)}
            onCollect={uid => { collectBuilding(uid); setSelectedUid(null) }}
            onClose={() => setSelectedUid(null)} />
        )}
        {showMinigames && (
          <MinigamePanel state={state} onStart={startGame} onFlare={useFlare} onClose={() => setShowMinigames(false)} />
        )}
        {activeGame && (
          activeGame.mode === 'fishing'
            ? <FishingGame def={activeGame} onDone={perf => { finishMinigame(activeGame.id, perf); setActiveGame(null) }} />
            : activeGame.mode === 'salvage'
              ? <SalvageGame def={activeGame} onDone={perf => { finishMinigame(activeGame.id, perf); setActiveGame(null) }} />
              : <TapGame def={activeGame} onDone={perf => { finishMinigame(activeGame.id, perf); setActiveGame(null) }} />
        )}

        {/* 一次性引导弹窗 */}
        {pop && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 70, background: 'rgba(10,20,45,.6)' }}>
            <div className="mx-8 w-full max-w-[320px] rounded-3xl p-5 text-center sheet-up"
              style={{ background: 'linear-gradient(180deg,#f5edd6,#e8d5a8)', border: '4px solid #1c2a4a', boxShadow: '0 8px 0 rgba(14,26,53,.6)' }}>
              <div className="text-5xl mb-2">{pop.icon}</div>
              <div className="font-black text-lg" style={{ color: '#1c2a4a' }}>{pop.title}</div>
              <div className="text-xs font-bold mt-1.5" style={{ color: '#5a4a30' }}>{pop.desc}</div>
              {pop.rewards && (
                <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
                  {pop.rewards.map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-0.5 text-[11px] font-black px-2 py-1 rounded-lg"
                      style={{ background: '#fff8', color: '#1c2a4a', border: '2px solid #1c2a4a' }}>
                      {k === 'xp' ? '✨' : RES[k as ResourceId].icon}{v}
                    </span>
                  ))}
                </div>
              )}
              {pop.nextText && (
                <div className="text-[11px] font-black mt-2.5" style={{ color: '#4b8fe8' }}>{pop.nextText}</div>
              )}
              <button onClick={dismissPop}
                className="mt-4 w-full py-2.5 rounded-2xl font-black text-white active:scale-95"
                style={{ background: 'linear-gradient(180deg,#5cb86e,#3e9450)', border: '3px solid #1c2a4a', boxShadow: '0 4px 0 #0e1a35' }}>
                知道了
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className="absolute top-24 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none" style={{ zIndex: 80 }}>
          {toasts.map(t => (
            <div key={t.id} className="toast-in px-4 py-1.5 rounded-full text-xs font-black text-white"
              style={{ background: '#1c2a4aee', border: `2.5px solid ${t.color}`, textShadow: '0 1px 0 #000' }}>
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
