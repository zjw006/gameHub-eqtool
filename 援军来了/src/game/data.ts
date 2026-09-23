// 游戏静态数据配置：兵种 / 敌人 / 技能 / 波次
import type { SoldierDef, EnemyDef, SkillDef, DamageType, EnemyCat } from './types'

// ---------- 克制关系 ----------
export const COUNTERS: Record<DamageType, EnemyCat> = {
  ballistic: 'mech',
  explosive: 'armor',
  energy: 'bio',
}
export const WEAK: Record<DamageType, EnemyCat> = {
  ballistic: 'armor',
  explosive: 'bio',
  energy: 'mech',
}
export const DTYPE_NAME: Record<DamageType, string> = {
  ballistic: '弹道',
  explosive: '爆炸',
  energy: '能量',
}
export const CAT_NAME: Record<EnemyCat, string> = {
  mech: '机械',
  armor: '装甲',
  bio: '生化',
}
export function dmgMul(dt: DamageType, cat: EnemyCat): number {
  if (COUNTERS[dt] === cat) return 1.3
  if (WEAK[dt] === cat) return 0.7
  return 1
}

// ---------- 兵种（9个） ----------
export const SOLDIERS: SoldierDef[] = [
  { id: 'assault', name: '突击步兵', dtype: 'ballistic', dmg: 18, interval: 1.0, range: 400, aoe: 0, canAir: false, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '均衡输出，可靠的战场中坚' },
  { id: 'gunner', name: '机枪手', dtype: 'ballistic', dmg: 6, interval: 0.22, range: 320, aoe: 0, canAir: false, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '高攻速扫射，清理小怪保护城墙' },
  { id: 'sniper', name: '狙击手', dtype: 'ballistic', dmg: 95, interval: 2.6, range: 1000, aoe: 0, canAir: true, chain: 0, stun: 0, slow: 0.35, slowDur: 1.5, pierce: 0, desc: '超远射程，重伤减速，可对空' },
  { id: 'rocket', name: '火箭兵', dtype: 'explosive', dmg: 46, interval: 1.8, range: 430, aoe: 62, canAir: true, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '对地对空，范围爆炸，泛用性强' },
  { id: 'grenadier', name: '榴弹炮', dtype: 'explosive', dmg: 72, interval: 3.2, range: 470, aoe: 95, canAir: false, chain: 0, stun: 1.0, slow: 0, slowDur: 0, pierce: 0, desc: '大范围震荡眩晕，填弹慢，无法对空' },
  { id: 'tanker', name: '坦克兵', dtype: 'explosive', dmg: 55, interval: 1.4, range: 240, aoe: 40, canAir: false, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '高额破甲，近距离重火力' },
  { id: 'mortar', name: '迫击炮', dtype: 'energy', dmg: 52, interval: 2.4, range: 500, aoe: 85, canAir: false, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '大范围能量伤害，生化克星' },
  { id: 'tesla', name: '电磁炮', dtype: 'energy', dmg: 26, interval: 1.3, range: 400, aoe: 0, canAir: true, chain: 3, stun: 0, slow: 0.2, slowDur: 0.8, pierce: 0, desc: '连锁闪电麻痹多目标，可对空' },
  { id: 'mecha', name: '机甲兵', dtype: 'energy', dmg: 30, interval: 0.9, range: 170, aoe: 70, canAir: false, chain: 0, stun: 0, slow: 0, slowDur: 0, pierce: 0, desc: '近身能量震荡，破盾好手' },
]
export const soldierById = (id: string) => SOLDIERS.find(s => s.id === id)!

// ---------- 敌人 ----------
export const ENEMIES: EnemyDef[] = [
  { id: 'bot', name: '机械蛛', cat: 'mech', hp: 55, speed: 52, wallDmg: 10, air: false, radius: 15, score: 1 },
  { id: 'drone', name: '无人机', cat: 'mech', hp: 40, speed: 78, wallDmg: 7, air: true, radius: 13, score: 1 },
  { id: 'tanklet', name: '装甲车', cat: 'armor', hp: 120, speed: 34, wallDmg: 17, air: false, radius: 17, score: 2 },
  { id: 'shielder', name: '盾卫', cat: 'armor', hp: 90, speed: 40, wallDmg: 11, air: false, radius: 15, score: 2 },
  { id: 'bug', name: '蚀骨虫', cat: 'bio', hp: 95, speed: 46, wallDmg: 11, air: false, radius: 15, score: 1 },
  { id: 'spitter', name: '毒孢子', cat: 'bio', hp: 70, speed: 60, wallDmg: 13, air: false, radius: 14, score: 2 },
  { id: 'elitebot', name: '精英机甲', cat: 'mech', hp: 420, speed: 38, wallDmg: 30, air: false, radius: 22, score: 6 },
  { id: 'boss', name: '毁灭者坦克', cat: 'armor', hp: 3600, speed: 16, wallDmg: 95, air: false, radius: 38, score: 60 },
]
export const enemyById = (id: string) => ENEMIES.find(e => e.id === id)!

