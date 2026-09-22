import type { BuildingDef, BuildingId, HeroDef, JobId, ResourceId, TaskDef } from '@/types/game'

export const RES: Record<ResourceId, { name: string; icon: string; color: string }> = {
  wood:      { name: '木材',   icon: '🪵', color: '#c98a4b' },
  plastic:   { name: '塑料',   icon: '🧴', color: '#e8734a' },
  cloth:     { name: '碎布',   icon: '🧵', color: '#e8b04b' },
  metal:     { name: '废金属', icon: '⚙️', color: '#9aa7b8' },
  glass:     { name: '玻璃',   icon: '🔷', color: '#7fd4e8' },
  algae:     { name: '海藻',   icon: '🌿', color: '#5cb86e' },
  fish:      { name: '鱼',     icon: '🐟', color: '#6ec6e8' },
  plank:     { name: '高级板材', icon: '🟫', color: '#a0622d' },
  ingot:     { name: '金属锭', icon: '🔩', color: '#c0c8d4' },
  ration:    { name: '口粮',   icon: '🍙', color: '#e8d44b' },
  blueprint: { name: '蓝图',   icon: '📐', color: '#4b8fe8' },
  gold:      { name: '金币',   icon: '🪙', color: '#f0c93f' },
  diamond:   { name: '钻石',   icon: '💎', color: '#7fd4f0' },
}

export const XP_PER_LEVEL = (lv: number) => 30 + lv * 25

// 建筑解锁链：基地等级为主条件，部分需前置建筑（对齐 building_unlock 配置）
export const BUILDINGS: BuildingDef[] = [
  { id: 'fishing_chair', name: '钓鱼椅', category: '采集', desc: '产出鱼；Lv2解锁自动挂机', unlockLevel: 1, precondition: null, autoLv: 2,
    cost: { wood: 15 }, produces: ['fish'], intervalSec: 6, output: { fish: 1 } },
  { id: 'sawmill', name: '锯木厂', category: '加工', desc: '木材 → 高级板材', unlockLevel: 2, precondition: 'fishing_chair', autoLv: null,
    cost: { wood: 30, cloth: 5 }, input: { wood: 2 }, output: { plank: 1 }, intervalSec: 10 },
  { id: 'salvage_boat', name: '拾荒船', category: '采集', desc: '打捞木材/塑料/碎布；Lv3解锁自动挂机', unlockLevel: 3, precondition: 'sawmill', autoLv: 3,
    cost: { wood: 25, plastic: 5 }, produces: ['wood', 'plastic', 'cloth'], intervalSec: 8, output: { wood: 1, plastic: 1 } },
  { id: 'furnace', name: '熔炉', category: '加工', desc: '废金属 → 金属锭', unlockLevel: 4, precondition: 'salvage_boat', autoLv: null,
    cost: { plank: 8, metal: 10 }, input: { metal: 2 }, output: { ingot: 1 }, intervalSec: 12 },
  { id: 'food_factory', name: '食品加工厂', category: '加工', desc: '鱼 → 口粮，维持居民状态', unlockLevel: 5, precondition: 'furnace', autoLv: null,
    cost: { wood: 30, plank: 4 }, input: { fish: 2 }, output: { ration: 1 }, intervalSec: 10 },
  { id: 'warehouse', name: '仓库', category: '功能', desc: '提升资源存储上限，仓库不足会导致溢出停产', unlockLevel: 6, precondition: 'food_factory', autoLv: null,
    cost: { wood: 40, plank: 6 } },
  { id: 'dive_dock', name: '潜水船坞', category: '采集', desc: '产出废金属/玻璃/海藻；Lv8解锁自动挂机', unlockLevel: 8, precondition: 'warehouse', autoLv: 8,
    cost: { wood: 40, plank: 5 }, produces: ['metal', 'glass', 'algae'], intervalSec: 12, output: { metal: 1, glass: 1 } },
  { id: 'radio', name: '广播站', category: '功能', desc: '英雄招募，解锁主线PVE关卡战斗（地标建筑，不占格子）', unlockLevel: 10, precondition: 'dive_dock', autoLv: null, landmark: true,
    cost: { plank: 10, ingot: 5, gold: 100 } },
  { id: 'command', name: '指挥中心', category: '功能', desc: '英雄委任，生产加速/产出加成buff（地标建筑，不占格子）', unlockLevel: 12, precondition: 'radio', autoLv: null, landmark: true,
    cost: { plank: 15, ingot: 10, blueprint: 3 } },
  { id: 'residence', name: '民居', category: '功能', desc: '居民居所，每级 +3 人口上限', unlockLevel: 3, precondition: null, autoLv: null,
    cost: { wood: 20, cloth: 5 } },
]

