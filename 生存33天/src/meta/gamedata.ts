// 英雄图鉴 + 庇护所建筑数据
import type { Look, WeaponType } from '../game/chibi';

export type Quality = '精良' | '史诗' | '传说' | '神话';
export type Job = '坦克' | '战士' | '远程' | '辅助';

export const QUALITY_COLOR: Record<Quality, string> = {
  精良: '#4a8cd8',
  史诗: '#9a5ae0',
  传说: '#e8912d',
  神话: '#e5484d',
};
export const QUALITY_MUL: Record<Quality, number> = { 精良: 1, 史诗: 1.25, 传说: 1.55, 神话: 1.9 };
export const QUALITY_RATE: { q: Quality; rate: number }[] = [
  { q: '神话', rate: 0.02 },
  { q: '传说', rate: 0.08 },
  { q: '史诗', rate: 0.30 },
  { q: '精良', rate: 0.60 },
];
export const PITY_MAX = 60; // 60 抽保底神话

export interface HeroDef {
  id: string; name: string; job: Job; quality: Quality;
  look: Look; weapon: WeaponType;
  maxHp: number; atk: number; range: number; cdMax: number;
  desc: string;
}

export const HEROES: HeroDef[] = [
  // —— 初始小队 ——
  {
    id: 'batboy', name: '球棒少年', job: '坦克', quality: '精良',
    look: { skin: '#ffd9b8', hair: '#3a2c22', cloth: '#c8362b', cloth2: '#f2f2f2', accent: '#d23b2e', hat: 'cap' },
    weapon: 'bat', maxHp: 560, atk: 24, range: 85, cdMax: 0.85,
    desc: '戴红帽的少年，一根球棒横扫尸群。',
  },
  {
    id: 'alisa', name: '爱丽莎', job: '远程', quality: '史诗',
    look: { skin: '#ffd9b8', hair: '#7a4a2b', cloth: '#3c3f4a', cloth2: '#5a5e6e', accent: '#8b93a8', hat: 'sidehair' },
    weapon: 'rifle', maxHp: 280, atk: 30, range: 270, cdMax: 1.05,
    desc: '冷静的步枪手，百步穿杨。',
  },
  {
    id: 'police', name: '李警官', job: '远程', quality: '精良',
    look: { skin: '#ffcfae', hair: '#2c2620', cloth: '#2e4d8f', cloth2: '#22355e', accent: '#e8c33c', hat: 'policecap' },
    weapon: 'pistol', maxHp: 300, atk: 24, range: 250, cdMax: 0.7,
    desc: '前刑警，手枪速射是他的招牌。',
  },
  {
    id: 'nurse', name: '小护士', job: '辅助', quality: '精良',
    look: { skin: '#ffe0c4', hair: '#e8b7c8', cloth: '#f6f0f4', cloth2: '#f0a8c0', accent: '#ff7ba2', hat: 'bow' },
    weapon: 'syringe', maxHp: 250, atk: 10, range: 250, cdMax: 1.1,
    desc: '战地护士，优先治疗血量最低的队友。',
  },
  // —— 卡池 ——
  {
    id: 'rose', name: '双枪玫瑰', job: '远程', quality: '史诗',
    look: { skin: '#ffd9b8', hair: '#5a3a6e', cloth: '#4a2c3c', cloth2: '#6e3a52', accent: '#e05a8a', hat: 'twintails' },
    weapon: 'dual', maxHp: 260, atk: 20, range: 260, cdMax: 0.42,
    desc: '双枪齐射，射速无人能及。',
  },
  {
    id: 'vigilante', name: '蒙面义警', job: '远程', quality: '史诗',
    look: { skin: '#e8c8a8', hair: '#1c1c22', cloth: '#2c3038', cloth2: '#3c4048', accent: '#e8c33c', hat: 'batmask' },
    weapon: 'rifle', maxHp: 300, atk: 34, range: 280, cdMax: 1.1,
    desc: '黑夜中的义警，子弹从不落空。',
  },
  {
    id: 'panda', name: '少林熊猫', job: '坦克', quality: '传说',
    look: { skin: '#f0f0ea', hair: '#3a3a3a', cloth: '#c8862d', cloth2: '#8a5a1c', accent: '#e8c33c', hat: 'panda' },
    weapon: 'fist', maxHp: 760, atk: 30, range: 80, cdMax: 0.8,
    desc: '会功夫的熊猫，皮糙肉厚。',
  },
  {
    id: 'frost', name: '寒冰领主', job: '坦克', quality: '传说',
    look: { skin: '#c8d8e8', hair: '#7ac8e8', cloth: '#2c4a6e', cloth2: '#1e344e', accent: '#4affe0', hat: 'ice' },
    weapon: 'axe', maxHp: 700, atk: 34, range: 90, cdMax: 0.95,
    desc: '冰封血脉觉醒者，寒气逼人。',
  },
  {
    id: 'chef', name: '主厨老爹', job: '辅助', quality: '传说',
    look: { skin: '#ffcfae', hair: '#6e6e66', cloth: '#f0ede4', cloth2: '#c8b89a', accent: '#e05a3c', hat: 'chef' },
    weapon: 'syringe', maxHp: 340, atk: 14, range: 260, cdMax: 1.0,
    desc: '一口热汤下肚，什么伤都好了一半。',
  },
  {
    id: 'wukong', name: '齐天行者', job: '战士', quality: '神话',
    look: { skin: '#e8b886', hair: '#8a5a2c', cloth: '#a8382e', cloth2: '#7a2820', accent: '#e8c33c', hat: 'wukong' },
    weapon: 'staff', maxHp: 520, atk: 52, range: 110, cdMax: 0.6,
    desc: '一棒下去，尸潮都要退三分。',
  },
  {
    id: 'mecha', name: '机甲先驱', job: '战士', quality: '神话',
    look: { skin: '#c8ccd4', hair: '#2c3038', cloth: '#3a4148', cloth2: '#2c3038', accent: '#4affe0', hat: 'mecha' },
    weapon: 'rifle', maxHp: 580, atk: 44, range: 240, cdMax: 0.75,
    desc: '废土科技的结晶，全身都是武器。',
  },
  {
    id: 'ronin', name: '浪人剑心', job: '战士', quality: '精良',
    look: { skin: '#ffd9b8', hair: '#2c2620', cloth: '#4a5563', cloth2: '#37404c', accent: '#c83c3c', hat: 'band' },
    weapon: 'axe', maxHp: 420, atk: 30, range: 95, cdMax: 0.8,
    desc: '流浪的刀客，斧刃不长眼。',
  },
];