// ---------- 波次（12波） ----------
export interface WaveSpawn { id: string; count: number; interval: number; delay?: number }
export interface WaveDef { no: number; spawns: WaveSpawn[]; hpMul: number }

export const WAVES: WaveDef[] = [
  { no: 1, hpMul: 1.0, spawns: [{ id: 'bot', count: 8, interval: 1.4 }] },
  { no: 2, hpMul: 1.15, spawns: [{ id: 'bot', count: 10, interval: 1.1 }, { id: 'bug', count: 3, interval: 2.2, delay: 4 }] },
  { no: 3, hpMul: 1.3, spawns: [{ id: 'bot', count: 8, interval: 1.0 }, { id: 'bug', count: 6, interval: 1.6, delay: 3 }] },
  { no: 4, hpMul: 1.5, spawns: [{ id: 'bug', count: 8, interval: 1.2 }, { id: 'shielder', count: 4, interval: 2.4, delay: 3 }, { id: 'bot', count: 6, interval: 0.9, delay: 8 }] },
  { no: 5, hpMul: 1.75, spawns: [{ id: 'tanklet', count: 4, interval: 2.6 }, { id: 'bot', count: 12, interval: 0.8, delay: 2 }, { id: 'spitter', count: 4, interval: 1.8, delay: 6 }] },
  { no: 6, hpMul: 2.0, spawns: [{ id: 'drone', count: 6, interval: 1.6 }, { id: 'bug', count: 10, interval: 1.0, delay: 2 }, { id: 'shielder', count: 5, interval: 2.0, delay: 5 }] },
  { no: 7, hpMul: 2.35, spawns: [{ id: 'tanklet', count: 6, interval: 2.0 }, { id: 'drone', count: 6, interval: 1.4, delay: 3 }, { id: 'spitter', count: 6, interval: 1.4, delay: 6 }] },
  { no: 8, hpMul: 2.4, spawns: [{ id: 'elitebot', count: 2, interval: 5 }, { id: 'bot', count: 14, interval: 0.7, delay: 1 }, { id: 'shielder', count: 6, interval: 1.8, delay: 6 }] },
  { no: 9, hpMul: 2.75, spawns: [{ id: 'tanklet', count: 8, interval: 1.6 }, { id: 'drone', count: 8, interval: 1.2, delay: 2 }, { id: 'bug', count: 12, interval: 0.8, delay: 5 }] },
  { no: 10, hpMul: 3.1, spawns: [{ id: 'elitebot', count: 3, interval: 4.5 }, { id: 'spitter', count: 10, interval: 1.0, delay: 2 }, { id: 'shielder', count: 8, interval: 1.5, delay: 6 }] },
  { no: 11, hpMul: 3.5, spawns: [{ id: 'drone', count: 12, interval: 0.9 }, { id: 'tanklet', count: 8, interval: 1.4, delay: 2 }, { id: 'elitebot', count: 3, interval: 4, delay: 6 }, { id: 'bug', count: 12, interval: 0.7, delay: 10 }] },
  { no: 12, hpMul: 3.9, spawns: [{ id: 'boss', count: 1, interval: 1, delay: 3 }, { id: 'elitebot', count: 3, interval: 6, delay: 8 }, { id: 'shielder', count: 8, interval: 1.6, delay: 2 }, { id: 'drone', count: 7, interval: 1.3, delay: 16 }] },
]

