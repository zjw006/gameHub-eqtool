import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuildingDef, BuildingId, GameState, JobId, Order, PlacedBuilding, ResourceId, TaskDef } from '@/types/game'
import { ACHIEVEMENTS, ASSIGN_TAG_EFFECT, BASE_STORAGE, BUILDINGS, CAPPED_RESOURCES, DAILY_CHEST_REWARD, DAILY_COUNT, DAILY_POOL, FINE_ORDER_MULT, FINE_ORDER_PROB, HEROES, JOBS, LANDMARK_SLOT, MAX_BUILDING_LV, MINIGAMES, ORDER_MAX, ORDER_REFRESH_COST, RES, RESIDENTS, STAGE_ENEMIES, STORAGE_PER_WAREHOUSE_LV, TASKS, UPGRADE_COST, WEEKLY_COUNT, WEEKLY_POOL, XP_PER_LEVEL, islandSlots, levelSpeedMult, pickTasks, weekKey, type SideTaskDef } from '@/data/gameData'

const SAVE_KEY = 'crazy-water-world-save-v2'

const initialState = (): GameState => ({
  level: 1,
  xp: 0,
  population: 3,
  resources: {
    wood: 0, plastic: 0, cloth: 0, metal: 0, glass: 0, algae: 0, fish: 0,
    plank: 0, ingot: 0, ration: 0, blueprint: 0, gold: 0, diamond: 0,
  },
  buildings: [],
  debrisCollected: 0,
  taskIndex: 0,
  taskProgress: 0,
  orders: [makeOrder(1, 1), makeOrder(2, 1), makeOrder(3, 1), makeOrder(4, 1)],
  nextOrderId: 5,
  heroes: [],
  stage: 1,
  nextUid: 1,
  lastSeen: Date.now(),
  satiety: 100,
  starvingSec: 0,
  jobs: { J001: 0, J002: 0, J003: 0, J004: 0, J005: 0 },
  assignments: [null, null],
  minigames: { date: today(), used: {}, cdUntil: {} },
  flares: 2,
  hourglasses: 0,
  side: freshSide(),
  popTip: null,
})

function today() {
  return new Date().toISOString().slice(0, 10)
}

// 每日任务按日期种子刷新；每周任务按ISO周刷新
function freshDaily(date: string) {
  const picked = pickTasks(DAILY_POOL, date, DAILY_COUNT)
  return { ids: picked.map(t => t.id), progress: {} as Record<string, number>, claimed: {} as Record<string, boolean> }
}
function freshWeekly(wk: string) {
  const picked = pickTasks(WEEKLY_POOL, wk, WEEKLY_COUNT)
  return { ids: picked.map(t => t.id), progress: {} as Record<string, number>, claimed: {} as Record<string, boolean> }
}
function freshSide(): GameState['side'] {
  return {
    dailyDate: today(), daily: freshDaily(today()), dailyChest: false,
    weeklyWeek: weekKey(), weekly: freshWeekly(weekKey()),
    claimedAch: [], seenPops: [],
  }
}

// 通用发奖（xp/沙漏/资源）
function grantReward(s: GameState, r: SideTaskDef['reward'], gainXpFn: (s: GameState, xp: number) => void) {
  for (const k in r) {
    if (k === 'xp') continue
    if (k === 'hourglass') { s.hourglasses += (r as any)[k]; continue }
    s.resources[k as ResourceId] += (r as any)[k]
  }
  if (r.xp) gainXpFn(s, r.xp)
}

// 成就条件检测（永久一次性，满足即自动领取）
function checkAch(id: string, s: GameState): boolean {
  switch (id) {
    case 'a_build5': return s.buildings.reduce((a, b) => a + (b.count || 1), 0) >= 5
    case 'a_build10': return s.buildings.some(b => b.level >= MAX_BUILDING_LV)
    case 'a_debris100': return s.debrisCollected >= 100
    case 'a_plank50': return s.resources.plank >= 30
    case 'a_stage6': return s.stage >= 6
    case 'a_hero5': return s.heroes.length >= 5
    case 'a_pop10': return s.population >= 10
    default: return false
  }
}

// 红点：有待领取奖励 / 待完成宝箱 / 优质订单 / 待展示弹窗
export function taskDot(s: GameState) {
  if (s.popTip) return true
  const dailyClaimable = s.side.daily.ids.some(id => {
    const def = DAILY_POOL.find(t => t.id === id)!
    return !s.side.daily.claimed[id] && (s.side.daily.progress[id] ?? 0) >= def.target
  })
  const weeklyClaimable = s.side.weekly.ids.some(id => {
    const def = WEEKLY_POOL.find(t => t.id === id)!
    return !s.side.weekly.claimed[id] && (s.side.weekly.progress[id] ?? 0) >= def.target
  })
  const chestReady = !s.side.dailyChest && s.side.daily.ids.length > 0 && s.side.daily.ids.every(id => s.side.daily.claimed[id])
  return dailyClaimable || weeklyClaimable || chestReady
}
export function orderDot(s: GameState) {
  return s.orders.some(o => o.quality === 'fine')
}

