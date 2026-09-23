// 33 天节奏曲线：阶段划分、每日事件、难度缩放、每日任务
// 前期 1-15「废墟拾荒」 → 中期 16-25「危机四伏」 → 后期 26-32「至暗时刻」 → 33「最终撤离」

export const MAX_DAY = 33;

export type PhaseId = 'early' | 'mid' | 'late' | 'final';

export interface Phase {
  id: PhaseId;
  name: string;
  from: number;
  to: number;
  color: string;
  desc: string;
}

export const PHASES: Phase[] = [
  { id: 'early', name: '废墟拾荒', from: 1, to: 15, color: '#5be08a', desc: '尸群零散，抓紧囤积物资、扩充小队' },
  { id: 'mid', name: '危机四伏', from: 16, to: 25, color: '#ffb347', desc: '丧尸成群游荡，疾行种开始出没' },
  { id: 'late', name: '至暗时刻', from: 26, to: 32, color: '#ff7a59', desc: '重装种成群，活下去就是胜利' },
  { id: 'final', name: '最终撤离', from: 33, to: 33, color: '#e5484d', desc: '尸王倾巢而出，撑过今天就回家' },
];

export function phaseOf(day: number): Phase {
  for (const p of PHASES) if (day >= p.from && day <= p.to) return p;
  return day > MAX_DAY ? PHASES[2] : PHASES[0];
}

// —— 每日事件 ——
export interface DayEvent {
  id: string;
  name: string;
  icon: string; // 单字符图标（画布/文本通用）
  desc: string;
  short: string; // 战斗内横幅短文案
  color: string;
  enemyHpMul: number;
  enemyAtkMul: number;
  extraSpawns: number; // 增援刷怪数量
  extraCans: number; // 额外罐头
  extraChest: boolean; // 额外金宝箱
  extraBoss: number; // 额外 Boss
  fogMul: number; // 视野倍率（小=雾更浓）
  timeMul: number; // 撤离时限倍率
  rewardMul: number; // 击杀奖励倍率
  fogTint: string; // 雾色
}

const BASE_EVENT: Omit<DayEvent, 'id' | 'name' | 'icon' | 'desc' | 'short' | 'color'> = {
  enemyHpMul: 1, enemyAtkMul: 1, extraSpawns: 0, extraCans: 0, extraChest: false,
  extraBoss: 0, fogMul: 1, timeMul: 1, rewardMul: 1, fogTint: '5,9,17',
};

const NO_EVENT: DayEvent = {
  ...BASE_EVENT, id: 'none', name: '平静的一天', icon: '·', color: '#9beeff',
  desc: '没有特殊动静，照常搜集物资', short: '',
};

