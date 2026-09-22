import { useState } from 'react'
import { ASSIGN_SLOTS, ASSIGN_TAG_EFFECT, BUILDINGS, CAPPED_RESOURCES, HEROES, JOBS, MAX_BUILDING_LV, RECRUIT_COST, RES, STAGE_ENEMIES, UPGRADE_COST, islandSlots, levelSpeedMult } from '@/data/gameData'
import { efficiency, isAuto, resCap } from '@/hooks/useGameState'
import type { BuildingId, GameState, JobId, PlacedBuilding, ResourceId } from '@/types/game'
import { BuildingArt, CoinIcon } from './art'

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

function CostTag({ id, n, enough }: { id: ResourceId; n: number; enough: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md"
      style={{ background: enough ? '#fff8' : '#e8734a33', color: enough ? O : '#c93a1a', border: `2px solid ${enough ? '#1c2a4a44' : '#c93a1a'}` }}>
      {RES[id].icon}{n}
    </span>
  )
}

// ============ 建造面板 ============
export function BuildPanel({ state, onBuild, onClose }: {
  state: GameState
  onBuild: (id: (typeof BUILDINGS)[number]['id']) => void
  onClose: () => void
}) {
  return (
    <Sheet title="🏗️ 建造建筑" onClose={onClose}>
      <div className="grid grid-cols-1 gap-2">
        {BUILDINGS.map(b => {
          const locked = state.level < b.unlockLevel
          const preName = b.precondition ? BUILDINGS.find(x => x.id === b.precondition)!.name : null
          const preMissing = preName ? !state.buildings.some(x => x.buildingId === b.precondition) : false
          const afford = Object.entries(b.cost).every(([k, v]) => state.resources[k as ResourceId] >= (v ?? 0))
          const built = state.buildings.filter(x => x.buildingId === b.id).reduce((a, x) => a + (x.count || 1), 0)
          // 格子满时同类仍可叠加；地标建筑（广播站/指挥中心）不占格子永远可放
          const cap = islandSlots(state.level)
          const gridUsed = state.buildings.filter(x => !BUILDINGS.find(d => d.id === x.buildingId)!.landmark).length
          const full = !b.landmark && gridUsed >= cap && built === 0
          const blocked = locked || preMissing
          return (
            <div key={b.id} className="flex items-center gap-3 rounded-2xl p-2.5"
              style={{ background: blocked ? '#c9bda0' : '#fffdf5', border: `3px solid ${O}`, opacity: blocked ? .7 : 1 }}>
              <div className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ background: '#e8dcb8', border: `2.5px solid ${O}`, filter: blocked ? 'grayscale(1)' : 'none' }}>
                <BuildingArt id={b.id} size={52} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm" style={{ color: O }}>{b.name}</span>
                  <span className="text-[10px] font-bold px-1.5 rounded-full text-white"
                    style={{ background: b.category === '采集' ? '#4b8fe8' : b.category === '加工' ? '#e8734a' : '#9b6ee8' }}>
                    {b.category}
                  </span>
                  {built > 0 && <span className="text-[10px] font-bold" style={{ color: '#5cb86e' }}>已建×{built}</span>}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: '#5a4a30' }}>{b.desc}</div>
                {preName && (
                  <div className="text-[10px] mt-0.5 font-bold" style={{ color: preMissing ? '#c93a1a' : '#5cb86e' }}>
                    {preMissing ? `🔒 前置：需先建造「${preName}」` : `✓ 前置「${preName}」已就绪`}
                  </div>
                )}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(b.cost).map(([k, v]) => (
                    <CostTag key={k} id={k as ResourceId} n={v!} enough={state.resources[k as ResourceId] >= (v ?? 0)} />
                  ))}
                </div>
              </div>
              <button
                disabled={blocked || !afford || full}
                onClick={() => onBuild(b.id)}
                className="shrink-0 px-3 py-2 rounded-xl font-black text-sm text-white active:scale-90 disabled:opacity-50"
                style={{ background: blocked ? '#6b7a9b' : afford && !full ? '#5cb86e' : '#9aa7b8', border: `3px solid ${O}`, boxShadow: '0 3px 0 #0e1a35' }}>
                {locked ? `Lv${b.unlockLevel}` : preMissing ? '前置' : full ? '满' : '建造'}
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] mt-3 text-center" style={{ color: '#5a4a30' }}>
        岛屿格子随基地等级扩建（Lv1 六格 → Lv9 封顶十格，当前 {islandSlots(state.level)} 格）；
        广播站/指挥中心为地标建筑不占格子；同类建筑叠加数量 ×N，不占用新格子
      </p>
    </Sheet>
  )
}