// 建筑升级：消耗基础资源+蓝图，等级越高产出速率越高
export const MAX_BUILDING_LV = 10
export const UPGRADE_COST = (lv: number): Partial<Record<ResourceId, number>> => ({
  wood: 12 * lv, plastic: 4 * lv, blueprint: lv,
})
export const levelSpeedMult = (lv: number) => 1 + 0.15 * (lv - 1)

// 资源存储上限：基础200 + 仓库每级+150（仅基础/加工资源受限，货币道具不受限）
export const BASE_STORAGE = 200
export const STORAGE_PER_WAREHOUSE_LV = 150
export const CAPPED_RESOURCES: ResourceId[] = ['wood', 'plastic', 'cloth', 'metal', 'glass', 'algae', 'fish', 'plank', 'ingot', 'ration']

export interface JobDef {
  jobId: JobId
  name: string
  targets: BuildingId[]
  effectDesc: string
  maxStaff: number
  boostPer: number // 每名居民对目标建筑的速度加成
}

export const JOBS: JobDef[] = [
  { jobId: 'J001', name: '伐木工', targets: ['sawmill'], effectDesc: '锯木厂产出 +25%/人', maxStaff: 3, boostPer: 0.25 },
  { jobId: 'J002', name: '矿工', targets: ['furnace', 'dive_dock'], effectDesc: '熔炉/潜水船坞产出 +25%/人', maxStaff: 3, boostPer: 0.25 },
  { jobId: 'J003', name: '猎人', targets: ['fishing_chair'], effectDesc: '钓鱼椅产出 +25%/人', maxStaff: 3, boostPer: 0.25 },
  { jobId: 'J004', name: '厨师', targets: ['food_factory'], effectDesc: '食品厂产出 +25%/人，在岗时全基地饱食衰减 -25%', maxStaff: 2, boostPer: 0.25 },
  { jobId: 'J005', name: '医生', targets: ['residence'], effectDesc: '饱食度衰减 -20%/人', maxStaff: 2, boostPer: 0.2 },
]

// 英雄委任加成
export const ASSIGN_TAG_EFFECT: Record<string, { targets: BuildingId[] | 'command'; desc: string; speedUp: number }> = {
  '采集型': { targets: ['fishing_chair', 'salvage_boat', 'dive_dock'], desc: '采集速度 +30%', speedUp: 0.3 },
  '加工型': { targets: ['sawmill', 'furnace', 'food_factory'], desc: '加工耗时 -23%', speedUp: 0.3 },
  '全局型': { targets: 'command', desc: '离线收益 +25%，订单奖励 +20%', speedUp: 0 },
}

export const ASSIGN_SLOTS = 2 // 指挥中心Lv1委任槽数

// ============ 限时/常驻小游戏 ============
export type MiniGameId = 'MG001' | 'MG002' | 'MG003' | 'MG004' | 'MG005'

export interface MiniGameDef {
  id: MiniGameId
  name: string
  icon: string
  type: '常驻' | '轮换'
  openWeekdays?: number[] // 0=周日
  unlockLevel: number
  dailyMax: number
  cdSec: number
  operation: string
  mode: 'fishing' | 'collect' | 'defend' | 'salvage'
  needBuilding?: BuildingId // 需建成对应建筑才解锁（如钓鱼小游戏←钓鱼椅）
  durationSec?: number
  baseReward: Partial<Record<ResourceId, [number, number]>> & { hourglass?: [number, number] }
  extraProb: number
  extraDesc: string
}