export const HERO_MAP: Record<string, HeroDef> = Object.fromEntries(HEROES.map(h => [h.id, h]));

// —— 庇护所建筑 ——
export interface BuildingDef {
  id: string; name: string; pre: string | null;
  cost: { wood: number; stone: number; supplies: number };
  desc: string; effect: string;
  icon: string; // 绘制用标识
}
export const BUILDINGS: BuildingDef[] = [
  { id: 'workbench', name: '工作台', pre: null, cost: { wood: 40, stone: 20, supplies: 0 }, desc: '制作工具，解锁建造', effect: '木材产出 +3/分钟', icon: 'workbench' },
  { id: 'storage', name: '储物箱', pre: 'workbench', cost: { wood: 60, stone: 30, supplies: 20 }, desc: '提升存储上限', effect: '探索物资需求 -1', icon: 'storage' },
  { id: 'fence', name: '围栏路障', pre: 'storage', cost: { wood: 80, stone: 60, supplies: 30 }, desc: '基础防御工事', effect: '全队生命 +8%', icon: 'fence' },
  { id: 'bed', name: '床铺', pre: 'fence', cost: { wood: 70, stone: 40, supplies: 40 }, desc: '幸存者休息处', effect: '脱战回血速度翻倍', icon: 'bed' },
  { id: 'farm', name: '农田', pre: 'bed', cost: { wood: 90, stone: 50, supplies: 60 }, desc: '离线产出食物', effect: '食物产出 +3/分钟', icon: 'farm' },
  { id: 'filter', name: '雨水过滤器', pre: 'farm', cost: { wood: 60, stone: 90, supplies: 70 }, desc: '离线产出净水', effect: '净水产出 +3/分钟', icon: 'filter' },
  { id: 'medstation', name: '医疗站', pre: 'filter', cost: { wood: 100, stone: 80, supplies: 100 }, desc: '制作急救包', effect: '战斗中全队 +2/秒 回血', icon: 'med' },
  { id: 'tower', name: '防御塔', pre: 'medstation', cost: { wood: 140, stone: 140, supplies: 140 }, desc: '自动攻击入侵者', effect: '全队攻击 +6%', icon: 'tower' },
  { id: 'forge', name: '高级锻造台', pre: 'tower', cost: { wood: 180, stone: 180, supplies: 200 }, desc: '打造高阶装备', effect: '全队攻击再 +8%', icon: 'forge' },
];
export const BUILDING_MAP: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
export const BUILD_MAX_LV = 5;
