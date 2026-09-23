// 游戏类型定义
export type DamageType = 'ballistic' | 'explosive' | 'energy'
export type EnemyCat = 'mech' | 'armor' | 'bio'

export interface SoldierDef {
  id: string
  name: string
  dtype: DamageType
  dmg: number
  interval: number // 攻击间隔(秒)
  range: number
  aoe: number // 溅射半径，0为单体
  canAir: boolean
  chain: number // 连锁目标数
  stun: number // 眩晕秒数
  slow: number // 减速比例 0-1
  slowDur: number
  pierce: number // 穿透数量(额外命中目标数)
  desc: string
}

export interface EnemyDef {
  id: string
  name: string
  cat: EnemyCat
  hp: number
  speed: number // px/s
  wallDmg: number // 每秒对城墙伤害
  air: boolean
  radius: number
  score: number
}

export interface EnemyUnit {
  uid: number
  def: EnemyDef
  x: number
  y: number
  hp: number
  maxHp: number
  shield: number
  slowUntil: number
  slowPct: number
  stunUntil: number
  wobble: number
  dead: boolean
}

export interface PadUnit {
  soldierId: string
  count: number
}

export interface Pad {
  id: number
  x: number
  y: number
  locked: boolean
  unit: PadUnit | null
}

export interface Projectile {
  x: number
  y: number
  tx: number
  ty: number
  targetUid: number
  speed: number
  dmg: number
  dtype: DamageType
  aoe: number
  pierceLeft: number
  hitSet: number[]
  kind: 'bullet' | 'rocket' | 'shell' | 'bolt'
  stun: number
  slow: number
  slowDur: number
  fromX: number
  fromY: number
}

export interface FxText {
  x: number
  y: number
  text: string
  color: string
  t: number // 存活时间
  size: number
}

export interface FxCircle {
  x: number
  y: number
  r: number
  maxR: number
  color: string
  t: number
}

export interface FxBeam {
  pts: { x: number; y: number }[]
  t: number
  color: string
}

export interface SoldierBuff {
  dmgMul: number
  rateMul: number
  pierceAdd: number
  chainAdd: number
  aoeMul: number
}

export interface SkillDef {
  id: string
  name: string
  icon: string
  dtypeTag: DamageType | 'global'
  desc: string
  apply: string // 效果标识，引擎里解释
  soldierId?: string
  rarity: 'normal' | 'rare' | 'epic'
}

export interface SkillOffer extends SkillDef {
  // 实例化后的描述（增援卡会带上具体兵种）
}

export interface GameEvent {
  type: 'wave-clear' | 'game-over' | 'victory' | 'wall-hit'
  wave?: number
}

export interface RunStats {
  kills: number
  dmgDealt: number
  skillsTaken: string[]
  wavesCleared: number
}