// 人口上限 = 基础3 + 等级成长 + 民居每级每座×3
export function popCap(s: GameState) {
  const residences = s.buildings.filter(b => b.buildingId === 'residence')
  return 3 + (s.level - 1) + residences.reduce((a, b) => a + 3 * (b.level || 1) * (b.count || 1), 0)
}

// 资源存储上限 = 基础200 + 仓库总等级×150
export function resCap(s: GameState) {
  const wh = s.buildings.filter(b => b.buildingId === 'warehouse')
  return BASE_STORAGE + wh.reduce((a, b) => a + STORAGE_PER_WAREHOUSE_LV * (b.level || 1) * (b.count || 1), 0)
}

// 受限资源 clamp 到存储上限
function clampStorage(s: GameState) {
  const cap = resCap(s)
  for (const r of CAPPED_RESOURCES) s.resources[r] = Math.min(s.resources[r], cap)
}

// 采集建筑是否已解锁自动挂机（无 autoLv 的建筑恒自动）
export function isAuto(pb: PlacedBuilding, def: BuildingDef, s?: GameState) {
  if (!def.autoLv) return true
  if ((pb.level || 1) >= def.autoLv) return true
  // 钓鱼椅特例：委派猎人后立即自动收鱼，无需等到 Lv2
  if (s && pb.buildingId === 'fishing_chair' && (s.jobs.J003 ?? 0) > 0) return true
  return false
}

// 等级加成后的实际生产间隔（秒）
export function effInterval(def: BuildingDef, lv: number) {
  return (def.intervalSec ?? 1) / levelSpeedMult(lv || 1)
}

// 岗位对某建筑的速度倍率
function jobBoost(s: GameState, buildingId: BuildingId) {
  let m = 1
  for (const job of JOBS) {
    if (job.targets.includes(buildingId)) m += s.jobs[job.jobId] * job.boostPer
  }
  return m
}

// 委任对某建筑的速度倍率
function assignBoost(s: GameState, buildingId: BuildingId) {
  let m = 1
  for (const a of s.assignments) {
    if (!a) continue
    const hero = HEROES.find(h => h.id === a.heroId)
    if (!hero) continue
    const eff = ASSIGN_TAG_EFFECT[hero.tag]
    if (eff.targets !== 'command' && (eff.targets as BuildingId[]).includes(buildingId) && a.target === buildingId) {
      m += eff.speedUp
    }
  }
  return m
}

// 是否有全局型委任（离线/订单加成）
function hasGlobalAssign(s: GameState) {
  return s.assignments.some(a => a && HEROES.find(h => h.id === a.heroId)?.tag === '全局型')
}

// 饱食度 → 生产效率（分段模型，对齐 hunger_model 配置）
export function efficiency(s: GameState) {
  const h = s.satiety
  if (h <= 0) return 0                       // 停止工作
  if (h >= 60) return 1                      // 满效率
  if (h >= 20) return 0.5 + ((h - 20) / 80) * 0.5   // 线性衰减：20点→50%
  return 0.2 + (h / 20) * 0.3                // 0~20：最低20%
}

// 饱食度衰减（点/秒）：单人0.8/分钟，厨师在岗全局-25%，医生每人-20%
function hungerDecayPerSec(s: GameState) {
  const chefOn = s.jobs.J004 > 0
  const doctorCut = Math.min(0.6, 0.2 * s.jobs.J005)
  return (0.8 / 60) * s.population * (chefOn ? 0.75 : 1) * (1 - doctorCut)
}

function makeOrder(id: number, level: number): Order {
  const pool: ResourceId[] = level >= 5 ? ['plank', 'ration', 'ingot'] : level >= 3 ? ['plank', 'ration', 'wood', 'fish'] : ['wood', 'fish']
  const want: Partial<Record<ResourceId, number>> = {}
  const n = 1 + Math.floor(Math.random() * 2)
  for (let i = 0; i < n; i++) {
    const r = pool[Math.floor(Math.random() * pool.length)]
    want[r] = (want[r] ?? 0) + 2 + Math.floor(Math.random() * 3) * level
  }
  const value = Object.entries(want).reduce((s, [k, v]) => s + v! * (['plank', 'ingot', 'ration'].includes(k) ? 8 : 2), 0)
  const fine = Math.random() < FINE_ORDER_PROB // 优质订单：奖励倍率更高，必掉蓝图
  return {
    id,
    resident: RESIDENTS[Math.floor(Math.random() * RESIDENTS.length)],
    want,
    rewardGold: Math.round(value * 1.5 * (fine ? FINE_ORDER_MULT : 1)),
    rewardXp: Math.round(value * 0.8 * (fine ? FINE_ORDER_MULT : 1)),
    rewardBlueprint: fine ? 1 : Math.random() < 0.25 ? 1 : undefined,
    quality: fine ? 'fine' : 'normal',
  }
}

