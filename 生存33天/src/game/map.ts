// 地图数据：废弃地铁站（搜打撤关卡）
export const WORLD_W = 2600;
export const WORLD_H = 2000;

export interface Wall { x: number; y: number; w: number; h: number }
export type PropType =
  | 'pillar' | 'bench' | 'vending' | 'crate' | 'gate' | 'counter'
  | 'train' | 'trash' | 'sign' | 'barrier' | 'stairs';

export interface Prop { type: PropType; x: number; y: number; w: number; h: number; solid: boolean; seed?: number }

export interface LootSpot { x: number; y: number; kind: 'can' | 'medkit' | 'chest' }
export interface EnemySpawn { kind: 'normal' | 'fast' | 'heavy' | 'boss'; x: number; y: number; group: number }

// —— 墙体（碰撞 + 遮挡绘制）——
export const WALLS: Wall[] = [
  // 外墙
  { x: 0, y: 0, w: WORLD_W, h: 60 },
  { x: 0, y: WORLD_H - 60, w: WORLD_W, h: 60 },
  { x: 0, y: 0, w: 60, h: WORLD_H },
  { x: WORLD_W - 60, y: 0, w: 60, h: WORLD_H },
  // A. 左上储物间：右墙（门洞 y 300-420）
  { x: 980, y: 60, w: 40, h: 240 },
  { x: 980, y: 420, w: 40, h: 180 },
  // 储物间下墙（门洞 x 430-550）
  { x: 60, y: 560, w: 370, h: 40 },
  { x: 550, y: 560, w: 470, h: 40 },
  // C. 左下办公区：上墙（门洞 x 380-500）
  { x: 60, y: 1340, w: 320, h: 40 },
  { x: 500, y: 1340, w: 360, h: 40 },
  // 办公区右墙（门洞 y 1560-1680）
  { x: 860, y: 1340, w: 40, h: 220 },
  { x: 860, y: 1680, w: 40, h: 260 },
  // B. 站台与大厅之间的矮隔断（检票口两侧）
  { x: 1160, y: 640, w: 260, h: 36 },
  { x: 2200, y: 640, w: 340, h: 36 },
  // 大厅与底部商业街之间的闸机墙（两个通道口）
  { x: 1000, y: 1300, w: 180, h: 36 },
  { x: 1480, y: 1300, w: 180, h: 36 },
  // 右下角商铺后墙
  { x: 1980, y: 1560, w: 36, h: 200 },
];

// —— 道具（部分有碰撞）——
export const PROPS: Prop[] = [
  // 大厅立柱
  { type: 'pillar', x: 900, y: 980, w: 70, h: 70, solid: true },
  { type: 'pillar', x: 1300, y: 980, w: 70, h: 70, solid: true },
  { type: 'pillar', x: 1700, y: 900, w: 70, h: 70, solid: true },
  { type: 'pillar', x: 1200, y: 1430, w: 70, h: 70, solid: true },
  { type: 'pillar', x: 1700, y: 1430, w: 70, h: 70, solid: true },
  // 长椅
  { type: 'bench', x: 300, y: 860, w: 170, h: 56, solid: true, seed: 1 },
  { type: 'bench', x: 620, y: 860, w: 170, h: 56, solid: true, seed: 2 },
  { type: 'bench', x: 1900, y: 1180, w: 170, h: 56, solid: true, seed: 3 },
  { type: 'bench', x: 1080, y: 1700, w: 170, h: 56, solid: true, seed: 4 },
  // 自动售货机
  { type: 'vending', x: 140, y: 660, w: 96, h: 74, solid: true, seed: 1 },
  { type: 'vending', x: 250, y: 660, w: 96, h: 74, solid: true, seed: 2 },
  { type: 'vending', x: 2400, y: 700, w: 96, h: 74, solid: true, seed: 3 },
  // 站台列车（大障碍物）
  { type: 'train', x: 1300, y: 92, w: 1180, h: 168, solid: true },
  // 站台座椅与垃圾桶
  { type: 'bench', x: 1450, y: 420, w: 160, h: 52, solid: true, seed: 5 },
  { type: 'trash', x: 1700, y: 420, w: 46, h: 46, solid: true },
  { type: 'bench', x: 1850, y: 420, w: 160, h: 52, solid: true, seed: 6 },
  // 木箱堆
  { type: 'crate', x: 720, y: 1180, w: 62, h: 62, solid: true, seed: 1 },
  { type: 'crate', x: 790, y: 1200, w: 62, h: 62, solid: true, seed: 2 },
  { type: 'crate', x: 755, y: 1120, w: 62, h: 62, solid: true, seed: 3 },
  { type: 'crate', x: 2050, y: 900, w: 62, h: 62, solid: true, seed: 4 },
  { type: 'crate', x: 2120, y: 920, w: 62, h: 62, solid: true, seed: 5 },
  // 检票闸机（底部通道）
  { type: 'gate', x: 1210, y: 1288, w: 46, h: 60, solid: true },
  { type: 'gate', x: 1300, y: 1288, w: 46, h: 60, solid: true },
  { type: 'gate', x: 1390, y: 1288, w: 46, h: 60, solid: true },
  // 商业街柜台
  { type: 'counter', x: 1080, y: 1560, w: 220, h: 70, solid: true, seed: 1 },
  { type: 'counter', x: 1400, y: 1620, w: 220, h: 70, solid: true, seed: 2 },
  // 警示隔离墩
  { type: 'barrier', x: 1860, y: 1470, w: 90, h: 40, solid: true, seed: 1 },
  { type: 'barrier', x: 2050, y: 1430, w: 90, h: 40, solid: true, seed: 2 },
  // 指示牌
  { type: 'sign', x: 1120, y: 700, w: 26, h: 90, solid: true },
  { type: 'sign', x: 2300, y: 1560, w: 26, h: 90, solid: true },
  // 撤离点：进站楼梯（底部右下）
  { type: 'stairs', x: 2200, y: 1720, w: 240, h: 160, solid: false },
  // 出生点旁废墟装饰
  { type: 'crate', x: 260, y: 1150, w: 62, h: 62, solid: true, seed: 6 },
  { type: 'trash', x: 380, y: 1290, w: 46, h: 46, solid: true },
];