export const MINIGAMES: MiniGameDef[] = [
  {
    id: 'MG001', name: '钓鱼小游戏', icon: '🎣', type: '常驻', unlockLevel: 1,
    dailyMax: 10, cdSec: 30, operation: '蓄力拖拽，把握时机收杆', mode: 'fishing',
    needBuilding: 'fishing_chair',
    baseReward: { fish: [12, 25] }, extraProb: 0.15, extraDesc: '稀有鱼（兑换1蓝图）',
  },
  {
    id: 'MG002', name: '海面打捞', icon: '🛶', type: '常驻', unlockLevel: 3,
    dailyMax: 8, cdSec: 45, operation: '拖动拾荒船在无缝海面游走，装满船舱后返程', mode: 'salvage',
    needBuilding: 'salvage_boat',
    baseReward: { wood: [18, 32], plastic: [8, 15], cloth: [4, 9] },
    extraProb: 0.12, extraDesc: '加速沙漏×1',
  },
  {
    id: 'MG003', name: '海底探索', icon: '🤿', type: '常驻', unlockLevel: 8,
    dailyMax: 6, cdSec: 60, operation: '氧气耗尽前点击采集海底物资', mode: 'collect', durationSec: 25,
    baseReward: { metal: [10, 20], glass: [4, 8], algae: [6, 13] },
    extraProb: 0.10, extraDesc: '蓝图×1',
  },
  {
    id: 'MG004', name: '海上突围', icon: '💥', type: '轮换', openWeekdays: [1, 3, 5], unlockLevel: 1,
    dailyMax: 4, cdSec: 120, operation: '点击拦截海盗炮火，保护撤离船20秒', mode: 'defend', durationSec: 20,
    baseReward: { blueprint: [2, 4], hourglass: [1, 2] },
    extraProb: 0.08, extraDesc: '随机英雄（碎片包）',
  },
  {
    id: 'MG005', name: '物资漂流', icon: '📦', type: '轮换', openWeekdays: [2, 4, 6], unlockLevel: 1,
    dailyMax: 4, cdSec: 120, operation: '拦截漂流物资箱，击退突袭怪物', mode: 'defend', durationSec: 20,
    baseReward: { plank: [8, 15], ingot: [5, 10] },
    extraProb: 0.08, extraDesc: '随机英雄（碎片包）',
  },
]

// 主线链：严格按建筑解锁顺序排列（钓鱼椅→锯木厂→拾荒船→熔炉→食品加工厂→仓库→潜水船坞→广播站→指挥中心），
// 保证每个建造任务出现时其前置建筑任务已完成
export const TASKS: TaskDef[] = [
  { id: 't1',  text: t => `在海面上拾取${t}份木材`, target: 15, metric: 'wood', reward: { gold: 30, xp: 20 } },
  { id: 't2',  text: () => '建造一座钓鱼椅', target: 1, metric: 'build:fishing_chair', reward: { gold: 20, xp: 25 } },
  { id: 't3',  text: t => `收获${t}条鱼`, target: 10, metric: 'fish', reward: { gold: 40, xp: 30 } },
  { id: 't4',  text: () => '建造一座锯木厂', target: 1, metric: 'build:sawmill', reward: { diamond: 5, xp: 35 } },
  { id: 't5',  text: t => `加工${t}块高级板材`, target: 5, metric: 'plank', reward: { gold: 60, xp: 40 } },
  { id: 't6',  text: () => '建造一艘拾荒船', target: 1, metric: 'build:salvage_boat', reward: { gold: 50, xp: 45 } },
  { id: 't7',  text: t => `完成${t}个居民订单`, target: 3, metric: 'order', reward: { blueprint: 2, xp: 50 } },
  // 委派任务放在订单（Lv3）开放之后：此时「订单→岗位」页签已可用
  { id: 't7b', text: () => '委派猎人钓鱼（订单→岗位）', target: 1, metric: 'assign:J003', reward: { gold: 30, xp: 30 } },
  { id: 't8',  text: () => '建造一座熔炉', target: 1, metric: 'build:furnace', reward: { gold: 80, xp: 55 } },
  { id: 't9',  text: () => '建造一座食品加工厂', target: 1, metric: 'build:food_factory', reward: { gold: 80, xp: 60 } },
  { id: 't10', text: t => `加工${t}份口粮`, target: 5, metric: 'ration', reward: { blueprint: 2, xp: 65 } },
  { id: 't11', text: () => '建造一座仓库', target: 1, metric: 'build:warehouse', reward: { diamond: 5, xp: 70 } },
  { id: 't12', text: () => '建造一座潜水船坞', target: 1, metric: 'build:dive_dock', reward: { blueprint: 3, xp: 80 } },
  { id: 't13', text: () => '建造一座广播站', target: 1, metric: 'build:radio', reward: { diamond: 10, xp: 100 } },
  { id: 't14', text: t => `招募${t}名英雄`, target: 1, metric: 'recruit', reward: { gold: 100, xp: 80 } },
  { id: 't15', text: t => `通过第${t}关海盗据点`, target: 3, metric: 'stage', reward: { blueprint: 3, xp: 100 } },
  { id: 't16', text: () => '建造指挥中心', target: 1, metric: 'build:command', reward: { diamond: 10, xp: 120 } },
  { id: 't17', text: t => `通过第${t}关深海海盗团`, target: 6, metric: 'stage', reward: { diamond: 15, xp: 150 } },
]