// ============ 建筑详情 / 升级 ============
export function BuildingSheet({ state, pb, onUpgrade, onCollect, onClose }: {
  state: GameState
  pb: PlacedBuilding
  onUpgrade: (uid: number) => void
  onCollect: (uid: number) => void
  onClose: () => void
}) {
  const def = BUILDINGS.find(b => b.id === pb.buildingId)!
  const auto = isAuto(pb, def, state)
  const maxed = pb.level >= MAX_BUILDING_LV
  const cnt = pb.count || 1
  const upCost = Object.fromEntries(Object.entries(UPGRADE_COST(pb.level)).map(([k, v]) => [k, (v ?? 0) * cnt])) as ReturnType<typeof UPGRADE_COST>
  const afford = Object.entries(upCost).every(([k, v]) => state.resources[k as ResourceId] >= (v ?? 0))
  const cap = resCap(state)
  const outputFull = def.output && Object.keys(def.output).some(k =>
    CAPPED_RESOURCES.includes(k as ResourceId) && state.resources[k as ResourceId] >= cap)
  const curInterval = def.intervalSec ? (def.intervalSec / levelSpeedMult(pb.level)) : null
  const nextInterval = def.intervalSec ? (def.intervalSec / levelSpeedMult(pb.level + 1)) : null
  return (
    <Sheet title={`${def.name} Lv${pb.level}${cnt > 1 ? ` ×${cnt}` : ''}`} onClose={onClose}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{ background: '#e8dcb8', border: `3px solid ${O}` }}>
          <BuildingArt id={pb.buildingId} size={80} />
        </div>
        {cnt > 1 && (
          <div className="w-full rounded-xl px-3 py-1.5 text-[11px] font-bold" style={{ background: '#9b59c822', border: `2.5px solid #9b59c8`, color: O }}>
            🏗️ 同类叠加 ×{cnt}：只占 1 格，产出与升级消耗均按数量计算
          </div>
        )}
        <div className="w-full rounded-2xl p-3" style={{ background: '#fffdf5', border: `3px solid ${O}` }}>
          <div className="text-[12px] font-bold" style={{ color: '#5a4a30' }}>{def.desc}</div>
          {curInterval && def.output && (
            <div className="text-[12px] font-black mt-1.5" style={{ color: O }}>
              ⏱️ 当前产出：{Object.entries(def.output).map(([k, v]) => `${RES[k as ResourceId].icon}×${(v ?? 0) * cnt}`).join('+')}
              / {curInterval.toFixed(1)}秒
              {!maxed && nextInterval && <span style={{ color: '#5cb86e' }}>（下级 {nextInterval.toFixed(1)}秒）</span>}
            </div>
          )}
          {def.autoLv && (
            <div className="text-[11px] font-bold mt-1" style={{ color: auto ? '#5cb86e' : '#e8734a' }}>
              {auto
                ? `✓ 已解锁自动挂机（离线也产出）${pb.buildingId === 'fishing_chair' && pb.level < (def.autoLv ?? 99) ? '·猎人代钓中' : ''}`
                : pb.buildingId === 'fishing_chair'
                  ? `🔒 Lv${def.autoLv} 解锁自动挂机；基地 Lv3 开放「订单→岗位」后委派猎人，立即自动收鱼`
                  : `🔒 Lv${def.autoLv} 解锁自动挂机，当前需手动收取`}
            </div>
          )}
          {pb.buildingId === 'warehouse' && (
            <div className="text-[12px] font-black mt-1.5" style={{ color: O }}>
              📦 存储上限：{cap}{!maxed && <span style={{ color: '#5cb86e' }}>（下级 {cap + 150 * cnt}）</span>}
            </div>
          )}
          {pb.buildingId === 'residence' && (
            <div className="text-[12px] font-black mt-1.5" style={{ color: O }}>
              👥 人口上限 +{3 * pb.level * cnt}{!maxed && <span style={{ color: '#5cb86e' }}>（下级 +{3 * (pb.level + 1) * cnt}）</span>}
            </div>
          )}
          {outputFull && (
            <div className="text-[11px] font-black mt-1.5" style={{ color: '#c93a1a' }}>
              ⚠️ 仓库已满，产出溢出停产！请升级仓库或消耗资源
            </div>
          )}
        </div>
        {pb.pending && (
          <button onClick={() => onCollect(pb.uid)}
            className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 build-pulse"
            style={{ background: 'linear-gradient(180deg,#e8b04b,#d19a2e)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
            👐 收取产出（{Object.entries(def.output!).map(([k, v]) => `${RES[k as ResourceId].icon}×${(v ?? 0) * cnt}`).join('+')}）
          </button>
        )}
        {!maxed ? (
          <button onClick={() => onUpgrade(pb.uid)} disabled={!afford}
            className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(180deg,#4b8fe8,#3563b8)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
            ⬆️ 升级到 Lv{pb.level + 1}（
            {Object.entries(upCost).map(([k, v]) => `${RES[k as ResourceId].icon}${v}`).join(' ')}）
          </button>
        ) : (
          <div className="font-black text-sm" style={{ color: '#5cb86e' }}>🌟 已满级 Lv{MAX_BUILDING_LV}</div>
        )}
      </div>
    </Sheet>
  )
}

// ============ 背包 ============
export function BagPanel({ state, onClose }: { state: GameState; onClose: () => void }) {
  const entries = (Object.keys(RES) as ResourceId[]).filter(k => !['gold', 'diamond'].includes(k))
  const cap = resCap(state)
  return (
    <Sheet title="🎒 资源背包" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        {entries.map(k => {
          const capped = CAPPED_RESOURCES.includes(k)
          const full = capped && state.resources[k] >= cap
          return (
            <div key={k} className="rounded-xl p-2 flex flex-col items-center"
              style={{ background: full ? '#f6d9cd' : '#fffdf5', border: `3px solid ${full ? '#c93a1a' : O}` }}>
              <span className="text-2xl">{RES[k].icon}</span>
              <span className="text-[10px] font-bold mt-0.5" style={{ color: '#5a4a30' }}>{RES[k].name}</span>
              <span className="text-sm font-black" style={{ color: full ? '#c93a1a' : O }}>
                {state.resources[k]}{capped && <span className="text-[9px] font-bold" style={{ color: '#8a7a58' }}>/{cap}</span>}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] mt-3 text-center" style={{ color: '#5a4a30' }}>
        存储上限 {cap}（基础200 + 仓库每级+150）；资源满仓会导致对应建筑溢出停产，请及时升级仓库
      </p>
    </Sheet>
  )
}

// ============ 订单 & 居民岗位 ============
export function OrderPanel({ state, onSubmit, onAssignJob, onReplenish, onRefresh, initTab, onClose }: {
  state: GameState
  onSubmit: (id: number) => void
  onAssignJob: (jobId: JobId, delta: 1 | -1) => void
  onReplenish: () => void
  onRefresh: () => void
  initTab?: 'order' | 'job' // 任务跳转可直达「岗位」页
  onClose: () => void
}) {
  const [tab, setTab] = useState<'order' | 'job'>(initTab ?? 'order')
  const idle = state.population - Object.values(state.jobs).reduce((a, b) => a + b, 0)
  const eff = efficiency(state)
  const satietyColor = state.satiety <= 0 ? '#c93a1a' : state.satiety < 20 ? '#e8734a' : state.satiety < 60 ? '#e8b04b' : '#5cb86e'
  return (
    <Sheet title="📦 居民" onClose={onClose}>
      <div className="flex gap-2 mb-3">
        {(['order', 'job'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-xl font-black text-sm active:scale-95"
            style={{
              background: tab === t ? O : '#fffdf5',
              color: tab === t ? '#f0c93f' : O,
              border: `3px solid ${O}`,
            }}>
            {t === 'order' ? '📦 订单' : `👥 岗位（空闲${idle}人）`}
          </button>
        ))}
      </div>
      {tab === 'job' ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl p-2.5"
            style={{ background: `${satietyColor}22`, border: `2.5px solid ${satietyColor}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold" style={{ color: O }}>
                🍖 饱食度 {Math.round(state.satiety)}/100 · 效率 {Math.round(eff * 100)}%
              </span>
              <button onClick={onReplenish}
                disabled={state.resources.ration < 5 || state.satiety >= 100}
                className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white active:scale-90 disabled:opacity-40"
                style={{ background: '#5cb86e', border: `2.5px solid ${O}` }}>
                补给（5🍙→+25）
              </button>
            </div>
            <div className="text-[10px] mt-1 font-bold" style={{ color: satietyColor }}>
              {state.satiety <= 0
                ? '⚠️ 断粮停工！持续120分钟将有居民流失'
                : state.satiety < 20
                  ? '⚠️ 效率已跌至低谷，立即补给口粮！'
                  : state.satiety < 60
                    ? '效率正在衰减，建议及时补给'
                    : '居民状态良好，全力生产中'}
            </div>
          </div>
          {JOBS.map(job => {
            const n = state.jobs[job.jobId]
            const hasBuilding = job.targets.some(t => state.buildings.some(b => b.buildingId === t))
            return (
              <div key={job.jobId} className="flex items-center gap-2 rounded-2xl p-2.5"
                style={{ background: '#fffdf5', border: `3px solid ${O}`, opacity: hasBuilding ? 1 : .55 }}>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm" style={{ color: O }}>{job.name}
                    <span className="text-[10px] font-bold ml-1.5" style={{ color: '#5a4a30' }}>上限{job.maxStaff}人</span>
                  </div>
                  <div className="text-[11px]" style={{ color: '#5a4a30' }}>
                    {hasBuilding ? job.effectDesc : `需要先建造「${job.targets.map(t => BUILDINGS.find(b => b.id === t)!.name).join('/')}」`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => onAssignJob(job.jobId, -1)} disabled={n <= 0}
                    className="w-7 h-7 rounded-lg font-black text-white active:scale-90 disabled:opacity-30"
                    style={{ background: '#e8734a', border: `2.5px solid ${O}` }}>−</button>
                  <span className="font-black text-base w-5 text-center" style={{ color: O }}>{n}</span>
                  <button onClick={() => onAssignJob(job.jobId, 1)} disabled={!hasBuilding || n >= job.maxStaff || idle <= 0}
                    className="w-7 h-7 rounded-lg font-black text-white active:scale-90 disabled:opacity-30"
                    style={{ background: '#5cb86e', border: `2.5px solid ${O}` }}>＋</button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-xl px-3 py-1.5"
          style={{ background: '#e8dcb8', border: `2.5px solid ${O}` }}>
          <span className="text-[11px] font-bold" style={{ color: O }}>订单列表 {state.orders.length}/4 · 优质订单奖励×1.6</span>
          <button onClick={onRefresh} disabled={state.resources.gold < 80}
            className="px-2.5 py-1 rounded-lg text-[11px] font-black active:scale-90 disabled:opacity-40"
            style={{ background: '#4b8fe8', color: '#fff', border: `2.5px solid ${O}` }}>
            🔄 刷新（🪙80）
          </button>
        </div>
        {state.orders.map(o => {
          const canDo = Object.entries(o.want).every(([k, v]) => state.resources[k as ResourceId] >= (v ?? 0))
          return (
            <div key={o.id} className="rounded-2xl p-3"
              style={{ background: o.quality === 'fine' ? '#fff3d6' : '#fffdf5', border: `3px solid ${o.quality === 'fine' ? '#f0c93f' : O}` }}>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm" style={{ color: O }}>
                  🧑‍🌾 {o.resident}
                  {o.quality === 'fine' && (
                    <span className="ml-1.5 text-[10px] font-black px-1.5 rounded-full"
                      style={{ background: '#f0c93f', color: O, border: `2px solid ${O}` }}>✦优质</span>
                  )}
                </span>
                <div className="flex items-center gap-2 text-[11px] font-bold" style={{ color: '#5a4a30' }}>
                  <span className="inline-flex items-center gap-0.5"><CoinIcon size={14} />{o.rewardGold}</span>
                  <span>✨{o.rewardXp}</span>
                  {o.rewardBlueprint ? <span>📐×{o.rewardBlueprint}</span> : null}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(o.want).map(([k, v]) => (
                    <CostTag key={k} id={k as ResourceId} n={v!} enough={state.resources[k as ResourceId] >= (v ?? 0)} />
                  ))}
                </div>
                <button disabled={!canDo} onClick={() => onSubmit(o.id)}
                  className="px-3 py-1.5 rounded-xl font-black text-sm text-white active:scale-90 disabled:opacity-40"
                  style={{ background: canDo ? '#5cb86e' : '#9aa7b8', border: `3px solid ${O}` }}>
                  交付
                </button>
              </div>
            </div>
          )
        })}
      </div>
      )}
    </Sheet>
  )
}

// ============ 英雄 ============
export function HeroPanel({ state, onRecruit, onAssignHero, onUnassign, onClose }: {
  state: GameState
  onRecruit: () => void
  onAssignHero: (slot: number, heroId: string, target: BuildingId | 'command') => void
  onUnassign: (slot: number) => void
  onClose: () => void
}) {
  const hasRadio = state.buildings.some(b => b.buildingId === 'radio')
  const hasCommand = state.buildings.some(b => b.buildingId === 'command')
  const [tab, setTab] = useState<'hero' | 'assign'>('hero')
  return (
    <Sheet title="📻 英雄" onClose={onClose}>
      {hasRadio && (
        <div className="flex gap-2 mb-3">
          {(['hero', 'assign'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-1.5 rounded-xl font-black text-sm active:scale-95"
              style={{
                background: tab === t ? O : '#fffdf5',
                color: tab === t ? '#f0c93f' : O,
                border: `3px solid ${O}`,
              }}>
              {t === 'hero' ? '🦸 招募' : '📌 委任'}
            </button>
          ))}
        </div>
      )}
      {tab === 'assign' && hasRadio ? (
        !hasCommand ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🗼</div>
            <p className="font-black" style={{ color: O }}>需要先建造「指挥中心」</p>
            <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>指挥中心 Lv12 解锁，建成后获得 {ASSIGN_SLOTS} 个委任槽</p>
          </div>
        ) : (
          <AssignTab state={state} onAssign={onAssignHero} onUnassign={onUnassign} />
        )
      ) : !hasRadio ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📻</div>
          <p className="font-black" style={{ color: O }}>需要先建造「广播站」</p>
          <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>广播站 Lv10 解锁（需先建潜水船坞），建成后即可招募英雄</p>
        </div>
      ) : (
        <>
          <button onClick={onRecruit} disabled={state.resources.gold < RECRUIT_COST.gold}
            className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 disabled:opacity-40 mb-3"
            style={{ background: 'linear-gradient(180deg,#9b6ee8,#7a4ec9)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
            📡 招募英雄（<CoinIcon size={14} /> {RECRUIT_COST.gold}）
          </button>
          {state.heroes.length === 0 ? (
            <p className="text-center text-xs py-4" style={{ color: '#5a4a30' }}>还没有英雄，点击上方按钮招募第一位伙伴！</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {state.heroes.map(h => {
                const def = HEROES.find(d => d.id === h.heroId)!
                return (
                  <div key={h.heroId} className="rounded-2xl p-2.5"
                    style={{ background: '#fffdf5', border: `3px solid ${def.color}` }}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs" style={{ color: O }}>{def.name}</span>
                      <span className="text-[10px] font-black px-1.5 rounded-full text-white" style={{ background: def.color }}>{def.rarity}</span>
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: def.color }}>{'★'.repeat(Math.min(h.stars, 5))} · {def.cls}</div>
                    <div className="text-[11px] mt-1 font-bold" style={{ color: '#5a4a30' }}>{def.skill}：{def.skillDesc}</div>
                    <div className="text-[11px] font-black mt-0.5" style={{ color: O }}>战力 {Math.round(def.power * (1 + (h.stars - 1) * 0.3))}</div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}

// ============ 英雄委任 ============
function AssignTab({ state, onAssign, onUnassign }: {
  state: GameState
  onAssign: (slot: number, heroId: string, target: BuildingId | 'command') => void
  onUnassign: (slot: number) => void
}) {
  const [picking, setPicking] = useState<number | null>(null)
  const [pickedHero, setPickedHero] = useState<string | null>(null)

  const validTargets = (heroId: string): { id: BuildingId | 'command'; name: string }[] => {
    const hero = HEROES.find(h => h.id === heroId)!
    const eff = ASSIGN_TAG_EFFECT[hero.tag]
    if (eff.targets === 'command') return [{ id: 'command', name: '指挥中心（主槽）' }]
    return (eff.targets as BuildingId[])
      .filter(t => state.buildings.some(b => b.buildingId === t))
      .map(t => ({ id: t, name: BUILDINGS.find(b => b.id === t)!.name }))
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: ASSIGN_SLOTS }, (_, i) => {
        const a = state.assignments[i]
        const hero = a ? HEROES.find(h => h.id === a.heroId) : null
        return (
          <div key={i} className="rounded-2xl p-3" style={{ background: '#fffdf5', border: `3px solid ${O}` }}>
            <div className="flex items-center justify-between">
              <span className="font-black text-sm" style={{ color: O }}>委任槽 {i + 1}</span>
              {a && hero && (
                <button onClick={() => onUnassign(i)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black text-white active:scale-90"
                  style={{ background: '#e8734a', border: `2.5px solid ${O}` }}>撤下</button>
              )}
            </div>
            {a && hero ? (
              <div className="mt-1.5 text-xs font-bold" style={{ color: hero.color }}>
                {hero.name}（{hero.tag}）→ {a.target === 'command' ? '指挥中心主槽' : BUILDINGS.find(b => b.id === a.target)?.name}
                <div className="text-[11px] mt-0.5" style={{ color: '#5a4a30' }}>{ASSIGN_TAG_EFFECT[hero.tag].desc}</div>
              </div>
            ) : picking === i ? (
              <div className="mt-2">
                {!pickedHero ? (
                  <>
                    <div className="text-[11px] font-bold mb-1" style={{ color: '#5a4a30' }}>选择英雄：</div>
                    <div className="flex flex-wrap gap-1.5">
                      {state.heroes.map(h => {
                        const def = HEROES.find(d => d.id === h.heroId)!
                        const busy = state.assignments.some((x, j) => j !== i && x?.heroId === h.heroId)
                        return (
                          <button key={h.heroId} disabled={busy}
                            onClick={() => setPickedHero(h.heroId)}
                            className="px-2 py-1 rounded-lg text-[11px] font-black active:scale-90 disabled:opacity-30"
                            style={{ background: def.color, color: '#fff', border: `2.5px solid ${O}` }}>
                            {def.name}·{def.tag}
                          </button>
                        )
                      })}
                      {state.heroes.length === 0 && <span className="text-[11px]" style={{ color: '#5a4a30' }}>先去招募英雄吧</span>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[11px] font-bold mb-1" style={{ color: '#5a4a30' }}>选择派驻目标：</div>
                    <div className="flex flex-wrap gap-1.5">
                      {validTargets(pickedHero).map(t => (
                        <button key={t.id}
                          onClick={() => { onAssign(i, pickedHero, t.id); setPicking(null); setPickedHero(null) }}
                          className="px-2 py-1 rounded-lg text-[11px] font-black text-white active:scale-90"
                          style={{ background: '#4b8fe8', border: `2.5px solid ${O}` }}>
                          {t.name}
                        </button>
                      ))}
                      {validTargets(pickedHero).length === 0 && (
                        <span className="text-[11px]" style={{ color: '#c93a1a' }}>没有可派驻的建筑（该标签需要对应建筑已建成）</span>
                      )}
                    </div>
                  </>
                )}
                <button onClick={() => { setPicking(null); setPickedHero(null) }}
                  className="mt-2 text-[11px] font-bold underline" style={{ color: '#5a4a30' }}>取消</button>
              </div>
            ) : (
              <button onClick={() => { setPicking(i); setPickedHero(null) }}
                className="mt-1.5 w-full py-1.5 rounded-xl text-xs font-black active:scale-95"
                style={{ background: '#e8dcb8', color: O, border: `2.5px dashed ${O}` }}>
                ＋ 派驻英雄
              </button>
            )}
          </div>
        )
      })}
      <p className="text-[11px] text-center" style={{ color: '#5a4a30' }}>
        委任不影响英雄出战；标签匹配对应建筑时加成生效，与居民岗位增益叠加
      </p>
    </div>
  )
}

// ============ 战斗 ============
export function BattlePanel({ state, teamPower, onFight, onClose }: {
  state: GameState
  teamPower: number
  onFight: () => boolean
  onClose: () => void
}) {
  const hasRadio = state.buildings.some(b => b.buildingId === 'radio')
  const enemy = STAGE_ENEMIES[Math.min(state.stage - 1, STAGE_ENEMIES.length - 1)]
  return (
    <Sheet title="⚔️ 海域闯关" onClose={onClose}>
      {!hasRadio ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏴‍☠️</div>
          <p className="font-black" style={{ color: O }}>建造「广播站」并招募英雄后解锁战斗</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-full rounded-2xl p-3 flex justify-between items-center" style={{ background: '#fffdf5', border: `3px solid ${O}` }}>
            <div>
              <div className="text-[11px] font-bold" style={{ color: '#5a4a30' }}>第 {state.stage} 关</div>
              <div className="font-black" style={{ color: '#c93a1a' }}>🏴‍☠️ {enemy.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold" style={{ color: '#5a4a30' }}>敌方战力 <b style={{ color: '#c93a1a' }}>{enemy.power}</b></div>
              <div className="text-[11px] font-bold" style={{ color: '#5a4a30' }}>我方战力 <b style={{ color: '#2a7a3a' }}>{teamPower}</b></div>
            </div>
          </div>
          <BattleButton onFight={onFight} canFight={state.heroes.length > 0} />
          <p className="text-[11px]" style={{ color: '#5a4a30' }}>放置回合制战斗，胜负由战力决定；胜利得金币，偶数关得蓝图</p>
        </div>
      )}
    </Sheet>
  )
}

function BattleButton({ onFight, canFight }: { onFight: () => boolean; canFight: boolean }) {
  const [result, setResult] = useState<null | boolean>(null)
  const [fighting, setFighting] = useState(false)
  return (
    <>
      <button
        disabled={!canFight || fighting}
        onClick={() => {
          setFighting(true)
          setResult(null)
          setTimeout(() => {
            setResult(onFight())
            setFighting(false)
          }, 900)
        }}
        className="w-full py-3 rounded-2xl font-black text-white text-base active:scale-95 disabled:opacity-40"
        style={{ background: 'linear-gradient(180deg,#e8734a,#c9572e)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
        {fighting ? '💥 激战中…' : '⚔️ 出击！'}
      </button>
      {result !== null && (
        <div className="font-black text-lg" style={{ color: result ? '#2a7a3a' : '#c93a1a' }}>
          {result ? '🎉 胜利！获得奖励' : '💦 战败了…提升英雄战力再来'}
        </div>
      )}
    </>
  )
}

// ============ 地图（预留） ============
export function MapPanel({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="🗺️ 海域地图" onClose={onClose}>
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🌊</div>
        <p className="font-black" style={{ color: O }}>Lv16 解锁联盟与新海域</p>
        <p className="text-xs mt-1" style={{ color: '#5a4a30' }}>货轮争夺、联盟城战、赛季玩法敬请期待</p>
      </div>
    </Sheet>
  )
}