// —— 物资点 ——
export const LOOT: LootSpot[] = [
  { x: 250, y: 300, kind: 'can' },
  { x: 700, y: 200, kind: 'can' },
  { x: 1050, y: 1150, kind: 'can' },
  { x: 1500, y: 1180, kind: 'can' },
  { x: 300, y: 1600, kind: 'can' },
  { x: 650, y: 1750, kind: 'can' },
  { x: 1520, y: 460, kind: 'can' },
  { x: 2080, y: 1680, kind: 'can' },
  { x: 850, y: 480, kind: 'medkit' },
  { x: 700, y: 1450, kind: 'medkit' },
  { x: 2350, y: 330, kind: 'chest' }, // 站台宝箱，BOSS 看守
];

// —— 怪物布防 ——
export const ENEMIES: EnemySpawn[] = [
  { kind: 'normal', x: 800, y: 900, group: 1 },
  { kind: 'normal', x: 870, y: 970, group: 1 },
  { kind: 'normal', x: 750, y: 1000, group: 1 },
  { kind: 'normal', x: 400, y: 300, group: 2 },
  { kind: 'normal', x: 520, y: 390, group: 2 },
  { kind: 'fast', x: 620, y: 250, group: 2 },
  { kind: 'fast', x: 350, y: 1550, group: 3 },
  { kind: 'fast', x: 500, y: 1660, group: 3 },
  { kind: 'fast', x: 430, y: 1760, group: 3 },
  { kind: 'heavy', x: 1750, y: 1050, group: 4 },
  { kind: 'normal', x: 1670, y: 1130, group: 4 },
  { kind: 'normal', x: 1830, y: 1140, group: 4 },
  { kind: 'fast', x: 2000, y: 1500, group: 5 },
  { kind: 'fast', x: 2160, y: 1560, group: 5 },
  { kind: 'normal', x: 2060, y: 1640, group: 5 },
  { kind: 'boss', x: 2250, y: 430, group: 6 },
  { kind: 'heavy', x: 2140, y: 510, group: 6 },
  { kind: 'heavy', x: 2380, y: 520, group: 6 },
  // 游荡者
  { kind: 'normal', x: 1300, y: 1250, group: 7 },
  { kind: 'normal', x: 1480, y: 1370, group: 7 },
];

export const SPAWN = { x: 220, y: 1180 };
export const EXTRACT = { x: 2320, y: 1800, r: 110 };
export const QUEST_NEED = 6; // 需要搜集的物资数
export const TIME_LIMIT = 240; // 探索倒计时（秒）

// —— 增援刷怪池（按阶段/事件依次取用，固定坐标避免卡墙） ——
export const EXTRA_SPAWNS: EnemySpawn[] = [
  { kind: 'normal', x: 950, y: 700, group: 8 },
  { kind: 'fast', x: 1050, y: 790, group: 8 },
  { kind: 'normal', x: 1350, y: 1050, group: 9 },
  { kind: 'heavy', x: 1600, y: 850, group: 9 },
  { kind: 'fast', x: 1900, y: 1250, group: 10 },
  { kind: 'normal', x: 1250, y: 1500, group: 10 },
  { kind: 'normal', x: 900, y: 1500, group: 11 },
  { kind: 'fast', x: 1750, y: 1600, group: 11 },
  { kind: 'normal', x: 2100, y: 900, group: 12 },
  { kind: 'fast', x: 550, y: 600, group: 12 },
  { kind: 'heavy', x: 1500, y: 300, group: 13 },
  { kind: 'normal', x: 2000, y: 600, group: 13 },
  { kind: 'fast', x: 1150, y: 900, group: 14 },
  { kind: 'normal', x: 800, y: 1300, group: 14 },
  { kind: 'heavy', x: 2200, y: 1100, group: 15 },
  { kind: 'fast', x: 1400, y: 1700, group: 15 },
];

// 空投事件的额外物资落点
export const AIRDROP_CANS: { x: number; y: number }[] = [
  { x: 1000, y: 500 }, { x: 1700, y: 700 }, { x: 600, y: 1100 }, { x: 1900, y: 1500 },
];
export const AIRDROP_CHEST = { x: 1200, y: 300 };

// 事件/Boss日的额外尸王落点（不靠近出生点）
export const EXTRA_BOSS_SPOTS = [
  { x: 1700, y: 900 },
  { x: 1350, y: 1250 },
];