export const HEROES: HeroDef[] = [
  { id: 'h_tank1', name: '铁壁·老船锚', cls: '坦克', rarity: 'SSR', skill: '钢铁壁垒', skillDesc: '全队护盾+15%减伤2回合', power: 120, color: '#4b8fe8', tag: '全局型' },
  { id: 'h_tank2', name: '鱼叉手·阿鲛', cls: '坦克', rarity: 'R', skill: '鱼叉猛击', skillDesc: '180%单体伤害+破甲20%', power: 80, color: '#5cb86e', tag: '采集型' },
  { id: 'h_dps1', name: '激流·浪花', cls: '输出', rarity: 'SR', skill: '激流扫射', skillDesc: '120%全体水系伤害', power: 100, color: '#9b6ee8', tag: '采集型' },
  { id: 'h_dps2', name: '水雷·砰砰', cls: '输出', rarity: 'SR', skill: '爆破水雷', skillDesc: '220%随机3目标+眩晕', power: 105, color: '#e8734a', tag: '加工型' },
  { id: 'h_sup1', name: '泉眼·小漪', cls: '辅助', rarity: 'SSR', skill: '生机涌泉', skillDesc: '全队治疗300%+清除减益', power: 115, color: '#e8b04b', tag: '全局型' },
  { id: 'h_sup2', name: '潮汐·沫沫', cls: '辅助', rarity: 'R', skill: '潮汐祝福', skillDesc: '全队攻+12%速+8%不可驱散', power: 75, color: '#7fd4e8', tag: '加工型' },
]

export const RECRUIT_COST = { gold: 50 }

export const RESIDENTS = ['老渔夫', '小满', '铁匠阿锤', '厨娘阿珍', '邮差海鸥', '医生白芷']

export const STAGE_ENEMIES = [
  { name: '海盗小兵', power: 60 },
  { name: '海盗双人组', power: 140 },
  { name: '海盗突击手', power: 260 },
  { name: '海盗小队', power: 420 },
  { name: '海盗首领·铁钩', power: 650 },
  { name: '深海海盗团', power: 950 },
]

export const NAV_ITEMS = [
  { id: 'base',   name: '基地', icon: 'base',   unlockLevel: 1 },
  { id: 'hero',   name: '英雄', icon: 'hero',   unlockLevel: 10 },
  { id: 'bag',    name: '背包', icon: 'bag',    unlockLevel: 1 },
  { id: 'battle', name: '战斗', icon: 'battle', unlockLevel: 10 },
  { id: 'order',  name: '订单', icon: 'order',  unlockLevel: 3 },
  { id: 'map',    name: '地图', icon: 'map',    unlockLevel: 16 },
] as const

export type NavId = typeof NAV_ITEMS[number]['id']

// 岛屿格子随基地等级扩建：Lv1 六格，每 2 级 +1 格，Lv9 封顶十格
export const ISLAND_SLOTS_BASE = 6
export const ISLAND_SLOTS_MAX = 10
export const islandSlots = (level: number) => Math.min(ISLAND_SLOTS_MAX, ISLAND_SLOTS_BASE + Math.floor((level - 1) / 2))
// 地标建筑（广播站/指挥中心）不占普通格子，放在岛屿地标位
export const LANDMARK_SLOT = -1

// ============ 任务系统：每日/每周/成就（对齐 task_system 配置） ============
export interface SideTaskDef {
  id: string
  name: string
  metric: string
  target: number
  needLevel?: number // 条件不满足时灰色锁定（block_tip）
  reward: Partial<Record<ResourceId, number>> & { xp?: number; hourglass?: number }
}

export const DAILY_COUNT = 5
export const WEEKLY_COUNT = 4
export const DAILY_CHEST_REWARD: SideTaskDef['reward'] = { gold: 100, blueprint: 2, xp: 100 }