// ---------- 技能 ----------
export const SKILLS: SkillDef[] = [
  // 全局
  { id: 'atk20', name: '火力强化', icon: '💥', dtypeTag: 'global', rarity: 'normal', desc: '全队攻击 +20%', apply: 'global_dmg_20' },
  { id: 'spd15', name: '急速射击', icon: '⚡', dtypeTag: 'global', rarity: 'normal', desc: '全队攻速 +15%', apply: 'global_rate_15' },
  { id: 'heal', name: '紧急维修', icon: '🔧', dtypeTag: 'global', rarity: 'normal', desc: '城墙耐久恢复 30%', apply: 'wall_heal_30' },
  { id: 'armorwall', name: '城墙加固', icon: '🛡️', dtypeTag: 'global', rarity: 'rare', desc: '城墙受到伤害 -15%（可叠加）', apply: 'wall_def_15' },
  { id: 'slot', name: '援军来了', icon: '📣', dtypeTag: 'global', rarity: 'epic', desc: '解锁 1 个上阵槽位；若已满员则全队攻击 +12%', apply: 'unlock_slot' },
  { id: 'bombard', name: '开局轰炸', icon: '☄️', dtypeTag: 'global', rarity: 'rare', desc: '每波开始时，对全场敌人造成 250 点伤害（可叠加）', apply: 'bombard_250' },
  // 兵种专属 / 派系
  { id: 'bottomfire', name: '强力底火', icon: '🔥', dtypeTag: 'ballistic', rarity: 'rare', desc: '弹道系伤害 +30%', apply: 'dtype_dmg_ballistic_30' },
  { id: 'pierce', name: '贯通弹', icon: '🎯', dtypeTag: 'ballistic', rarity: 'epic', desc: '弹道系子弹穿透 +1，穿透伤害为 80%', apply: 'pierce_ballistic_1' },
  { id: 'gunnerext', name: '弹链扩容', icon: '🧨', dtypeTag: 'ballistic', rarity: 'rare', desc: '机枪手攻速 +50%', apply: 'soldier_rate_gunner_50', soldierId: 'gunner' },
  { id: 'sniperheavy', name: '重伤弹头', icon: '☠️', dtypeTag: 'ballistic', rarity: 'rare', desc: '狙击手伤害 +40%，减速效果增强', apply: 'soldier_dmg_sniper_40', soldierId: 'sniper' },
  { id: 'cluster', name: '子母弹', icon: '🍇', dtypeTag: 'explosive', rarity: 'rare', desc: '爆炸系溅射范围 +35%', apply: 'dtype_aoe_explosive_35' },
  { id: 'rocketup', name: '火箭增程', icon: '🚀', dtypeTag: 'explosive', rarity: 'rare', desc: '火箭兵伤害 +25%，爆炸范围 +25%', apply: 'soldier_rocket_25', soldierId: 'rocket' },
  { id: 'current', name: '强力电流', icon: '🌩️', dtypeTag: 'energy', rarity: 'epic', desc: '电磁炮连锁目标 +2', apply: 'soldier_chain_tesla_2', soldierId: 'tesla' },
  { id: 'energyup', name: '能量过载', icon: '🔮', dtypeTag: 'energy', rarity: 'rare', desc: '能量系伤害 +30%', apply: 'dtype_dmg_energy_30' },
  { id: 'mortarup', name: '高爆装药', icon: '💣', dtypeTag: 'explosive', rarity: 'rare', desc: '迫击炮/榴弹炮伤害 +30%', apply: 'dtype_dmg_explosive_30' },
]

// 增援卡模板（运行时实例化）
export function reinforceSkill(soldierId: string): SkillDef {
  const s = soldierById(soldierId)
  return {
    id: `reinforce_${soldierId}`,
    name: `增援·${s.name}`,
    icon: '🪖',
    dtypeTag: s.dtype,
    rarity: 'normal',
    desc: `额外上阵 1 个${s.name}（${DTYPE_NAME[s.dtype]}系）`,
    apply: `reinforce_${soldierId}`,
    soldierId,
  }
}

// ---------- 关卡常量 ----------
export const VIEW_W = 540
export const VIEW_H = 900
export const WALL_Y = 660 // 城墙顶线
export const WALL_MAX_HP = 3600
export const FIELD_TOP = 40

// 槽位布局：上排4个 + 下排3个
export const PAD_POS: { x: number; y: number }[] = [
  { x: 80, y: 730 }, { x: 210, y: 730 }, { x: 340, y: 730 }, { x: 470, y: 730 },
  { x: 140, y: 825 }, { x: 270, y: 825 }, { x: 400, y: 825 },
]
export const INITIAL_UNLOCKED = 5

export const RARITY_COLOR: Record<string, string> = {
  normal: '#8fa3b8',
  rare: '#4aa3ff',
  epic: '#c77dff',
}
