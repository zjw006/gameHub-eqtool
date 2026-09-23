// 《生存33天》地图战斗复刻引擎：搜 → 打 → 撤
import { WALLS, PROPS, LOOT, ENEMIES, EXTRA_SPAWNS, AIRDROP_CANS, AIRDROP_CHEST, EXTRA_BOSS_SPOTS, SPAWN, EXTRACT, TIME_LIMIT, WORLD_W, WORLD_H } from './map';
import { drawUnit, type Look, type WeaponType, type ZombieKind } from './chibi';
import { sfx } from './audio';
import { dayScale, phaseExtraSpawns, type DayEvent, type DayQuest } from '../meta/daycurve';

// 由布阵页注入的战斗单位
export interface BattleHero {
  id: string; name: string; job: string;
  look: Look; weapon: WeaponType; level: number;
  maxHp: number; atk: number; range: number; cdMax: number;
}

export interface BattlePerks {
  hpMul: number; atkMul: number; regenMul: number; needMinus: number; battleRegen: number;
}

export interface BattleOptions {
  squad: (BattleHero | null)[]; // 6 格编队（0-2 前排，3-5 后排）
  day: number;
  perks: BattlePerks;
  event: DayEvent;
  quest: DayQuest;
}

export interface HeroState {
  id: string; name: string; job: string; look: Look; weapon: WeaponType;
  x: number; y: number; hp: number; maxHp: number;
  atk: number; range: number; cd: number; cdMax: number;
  alive: boolean; face: number; walk: number; flash: number;
  offX: number; offY: number; lastHurt: number;
}

export interface EnemyState {
  id: number; kind: ZombieKind; x: number; y: number;
  hp: number; maxHp: number; atk: number; speed: number; range: number; armor: number;
  aggro: boolean; cd: number; face: number; walk: number; flash: number;
  homeX: number; homeY: number; group: number;
  slamCd: number; telegraph: number; dead: boolean; deadT: number; scale: number;
}

interface Bullet { x: number; y: number; vx: number; vy: number; dmg: number; life: number; fromNurse?: boolean }
interface Floater { x: number; y: number; txt: string; color: string; t: number; size: number }
interface Particle { x: number; y: number; vx: number; vy: number; t: number; life: number; color: string; size: number; toCorner?: boolean }
interface GroundLoot { x: number; y: number; kind: 'can' | 'medkit' | 'chest'; taken: boolean; bob: number }

export interface ResultData {
  win: boolean; reason: string; cans: number; chest: boolean;
  kills: number; timeUsed: number; powerGain: number; rewardMul: number;
}

export interface HudSnapshot {
  day: number; timeLeft: number; power: number; gems: number;
  supplies: number; need: number; stage: number; kills: number;
  questLabel: string; questCur: number; questMax: number;
  extractActive: boolean; extractT: number; hurtT: number;
  heroes: { id: string; name: string; job: string; hp: number; maxHp: number; alive: boolean }[];
  result: ResultData | null;
}

const HERO_SCALE = 1.12;

// 编队槽位 → 相对小队中心的偏移（随朝向旋转）
function slotOffset(i: number): { offX: number; offY: number } {
  if (i < 3) return { offX: 58, offY: (i - 1) * 62 };
  return { offX: -46, offY: (i - 4) * 62 };
}

const ENEMY_DEFS: Record<ZombieKind, { hp: number; atk: number; speed: number; range: number; armor: number; scale: number }> = {
  normal: { hp: 95, atk: 11, speed: 92, range: 48, armor: 0, scale: 1 },
  fast: { hp: 62, atk: 8, speed: 185, range: 44, armor: 0, scale: 0.92 },
  heavy: { hp: 430, atk: 24, speed: 52, range: 58, armor: 5, scale: 1.45 },
  boss: { hp: 950, atk: 32, speed: 68, range: 78, armor: 3, scale: 1.8 },
};

const SQUAD_SPEED = 185;
const AGGRO_R = 300;
const LEASH_R = 640;

function d2(ax: number, ay: number, bx: number, by: number) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// 圆形 vs 矩形推挤
function resolveCircleRect(px: number, py: number, r: number, rx: number, ry: number, rw: number, rh: number): [number, number] {
  const cx = clamp(px, rx, rx + rw), cy = clamp(py, ry, ry + rh);
  const dx = px - cx, dy = py - cy;
  const dd = dx * dx + dy * dy;
  if (dd >= r * r) return [px, py];
  if (dd < 0.0001) {
    // 圆心在矩形内：往最近边推
    const l = px - rx, rr_ = rx + rw - px, t = py - ry, bb = ry + rh - py;
    const m = Math.min(l, rr_, t, bb);
    if (m === l) return [rx - r, py];
    if (m === rr_) return [rx + rw + r, py];
    if (m === t) return [px, ry - r];
    return [px, ry + rh + r];
  }
  const dist = Math.sqrt(dd);
  return [cx + (dx / dist) * r, cy + (dy / dist) * r];
}