export const DAILY_POOL: SideTaskDef[] = [
  { id: 'd_mg',      name: '完成2次小游戏',       metric: 'minigame',         target: 2,  reward: { xp: 60, fish: 20 } },
  { id: 'd_debris',  name: '拾取10份漂浮物',      metric: 'debris',           target: 10, reward: { xp: 60, plastic: 10 } },
  { id: 'd_fight',   name: '击败1次海盗',         metric: 'fight',            target: 1,  needLevel: 10, reward: { xp: 80, hourglass: 1 } },
  { id: 'd_order',   name: '完成2个居民订单',     metric: 'order',            target: 2,  reward: { xp: 60, gold: 50 } },
  { id: 'd_fish',    name: '收获10条鱼',          metric: 'fish',             target: 10, reward: { xp: 60, wood: 20 } },
  { id: 'd_plank',   name: '加工5块高级板材',     metric: 'plank',            target: 5,  needLevel: 2, reward: { xp: 60, cloth: 10 } },
  { id: 'd_collect', name: '手动收取建筑产出5次', metric: 'collect',          target: 5,  reward: { xp: 60, metal: 10 } },
  { id: 'd_salvage', name: '拾荒船采集5次',       metric: 'prod:salvage_boat', target: 5, needLevel: 3, reward: { xp: 60, plastic: 10 } },
]

export const WEEKLY_POOL: SideTaskDef[] = [
  { id: 'w_fight',  name: '通关主线关卡20次',       metric: 'fight',          target: 20, needLevel: 10, reward: { xp: 300, blueprint: 5 } },
  { id: 'w_mg',     name: '完成15次小游戏',         metric: 'minigame',       target: 15, reward: { xp: 300, blueprint: 3 } },
  { id: 'w_dive',   name: '完成海底探索小游戏8次',  metric: 'minigame:MG003', target: 8,  needLevel: 8, reward: { xp: 300, blueprint: 3 } },
  { id: 'w_order',  name: '完成15个居民订单',       metric: 'order',          target: 15, reward: { xp: 300, ingot: 5 } },
  { id: 'w_debris', name: '拾取60份漂浮物',         metric: 'debris',         target: 60, reward: { xp: 300, plank: 8 } },
  { id: 'w_ration', name: '加工20份口粮',           metric: 'ration',         target: 20, reward: { xp: 300, gold: 200 } },
]

// 按日期/周种子确定性抽取每日/每周任务
function hashKey(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
export function pickTasks(pool: SideTaskDef[], key: string, count: number): SideTaskDef[] {
  let seed = hashKey(key)
  const rnd = () => { seed = Math.imul(seed ^ (seed >>> 15), seed | 1); seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61); return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296 }
  const arr = [...pool]
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }
  return arr.slice(0, Math.min(count, arr.length))
}

export function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = (t.getUTCDay() + 6) % 7
  t.setUTCDate(t.getUTCDate() - day + 3)
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round((t.getTime() - firstThursday.getTime()) / 604800000)
  return `${t.getUTCFullYear()}-W${week}`
}

export interface AchievementDef {
  id: string
  name: string
  group: '建造成就' | '采集成就' | '战斗成就' | '人口成就'
  reward: SideTaskDef['reward']
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_build5',    name: '建造5座建筑',        group: '建造成就', reward: { xp: 200, gold: 100 } },
  { id: 'a_build10',   name: '将任意建筑升到10级', group: '建造成就', reward: { xp: 800, blueprint: 10 } },
  { id: 'a_debris100', name: '收集100份漂浮物',    group: '采集成就', reward: { xp: 300, hourglass: 2 } },
  { id: 'a_plank50',   name: '一次持有30块高级板材', group: '采集成就', reward: { xp: 300, blueprint: 3 } },
  { id: 'a_stage6',    name: '击败海盗首领·铁钩',  group: '战斗成就', reward: { xp: 500, diamond: 20 } },
  { id: 'a_hero5',     name: '拥有5名英雄',        group: '战斗成就', reward: { xp: 400, diamond: 10 } },
  { id: 'a_pop10',     name: '基地人口达到10人',   group: '人口成就', reward: { xp: 1000, blueprint: 5 } },
]

// 居民订单品质
export const FINE_ORDER_PROB = 0.25
export const FINE_ORDER_MULT = 1.6
export const ORDER_REFRESH_COST = 80
export const ORDER_MAX = 4