const EVENT_TABLE: Record<number, DayEvent> = {
  5: {
    ...BASE_EVENT, id: 'airdrop', name: '物资空投', icon: '降', color: '#37e0ff',
    short: '物资 +4 · 金宝箱 +1',
    desc: '军方空投掠过！地图多出 4 处物资和 1 只金宝箱',
    extraCans: 4, extraChest: true,
  },
  8: {
    ...BASE_EVENT, id: 'horde', name: '尸潮来袭', icon: '潮', color: '#ff7a59',
    short: '敌人增援 · 击杀奖励提升',
    desc: '尸群倾巢而出！敌人大量增援，击杀奖励 +50%',
    extraSpawns: 8, rewardMul: 1.5,
  },
  12: {
    ...BASE_EVENT, id: 'fog', name: '浓雾弥漫', icon: '雾', color: '#b8c6d4',
    short: '视野缩小 · 物资 +2',
    desc: '能见度骤降！视野缩小 40%，但散落物资更多',
    fogMul: 0.6, extraCans: 2,
  },
  15: {
    ...BASE_EVENT, id: 'bossday', name: '尸王现身', icon: '王', color: '#e5484d',
    short: '额外尸王 · 奖励翻倍',
    desc: '阶段领主出巡！多一只尸王，击杀奖励翻倍',
    extraBoss: 1, enemyHpMul: 1.15, rewardMul: 2,
  },
  18: {
    ...BASE_EVENT, id: 'bloodmoon', name: '血月当空', icon: '月', color: '#ff5c7a',
    short: '丧尸狂暴 · 奖励翻倍',
    desc: '血月升起！丧尸攻击 +30%，击杀奖励翻倍',
    enemyAtkMul: 1.3, enemyHpMul: 1.1, rewardMul: 2, fogTint: '40,6,14',
  },
  20: {
    ...BASE_EVENT, id: 'airdrop', name: '物资空投', icon: '降', color: '#37e0ff',
    short: '物资 +4 · 金宝箱 +1',
    desc: '军方空投掠过！地图多出 4 处物资和 1 只金宝箱',
    extraCans: 4, extraChest: true,
  },
  22: {
    ...BASE_EVENT, id: 'horde', name: '尸潮来袭', icon: '潮', color: '#ff7a59',
    short: '敌人增援 · 击杀奖励提升',
    desc: '尸群倾巢而出！敌人大量增援，击杀奖励 +50%',
    extraSpawns: 10, rewardMul: 1.5,
  },
  25: {
    ...BASE_EVENT, id: 'bossday', name: '尸王现身', icon: '王', color: '#e5484d',
    short: '额外尸王 · 奖励翻倍',
    desc: '阶段领主出巡！多一只尸王，击杀奖励翻倍',
    extraBoss: 1, enemyHpMul: 1.2, rewardMul: 2,
  },
  28: {
    ...BASE_EVENT, id: 'bloodmoon', name: '血月当空', icon: '月', color: '#ff5c7a',
    short: '丧尸狂暴 · 奖励翻倍',
    desc: '血月升起！丧尸攻击 +30%，击杀奖励翻倍',
    enemyAtkMul: 1.35, enemyHpMul: 1.15, rewardMul: 2, fogTint: '40,6,14',
  },
  30: {
    ...BASE_EVENT, id: 'horde', name: '尸潮来袭', icon: '潮', color: '#ff7a59',
    short: '敌人增援 · 击杀奖励提升',
    desc: '最后的疯狂！敌人海量增援，击杀奖励 +80%',
    extraSpawns: 12, rewardMul: 1.8,
  },
  32: {
    ...BASE_EVENT, id: 'airdrop', name: '最后的空投', icon: '降', color: '#37e0ff',
    short: '物资 +4 · 金宝箱 +1',
    desc: '最后的补给！地图多出 4 处物资和 1 只金宝箱',
    extraCans: 4, extraChest: true,
  },
  33: {
    ...BASE_EVENT, id: 'finale', name: '最终撤离', icon: '终', color: '#ffd94d',
    short: '击败双尸王后撤离',
    desc: '直升机 5 分钟后到达！双尸王拦路，击败它们再撤离',
    extraBoss: 1, extraSpawns: 6, enemyHpMul: 1.2, enemyAtkMul: 1.1,
    timeMul: 1.25, rewardMul: 3, fogTint: '30,10,6',
  },
};

// 通关后进入无尽坚守：后期事件按 26 天后的节奏循环
const ENDLESS_CYCLE = [28, 30, 32, 26, 29, 31];

export function dayEvent(day: number): DayEvent {
  if (day <= MAX_DAY) return EVENT_TABLE[day] ?? NO_EVENT;
  const c = ENDLESS_CYCLE[(day - MAX_DAY - 1) % ENDLESS_CYCLE.length];
  const ev = EVENT_TABLE[c];
  return ev ? { ...ev } : NO_EVENT;
}

// —— 难度曲线：分段陡增 ——
export function dayScale(day: number): { hpMul: number; atkMul: number } {
  const d = Math.max(1, day);
  let hp: number;
  if (d <= 15) hp = 1 + (d - 1) * 0.07;
  else if (d <= 25) hp = 1.98 + (d - 15) * 0.09;
  else hp = 2.88 + (d - 25) * 0.12;
  const atk = 1 + (hp - 1) * 0.62;
  return { hpMul: hp, atkMul: atk };
}

// 阶段增援刷怪数量（叠加在事件增援之上）
export function phaseExtraSpawns(day: number): number {
  if (day <= 15) return 0;
  if (day <= 25) return 6;
  return 12;
}

// —— 每日任务 ——
export type QuestMode = 'collect' | 'hunt' | 'chest' | 'boss';
export interface DayQuest {
  mode: QuestMode;
  need: number; // collect=罐头数 hunt=击杀数 chest/boss=1或2
  label: string;
}

export function dayQuest(day: number): DayQuest {
  if (day === MAX_DAY) return { mode: 'boss', need: 2, label: '击败尸王' };
  const phase = phaseOf(day).id;
  const huntNeed = phase === 'early' ? 8 : phase === 'mid' ? 12 : 16;
  if (day % 7 === 4) return { mode: 'chest', need: 1, label: '开启金宝箱' };
  if (day % 3 === 0) return { mode: 'hunt', need: huntNeed, label: '清剿尸群' };
  const collectNeed = phase === 'early' ? 6 : phase === 'mid' ? 7 : 8;
  return { mode: 'collect', need: collectNeed, label: '搜集物资' };
}