function load(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw) as GameState
    // 旧存档兼容
    s.satiety ??= 100
    s.starvingSec ??= 0
    s.jobs ??= { J001: 0, J002: 0, J003: 0, J004: 0, J005: 0 }
    s.assignments ??= [null, null]
    s.minigames ??= { date: today(), used: {}, cdUntil: {} }
    s.flares ??= 2
    s.hourglasses ??= 0
    for (const pb of s.buildings) { pb.level ??= 1; pb.pending ??= false; pb.count ??= 1 }
    // 格子扩容/地标迁移：地标建筑固定 slot=-1；普通建筑格子重新紧凑排列，防止旧档格子超上限后隐藏
    let gi = 0
    for (const pb of s.buildings) {
      const def = BUILDINGS.find(b => b.id === pb.buildingId)!
      if (def.landmark) pb.slot = LANDMARK_SLOT
      else { pb.slot = gi; gi += 1 }
    }
    s.side ??= freshSide()
    s.popTip ??= null
    clampStorage(s)
    // 跨天刷新小游戏次数 + 每日补1枚信号弹 + 每日/每周任务重置
    if (s.minigames.date !== today()) {
      s.minigames = { date: today(), used: {}, cdUntil: {} }
      s.flares += 1
    }
    if (s.side.dailyDate !== today()) {
      s.side.dailyDate = today()
      s.side.daily = freshDaily(today())
      s.side.dailyChest = false
    }
    if (s.side.weeklyWeek !== weekKey()) {
      s.side.weeklyWeek = weekKey()
      s.side.weekly = freshWeekly(weekKey())
    }
    // 离线挂机收益：仅已解锁自动挂机的建筑结算，最多4小时
    const awaySec = Math.min((Date.now() - s.lastSeen) / 1000, 4 * 3600)
    if (awaySec > 60 && s.buildings.length > 0) {
      const offlineBoost = hasGlobalAssign(s) ? 1.25 : 1
      for (const pb of s.buildings) {
        const def = BUILDINGS.find(b => b.id === pb.buildingId)!
        if (!def.output || !def.intervalSec || !isAuto(pb, def, s)) continue
        const boost = jobBoost(s, pb.buildingId) * assignBoost(s, pb.buildingId) * offlineBoost
        const cycles = Math.floor((awaySec / effInterval(def, pb.level)) * boost * 0.5) * (pb.count || 1) // 离线效率50%，同类叠加按数量结算
        if (cycles <= 0) continue
        if (def.input && !canAfford(s.resources, scaleCost(def.input, cycles))) continue
        if (def.input) applyCost(s.resources, scaleCost(def.input, cycles), -1)
        applyCost(s.resources, scaleCost(def.output, cycles), 1)
        clampStorage(s)
      }
    }
    s.lastSeen = Date.now()
    return s
  } catch {
    return initialState()
  }
}

function scaleCost(c: Partial<Record<ResourceId, number>>, n: number) {
  const o: Partial<Record<ResourceId, number>> = {}
  for (const k in c) o[k as ResourceId] = (c[k as ResourceId] ?? 0) * n
  return o
}
function canAfford(res: Record<ResourceId, number>, cost: Partial<Record<ResourceId, number>>) {
  return Object.entries(cost).every(([k, v]) => res[k as ResourceId] >= (v ?? 0))
}
function applyCost(res: Record<ResourceId, number>, cost: Partial<Record<ResourceId, number>>, dir: 1 | -1) {
  for (const k in cost) res[k as ResourceId] += dir * (cost[k as ResourceId] ?? 0)
}

export interface Toast { id: number; text: string; color?: string }

