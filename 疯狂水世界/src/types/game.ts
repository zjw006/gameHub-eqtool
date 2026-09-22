export type ResourceId =
  | 'wood' | 'plastic' | 'cloth'
  | 'metal' | 'glass' | 'algae' | 'fish'
  | 'plank' | 'ingot' | 'ration'
  | 'blueprint' | 'gold' | 'diamond'

export type BuildingId =
  | 'fishing_chair' | 'salvage_boat' | 'dive_dock'
  | 'sawmill' | 'furnace' | 'food_factory'
  | 'warehouse' | 'radio' | 'command' | 'residence'

export interface BuildingDef {
  id: BuildingId
  name: string
  category: '采集' | '加工' | '功能'
  desc: string
  unlockLevel: number
  precondition?: BuildingId | null // 前置建筑（需已建成）
  autoLv?: number | null           // 采集建筑达到该等级解锁自动挂机
  landmark?: boolean               // 地标建筑（广播站/指挥中心）：不占普通格子，放在岛屿地标位
  cost: Partial<Record<ResourceId, number>>
  // 采集/加工
  produces?: ResourceId[]
  intervalSec?: number
  input?: Partial<Record<ResourceId, number>>
  output?: Partial<Record<ResourceId, number>>
}

export interface PlacedBuilding {
  uid: number
  buildingId: BuildingId
  level: number
  count: number // 同类建筑叠加数量（只占一个格子）
  progress: number // 0..1
  slot: number
  pending?: boolean // 未解锁自动挂机：产出待手动收取
}

export interface HeroDef {
  id: string
  name: string
  cls: '坦克' | '输出' | '辅助'
  rarity: 'N' | 'R' | 'SR' | 'SSR'
  skill: string
  skillDesc: string
  power: number
  color: string
  tag: '采集型' | '加工型' | '全局型'
}

export type JobId = 'J001' | 'J002' | 'J003' | 'J004' | 'J005'

export interface HeroAssignment {
  heroId: string
  target: BuildingId | 'command'
}

export interface HeroInstance {
  heroId: string
  level: number
  stars: number
}

export interface TaskDef {
  id: string
  text: (target: number) => string
  target: number
  metric: string
  reward: Partial<Record<ResourceId, number>> & { xp?: number }
}

export interface Order {
  id: number
  resident: string
  want: Partial<Record<ResourceId, number>>
  rewardGold: number
  rewardXp: number
  rewardBlueprint?: number
  quality?: 'normal' | 'fine' // 优质订单奖励倍率更高
}

// 每日/周任务状态
export interface SideTaskState {
  ids: string[]
  progress: Record<string, number>
  claimed: Record<string, boolean>
}

export interface GameState {
  level: number
  xp: number
  population: number
  resources: Record<ResourceId, number>
  buildings: PlacedBuilding[]
  debrisCollected: number
  taskIndex: number
  taskProgress: number
  orders: Order[]
  nextOrderId: number
  heroes: HeroInstance[]
  stage: number
  nextUid: number
  lastSeen: number
  // 人口系统
  satiety: number          // 饱食度 0-100
  starvingSec: number      // 饱食度归零累计秒数
  jobs: Record<JobId, number>
  // 英雄委任
  assignments: (HeroAssignment | null)[]
  // 小游戏
  minigames: {
    date: string // YYYY-MM-DD，用于每日刷新
    used: Record<string, number>
    cdUntil: Record<string, number> // 时间戳
  }
  flares: number    // 应急信号弹
  hourglasses: number // 加速沙漏
  // 任务系统（每日/每周/成就）
  side: {
    dailyDate: string
    daily: SideTaskState
    dailyChest: boolean
    weeklyWeek: string
    weekly: SideTaskState
    claimedAch: string[]
    seenPops: string[]
  }
  popTip: string | null // 待展示的一次性弹窗 id
}

export interface Debris {
  id: number
  kind: 'wood' | 'plastic' | 'cloth' | 'barrel' | 'chest'
  x: number // 0..100 %
  y: number
  vx: number
  bob: number
  scale: number
}

export interface FloatText {
  id: number
  x: number
  y: number
  text: string
  color: string
}
