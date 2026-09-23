// 元游戏状态：本地存档（localStorage）
import { HERO_MAP, BUILDING_MAP, BUILD_MAX_LV, QUALITY_MUL, type Quality } from './gamedata';

export interface Resources {
  wood: number; stone: number; food: number; water: number; supplies: number; tickets: number;
}

export interface Stats {
  totalKills: number;
  totalCans: number;
  totalChests: number;
}

export interface MetaState {
  day: number;
  power: number;
  gems: number;
  res: Resources;
  pity: number; // 距离神话保底已抽次数
  roster: Record<string, number>; // heroId -> level
  formation: (string | null)[]; // 6 格：0-2 前排 3-5 后排
  buildings: Record<string, number>; // buildingId -> level
  bonusPower: number; // 战斗胜利累积的战力
  stats: Stats; // 生涯战绩
  cleared: boolean; // 是否已通关 33 天
  lastTick: number; // 上次结算时间戳
}

const KEY = 'survive33_meta_v1';

export function defaultMeta(): MetaState {
  const m: MetaState = {
    day: 1,
    power: 0,
    gems: 20,
    res: { wood: 120, stone: 80, food: 60, water: 60, supplies: 50, tickets: 3 },
    pity: 0,
    roster: { batboy: 1, alisa: 1, police: 1, nurse: 1 },
    formation: ['batboy', null, null, 'alisa', 'police', 'nurse'] as (string | null)[],
    buildings: {},
    bonusPower: 0,
    stats: { totalKills: 0, totalCans: 0, totalChests: 0 },
    cleared: false,
    lastTick: Date.now(),
  };
  m.power = computePower(m);
  return m;
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultMeta();
    const m = { ...defaultMeta(), ...JSON.parse(raw) };
    m.res = { ...defaultMeta().res, ...(m.res ?? {}) };
    if (!Array.isArray(m.formation) || m.formation.length !== 6) m.formation = defaultMeta().formation;
    return m;
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(m: MetaState) {
  try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ }
}

// 离线/挂机产出：农田食物、过滤器净水、工作台木材（按分钟）
export function tickProduction(m: MetaState): { gained: Partial<Resources>; minutes: number } {
  const now = Date.now();
  const minutes = Math.min(8 * 60, Math.floor((now - m.lastTick) / 60000));
  const gained: Partial<Resources> = {};
  if (minutes > 0) {
    const lv = (id: string) => m.buildings[id] ?? 0;
    if (lv('workbench') > 0) gained.wood = 3 * lv('workbench') * minutes;
    if (lv('farm') > 0) gained.food = 3 * lv('farm') * minutes;
    if (lv('filter') > 0) gained.water = 3 * lv('filter') * minutes;
    if (lv('forge') > 0) gained.supplies = 2 * lv('forge') * minutes;
    for (const k of Object.keys(gained) as (keyof Resources)[]) {
      m.res[k] += gained[k] ?? 0;
    }
    m.lastTick = now;
  }
  return { gained, minutes };
}

// 建筑加成汇总
export interface Perks {
  hpMul: number; atkMul: number; regenMul: number; needMinus: number; battleRegen: number;
}
export function computePerks(m: MetaState): Perks {
  const lv = (id: string) => m.buildings[id] ?? 0;
  return {
    hpMul: 1 + 0.08 * lv('fence'),
    atkMul: 1 + 0.06 * lv('tower') + 0.08 * lv('forge'),
    regenMul: 1 + 1 * lv('bed'),
    needMinus: lv('storage') > 0 ? 1 : 0,
    battleRegen: 2 * lv('medstation'),
  };
}

// 建筑升级消耗（level 从 0 开始）
export function buildingCost(id: string, curLv: number): Resources & { ok: boolean } {
  const def = BUILDING_MAP[id];
  const mul = Math.pow(1.6, curLv);
  return {
    wood: Math.round(def.cost.wood * mul),
    stone: Math.round(def.cost.stone * mul),
    supplies: Math.round(def.cost.supplies * mul),
    food: 0, water: 0, tickets: 0,
    ok: curLv < BUILD_MAX_LV,
  };
}

export function buildingUnlocked(m: MetaState, id: string): boolean {
  const def = BUILDING_MAP[id];
  if (!def.pre) return true;
  return (m.buildings[def.pre] ?? 0) > 0;
}

// 战力 = 队伍养成 + 建筑
export function computePower(m: MetaState): number {
  let p = 400;
  for (const [id, lv] of Object.entries(m.roster)) {
    const def = HERO_MAP[id];
    if (!def) continue;
    p += Math.round((def.maxHp / 28 + def.atk * 6) * QUALITY_MUL[def.quality] * (1 + (lv - 1) * 0.12));
  }
  for (const [, lv] of Object.entries(m.buildings)) p += lv * 60;
  p += m.bonusPower ?? 0;
  return p;
}

// 英雄升级消耗（物资 + 食物）
export function heroUpgradeCost(lv: number): { supplies: number; food: number } {
  return { supplies: 30 * lv, food: 15 * lv };
}

export function heroStats(id: string, lv: number) {
  const def = HERO_MAP[id];
  const mul = QUALITY_MUL[def.quality] * (1 + (lv - 1) * 0.12);
  return {
    maxHp: Math.round(def.maxHp * mul),
    atk: Math.round(def.atk * mul),
    range: def.range,
    cdMax: def.cdMax,
  };
}

// 抽卡
export interface PullResult { heroId: string; quality: Quality; isNew: boolean }

export function pullOnce(m: MetaState, forceQ?: Quality): PullResult {
  let q: Quality;
  if (forceQ) {
    q = forceQ;
  } else if (m.pity + 1 >= 60) {
    q = '神话';
  } else {
    const r = Math.random();
    let acc = 0;
    q = '精良';
    for (const it of [{ q: '神话' as Quality, rate: 0.02 }, { q: '传说' as Quality, rate: 0.08 }, { q: '史诗' as Quality, rate: 0.30 }, { q: '精良' as Quality, rate: 0.60 }]) {
      acc += it.rate;
      if (r < acc) { q = it.q; break; }
    }
  }
  const pool = Object.values(HERO_MAP).filter(h => h.quality === q);
  const def = pool[Math.floor(Math.random() * pool.length)];
  const isNew = !(def.id in m.roster);
  if (q === '神话') m.pity = 0; else m.pity += 1;
  if (isNew) m.roster[def.id] = 1;
  else m.res.supplies += 60; // 重复转化为物资
  return { heroId: def.id, quality: q, isNew };
}