// 预生成的地面污渍（确定性随机）
function seededRandom(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const rnd = seededRandom(33);
const STAINS = Array.from({ length: 60 }, () => ({
  x: 80 + rnd() * (WORLD_W - 160), y: 80 + rnd() * (WORLD_H - 160),
  r: 20 + rnd() * 60, a: 0.05 + rnd() * 0.1, green: rnd() < 0.25,
}));
const CRACKS = Array.from({ length: 26 }, () => {
  const x = 100 + rnd() * (WORLD_W - 200), y = 100 + rnd() * (WORLD_H - 200);
  const pts: [number, number][] = [[x, y]];
  let cx = x, cy = y;
  for (let i = 0; i < 4; i++) { cx += (rnd() - 0.5) * 90; cy += (rnd() - 0.5) * 90; pts.push([cx, cy]); }
  return pts;
});
const LAMPS = [
  { x: 600, y: 800, f: 1.7 }, { x: 1500, y: 900, f: 2.3 }, { x: 2100, y: 1400, f: 1.3 },
  { x: 2000, y: 420, f: 2.9 }, { x: 400, y: 1550, f: 2.1 }, { x: 350, y: 350, f: 1.9 },
];

export class Game {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private onHud: (s: HudSnapshot) => void;
  private onBanner: (text: string) => void;
  private raf = 0;
  private lastT = 0;
  private hudT = 0;
  private running = false;
  private destroyed = false;

  W = 0; H = 0; dpr = 1;
  camX = 0; camY = 0; shake = 0;

  // 输入
  joyActive = false; joyBaseX = 0; joyBaseY = 0; joyDX = 0; joyDY = 0; joyPid = -1;
  keys = new Set<string>();

  // 状态
  squadX = SPAWN.x; squadY = SPAWN.y;
  squadFace = 0;
  moveMag = 0;
  heroes: HeroState[] = [];
  enemies: EnemyState[] = [];
  bullets: Bullet[] = [];
  floaters: Floater[] = [];
  particles: Particle[] = [];
  loots: GroundLoot[] = [];
  supplies = 0; kills = 0; stage = 0;
  bossKills = 0; chestTaken = 0;
  extractT = 0; timeLeft = TIME_LIMIT; elapsed = 0;
  hurtT = 0; result: ResultData | null = null;
  private bannered = new Set<string>();
  private time = 0;
  private options: BattleOptions;
  private need = 6;

  constructor(canvas: HTMLCanvasElement, onHud: (s: HudSnapshot) => void, onBanner: (t: string) => void, options: BattleOptions) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d')!;
    this.onHud = onHud;
    this.onBanner = onBanner;
    this.options = options;
    this.resize();
    window.addEventListener('resize', this.resize);
    canvas.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    this.reset();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.resize);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  reset() {
    this.squadX = SPAWN.x; this.squadY = SPAWN.y;
    this.squadFace = 0; this.moveMag = 0;
    const { perks, day, event, quest } = this.options;
    this.need = quest.mode === 'collect' ? Math.max(3, quest.need - perks.needMinus) : quest.need;
    this.timeLeft = Math.round(TIME_LIMIT * event.timeMul);
    this.heroes = this.options.squad
      .map((d, i) => {
        if (!d) return null;
        const off = slotOffset(i);
        const maxHp = Math.round(d.maxHp * perks.hpMul);
        return {
          ...d, maxHp, atk: Math.round(d.atk * perks.atkMul),
          x: SPAWN.x + off.offX, y: SPAWN.y + off.offY, hp: maxHp,
          cd: 0, alive: true, face: 0, walk: 0, flash: 0, lastHurt: -99,
          ...off,
        } as HeroState;
      })
      .filter((h): h is HeroState => h !== null);
    // 难度：分段天数曲线 × 当日事件修正
    const scale = dayScale(day);
    const hpMul = scale.hpMul * event.enemyHpMul;
    const atkMul = scale.atkMul * event.enemyAtkMul;
    // 敌群：基础布防 + 阶段构成升级 + 阶段/事件增援 + 额外尸王
    const spawns = ENEMIES.map(s => ({ ...s }));
    if (day > 15) spawns.forEach((s, i) => { if (s.kind === 'normal' && i % 3 === 1) s.kind = 'fast'; });
    if (day > 25) spawns.forEach((s, i) => {
      if (s.kind === 'normal' && i % 2 === 0) s.kind = 'fast';
      else if (s.kind === 'fast' && i % 5 === 0) s.kind = 'heavy';
    });
    const extraN = phaseExtraSpawns(day) + event.extraSpawns;
    for (let i = 0; i < extraN && i < EXTRA_SPAWNS.length; i++) spawns.push({ ...EXTRA_SPAWNS[i]! });
    for (let i = 0; i < event.extraBoss; i++) {
      const spot = EXTRA_BOSS_SPOTS[i % EXTRA_BOSS_SPOTS.length]!;
      spawns.push({ kind: 'boss' as const, x: spot.x, y: spot.y, group: 20 + i });
    }
    this.enemies = spawns.map((s, i) => {
      const def = ENEMY_DEFS[s.kind];
      return {
        id: i, kind: s.kind, x: s.x, y: s.y,
        hp: Math.round(def.hp * hpMul), maxHp: Math.round(def.hp * hpMul),
        atk: def.atk * atkMul, speed: def.speed, range: def.range, armor: def.armor,
        aggro: false, cd: 0, face: Math.PI / 2, walk: 0, flash: 0,
        homeX: s.x, homeY: s.y, group: s.group, slamCd: 4, telegraph: 0,
        dead: false, deadT: 0, scale: def.scale,
      };
    });
    // 物资：基础 + 事件额外落点
    this.loots = LOOT.map(l => ({ ...l, taken: false, bob: Math.random() * 6 }));
    for (const c of AIRDROP_CANS.slice(0, event.extraCans)) {
      this.loots.push({ x: c.x, y: c.y, kind: 'can', taken: false, bob: Math.random() * 6 });
    }
    if (event.extraChest) this.loots.push({ x: AIRDROP_CHEST.x, y: AIRDROP_CHEST.y, kind: 'chest', taken: false, bob: 0 });
    this.bullets = []; this.floaters = []; this.particles = [];
    this.supplies = 0; this.kills = 0; this.stage = 0;
    this.bossKills = 0; this.chestTaken = 0;
    this.extractT = 0; this.elapsed = 0;
    this.hurtT = 0; this.result = null; this.bannered.clear();
    this.camX = this.squadX - this.W / 2; this.camY = this.squadY - this.H / 2;
    this.pushHud();
    // 开场播报：阶段节点 + 当日事件
    if (day === 1) this.onBanner('第1天 · 废墟拾荒：抓紧囤积物资');
    if (day === 16) this.onBanner('进入中期 · 危机四伏：尸群开始成群游荡');
    if (day === 26) this.onBanner('进入后期 · 至暗时刻：重装种成群出没');
    if (day === 33) this.onBanner('最终撤离日！击败尸王后登机');
    if (event.id !== 'none' && event.id !== 'finale') this.onBanner(`「${event.name}」${event.short}`);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const loop = (t: number) => {
      if (this.destroyed) return;
      const dt = Math.min(0.05, (t - this.lastT) / 1000);
      this.lastT = t;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private resize = () => {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth; this.H = window.innerHeight;
    this.canvas.width = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
  };

  private onKey = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };

  private onDown = (e: PointerEvent) => {
    if (this.result) return;
    this.joyActive = true; this.joyPid = e.pointerId;
    this.joyBaseX = e.clientX; this.joyBaseY = e.clientY;
    this.joyDX = 0; this.joyDY = 0;
  };
  private onMove = (e: PointerEvent) => {
    if (!this.joyActive || e.pointerId !== this.joyPid) return;
    const R = 62;
    let dx = e.clientX - this.joyBaseX, dy = e.clientY - this.joyBaseY;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = dx / d * R; dy = dy / d * R; }
    this.joyDX = dx / R; this.joyDY = dy / R;
  };
  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.joyPid) return;
    this.joyActive = false; this.joyDX = 0; this.joyDY = 0; this.joyPid = -1;
  };

  // 雷达数据（HUD 小地图用）
  getRadar(): { px: number; py: number; foes: [number, number][]; loots: [number, number][]; extract: [number, number] | null } {
    return {
      px: this.squadX / WORLD_W, py: this.squadY / WORLD_H,
      foes: this.enemies.filter(e => !e.dead && e.aggro).map(e => [e.x / WORLD_W, e.y / WORLD_H]),
      loots: this.loots.filter(l => !l.taken).map(l => [l.x / WORLD_W, l.y / WORLD_H]),
      extract: this.stage >= 1 ? [EXTRACT.x / WORLD_W, EXTRACT.y / WORLD_H] : null,
    };
  }

  objectivePos(): { x: number; y: number } {
    if (this.stage >= 1) return { x: EXTRACT.x, y: EXTRACT.y };
    const mode = this.options.quest.mode;
    if (mode === 'hunt' || mode === 'boss') {
      // 指向最近的存活目标
      let be: EnemyState | null = null, bd = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (mode === 'boss' && e.kind !== 'boss') continue;
        const dd = d2(e.x, e.y, this.squadX, this.squadY);
        if (dd < bd) { bd = dd; be = e; }
      }
      if (be) return { x: be.x, y: be.y };
      return { x: EXTRACT.x, y: EXTRACT.y };
    }
    let best: GroundLoot | null = null, bd = Infinity;
    for (const l of this.loots) {
      if (l.taken || l.kind === 'medkit') continue;
      if (mode === 'chest' && l.kind !== 'chest') continue;
      const dd = d2(l.x, l.y, this.squadX, this.squadY);
      if (dd < bd) { bd = dd; best = l; }
    }
    if (best) return { x: best.x, y: best.y };
    return { x: EXTRACT.x, y: EXTRACT.y };
  }

  // ================= 更新 =================
  private update(dt: number) {
    this.time += dt;
    if (this.result) {
      this.updateFx(dt);
      this.hudT += dt;
      if (this.hudT > 0.2) { this.hudT = 0; this.pushHud(); }
      return;
    }
    this.elapsed += dt;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish(false, '信号中断，小队迷失在废墟中');
      return;
    }

    // —— 小队移动 ——
    let mx = this.joyDX, my = this.joyDY;
    if (this.keys.has('w') || this.keys.has('arrowup')) my -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) my += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) mx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) mx += 1;
    const ml = Math.hypot(mx, my);
    if (ml > 1) { mx /= ml; my /= ml; }
    this.moveMag = Math.min(1, ml);
    if (ml > 0.05) {
      const nx = this.squadX + mx * SQUAD_SPEED * dt;
      const ny = this.squadY + my * SQUAD_SPEED * dt;
      const [rx, ry] = this.collide(nx, ny, 26);
      this.squadX = rx; this.squadY = ry;
      const targetFace = Math.atan2(my, mx);
      let df = targetFace - this.squadFace;
      while (df > Math.PI) df -= Math.PI * 2;
      while (df < -Math.PI) df += Math.PI * 2;
      this.squadFace += df * Math.min(1, dt * 10);
    }

    // —— 英雄编队跟随 ——
    const cos = Math.cos(this.squadFace), sin = Math.sin(this.squadFace);
    for (const h of this.heroes) {
      if (!h.alive) continue;
      const tx = this.squadX + h.offX * cos - h.offY * sin;
      const ty = this.squadY + h.offX * sin + h.offY * cos;
      const dx = tx - h.x, dy = ty - h.y;
      const dd = Math.hypot(dx, dy);
      if (dd > 2) {
        const sp = Math.min(dd * 6, dd > 140 ? 400 : 300);
        h.x += dx / dd * sp * dt;
        h.y += dy / dd * sp * dt;
        h.walk += dt * (sp / 60);
      } else {
        h.walk = lerp(h.walk, Math.round(h.walk / Math.PI) * Math.PI, dt * 8);
      }
      h.flash = Math.max(0, h.flash - dt * 4);
      // 脱战回血（床铺加成）+ 医疗站战中回血
      if (this.time - h.lastHurt > 5 && h.hp < h.maxHp) {
        h.hp = Math.min(h.maxHp, h.hp + 6 * this.options.perks.regenMul * dt);
      }
      if (this.options.perks.battleRegen > 0 && h.hp < h.maxHp) {
        h.hp = Math.min(h.maxHp, h.hp + this.options.perks.battleRegen * dt);
      }
    }

    this.heroCombat(dt);
    this.enemyAI(dt);
    this.updateBullets(dt);
    this.updateFx(dt);
    this.pickups(dt);
    this.questLogic(dt);

    // 相机
    const tx = clamp(this.squadX - this.W / 2, -40, WORLD_W - this.W + 40);
    const ty = clamp(this.squadY - this.H / 2, -40, WORLD_H - this.H + 40);
    this.camX = lerp(this.camX, tx, Math.min(1, dt * 5));
    this.camY = lerp(this.camY, ty, Math.min(1, dt * 5));
    this.shake = Math.max(0, this.shake - dt * 30);
    this.hurtT = Math.max(0, this.hurtT - dt);

    // 团灭判定
    if (this.heroes.every(h => !h.alive)) {
      this.finish(false, '全队阵亡，本次搜集的物资全部丢失');
      return;
    }

    this.hudT += dt;
    if (this.hudT > 0.12) { this.hudT = 0; this.pushHud(); }
  }

  private collide(px: number, py: number, r: number): [number, number] {
    let x = px, y = py;
    for (const w of WALLS) [x, y] = resolveCircleRect(x, y, r, w.x, w.y, w.w, w.h);
    for (const p of PROPS) {
      if (!p.solid || p.type === 'stairs') continue;
      [x, y] = resolveCircleRect(x, y, r, p.x, p.y, p.w, p.h);
    }
    x = clamp(x, 60 + r, WORLD_W - 60 - r);
    y = clamp(y, 60 + r, WORLD_H - 60 - r);
    return [x, y];
  }

  private heroCombat(dt: number) {
    for (const h of this.heroes) {
      if (!h.alive) continue;
      h.cd -= dt;
      // 目标：范围内最近敌人
      let best: EnemyState | null = null, bd = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dd = d2(h.x, h.y, e.x, e.y);
        if (dd < bd) { bd = dd; best = e; }
      }
      const inRange = best && bd < (h.range + 30) * (h.range + 30);
      if (best && inRange) {
        h.face = Math.atan2(best.y - h.y, best.x - h.x);
        if (h.cd <= 0) {
          h.cd = h.cdMax;
          if (h.job === '辅助') {
            // 优先治疗血量最低的队友
            let tgt: HeroState | null = null, low = 0.9;
            for (const a of this.heroes) {
              if (!a.alive) continue;
              const r = a.hp / a.maxHp;
              if (r < low) { low = r; tgt = a; }
            }
            if (tgt) {
              const heal = 34;
              tgt.hp = Math.min(tgt.maxHp, tgt.hp + heal);
              this.floaters.push({ x: tgt.x, y: tgt.y - 70, txt: '+' + heal, color: '#5be08a', t: 0, size: 22 });
              this.burst(tgt.x, tgt.y - 30, '#7be0a8', 6, 60);
              sfx.heal();
            } else {
              this.fireBullet(h, best, h.atk);
            }
          } else if (h.range <= 130) {
            // 近战：小范围横扫
            sfx.melee();
            this.burst(h.x + Math.cos(h.face) * 50, h.y + Math.sin(h.face) * 50, '#ffe9a8', 5, 90);
            for (const e of this.enemies) {
              if (e.dead) continue;
              if (d2(h.x, h.y, e.x, e.y) < 110 * 110) this.damageEnemy(e, h.atk);
            }
          } else {
            this.fireBullet(h, best, h.atk);
          }
        }
      } else if (this.moveMag > 0.05) {
        h.face = this.squadFace;
      }
    }
  }

  private fireBullet(h: HeroState, e: EnemyState, dmg: number) {
    const a = Math.atan2(e.y - h.y, e.x - h.x);
    this.bullets.push({ x: h.x + Math.cos(a) * 24, y: h.y - 26 + Math.sin(a) * 24, vx: Math.cos(a) * 780, vy: Math.sin(a) * 780, dmg, life: 0.6 });
    sfx.shoot();
    this.burst(h.x + Math.cos(a) * 30, h.y - 26 + Math.sin(a) * 30, '#ffd97a', 2, 40);
  }

  private damageEnemy(e: EnemyState, dmg: number) {
    const real = Math.max(1, Math.round(dmg - e.armor + (Math.random() * 6 - 3)));
    e.hp -= real;
    e.flash = 1;
    if (!e.aggro) { e.aggro = true; this.aggroGroup(e.group); }
    this.floaters.push({ x: e.x + (Math.random() * 20 - 10), y: e.y - 60 * e.scale, txt: String(real), color: '#ffffff', t: 0, size: e.kind === 'boss' ? 26 : 20 });
    sfx.hit();
    if (e.hp <= 0 && !e.dead) {
      e.dead = true; e.deadT = 0;
      this.kills++;
      if (e.kind === 'boss') {
        this.bossKills++;
        this.onBanner('尸王被击败了！');
      }
      sfx.die();
      this.burst(e.x, e.y - 20, '#8fb573', 14, 130);
      this.burst(e.x, e.y - 10, '#4a5c3c', 8, 90);
      // 小概率掉物资
      if (Math.random() < 0.16 && this.stage === 0) {
        this.loots.push({ x: e.x, y: e.y, kind: 'can', taken: false, bob: 0 });
      }
    }
  }

  private aggroGroup(gid: number) {
    for (const e of this.enemies) if (e.group === gid) e.aggro = true;
  }

  private enemyAI(dt: number) {
    const aliveHeroes = this.heroes.filter(h => h.alive);
    for (const e of this.enemies) {
      if (e.dead) { e.deadT += dt; continue; }
      e.flash = Math.max(0, e.flash - dt * 4);
      e.cd -= dt;

      // 索敌
      if (!e.aggro) {
        if (d2(e.x, e.y, this.squadX, this.squadY) < AGGRO_R * AGGRO_R) {
          e.aggro = true;
          this.aggroGroup(e.group);
          if (!this.bannered.has('fight')) { this.bannered.add('fight'); this.onBanner('遭遇尸群！自动接战'); sfx.alarm(); }
        }
      }
      if (!e.aggro || aliveHeroes.length === 0) {
        e.walk = lerp(e.walk, Math.round(e.walk / Math.PI) * Math.PI, dt * 6);
        continue;
      }

      // 脱战回巢
      if (d2(e.x, e.y, e.homeX, e.homeY) > LEASH_R * LEASH_R) {
        const a = Math.atan2(e.homeY - e.y, e.homeX - e.x);
        e.x += Math.cos(a) * e.speed * dt;
        e.y += Math.sin(a) * e.speed * dt;
        e.hp = Math.min(e.maxHp, e.hp + 40 * dt);
        e.face = a; e.walk += dt * 3;
        if (d2(e.x, e.y, e.homeX, e.homeY) < 60 * 60) e.aggro = false;
        continue;
      }

      // 目标选择：疾行优先切后排（血量上限最低者），其余就近
      let tgt: HeroState | null = null;
      if (e.kind === 'fast') {
        tgt = aliveHeroes.reduce((a, b) => (a.maxHp < b.maxHp ? a : b));
      } else {
        let bd = Infinity;
        for (const h of aliveHeroes) {
          const dd = d2(e.x, e.y, h.x, h.y);
          if (dd < bd) { bd = dd; tgt = h; }
        }
      }
      if (!tgt) continue;

      const dd = Math.hypot(tgt.x - e.x, tgt.y - e.y);
      const reach = e.range + 14;
      e.face = Math.atan2(tgt.y - e.y, tgt.x - e.x);

      // BOSS 蓄力砸地
      if (e.kind === 'boss') {
        e.slamCd -= dt;
        if (e.telegraph > 0) {
          e.telegraph -= dt;
          if (e.telegraph <= 0) {
            sfx.slam();
            this.shake = 14;
            this.burst(e.x, e.y, '#c05aff', 22, 260);
            for (const h of aliveHeroes) {
              if (d2(e.x, e.y, h.x, h.y) < 165 * 165) this.damageHero(h, 42);
            }
            e.slamCd = 6.5;
          }
          continue; // 蓄力时不移动
        } else if (e.slamCd <= 0 && dd < 200) {
          e.telegraph = 0.9;
          continue;
        }
      }

      if (dd > reach) {
        const sp = e.speed * (e.kind === 'fast' && dd > 220 ? 1.25 : 1);
        let nx = e.x + Math.cos(e.face) * sp * dt;
        let ny = e.y + Math.sin(e.face) * sp * dt;
        [nx, ny] = this.collide(nx, ny, 16 * e.scale);
        e.x = nx; e.y = ny;
        e.walk += dt * (sp / 55);
      } else if (e.cd <= 0) {
        e.cd = e.kind === 'fast' ? 0.7 : 1.05;
        this.damageHero(tgt, e.atk + Math.random() * 4 - 2);
        if (e.kind === 'boss') { // 吸血
          e.hp = Math.min(e.maxHp, e.hp + e.atk * 0.6);
          this.floaters.push({ x: e.x, y: e.y - 80 * e.scale, txt: '吸血 +' + Math.round(e.atk * 0.6), color: '#c05aff', t: 0, size: 18 });
        }
        this.burst(tgt.x, tgt.y - 30, '#e5484d', 4, 70);
      }
    }
    // 敌人之间简单分离
    const es = this.enemies.filter(e => !e.dead);
    for (let i = 0; i < es.length; i++) {
      for (let j = i + 1; j < es.length; j++) {
        const a = es[i], b = es[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dd = Math.hypot(dx, dy);
        const min = 26 * (a.scale + b.scale) * 0.5;
        if (dd > 0.01 && dd < min) {
          const push = (min - dd) / 2;
          a.x -= dx / dd * push; a.y -= dy / dd * push;
          b.x += dx / dd * push; b.y += dy / dd * push;
        }
      }
    }
  }

  private damageHero(h: HeroState, dmg: number) {
    if (!h.alive) return;
    const real = Math.max(1, Math.round(dmg));
    h.hp -= real;
    h.flash = 1;
    h.lastHurt = this.time;
    this.hurtT = 0.35;
    this.floaters.push({ x: h.x + (Math.random() * 16 - 8), y: h.y - 66, txt: '-' + real, color: '#ff6b6b', t: 0, size: 20 });
    sfx.hurt();
    if (h.hp <= 0) {
      h.hp = 0;
      h.alive = false;
      this.floaters.push({ x: h.x, y: h.y - 90, txt: h.name + ' 倒下了！', color: '#ff9b9b', t: 0, size: 22 });
      if (!this.bannered.has('down')) { this.bannered.add('down'); this.onBanner('有队员倒下了！注意走位'); }
    }
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const rr = 22 * e.scale;
        if (d2(b.x, b.y, e.x, e.y - 20 * e.scale) < rr * rr) {
          this.damageEnemy(e, b.dmg);
          b.life = 0;
          break;
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.life > 0);
  }

  private updateFx(dt: number) {
    for (const f of this.floaters) { f.t += dt; f.y -= dt * 46; }
    this.floaters = this.floaters.filter(f => f.t < 1.1);
    for (const p of this.particles) {
      p.t += dt;
      if (p.toCorner) {
        // 飞向屏幕左下任务栏
        const txp = this.camX + 60, typ = this.camY + this.H - 150;
        p.vx = (txp - p.x) * 6; p.vy = (typ - p.y) * 6;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.96; p.vy *= 0.96;
    }
    this.particles = this.particles.filter(p => p.t < p.life);
  }

  private pickups(_dt: number) {
    for (const l of this.loots) {
      if (l.taken) continue;
      if (d2(l.x, l.y, this.squadX, this.squadY) < 52 * 52) {
        l.taken = true;
        if (l.kind === 'can') {
          this.supplies += 1;
          this.floaters.push({ x: l.x, y: l.y - 40, txt: '+1 物资', color: '#ffd94d', t: 0, size: 22 });
          this.particles.push({ x: l.x, y: l.y, vx: 0, vy: -60, t: 0, life: 0.9, color: '#ffd94d', size: 10, toCorner: true });
          sfx.pickup();
        } else if (l.kind === 'medkit') {
          for (const h of this.heroes) if (h.alive) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.35);
          this.floaters.push({ x: l.x, y: l.y - 40, txt: '全队治疗 +35%', color: '#5be08a', t: 0, size: 22 });
          this.burst(l.x, l.y, '#7be0a8', 10, 110);
          sfx.heal();
        } else {
          this.supplies += 2;
          this.chestTaken += 1;
          this.floaters.push({ x: l.x, y: l.y - 50, txt: '高级物资箱！ +2 物资', color: '#ffb84d', t: 0, size: 26 });
          this.burst(l.x, l.y, '#ffd94d', 20, 180);
          sfx.chest();
          this.onBanner('获得高级物资箱！');
        }
      }
    }
  }

  private questProgress(): { cur: number; max: number } {
    const q = this.options.quest;
    switch (q.mode) {
      case 'collect': return { cur: Math.min(this.supplies, this.need), max: this.need };
      case 'hunt': return { cur: Math.min(this.kills, this.need), max: this.need };
      case 'chest': return { cur: Math.min(this.chestTaken, this.need), max: this.need };
      case 'boss': return { cur: Math.min(this.bossKills, this.need), max: this.need };
    }
  }

  private questDone(): boolean {
    const p = this.questProgress();
    return p.cur >= p.max;
  }

  private questLogic(dt: number) {
    if (this.stage === 0 && this.questDone()) {
      this.stage = 1;
      this.onBanner(this.options.quest.mode === 'collect' ? '物资集齐！前往撤离点撤离' : '任务完成！前往撤离点撤离');
      sfx.alarm();
    }
    if (this.stage >= 1) {
      const inZone = d2(this.squadX, this.squadY, EXTRACT.x, EXTRACT.y) < EXTRACT.r * EXTRACT.r;
      if (inZone) {
        this.extractT += dt / 2.2;
        if (this.extractT >= 1) {
          this.extractT = 1;
          this.finish(true, '撤离成功！');
        }
      } else {
        this.extractT = Math.max(0, this.extractT - dt * 0.8);
      }
    }
  }

  private finish(win: boolean, reason: string) {
    if (this.result) return;
    const cans = this.supplies;
    const chest = this.loots.some(l => l.kind === 'chest' && l.taken);
    const rewardMul = this.options.event.rewardMul;
    this.result = {
      win, reason,
      cans: win ? cans : 0,
      chest: win && chest,
      kills: this.kills,
      timeUsed: Math.round(this.elapsed),
      powerGain: win ? Math.round((40 * cans + (chest ? 144 : 0) + this.kills * 3) * rewardMul) : 0,
      rewardMul,
    };
    if (win) sfx.win(); else sfx.lose();
    this.pushHud();
  }

  private burst(x: number, y: number, color: string, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        t: 0, life: 0.4 + Math.random() * 0.4, color, size: 3 + Math.random() * 4,
      });
    }
  }

  private pushHud() {
    const qp = this.questProgress();
    this.onHud({
      day: this.options.day, timeLeft: Math.ceil(this.timeLeft), power: 0, gems: 0,
      supplies: this.supplies, need: this.need, stage: this.stage, kills: this.kills,
      questLabel: this.options.quest.label, questCur: qp.cur, questMax: qp.max,
      extractActive: this.stage >= 1, extractT: this.extractT, hurtT: this.hurtT,
      heroes: this.heroes.map(h => ({ id: h.id, name: h.name, job: h.job, hp: Math.ceil(h.hp), maxHp: h.maxHp, alive: h.alive })),
      result: this.result,
    });
  }

  // ================= 渲染 =================
  private render() {
    const g = this.g;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.fillStyle = '#10141c';
    g.fillRect(0, 0, this.W, this.H);

    const shX = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const shY = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    g.save();
    g.translate(-this.camX + shX, -this.camY + shY);

    this.drawFloor(g);

    // 可排序渲染队列
    type Item = { y: number; draw: () => void };
    const items: Item[] = [];

    for (const w of WALLS) items.push({ y: w.y + w.h, draw: () => this.drawWall(g, w.x, w.y, w.w, w.h) });
    for (const p of PROPS) items.push({ y: p.y + p.h, draw: () => this.drawProp(g, p) });
    for (const l of this.loots) if (!l.taken) items.push({ y: l.y, draw: () => this.drawLoot(g, l) });

    // 撤离点光柱
    if (this.stage >= 1) items.push({ y: EXTRACT.y - 10, draw: () => this.drawExtract(g) });

    for (const e of this.enemies) {
      if (e.dead && e.deadT > 0.55) continue;
      items.push({
        y: e.y,
        draw: () => {
          // BOSS 蓄力预警圈
          if (e.kind === 'boss' && e.telegraph > 0) {
            const p = 1 - e.telegraph / 0.9;
            g.save();
            g.globalAlpha = 0.25 + p * 0.3;
            g.fillStyle = '#ff3b30';
            g.beginPath(); g.ellipse(e.x, e.y, 165, 165 * 0.82, 0, 0, Math.PI * 2); g.fill();
            g.globalAlpha = 0.9;
            g.strokeStyle = '#ff6b60';
            g.lineWidth = 3;
            g.beginPath(); g.ellipse(e.x, e.y, 165 * p, 165 * 0.82 * p, 0, 0, Math.PI * 2); g.stroke();
            g.restore();
          }
          const fade = e.dead ? Math.max(0, 1 - e.deadT / 0.55) : 1;
          g.save();
          g.globalAlpha = fade;
          drawUnit(g, e.x, e.y, e.scale, { skin: '', hair: '', cloth: '', cloth2: '', accent: '', hat: 'none' }, {
            zombie: e.kind, face: e.face, walk: e.walk, dead: e.dead,
            flash: e.flash, weapon: 'claw',
          });
          g.restore();
          if (!e.dead) this.drawHpBar(g, e.x, e.y - 74 * e.scale, 52 * e.scale, e.hp / e.maxHp, e.kind === 'boss' ? '#c05aff' : '#e5484d', e.kind === 'boss' ? '吸血领主' : undefined);
        },
      });
    }

    for (const h of this.heroes) {
      items.push({
        y: h.y,
        draw: () => {
          drawUnit(g, h.x, h.y, HERO_SCALE, h.look, {
            face: h.face, walk: h.walk, dead: !h.alive, flash: h.flash,
            weapon: h.weapon,
          });
          if (h.alive) this.drawHpBar(g, h.x, h.y - 74, 46, h.hp / h.maxHp, '#5be08a', h.name);
        },
      });
    }

    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    // 子弹
    for (const b of this.bullets) {
      g.save();
      g.strokeStyle = '#ffe9a8';
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(b.x - b.vx * 0.016, b.y - b.vy * 0.016);
      g.lineTo(b.x, b.y);
      g.stroke();
      g.restore();
    }

    // 粒子
    for (const p of this.particles) {
      g.save();
      g.globalAlpha = 1 - p.t / p.life;
      g.fillStyle = p.color;
      g.beginPath(); g.arc(p.x, p.y, p.size, 0, Math.PI * 2); g.fill();
      g.restore();
    }

    // 飘字
    for (const f of this.floaters) {
      g.save();
      g.globalAlpha = 1 - f.t / 1.1;
      g.font = `900 ${f.size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(20,16,24,0.9)';
      g.strokeText(f.txt, f.x, f.y);
      g.fillStyle = f.color;
      g.fillText(f.txt, f.x, f.y);
      g.restore();
    }

    // 灯光
    for (const lamp of LAMPS) {
      const fl = 0.75 + 0.25 * Math.sin(this.time * lamp.f * 3 + lamp.x);
      const grad = g.createRadialGradient(lamp.x, lamp.y, 10, lamp.x, lamp.y, 260);
      grad.addColorStop(0, `rgba(255, 230, 160, ${0.10 * fl})`);
      grad.addColorStop(1, 'rgba(255,230,160,0)');
      g.fillStyle = grad;
      g.fillRect(lamp.x - 260, lamp.y - 260, 520, 520);
    }

    g.restore();

    // —— 迷雾 / 暗角（事件影响浓度与色调：浓雾/血月） ——
    const ev = this.options.event;
    const fogMul = ev.fogMul;
    const tint = ev.fogTint;
    const sx = this.squadX - this.camX + shX, sy = this.squadY - this.camY + shY;
    const fog = g.createRadialGradient(sx, sy, Math.min(this.W, this.H) * 0.30 * fogMul, sx, sy, Math.min(this.W, this.H) * 0.62 * fogMul);
    fog.addColorStop(0, `rgba(${tint},0)`);
    fog.addColorStop(1, `rgba(${tint},0.88)`);
    g.fillStyle = fog;
    g.fillRect(0, 0, this.W, this.H);

    this.drawEdgeArrow(g);
    this.drawJoystick(g);
  }

  private drawFloor(g: CanvasRenderingContext2D) {
    // 底
    g.fillStyle = '#3a414c';
    g.fillRect(0, 0, WORLD_W, WORLD_H);
    // 地砖
    const T = 130;
    for (let x = 0; x < WORLD_W; x += T) {
      for (let y = 0; y < WORLD_H; y += T) {
        if (((x + y) / T) % 2 === 0) {
          g.fillStyle = 'rgba(255,255,255,0.025)';
          g.fillRect(x, y, T, T);
        }
      }
    }
    g.strokeStyle = 'rgba(0,0,0,0.14)';
    g.lineWidth = 2;
    for (let x = 0; x <= WORLD_W; x += T) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WORLD_H); g.stroke(); }
    for (let y = 0; y <= WORLD_H; y += T) { g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD_W, y); g.stroke(); }

    // 站台区域（右上）地面提亮 + 黄色安全线
    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.fillRect(1160, 60, WORLD_W - 1160 - 60, 620);
    g.fillStyle = '#c9a437';
    for (let x = 1200; x < WORLD_W - 100; x += 46) g.fillRect(x, 282, 30, 8);
    // 铁轨
    g.fillStyle = '#23272e';
    g.fillRect(1160, 60, WORLD_W - 1160, 30);
    g.strokeStyle = '#565e6a';
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(1160, 70); g.lineTo(WORLD_W, 70); g.stroke();
    g.beginPath(); g.moveTo(1160, 84); g.lineTo(WORLD_W, 84); g.stroke();

    // 污渍
    for (const s of STAINS) {
      g.fillStyle = s.green ? `rgba(96,150,60,${s.a})` : `rgba(10,12,16,${s.a})`;
      g.beginPath(); g.ellipse(s.x, s.y, s.r, s.r * 0.7, 0, 0, Math.PI * 2); g.fill();
    }
    // 裂缝
    g.strokeStyle = 'rgba(0,0,0,0.25)';
    g.lineWidth = 2;
    for (const pts of CRACKS) {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    }
  }

  private drawWall(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    const T = 20; // 假高度
    g.fillStyle = '#20262f';
    g.fillRect(x, y - T, w, h + T);
    g.fillStyle = '#4a5563';
    g.fillRect(x, y - T, w, T);
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(x, y - T, w, 3);
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.lineWidth = 2;
    g.strokeRect(x, y - T, w, h + T);
  }

  private drawProp(g: CanvasRenderingContext2D, p: (typeof PROPS)[number]) {
    const { x, y, w, h } = p;
    g.save();
    switch (p.type) {
      case 'pillar': {
        g.fillStyle = '#2c333e'; g.fillRect(x, y - 26, w, h + 26);
        g.fillStyle = '#4a5563'; g.fillRect(x, y - 26, w, 26);
        g.fillStyle = '#c9a437'; g.fillRect(x, y + h - 14, w, 8);
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(x, y - 26, w, h + 26);
        break;
      }
      case 'bench': {
        g.fillStyle = '#20242c'; g.fillRect(x + 6, y + h - 12, 10, 12); g.fillRect(x + w - 16, y + h - 12, 10, 12);
        g.fillStyle = '#7a5c38';
        g.fillRect(x, y, w, h);
        g.fillStyle = '#8f6c42';
        for (let i = 0; i < 3; i++) g.fillRect(x + 4, y + 5 + i * (h - 10) / 3, w - 8, (h - 10) / 3 - 5);
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
        break;
      }
      case 'vending': {
        const red = (p.seed ?? 0) % 2 === 0;
        g.fillStyle = '#1f242c'; g.fillRect(x + 4, y + h - 8, w - 8, 10);
        g.fillStyle = red ? '#8c3a3a' : '#3a5a8c';
        g.fillRect(x, y - 30, w, h + 30);
        g.fillStyle = 'rgba(160,220,255,0.75)';
        g.fillRect(x + 8, y - 22, w * 0.55, h * 0.6);
        g.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 3; i++) g.fillRect(x + 12, y - 16 + i * 14, w * 0.55 - 8, 3);
        g.fillStyle = '#dfe6ee';
        g.fillRect(x + w - 24, y - 16, 14, 26);
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 2; g.strokeRect(x, y - 30, w, h + 30);
        break;
      }
      case 'crate': {
        g.fillStyle = '#6e5638'; g.fillRect(x, y, w, h);
        g.fillStyle = '#7d6440'; g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.strokeStyle = '#4c3a24'; g.lineWidth = 3;
        g.strokeRect(x, y, w, h);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + h); g.moveTo(x + w, y); g.lineTo(x, y + h); g.stroke();
        break;
      }
      case 'gate': {
        g.fillStyle = '#39424e'; g.fillRect(x, y - 16, w, h + 16);
        g.fillStyle = '#4a5563'; g.fillRect(x, y - 16, w, 12);
        g.fillStyle = '#39d98a';
        g.beginPath(); g.arc(x + w / 2, y - 10, 5, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(x, y - 16, w, h + 16);
        break;
      }
      case 'counter': {
        g.fillStyle = '#3a3128'; g.fillRect(x, y, w, h);
        g.fillStyle = '#5c4c3a'; g.fillRect(x, y - 10, w, 16);
        const aw = (p.seed ?? 0) % 2 === 0 ? '#a84848' : '#4878a8';
        for (let i = 0; i < 6; i++) {
          g.fillStyle = i % 2 === 0 ? aw : '#e8e2d4';
          g.fillRect(x + i * (w / 6), y - 10, w / 6, 8);
        }
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
        break;
      }
      case 'train': {
        // 列车侧面
        g.fillStyle = '#313a46'; g.fillRect(x, y, w, h);
        g.fillStyle = '#46525f'; g.fillRect(x, y, w, 26); // 车顶沿
        g.fillStyle = '#c9a437'; g.fillRect(x, y + h - 34, w, 10); // 黄色腰线
        // 车窗
        g.fillStyle = 'rgba(140,200,190,0.32)';
        for (let wx = x + 30; wx < x + w - 90; wx += 110) {
          g.fillRect(wx, y + 44, 72, 52);
        }
        // 车门
        g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 3;
        for (let dx = x + 160; dx < x + w - 80; dx += 330) {
          g.strokeRect(dx, y + 30, 84, h - 44);
          g.beginPath(); g.moveTo(dx + 42, y + 30); g.lineTo(dx + 42, y + h - 14); g.stroke();
        }
        g.strokeRect(x, y, w, h);
        break;
      }
      case 'trash': {
        g.fillStyle = '#3c4a42';
        g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#55685c';
        g.beginPath(); g.ellipse(x + w / 2, y + 8, w / 2 - 4, 8, 0, 0, Math.PI * 2); g.fill();
        break;
      }
      case 'sign': {
        g.fillStyle = '#4a5563'; g.fillRect(x + w / 2 - 3, y, 6, h);
        g.fillStyle = '#1f8a5c'; g.fillRect(x - 16, y - 6, w + 32, 34);
        g.fillStyle = '#fff';
        g.font = '900 20px "PingFang SC", "Microsoft YaHei", sans-serif';
        g.textAlign = 'center';
        g.fillText('出口', x + w / 2, y + 18);
        break;
      }
      case 'barrier': {
        g.fillStyle = '#3c3c3c'; g.fillRect(x, y + h - 10, w, 10);
        for (let i = 0; i < 5; i++) {
          g.fillStyle = i % 2 === 0 ? '#e8c33c' : '#2c2c2c';
          g.save();
          g.translate(x + i * (w / 5), y);
          g.fillRect(0, 0, w / 5 - 2, h - 10);
          g.restore();
        }
        g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(x, y, w, h - 10);
        break;
      }
      case 'stairs': {
        // 下行楼梯（进站口）
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          g.fillStyle = `rgb(${52 - t * 26}, ${58 - t * 28}, ${70 - t * 32})`;
          g.fillRect(x + i * 8, y + i * 20, w - i * 16, 20);
        }
        g.strokeStyle = '#6a7684'; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + w * 0.28, y + h); g.stroke();
        g.beginPath(); g.moveTo(x + w + 6, y); g.lineTo(x + w * 0.72, y + h); g.stroke();
        break;
      }
    }
    g.restore();
  }

  private drawLoot(g: CanvasRenderingContext2D, l: GroundLoot) {
    const bob = Math.sin(this.time * 3 + l.bob) * 4;
    const y = l.y + bob;
    g.save();
    // 光环
    const glow = g.createRadialGradient(l.x, l.y, 2, l.x, l.y, 34);
    const gc = l.kind === 'can' ? '255,217,77' : l.kind === 'medkit' ? '123,224,168' : '255,164,60';
    glow.addColorStop(0, `rgba(${gc},0.35)`);
    glow.addColorStop(1, `rgba(${gc},0)`);
    g.fillStyle = glow;
    g.fillRect(l.x - 34, l.y - 34, 68, 68);

    if (l.kind === 'can') {
      g.fillStyle = '#b8bec8';
      g.fillRect(l.x - 11, y - 16, 22, 26);
      g.fillStyle = '#d8613c';
      g.fillRect(l.x - 11, y - 10, 22, 14);
      g.fillStyle = '#e8edf2';
      g.beginPath(); g.ellipse(l.x, y - 16, 11, 4, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1c1620'; g.lineWidth = 2;
      g.strokeRect(l.x - 11, y - 16, 22, 26);
    } else if (l.kind === 'medkit') {
      g.fillStyle = '#e8edf2';
      g.fillRect(l.x - 14, y - 12, 28, 22);
      g.fillStyle = '#e5484d';
      g.fillRect(l.x - 3, y - 9, 6, 16);
      g.fillRect(l.x - 9, y - 4, 18, 6);
      g.strokeStyle = '#1c1620'; g.lineWidth = 2;
      g.strokeRect(l.x - 14, y - 12, 28, 22);
    } else {
      // 金宝箱
      g.fillStyle = '#8a6a20';
      g.fillRect(l.x - 20, y - 12, 40, 24);
      g.fillStyle = '#c9a437';
      g.fillRect(l.x - 20, y - 20, 40, 12);
      g.fillStyle = '#ffe066';
      g.fillRect(l.x - 4, y - 14, 8, 12);
      g.strokeStyle = '#4c3a10'; g.lineWidth = 2.5;
      g.strokeRect(l.x - 20, y - 20, 40, 32);
    }
    g.restore();
  }

  private drawExtract(g: CanvasRenderingContext2D) {
    const t = this.time;
    // 撤离圈
    g.save();
    const pulse = 1 + Math.sin(t * 4) * 0.06;
    g.strokeStyle = 'rgba(55,224,255,0.9)';
    g.lineWidth = 4;
    g.beginPath(); g.ellipse(EXTRACT.x, EXTRACT.y, EXTRACT.r * pulse, EXTRACT.r * 0.86 * pulse, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(55,224,255,0.10)';
    g.beginPath(); g.ellipse(EXTRACT.x, EXTRACT.y, EXTRACT.r, EXTRACT.r * 0.86, 0, 0, Math.PI * 2); g.fill();
    // 光柱
    const beam = g.createLinearGradient(EXTRACT.x, EXTRACT.y - 420, EXTRACT.x, EXTRACT.y);
    beam.addColorStop(0, 'rgba(55,224,255,0)');
    beam.addColorStop(1, 'rgba(55,224,255,0.35)');
    g.fillStyle = beam;
    g.fillRect(EXTRACT.x - 34, EXTRACT.y - 420, 68, 420);
    // 进度环
    if (this.extractT > 0) {
      g.strokeStyle = '#ffd94d';
      g.lineWidth = 8;
      g.beginPath();
      g.arc(EXTRACT.x, EXTRACT.y - 40, 40, -Math.PI / 2, -Math.PI / 2 + this.extractT * Math.PI * 2);
      g.stroke();
      g.fillStyle = '#fff';
      g.font = '900 24px "PingFang SC", "Microsoft YaHei", sans-serif';
      g.textAlign = 'center';
      g.fillText('撤离中…', EXTRACT.x, EXTRACT.y - 92);
    }
    g.fillStyle = '#9beeff';
    g.font = '900 26px "PingFang SC", "Microsoft YaHei", sans-serif';
    g.textAlign = 'center';
    g.lineWidth = 5; g.strokeStyle = 'rgba(10,20,30,0.9)';
    g.strokeText('撤离点', EXTRACT.x, EXTRACT.y + EXTRACT.r + 34);
    g.fillText('撤离点', EXTRACT.x, EXTRACT.y + EXTRACT.r + 34);
    g.restore();
  }

  private drawHpBar(g: CanvasRenderingContext2D, x: number, y: number, w: number, ratio: number, color: string, name?: string) {
    g.save();
    if (name) {
      g.font = '700 15px "PingFang SC", "Microsoft YaHei", sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 3.5; g.strokeStyle = 'rgba(15,12,18,0.85)';
      g.strokeText(name, x, y - 7);
      g.fillStyle = '#eef2f6';
      g.fillText(name, x, y - 7);
    }
    g.fillStyle = 'rgba(12,14,18,0.78)';
    g.fillRect(x - w / 2 - 1.5, y - 1.5, w + 3, 8);
    g.fillStyle = color;
    g.fillRect(x - w / 2, y, w * clamp(ratio, 0, 1), 5);
    g.restore();
  }

  private drawEdgeArrow(g: CanvasRenderingContext2D) {
    if (this.result) return;
    const obj = this.objectivePos();
    const sx = obj.x - this.camX, sy = obj.y - this.camY;
    const m = 70;
    if (sx > m && sx < this.W - m && sy > m && sy < this.H - m) return;
    const cx = clamp(sx, m, this.W - m), cy = clamp(sy, m + 60, this.H - m);
    const ang = Math.atan2(sy - cy, sx - cx);
    const bounce = Math.sin(this.time * 6) * 8;
    g.save();
    g.translate(cx + Math.cos(ang) * bounce, cy + Math.sin(ang) * bounce);
    g.rotate(ang);
    g.fillStyle = '#ffc233';
    g.strokeStyle = 'rgba(120,60,0,0.9)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(26, 0); g.lineTo(2, -16); g.lineTo(8, 0); g.lineTo(2, 16);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
  }

  private drawJoystick(g: CanvasRenderingContext2D) {
    if (!this.joyActive) return;
    g.save();
    g.globalAlpha = 0.35;
    g.fillStyle = '#dfe8f2';
    g.beginPath(); g.arc(this.joyBaseX, this.joyBaseY, 62, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.75;
    g.beginPath(); g.arc(this.joyBaseX + this.joyDX * 62, this.joyBaseY + this.joyDY * 62, 30, 0, Math.PI * 2); g.fill();
    g.restore();
  }
}