export function useGameState() {
  const [state, setState] = useState<GameState>(load)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const pushToast = useCallback((text: string, color = '#fff') => {
    const id = ++toastId.current
    setToasts(t => [...t.slice(-3), { id, text, color }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200)
  }, [])

  // 持久化
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        const ns = { ...s, lastSeen: Date.now() }
        localStorage.setItem(SAVE_KEY, JSON.stringify(ns))
        return ns
      })
    }, 5000)
    return () => clearInterval(t)
  }, [])

  // 生产 & 生存 tick（1s）
  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        const ns: GameState = { ...s, resources: { ...s.resources }, side: { ...s.side } }
        // 跨天/跨周重置（挂到午夜也能刷）
        if (ns.side.dailyDate !== today()) {
          ns.side.dailyDate = today()
          ns.side.daily = freshDaily(today())
          ns.side.dailyChest = false
          ns.minigames = { date: today(), used: {}, cdUntil: {} }
          ns.flares += 1
        }
        if (ns.side.weeklyWeek !== weekKey()) {
          ns.side.weeklyWeek = weekKey()
          ns.side.weekly = freshWeekly(weekKey())
        }
        // --- 饱食度：按数值模型衰减（口粮补给改为手动） ---
        ns.satiety = Math.max(0, s.satiety - hungerDecayPerSec(s))
        // 居民流失：饱食度持续为0超过120分钟，流失1名居民
        if (ns.satiety <= 0) {
          ns.starvingSec = s.starvingSec + 1
          if (ns.starvingSec >= 120 * 60 && ns.population > 1) {
            ns.population -= 1
            ns.starvingSec = 0
            ns.satiety = 40
            // 超出人口的岗位自动下岗
            const total = Object.values(ns.jobs).reduce((a, b) => a + b, 0)
            let over = total - ns.population
            if (over > 0) {
              const nj = { ...ns.jobs }
              for (const k of Object.keys(nj) as JobId[]) {
                const cut = Math.min(nj[k], over)
                nj[k] -= cut
                over -= cut
                if (over <= 0) break
              }
              ns.jobs = nj
            }
            pushToast('💔 长期断粮，一名居民离开了基地…', '#e8734a')
          }
        } else {
          ns.starvingSec = 0
        }
        const eff = efficiency(ns)
        const cap = resCap(ns)
        // --- 建筑生产 ---
        ns.buildings = s.buildings.map(pb => {
          const def = BUILDINGS.find(b => b.id === pb.buildingId)!
          if (!def.output || !def.intervalSec) return pb
          const auto = isAuto(pb, def, ns)
          if (pb.pending && !auto) return pb // 未解锁自动挂机：产出待手动收取（已解锁则继续走自动结算）
          const interval = effInterval(def, pb.level)
          const speed = jobBoost(ns, pb.buildingId) * assignBoost(ns, pb.buildingId) * eff
          let prog = pb.progress + speed / interval
          let pending = false
          const outputFull = () => Object.keys(def.output!).some(k =>
            CAPPED_RESOURCES.includes(k as ResourceId) && ns.resources[k as ResourceId] >= cap)
          if (prog >= 1) {
            if (outputFull()) {
              prog = 1 // 仓库已满：溢出停产
            } else if (!auto) {
              prog = 1; pending = true // 完成一轮，等待手动收取
            } else {
              const cnt = pb.count || 1
              const scaledInput = def.input ? scaleCost(def.input, cnt) : undefined
              const scaledOutput = scaleCost(def.output, cnt)
              while (prog >= 1) {
                if (scaledInput && !canAfford(ns.resources, scaledInput)) { prog = 0.99; break }
                if (outputFull()) { prog = 1; break }
                prog -= 1
                if (scaledInput) applyCost(ns.resources, scaledInput, -1)
                applyCost(ns.resources, scaledOutput, 1)
                bumpMetric(ns, `prod:${pb.buildingId}`, cnt)
                for (const k of Object.keys(def.output)) bumpMetric(ns, k, (def.output[k as ResourceId] ?? 1) * cnt)
              }
            }
          }
          return { ...pb, progress: prog, pending }
        })
        clampStorage(ns)
        // 成就：满足条件自动领取（不接取）
        for (const a of ACHIEVEMENTS) {
          if (!ns.side.claimedAch.includes(a.id) && checkAch(a.id, ns)) {
            ns.side.claimedAch = [...ns.side.claimedAch, a.id]
            grantReward(ns, a.reward, gainXp)
            pushToast(`🏆 成就达成「${a.name}」，奖励已发放！`, '#f0c93f')
          }
        }
        return ns
      })
    }, 1000)
    return () => clearInterval(t)
  }, [pushToast])

  const gainXp = (s: GameState, xp: number) => {
    s.xp += xp
    while (s.xp >= XP_PER_LEVEL(s.level)) {
      s.xp -= XP_PER_LEVEL(s.level)
      s.level += 1
      pushToast(`🎉 基地升到 ${s.level} 级！人口上限+1`, '#f0c93f')
    }
  }

  // 主线任务完成：发奖 + Toast + 奖励结算弹窗（含下一任务预告）
  const completeMainTask = (s: GameState, task: TaskDef) => {
    const r = task.reward
    for (const k in r) {
      if (k === 'xp') continue
      s.resources[k as ResourceId] += (r as any)[k]
    }
    if (r.xp) gainXp(s, r.xp)
    pushToast(`✅ 主线完成：${task.text(task.target)}`, '#5cb86e')
    s.taskIndex += 1
    s.taskProgress = 0
    s.popTip = `done:${task.id}`
  }

  const bumpTask = (s: GameState, metric: string, n = 1) => {
    const task = TASKS[s.taskIndex]
    if (!task) return
    if (task.metric === metric) {
      s.taskProgress += n
      if (s.taskProgress >= task.target) completeMainTask(s, task)
    }
  }

  // 统一埋点：主线 + 每日 + 每周
  const bumpMetric = (s: GameState, metric: string, n = 1) => {
    bumpTask(s, metric, n)
    for (const id of s.side.daily.ids) {
      const def = DAILY_POOL.find(t => t.id === id)
      if (def && def.metric === metric && !s.side.daily.claimed[id]) {
        s.side.daily.progress[id] = Math.min(def.target, (s.side.daily.progress[id] ?? 0) + n)
      }
    }
    for (const id of s.side.weekly.ids) {
      const def = WEEKLY_POOL.find(t => t.id === id)
      if (def && def.metric === metric && !s.side.weekly.claimed[id]) {
        s.side.weekly.progress[id] = Math.min(def.target, (s.side.weekly.progress[id] ?? 0) + n)
      }
    }
  }

  const collectDebris = useCallback((kind: 'wood' | 'plastic' | 'cloth' | 'barrel' | 'chest') => {
    setState(s => {
      const ns = { ...s, resources: { ...s.resources } }
      const give = (r: ResourceId, n: number) => {
        ns.resources[r] += n
        if (['wood', 'fish'].includes(r)) bumpMetric(ns, r, n)
      }
      if (kind === 'barrel') { give('wood', 2); give('plastic', 1) }
      else if (kind === 'chest') { give('wood', 1); ns.resources.gold += 5; if (Math.random() < 0.15) ns.resources.diamond += 1 }
      else give(kind, 1)
      ns.debrisCollected += 1
      bumpMetric(ns, 'debris')
      gainXp(ns, 3)
      return ns
    })
  }, [])

  // 前置建筑是否已建造
  const preMet = useCallback((s: GameState, def: BuildingDef) =>
    !def.precondition || s.buildings.some(b => b.buildingId === def.precondition), [])

  // 格子占用：仅统计非地标建筑（地标不占格）；同类叠加也不占新格
  const gridUsed = (s: GameState) => s.buildings.filter(b => !BUILDINGS.find(d => d.id === b.buildingId)!.landmark).length

  const canBuild = useCallback((id: BuildingId) => {
    const def = BUILDINGS.find(b => b.id === id)!
    const hasStack = state.buildings.some(b => b.buildingId === id) // 同类叠加不占新格子
    return state.level >= def.unlockLevel && preMet(state, def) && canAfford(state.resources, def.cost) &&
      (hasStack || !!def.landmark || gridUsed(state) < islandSlots(state.level))
  }, [state, preMet])

  const build = useCallback((id: BuildingId) => {
    setState(s => {
      const def = BUILDINGS.find(b => b.id === id)!
      const existing = s.buildings.find(b => b.buildingId === id)
      if (s.level < def.unlockLevel || !preMet(s, def) || !canAfford(s.resources, def.cost) ||
        (!existing && !def.landmark && gridUsed(s) >= islandSlots(s.level))) return s
      const ns = { ...s, resources: { ...s.resources }, buildings: [...s.buildings] }
      applyCost(ns.resources, def.cost, -1)
      if (existing) {
        // 同类建筑：数量+1，不占用新格子
        const i = ns.buildings.findIndex(b => b.buildingId === id)
        ns.buildings[i] = { ...existing, count: (existing.count || 1) + 1 }
        pushToast(`🏗️ ${def.name} +1（现有×${ns.buildings[i].count}）`, '#7fd4e8')
      } else {
        // 地标建筑放地标位（slot=-1）；普通建筑占下一个空格
        let slot = LANDMARK_SLOT
        if (!def.landmark) {
          const used = new Set(ns.buildings.filter(b => b.slot >= 0).map(b => b.slot))
          slot = 0
          while (used.has(slot)) slot += 1
        }
        ns.buildings.push({ uid: ns.nextUid, buildingId: id, level: 1, count: 1, progress: 0, slot })
        ns.nextUid += 1
        pushToast(`🏗️ ${def.name} 建造完成！`, '#7fd4e8')
      }
      bumpTask(ns, `build:${id}`)
      gainXp(ns, 15)
      // 新系统解锁弹窗（仅首次；奖励结算弹窗优先，冲突时跳过系统介绍）
      if (['radio', 'command', 'warehouse'].includes(id) && !ns.side.seenPops.includes(`sys:${id}`)) {
        if (!ns.popTip) ns.popTip = `sys:${id}`
        else ns.side = { ...ns.side, seenPops: [...ns.side.seenPops, `sys:${id}`] }
      }
      return ns
    })
  }, [pushToast, preMet])

  // 建筑升级：基础资源+蓝图×数量，整叠一起升，等级越高产出速率越高
  const upgradeBuilding = useCallback((uid: number) => {
    setState(s => {
      const pb = s.buildings.find(b => b.uid === uid)
      if (!pb) return s
      const def = BUILDINGS.find(b => b.id === pb.buildingId)!
      if (pb.level >= MAX_BUILDING_LV) return s
      const cost = scaleCost(UPGRADE_COST(pb.level), pb.count || 1)
      if (!canAfford(s.resources, cost)) return s
      const ns = { ...s, resources: { ...s.resources }, buildings: [...s.buildings] }
      applyCost(ns.resources, cost, -1)
      const i = ns.buildings.findIndex(b => b.uid === uid)
      ns.buildings[i] = { ...pb, level: pb.level + 1 }
      gainXp(ns, 10)
      const extra = def.autoLv && ns.buildings[i].level === def.autoLv ? '，已解锁自动挂机！' : ''
      pushToast(`⬆️ ${def.name} 升到 Lv${ns.buildings[i].level}${extra}`, '#f0c93f')
      return ns
    })
  }, [pushToast])

  // 手动收取产出（未解锁自动挂机的建筑），按叠加数量结算
  const collectBuilding = useCallback((uid: number) => {
    setState(s => {
      const pb = s.buildings.find(b => b.uid === uid)
      if (!pb || !pb.pending) return s
      const def = BUILDINGS.find(b => b.id === pb.buildingId)!
      if (!def.output) return s
      const cnt = pb.count || 1
      const scaledOutput = scaleCost(def.output, cnt)
      const ns = { ...s, resources: { ...s.resources }, buildings: [...s.buildings] }
      applyCost(ns.resources, scaledOutput, 1)
      bumpMetric(ns, 'collect')
      bumpMetric(ns, `prod:${pb.buildingId}`, cnt)
      for (const k of Object.keys(def.output)) bumpMetric(ns, k, (def.output[k as ResourceId] ?? 1) * cnt)
      clampStorage(ns)
      const i = ns.buildings.findIndex(b => b.uid === uid)
      ns.buildings[i] = { ...pb, pending: false, progress: 0 }
      return ns
    })
  }, [])

  const submitOrder = useCallback((orderId: number) => {
    setState(s => {
      const order = s.orders.find(o => o.id === orderId)
      if (!order || !canAfford(s.resources, order.want)) return s
      const ns = { ...s, resources: { ...s.resources } }
      applyCost(ns.resources, order.want, -1)
      const globalBonus = hasGlobalAssign(ns) ? 1.2 : 1
      ns.resources.gold += Math.round(order.rewardGold * globalBonus)
      if (order.rewardBlueprint) ns.resources.blueprint += order.rewardBlueprint
      gainXp(ns, Math.round(order.rewardXp * globalBonus))
      bumpMetric(ns, 'order')
      // 30% 概率收留新幸存者
      if (Math.random() < 0.3 && ns.population < popCap(ns)) {
        ns.population += 1
        pushToast(`🧑‍🤝‍🧑 一位幸存者加入了基地！人口 ${ns.population}/${popCap(ns)}`, '#5cb86e')
      }
      ns.orders = s.orders.filter(o => o.id !== orderId)
      if (ns.orders.length < ORDER_MAX) {
        ns.orders.push(makeOrder(ns.nextOrderId, ns.level))
        ns.nextOrderId += 1
      }
      pushToast(`📦 订单完成 +${order.rewardGold}金币`, '#f0c93f')
      return ns
    })
  }, [pushToast])

  // 订单手动刷新：消耗金币重刷整份列表
  const refreshOrders = useCallback(() => {
    setState(s => {
      if (s.resources.gold < ORDER_REFRESH_COST) return s
      const ns = { ...s, resources: { ...s.resources } }
      ns.resources.gold -= ORDER_REFRESH_COST
      let nid = s.nextOrderId
      ns.orders = Array.from({ length: ORDER_MAX }, () => makeOrder(nid++, ns.level))
      ns.nextOrderId = nid
      pushToast(`🔄 订单列表已刷新（-${ORDER_REFRESH_COST}金币）`, '#7fd4e8')
      return ns
    })
  }, [pushToast])

  const recruit = useCallback(() => {
    setState(s => {
      if (s.resources.gold < 50) return s
      const ns = { ...s, resources: { ...s.resources }, heroes: [...s.heroes] }
      ns.resources.gold -= 50
      const roll = Math.random()
      const rarity = roll < 0.05 ? 'SSR' : roll < 0.3 ? 'SR' : roll < 0.65 ? 'R' : 'N'
      const pool = HEROES.filter(h => h.rarity === rarity)
      const pick = (pool.length ? pool : HEROES.filter(h => h.rarity === 'R'))[Math.floor(Math.random() * (pool.length || 2))]
      const exist = ns.heroes.find(h => h.heroId === pick.id)
      if (exist) {
        exist.stars += 1
        pushToast(`⭐ ${pick.name} 升星到 ${exist.stars} 星！`, pick.color)
      } else {
        ns.heroes.push({ heroId: pick.id, level: 1, stars: 1 })
        pushToast(`🦸 招募到 ${rarity} 英雄「${pick.name}」！`, pick.color)
      }
      bumpMetric(ns, 'recruit')
      return ns
    })
  }, [pushToast])

  const teamPower = useCallback(() => {
    return state.heroes.reduce((sum, h) => {
      const def = HEROES.find(d => d.id === h.heroId)!
      return sum + Math.round(def.power * (1 + (h.stars - 1) * 0.3))
    }, 0)
  }, [state.heroes])

  const fight = useCallback((): boolean => {
    const enemy = STAGE_ENEMIES[Math.min(state.stage - 1, STAGE_ENEMIES.length - 1)]
    const win = teamPower() >= enemy.power
    if (win) {
      setState(s => {
        const ns = { ...s, resources: { ...s.resources } }
        ns.resources.gold += 40 + s.stage * 10
        if (s.stage % 2 === 0) ns.resources.blueprint += 1
        ns.stage = s.stage + 1
        gainXp(ns, 30)
        bumpMetric(ns, 'fight')
        // 通关营救幸存者
        if (ns.population < popCap(ns)) {
          ns.population += 1
          pushToast(`🛟 从海盗手中营救了一名幸存者！`, '#5cb86e')
        }
        const t = TASKS[ns.taskIndex]
        if (t && t.metric === 'stage') {
          ns.taskProgress = Math.max(ns.taskProgress, ns.stage - 1)
          if (ns.taskProgress >= t.target) completeMainTask(ns, t)
        }
        return ns
      })
    }
    return win
  }, [state.stage, teamPower])

  // 居民岗位分配
  const assignJob = useCallback((jobId: JobId, delta: 1 | -1) => {
    setState(s => {
      const job = JOBS.find(j => j.jobId === jobId)!
      const cur = s.jobs[jobId]
      if (delta === 1) {
        const totalAssigned = Object.values(s.jobs).reduce((a, b) => a + b, 0)
        if (cur >= job.maxStaff || totalAssigned >= s.population) return s
        // 岗位对应建筑至少建了一座
        if (!job.targets.some(t => s.buildings.some(b => b.buildingId === t))) return s
      }
      if (delta === -1 && cur <= 0) return s
      const ns = { ...s, jobs: { ...s.jobs, [jobId]: cur + delta } }
      if (delta === 1) bumpMetric(ns, `assign:${jobId}`) // 主线：委派猎人钓鱼
      return ns
    })
  }, [])

  // 口粮补给：消耗5口粮，恢复25饱食度
  const replenish = useCallback(() => {
    setState(s => {
      if (s.resources.ration < 5 || s.satiety >= 100) return s
      const ns = { ...s, resources: { ...s.resources } }
      ns.resources.ration -= 5
      ns.satiety = Math.min(100, ns.satiety + 25)
      ns.starvingSec = 0
      pushToast(`🍙 补给完成！饱食度 +25`, '#5cb86e')
      return ns
    })
  }, [pushToast])

  // ============ 小游戏 ============
  // 开始一局：扣次数 + 进入CD
  const startMinigame = useCallback((id: string, cdSec: number) => {
    setState(s => ({
      ...s,
      minigames: {
        ...s.minigames,
        used: { ...s.minigames.used, [id]: (s.minigames.used[id] ?? 0) + 1 },
        cdUntil: { ...s.minigames.cdUntil, [id]: Date.now() + cdSec * 1000 },
      },
    }))
  }, [])

  // 结算一局：基础奖励按区间roll × 表现系数(0.6~1.4)，独立奖励池不吃生产倍率
  const finishMinigame = useCallback((id: string, performance: number) => {
    setState(s => {
      const def = MINIGAMES.find(m => m.id === id)!
      const ns = { ...s, resources: { ...s.resources } }
      const mult = 0.6 + 0.8 * Math.max(0, Math.min(1, performance))
      const gains: string[] = []
      for (const [k, range] of Object.entries(def.baseReward)) {
        const n = Math.max(1, Math.round((range[0] + Math.random() * (range[1] - range[0])) * mult))
        if (k === 'hourglass') { ns.hourglasses += n; gains.push(`加速沙漏×${n}`) }
        else { ns.resources[k as ResourceId] += n; gains.push(`${RES[k as ResourceId].name}×${n}`) }
      }
      if (Math.random() < def.extraProb) {
        if (def.id === 'MG001') { ns.resources.blueprint += 1; gains.push('稀有鱼→蓝图×1') }
        else if (def.id === 'MG002') { ns.hourglasses += 1; gains.push('加速沙漏×1') }
        else if (def.id === 'MG003') { ns.resources.blueprint += 1; gains.push('蓝图×1') }
        else {
          // 英雄碎片随机包：随机英雄，已有则升星
          const pick = HEROES[Math.floor(Math.random() * HEROES.length)]
          const exist = ns.heroes.find(h => h.heroId === pick.id)
          if (exist) exist.stars += 1
          else ns.heroes = [...ns.heroes, { heroId: pick.id, level: 1, stars: 1 }]
          gains.push(`英雄碎片包→${pick.name}`)
        }
      }
      pushToast(`🎮 ${def.name}完成：${gains.join('、')}`, '#7fd4e8')
      gainXp(ns, 10)
      bumpMetric(ns, 'minigame')
      bumpMetric(ns, `minigame:${def.id}`)
      return ns
    })
  }, [pushToast])

  // 应急信号弹：重置某小游戏当日次数与CD
  const useFlare = useCallback((id: string) => {
    setState(s => {
      if (s.flares <= 0) return s
      const used = { ...s.minigames.used, [id]: 0 }
      const cdUntil = { ...s.minigames.cdUntil, [id]: 0 }
      pushToast('🚀 信号弹升空！次数已重置', '#f0c93f')
      return { ...s, flares: s.flares - 1, minigames: { ...s.minigames, used, cdUntil } }
    })
  }, [pushToast])

  // 英雄委任
  const assignHero = useCallback((slot: number, heroId: string, target: BuildingId | 'command') => {
    setState(s => {
      if (!s.buildings.some(b => b.buildingId === 'command')) return s
      const hero = HEROES.find(h => h.id === heroId)
      if (!hero || !s.heroes.some(h => h.heroId === heroId)) return s
      const eff = ASSIGN_TAG_EFFECT[hero.tag]
      const ok = eff.targets === 'command' ? target === 'command' : (eff.targets as BuildingId[]).includes(target)
      if (!ok) return s
      // 同一英雄只能占一个槽
      const na = s.assignments.map((a, i) => (a?.heroId === heroId && i !== slot ? null : a))
      na[slot] = { heroId, target }
      pushToast(`📌 ${hero.name} 委任生效！`, hero.color)
      return { ...s, assignments: na }
    })
  }, [pushToast])

  const unassignHero = useCallback((slot: number) => {
    setState(s => {
      const na = [...s.assignments]
      na[slot] = null
      return { ...s, assignments: na }
    })
  }, [])

  // 领取每日/每周任务奖励
  const claimSideTask = useCallback((scope: 'daily' | 'weekly', id: string) => {
    setState(s => {
      const pool = scope === 'daily' ? DAILY_POOL : WEEKLY_POOL
      const def = pool.find(t => t.id === id)
      if (!def) return s
      const st = s.side[scope]
      if (st.claimed[id] || (st.progress[id] ?? 0) < def.target) return s
      const ns = { ...s, resources: { ...s.resources }, side: { ...s.side, [scope]: { ...st, claimed: { ...st.claimed, [id]: true } } } }
      grantReward(ns, def.reward, gainXp)
      pushToast(`🎁 领取「${def.name}」奖励！`, '#f0c93f')
      return ns
    })
  }, [pushToast])

  // 每日全部完成：领取额外宝箱
  const claimDailyChest = useCallback(() => {
    setState(s => {
      if (s.side.dailyChest || !s.side.daily.ids.every(id => s.side.daily.claimed[id])) return s
      const ns = { ...s, resources: { ...s.resources }, side: { ...s.side, dailyChest: true } }
      grantReward(ns, DAILY_CHEST_REWARD, gainXp)
      pushToast(`🧰 每日宝箱到手！全任务完成奖励`, '#f0c93f')
      return ns
    })
  }, [pushToast])

  // 弹窗引导：关闭并标记已读（同类仅首次弹出）
  const dismissPop = useCallback(() => {
    setState(s => {
      if (!s.popTip) return s
      return { ...s, side: { ...s.side, seenPops: [...s.side.seenPops, s.popTip] }, popTip: null }
    })
  }, [])

  return { state, toasts, pushToast, collectDebris, canBuild, build, upgradeBuilding, collectBuilding, submitOrder, refreshOrders, recruit, teamPower, fight, assignJob, assignHero, unassignHero, replenish, startMinigame, finishMinigame, useFlare, claimSideTask, claimDailyChest, dismissPop }
}
