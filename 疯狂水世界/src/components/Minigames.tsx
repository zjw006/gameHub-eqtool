import { useEffect, useRef, useState } from 'react'
import { BUILDINGS, MINIGAMES, type MiniGameDef, type MiniGameId } from '@/data/gameData'
import type { GameState } from '@/types/game'

const O = '#1c2a4a'
const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function isOpenToday(def: MiniGameDef) {
  if (!def.openWeekdays) return true
  return def.openWeekdays.includes(new Date().getDay())
}

function fmtCd(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return s >= 60 ? `${Math.floor(s / 60)}分${s % 60}秒` : `${s}秒`
}

// ============ 小游戏入口面板 ============
export function MinigamePanel({ state, onStart, onFlare, onClose }: {
  state: GameState
  onStart: (def: MiniGameDef) => void
  onFlare: (id: MiniGameId) => void
  onClose: () => void
}) {
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force(x => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="absolute inset-0 flex items-end" style={{ zIndex: 60, background: 'rgba(10,20,45,.55)' }} onClick={onClose}>
      <div className="w-full max-h-[72%] flex flex-col rounded-t-3xl overflow-hidden sheet-up"
        style={{ background: 'linear-gradient(180deg,#f5edd6,#e8d5a8)', border: `4px solid ${O}`, borderBottom: 'none' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ background: O, borderBottom: '3px solid #0e1a35' }}>
          <span className="font-black text-white">🎮 小游戏 <span className="text-[11px] font-bold" style={{ color: '#7fd4e8' }}>奖励独立，不吃生产倍率</span></span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black" style={{ color: '#f0c93f' }}>🚀×{state.flares}</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full font-black text-sm text-white active:scale-90"
              style={{ background: '#e8734a', border: '2.5px solid #0e1a35' }}>✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-3 flex flex-col gap-2">
          {MINIGAMES.map(def => {
            const open = isOpenToday(def)
            const unlocked = state.level >= def.unlockLevel
            const needB = def.needBuilding ? BUILDINGS.find(b => b.id === def.needBuilding)! : null
            const missingB = needB ? !state.buildings.some(b => b.buildingId === needB.id) : false
            const used = state.minigames.used[def.id] ?? 0
            const left = def.dailyMax - used
            const cdMs = (state.minigames.cdUntil[def.id] ?? 0) - Date.now()
            const onCd = cdMs > 0
            const canPlay = open && unlocked && !missingB && left > 0 && !onCd
            const dayStr = def.openWeekdays?.map(d => WEEK_CN[d]).join('/') ?? ''
            return (
              <div key={def.id} className="rounded-2xl p-3"
                style={{ background: '#fffdf5', border: `3px solid ${O}`, opacity: open && unlocked && !missingB ? 1 : .55 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{def.icon}</span>
                    <div>
                      <span className="font-black text-sm" style={{ color: O }}>{def.name}</span>
                      <span className="ml-1.5 text-[10px] font-bold px-1.5 rounded-full text-white"
                        style={{ background: def.type === '常驻' ? '#4b8fe8' : '#9b6ee8' }}>
                        {def.type === '常驻' ? '常驻' : dayStr}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-black" style={{ color: left > 0 ? '#2a7a3a' : '#c93a1a' }}>
                    今日 {left}/{def.dailyMax}
                  </span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: '#5a4a30' }}>{def.operation}</div>
                <div className="flex items-center justify-between mt-2">
                  {!open ? (
                    <span className="text-[11px] font-bold" style={{ color: '#9b6ee8' }}>📅 今日未开启（{dayStr}开放）</span>
                  ) : missingB ? (
                    <span className="text-[11px] font-bold" style={{ color: '#c93a1a' }}>🔒 需先建造「{needB!.name}」</span>
                  ) : !unlocked ? (
                    <span className="text-[11px] font-bold" style={{ color: '#c93a1a' }}>🔒 基地 Lv{def.unlockLevel} 解锁</span>
                  ) : (
                    <span className="text-[11px] font-bold" style={{ color: onCd ? '#e8734a' : '#5a4a30' }}>
                      {onCd ? `⏱️ 冷却 ${fmtCd(cdMs)}` : `额外奖概率 ${Math.round(def.extraProb * 100)}%：${def.extraDesc}`}
                    </span>
                  )}
                  <div className="flex gap-1.5">
                    {left <= 0 && open && unlocked && (
                      <button onClick={() => onFlare(def.id)} disabled={state.flares <= 0}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-black text-white active:scale-90 disabled:opacity-40"
                        style={{ background: '#e8b04b', border: `2.5px solid ${O}` }}>
                        🚀 重置
                      </button>
                    )}
                    <button disabled={!canPlay} onClick={() => onStart(def)}
                      className="px-4 py-1.5 rounded-xl text-xs font-black text-white active:scale-90 disabled:opacity-40"
                      style={{ background: canPlay ? '#5cb86e' : '#9aa7b8', border: `2.5px solid ${O}` }}>
                      开始
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============ 钓鱼：蓄力收杆 ============
export function FishingGame({ def, onDone }: { def: MiniGameDef; onDone: (perf: number) => void }) {
  const [power, setPower] = useState(0)
  const [phase, setPhase] = useState<'aim' | 'result'>('aim')
  const [result, setResult] = useState('')
  const dir = useRef(1)
  const powerRef = useRef(0)

  useEffect(() => {
    const t = setInterval(() => {
      powerRef.current += dir.current * 3.2
      if (powerRef.current >= 100) { powerRef.current = 100; dir.current = -1 }
      if (powerRef.current <= 0) { powerRef.current = 0; dir.current = 1 }
      setPower(powerRef.current)
    }, 30)
    return () => clearInterval(t)
  }, [])

  const strike = () => {
    const p = powerRef.current
    let perf: number, text: string
    if (p >= 62 && p <= 88) { perf = 1; text = '🌟 完美收杆！大鱼上钩！' }
    else if (p >= 40 && p < 62 || p > 88 && p <= 96) { perf = 0.7; text = '🐟 钓到了一条不错的鱼' }
    else { perf = 0.35; text = '💦 时机不佳，只捞到小鱼苗' }
    setResult(text)
    setPhase('result')
    setTimeout(() => onDone(perf), 1400)
  }

  return (
    <GameShell title={`🎣 ${def.name}`}>
      {phase === 'aim' ? (
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="text-5xl animate-bounce">🐟</div>
          <div className="w-full max-w-[280px]">
            <div className="relative h-8 rounded-full overflow-hidden" style={{ background: '#0e1a35', border: `3px solid ${O}` }}>
              {/* 完美区间 */}
              <div className="absolute top-0 bottom-0" style={{ left: '62%', width: '26%', background: '#5cb86e' }} />
              <div className="absolute top-0 bottom-0" style={{ left: '40%', width: '22%', background: '#e8b04b' }} />
              <div className="absolute top-0 bottom-0" style={{ left: '88%', width: '8%', background: '#e8b04b' }} />
              <div className="absolute top-[-4px] bottom-[-4px] w-1.5 rounded" style={{ left: `${power}%`, background: '#fff', boxShadow: '0 0 8px #fff' }} />
            </div>
            <div className="flex justify-between text-[10px] font-bold mt-1" style={{ color: '#cfe6ff' }}>
              <span>太早</span><span style={{ color: '#5cb86e' }}>完美区</span><span>太迟</span>
            </div>
          </div>
          <button onClick={strike}
            className="px-10 py-3.5 rounded-2xl font-black text-lg text-white active:scale-90"
            style={{ background: 'linear-gradient(180deg,#e8734a,#c9572e)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
            🎣 收杆！
          </button>
        </div>
      ) : (
        <div className="py-14 text-center font-black text-lg text-white" style={{ textShadow: '0 2px 0 #0e1a35' }}>{result}</div>
      )}
    </GameShell>
  )
}

// ============ 限时点击挑战（打捞/探索/突围/漂流通用） ============
interface SpawnItem { id: number; x: number; y: number; hazard: boolean; icon: string; born: number }

const ICONS: Record<string, { targets: string[]; hazards: string[] }> = {
  MG002: { targets: ['🪵', '🧴', '🧵'], hazards: ['🦈'] },
  MG003: { targets: ['⚙️', '🔷', '🌿'], hazards: ['🦈'] },
  MG004: { targets: ['🛟'], hazards: ['💣'] },
  MG005: { targets: ['📦'], hazards: ['👾'] },
}

export function TapGame({ def, onDone }: { def: MiniGameDef; onDone: (perf: number) => void }) {
  const dur = def.durationSec ?? 20
  const [left, setLeft] = useState(dur)
  const [score, setScore] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [items, setItems] = useState<SpawnItem[]>([])
  const [over, setOver] = useState(false)
  const idRef = useRef(0)
  const scoreRef = useRef(0)
  const heartsRef = useRef(3)
  const doneRef = useRef(false)
  const icons = ICONS[def.id]

  const finish = (finalScore: number) => {
    if (doneRef.current) return
    doneRef.current = true
    setOver(true)
    // 表现分：击中数 / 期望（每秒1.2个目标 × 时长）
    const expected = dur * 1.1
    setTimeout(() => onDone(Math.min(1, finalScore / expected)), 1200)
  }

  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now()
      setItems(list => {
        const kept = []
        for (const it of list) {
          if (now - it.born > 1500) {
            if (it.hazard && def.mode === 'defend') {
              heartsRef.current -= 1
              setHearts(heartsRef.current)
            }
            continue
          }
          kept.push(it)
        }
        return kept
      })
      // 生成
      if (Math.random() < 0.75) {
        const hazard = Math.random() < (def.mode === 'defend' ? 0.45 : 0.22)
        const pool = hazard ? icons.hazards : icons.targets
        setItems(list => [...list.slice(-14), {
          id: ++idRef.current,
          x: 8 + Math.random() * 84,
          y: 10 + Math.random() * 72,
          hazard,
          icon: pool[Math.floor(Math.random() * pool.length)],
          born: Date.now(),
        }])
      }
    }, 550)
    const timer = setInterval(() => {
      setLeft(l => {
        if (l <= 1) {
          clearInterval(timer)
          clearInterval(tick)
          finish(scoreRef.current)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => { clearInterval(tick); clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 心耗尽立即结束
  useEffect(() => {
    if (hearts <= 0 && !over) {
      finish(scoreRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearts])

  const tap = (it: SpawnItem) => {
    if (over) return
    setItems(list => list.filter(x => x.id !== it.id))
    if (it.hazard) {
      if (def.mode === 'defend') {
        scoreRef.current += 1
        setScore(scoreRef.current)
      } else {
        scoreRef.current = Math.max(0, scoreRef.current - 3)
        setScore(scoreRef.current)
      }
    } else {
      scoreRef.current += def.mode === 'defend' ? 2 : 1
      setScore(scoreRef.current)
    }
  }

  return (
    <GameShell title={`${def.icon} ${def.name}`}>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="font-black text-white text-sm" style={{ textShadow: '0 1px 0 #0e1a35' }}>⏱️ {left}s</span>
        {def.mode === 'defend' && (
          <span className="font-black text-sm" style={{ color: '#ff9a8a', textShadow: '0 1px 0 #0e1a35' }}>
            {'❤️'.repeat(Math.max(0, hearts))}{'🖤'.repeat(3 - Math.max(0, hearts))}
          </span>
        )}
        <span className="font-black text-white text-sm" style={{ textShadow: '0 1px 0 #0e1a35' }}>得分 {score}</span>
      </div>
      <div className="relative w-full rounded-2xl overflow-hidden"
        style={{
          height: 300, border: `3px solid ${O}`,
          background: def.id === 'MG003'
            ? 'linear-gradient(180deg,#1a3370,#0c1830)'
            : 'linear-gradient(180deg,#3563b8,#1a3370)',
        }}>
        {items.map(it => (
          <button key={it.id} onClick={() => tap(it)}
            className="absolute text-3xl active:scale-75 spawn-pop"
            style={{
              left: `${it.x}%`, top: `${it.y}%`, transform: 'translate(-50%,-50%)',
              background: 'none', border: 'none', padding: 8,
              filter: it.hazard ? 'drop-shadow(0 0 6px #ff5a3c)' : 'none',
            }}>
            {it.icon}
          </button>
        ))}
        {over && (
          <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white"
            style={{ background: 'rgba(10,20,45,.6)', textShadow: '0 2px 0 #0e1a35' }}>
            {hearts <= 0 ? '💥 防线被突破…' : '🏁 时间到！'} 得分 {score}
          </div>
        )}
      </div>
      <p className="text-center text-[11px] mt-2 font-bold" style={{ color: '#cfe6ff' }}>
        {def.mode === 'defend' ? '点物资得分，炮火/怪物要及时点掉，漏掉会扣心！' : '点物资得分，小心别点到鲨鱼（-3分）！'}
      </p>
    </GameShell>
  )
}

// ============ 海面打捞：拖动拾荒船在无缝海面游走收集 ============
const SALVAGE_W = 1600
const SALVAGE_H = 1100
const SALVAGE_CAP = 12
const SALVAGE_ITEM_COUNT = 40
const SALVAGE_ICONS = ['🪵', '🪵', '🧴', '🧴', '🧵', '🛢️']
const COLLECT_R = 52

interface DriftItem { id: number; x: number; y: number; icon: string }
interface FloatText { id: number; x: number; y: number }

const randItem = (id: number): DriftItem => ({
  id,
  x: 60 + Math.random() * (SALVAGE_W - 120),
  y: 60 + Math.random() * (SALVAGE_H - 120),
  icon: SALVAGE_ICONS[Math.floor(Math.random() * SALVAGE_ICONS.length)],
})

export function SalvageGame({ def, onDone }: { def: MiniGameDef; onDone: (perf: number) => void }) {
  const [boat, setBoat] = useState({ x: SALVAGE_W / 2, y: SALVAGE_H / 2 })
  const [cam, setCam] = useState({ x: 0, y: 0 })
  const [items, setItems] = useState<DriftItem[]>(() => Array.from({ length: SALVAGE_ITEM_COUNT }, (_, i) => randItem(i + 1)))
  const [floats, setFloats] = useState<FloatText[]>([])
  const [count, setCount] = useState(0)
  const [full, setFull] = useState(false)
  const [done, setDone] = useState(false)
  const boatRef = useRef(boat)
  const targetRef = useRef<{ x: number; y: number } | null>(null)
  const camRef = useRef({ x: 0, y: 0 })
  const itemsRef = useRef(items)
  const countRef = useRef(0)
  const fullRef = useRef(false)
  const doneRef = useRef(false)
  const draggingRef = useRef(false)
  const idRef = useRef(SALVAGE_ITEM_COUNT)
  const floatIdRef = useRef(0)
  const areaRef = useRef<HTMLDivElement>(null)

  // 主循环：船向拖拽目标移动，镜头跟随，靠近废弃物自动收集
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const b = boatRef.current
      const t = targetRef.current
      if (t && !fullRef.current && !doneRef.current) {
        const dx = t.x - b.x
        const dy = t.y - b.y
        const d = Math.hypot(dx, dy)
        if (d > 5) {
          const k = Math.min(1, (330 * dt) / d)
          b.x = Math.max(30, Math.min(SALVAGE_W - 30, b.x + dx * k))
          b.y = Math.max(30, Math.min(SALVAGE_H - 30, b.y + dy * k))
        }
      }
      // 收集判定
      if (!fullRef.current && !doneRef.current) {
        const hit = itemsRef.current.filter(it => Math.hypot(it.x - b.x, it.y - b.y) < COLLECT_R)
        if (hit.length > 0) {
          for (const h of hit) {
            countRef.current += 1
            const fid = ++floatIdRef.current
            setFloats(fl => [...fl, { id: fid, x: h.x, y: h.y }])
            setTimeout(() => setFloats(fl => fl.filter(f => f.id !== fid)), 700)
          }
          itemsRef.current = itemsRef.current.filter(it => !hit.includes(it))
          // 船舱未满则在远处刷新废弃物，保持海面密度
          if (countRef.current < SALVAGE_CAP) {
            for (const _ of hit) {
              let it = randItem(++idRef.current)
              let guard = 0
              while (Math.hypot(it.x - b.x, it.y - b.y) < 320 && guard++ < 20) it = randItem(++idRef.current)
              itemsRef.current.push(it)
            }
          }
          setItems([...itemsRef.current])
          setCount(countRef.current)
          if (countRef.current >= SALVAGE_CAP) {
            fullRef.current = true
            targetRef.current = null
            setFull(true)
          }
        }
      }
      const area = areaRef.current
      if (area) {
        camRef.current = {
          x: Math.max(0, Math.min(SALVAGE_W - area.clientWidth, b.x - area.clientWidth / 2)),
          y: Math.max(0, Math.min(SALVAGE_H - area.clientHeight, b.y - area.clientHeight / 2)),
        }
      }
      setBoat({ ...b })
      setCam({ ...camRef.current })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const toWorld = (e: React.PointerEvent) => {
    const r = areaRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left + camRef.current.x, y: e.clientY - r.top + camRef.current.y }
  }

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    setTimeout(() => onDone(Math.min(1, countRef.current / SALVAGE_CAP)), 1300)
  }

  return (
    <GameShell title={`${def.icon} ${def.name}`}>
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="font-black text-white text-sm" style={{ textShadow: '0 1px 0 #0e1a35' }}>
          🧺 船舱 {count}/{SALVAGE_CAP}
        </span>
        <span className="text-[11px] font-bold" style={{ color: '#cfe6ff' }}>按住海面拖动，拾荒船跟随手指游走</span>
      </div>
      <div className="w-full h-2.5 rounded-full mb-2 overflow-hidden" style={{ background: '#0e1a35', border: `2px solid ${O}` }}>
        <div className="h-full transition-all duration-300" style={{ width: `${(count / SALVAGE_CAP) * 100}%`, background: full ? '#e8734a' : '#5cb86e' }} />
      </div>
      <div
        ref={areaRef}
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{ height: 340, border: `3px solid ${O}`, background: '#1a3370', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={e => { draggingRef.current = true; areaRef.current?.setPointerCapture(e.pointerId); if (!fullRef.current) targetRef.current = toWorld(e) }}
        onPointerMove={e => { if (draggingRef.current && !fullRef.current) targetRef.current = toWorld(e) }}
        onPointerUp={() => { draggingRef.current = false }}
        onPointerCancel={() => { draggingRef.current = false }}
      >
        {/* 无缝世界层：随镜头平移 */}
        <div className="absolute" style={{
          left: -cam.x, top: -cam.y, width: SALVAGE_W, height: SALVAGE_H,
          background: 'radial-gradient(circle at 34px 42px, #ffffff16 6px, transparent 7px), radial-gradient(circle at 96px 108px, #ffffff0e 9px, transparent 10px), linear-gradient(180deg,#2f66b0,#16264a)',
          backgroundSize: '150px 150px, 190px 190px, 100% 100%',
        }}>
          {items.map(it => (
            <div key={it.id} className="absolute text-2xl pointer-events-none"
              style={{ left: it.x, top: it.y, transform: 'translate(-50%,-50%)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.4))' }}>
              {it.icon}
            </div>
          ))}
          {floats.map(f => (
            <div key={f.id} className="absolute font-black text-sm pointer-events-none spawn-pop"
              style={{ left: f.x, top: f.y - 24, transform: 'translate(-50%,-50%)', color: '#f0c93f', textShadow: '0 2px 0 #0e1a35' }}>
              +1
            </div>
          ))}
        </div>
        {/* 拾荒船（屏幕坐标） */}
        <div className="absolute pointer-events-none text-4xl"
          style={{
            left: boat.x - cam.x, top: boat.y - cam.y, transform: 'translate(-50%,-50%)',
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,.5))',
          }}>
          🛶
          <div className="absolute left-1/2 top-full -translate-x-1/2 w-10 h-2 rounded-full" style={{ background: '#ffffff2e' }} />
        </div>
        {/* 船舱满：弹出返程 */}
        {full && !done && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(10,20,45,.55)' }}
            onPointerDown={e => e.stopPropagation()}>
            <div className="font-black text-white text-lg" style={{ textShadow: '0 2px 0 #0e1a35' }}>🧺 船舱已装满 {SALVAGE_CAP}/{SALVAGE_CAP}！</div>
            <button onClick={finish}
              className="px-10 py-3.5 rounded-2xl font-black text-lg text-white active:scale-90 build-pulse"
              style={{ background: 'linear-gradient(180deg,#5cb86e,#3e9450)', border: `3px solid ${O}`, boxShadow: '0 4px 0 #0e1a35' }}>
              🏝️ 返程
            </button>
          </div>
        )}
        {done && (
          <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-white"
            style={{ background: 'rgba(10,20,45,.6)', textShadow: '0 2px 0 #0e1a35' }}>
            🎉 满载而归！打捞 {count} 份物资
          </div>
        )}
      </div>
      <p className="text-center text-[11px] mt-2 font-bold" style={{ color: '#cfe6ff' }}>
        靠近废弃物自动打捞；海面无边无际，装满船舱后返程结算
      </p>
    </GameShell>
  )
}

function GameShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ zIndex: 70, background: 'linear-gradient(180deg,#2a3f6e,#16264a)' }}>
      <div className="px-4 py-3 font-black text-white text-center" style={{ background: O, borderBottom: '3px solid #0e1a35' }}>
        {title}
      </div>
      <div className="flex-1 flex flex-col justify-center px-4">{children}</div>
    </div>
  )
}
