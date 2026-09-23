// Q版二头身角色绘制：纯 Canvas 矢量绘制，支持自定义配色/帽子/武器
export type HatType =
  | 'none' | 'cap' | 'policecap' | 'bow' | 'sidehair'
  | 'mecha' | 'wukong' | 'chef' | 'batmask' | 'panda' | 'ice' | 'band' | 'twintails';

export type WeaponType = 'bat' | 'rifle' | 'pistol' | 'syringe' | 'claw' | 'staff' | 'fist' | 'dual' | 'axe';

export interface Look {
  skin: string; hair: string; cloth: string; cloth2: string; accent: string;
  hat: HatType;
}

export type ZombieKind = 'normal' | 'fast' | 'heavy' | 'boss';

const ZOMBIE_LOOKS: Record<ZombieKind, Look> = {
  normal: { skin: '#9db38a', hair: '#4a4a42', cloth: '#5c5648', cloth2: '#6e4632', accent: '#7a8a6a', hat: 'none' },
  fast: { skin: '#a8bf7e', hair: '#3c3a30', cloth: '#7a3a3a', cloth2: '#5c2c2c', accent: '#c9d86a', hat: 'none' },
  heavy: { skin: '#8a9a92', hair: '#3a4440', cloth: '#4a4038', cloth2: '#3a332c', accent: '#b08a4a', hat: 'none' },
  boss: { skin: '#7a6a9a', hair: '#2c2438', cloth: '#3a2c4a', cloth2: '#2a2038', accent: '#c05aff', hat: 'none' },
};

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export interface DrawOpts {
  zombie?: ZombieKind | null;
  face?: number; walk?: number; dead?: boolean;
  flash?: number; weapon?: WeaponType;
}

/** 绘制二头身角色，身高约 62*s */
export function drawUnit(
  g: CanvasRenderingContext2D,
  x: number, y: number, s: number,
  look: Look,
  opts: DrawOpts = {}
) {
  const zk = opts.zombie ?? null;
  const pal = zk ? ZOMBIE_LOOKS[zk] : look;
  const face = opts.face ?? Math.PI / 2;
  const walk = opts.walk ?? 0;
  const bob = Math.sin(walk * 10) * 2 * s;
  const legSwing = Math.sin(walk * 10) * 5 * s;

  g.save();
  g.translate(x, y + bob * 0.4);
  if (opts.dead) {
    g.rotate(Math.PI / 2.2);
    g.globalAlpha = 0.75;
  }
  const OUT = '#1c1620';
  g.lineWidth = 2.4 * s;
  g.strokeStyle = OUT;

  // 腿
  g.fillStyle = zk ? '#3c3630' : '#2c3038';
  rr(g, -8 * s, -14 * s + Math.max(0, legSwing * 0.4), 7 * s, 14 * s, 3 * s); g.fill(); g.stroke();
  rr(g, 1 * s, -14 * s + Math.max(0, -legSwing * 0.4), 7 * s, 14 * s, 3 * s); g.fill(); g.stroke();

  // 身体
  g.fillStyle = pal.cloth;
  rr(g, -11 * s, -30 * s, 22 * s, 20 * s, 6 * s); g.fill(); g.stroke();
  g.fillStyle = pal.cloth2;
  if (look.hat === 'cap') { rr(g, -11 * s, -30 * s, 22 * s, 7 * s, 4 * s); g.fill(); }
  if (look.hat === 'policecap') { g.fillStyle = pal.accent; rr(g, -3 * s, -28 * s, 6 * s, 5 * s, 1 * s); g.fill(); }
  if (look.hat === 'bow') { g.fillStyle = pal.accent; rr(g, -2.5 * s, -27 * s, 5 * s, 10 * s, 1 * s); g.fill(); rr(g, -5 * s, -24.5 * s, 10 * s, 5 * s, 1 * s); g.fill(); }
  if (zk) { g.fillStyle = pal.cloth2; rr(g, -8 * s, -26 * s, 7 * s, 6 * s, 1 * s); g.fill(); }

  // 手臂 + 武器
  const wx = Math.cos(face), wy = Math.sin(face);
  const armX = wx * 12 * s, armY = -20 * s + wy * 6 * s;
  g.fillStyle = pal.skin;
  rr(g, armX - 4 * s, armY - 4 * s, 8 * s, 8 * s, 3 * s); g.fill(); g.stroke();

  g.save();
  g.translate(armX, armY);
  g.rotate(face);
  switch (opts.weapon) {
    case 'bat':
      g.fillStyle = '#c9a05c'; rr(g, 2 * s, -3 * s, 22 * s, 6 * s, 3 * s); g.fill(); g.stroke();
      break;
    case 'rifle':
      g.fillStyle = '#33383f'; rr(g, 0, -3 * s, 26 * s, 6 * s, 1.5 * s); g.fill(); g.stroke();
      g.fillStyle = '#22262c'; rr(g, 14 * s, -2 * s, 12 * s, 4 * s, 1 * s); g.fill();
      break;
    case 'pistol':
      g.fillStyle = '#33383f'; rr(g, 0, -2.5 * s, 12 * s, 5 * s, 1 * s); g.fill(); g.stroke();
      break;
    case 'dual':
      g.fillStyle = '#33383f'; rr(g, 0, -6 * s, 13 * s, 4.5 * s, 1 * s); g.fill(); g.stroke();
      rr(g, 0, 1.5 * s, 13 * s, 4.5 * s, 1 * s); g.fill(); g.stroke();
      break;
    case 'syringe':
      g.fillStyle = '#dfe8ee'; rr(g, 0, -2 * s, 14 * s, 4 * s, 1 * s); g.fill(); g.stroke();
      g.fillStyle = '#7be0a8'; rr(g, 3 * s, -1.4 * s, 8 * s, 2.8 * s, 1 * s); g.fill();
      break;
    case 'staff':
      g.fillStyle = '#a8382e'; rr(g, -6 * s, -2.5 * s, 34 * s, 5 * s, 2 * s); g.fill(); g.stroke();
      g.fillStyle = '#e8c33c'; rr(g, 24 * s, -3.5 * s, 6 * s, 7 * s, 2 * s); g.fill(); g.stroke();
      break;
    case 'axe':
      g.fillStyle = '#7a5c38'; rr(g, 0, -2 * s, 18 * s, 4 * s, 1.5 * s); g.fill(); g.stroke();
      g.fillStyle = '#9aa6b2'; rr(g, 12 * s, -9 * s, 8 * s, 16 * s, 2 * s); g.fill(); g.stroke();
      break;
    case 'claw':
      g.strokeStyle = OUT; g.lineWidth = 2 * s;
      for (let i = -1; i <= 1; i++) {
        g.beginPath(); g.moveTo(4 * s, i * 4 * s); g.lineTo(12 * s, i * 5 * s); g.stroke();
      }
      break;
    case 'fist':
    default:
      break;
  }
  g.restore();

  // 头
  const headR = 15 * s;
  const hy = -42 * s;
  g.fillStyle = pal.skin;
  g.strokeStyle = OUT;
  g.lineWidth = 2.4 * s;
  g.beginPath(); g.arc(0, hy, headR, 0, Math.PI * 2); g.fill(); g.stroke();

  drawHat(g, pal, look.hat, headR, hy, s, zk);

  // 眼睛
  if (!opts.dead) {
    if (zk) {
      g.fillStyle = zk === 'boss' ? '#ff5a3c' : '#ffe066';
      g.beginPath(); g.arc(-5 * s, hy, 2.6 * s, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(5 * s, hy, 2.6 * s, 0, Math.PI * 2); g.fill();
    } else if (look.hat === 'mecha' || look.hat === 'batmask') {
      g.fillStyle = look.hat === 'mecha' ? '#4affe0' : '#ffe066';
      rr(g, -9 * s, hy - 3 * s, 7 * s, 4 * s, 2 * s); g.fill();
      rr(g, 2 * s, hy - 3 * s, 7 * s, 4 * s, 2 * s); g.fill();
    } else {
      g.fillStyle = '#241c18';
      g.beginPath(); g.arc(-5 * s, hy, 2.2 * s, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(5 * s, hy, 2.2 * s, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-4.4 * s, hy - 0.8 * s, 0.8 * s, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(5.6 * s, hy - 0.8 * s, 0.8 * s, 0, Math.PI * 2); g.fill();
    }
  } else {
    g.strokeStyle = '#241c18';
    g.lineWidth = 1.6 * s;
    for (const ex of [-5, 5]) {
      g.beginPath(); g.moveTo((ex - 2) * s, hy - 2 * s); g.lineTo((ex + 2) * s, hy + 2 * s); g.stroke();
      g.beginPath(); g.moveTo((ex + 2) * s, hy - 2 * s); g.lineTo((ex - 2) * s, hy + 2 * s); g.stroke();
    }
  }

  // 受击闪白
  if (opts.flash && opts.flash > 0) {
    g.globalAlpha = Math.min(0.85, opts.flash * 5);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(0, hy, headR + 1, 0, Math.PI * 2); g.fill();
    rr(g, -11 * s, -30 * s, 22 * s, 20 * s, 6 * s); g.fill();
  }
  g.restore();
}

function drawHat(
  g: CanvasRenderingContext2D, pal: Look, hat: HatType,
  headR: number, hy: number, s: number, zk: ZombieKind | null
) {
  const OUT = '#1c1620';
  g.strokeStyle = OUT;
  if (zk) {
    g.fillStyle = pal.hair;
    g.beginPath(); g.arc(-4 * s, hy - headR * 0.8, 5 * s, 0, Math.PI * 2); g.fill();
    if (zk === 'boss') {
      g.fillStyle = pal.accent;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 7 * s - 3 * s, hy - headR * 0.7);
        g.lineTo(i * 7 * s, hy - headR * 1.45);
        g.lineTo(i * 7 * s + 3 * s, hy - headR * 0.7);
        g.closePath(); g.fill(); g.stroke();
      }
    }
    if (zk === 'heavy') {
      g.fillStyle = pal.accent;
      g.beginPath(); g.moveTo(-14 * s, -34 * s); g.lineTo(-20 * s, -44 * s); g.lineTo(-8 * s, -36 * s); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(14 * s, -34 * s); g.lineTo(20 * s, -44 * s); g.lineTo(8 * s, -36 * s); g.closePath(); g.fill(); g.stroke();
    }
    return;
  }

  switch (hat) {
    case 'cap':
      g.fillStyle = pal.accent;
      g.beginPath(); g.arc(0, hy - 2 * s, headR * 0.98, Math.PI, 0); g.fill(); g.stroke();
      rr(g, -2 * s, hy - headR - 4 * s, 8 * s, 6 * s, 2 * s); g.fill(); g.stroke();
      rr(g, 2 * s, hy - 6 * s, 16 * s, 5 * s, 2 * s); g.fill(); g.stroke();
      break;
    case 'policecap':
      g.fillStyle = pal.cloth;
      g.beginPath(); g.arc(0, hy - 3 * s, headR * 0.95, Math.PI, 0); g.fill(); g.stroke();
      g.fillStyle = pal.accent;
      rr(g, -3 * s, hy - headR - 2 * s, 6 * s, 4 * s, 1 * s); g.fill();
      break;
    case 'bow':
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 0.95, Math.PI * 0.95, Math.PI * 2.05); g.fill(); g.stroke();
      g.fillStyle = pal.accent;
      g.beginPath(); g.arc(-9 * s, hy - headR - 1 * s, 5 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.arc(9 * s, hy - headR - 1 * s, 5 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      break;
    case 'sidehair':
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 0.96, Math.PI * 0.9, Math.PI * 2.1); g.fill(); g.stroke();
      rr(g, -headR - 2 * s, hy - 4 * s, 6 * s, 16 * s, 3 * s); g.fill(); g.stroke();
      break;
    case 'twintails':
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 0.96, Math.PI * 0.9, Math.PI * 2.1); g.fill(); g.stroke();
      rr(g, -headR - 5 * s, hy - 2 * s, 8 * s, 24 * s, 4 * s); g.fill(); g.stroke();
      rr(g, headR - 3 * s, hy - 2 * s, 8 * s, 24 * s, 4 * s); g.fill(); g.stroke();
      break;
    case 'band':
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 0.96, Math.PI * 0.9, Math.PI * 2.1); g.fill(); g.stroke();
      g.fillStyle = pal.accent;
      rr(g, -headR, hy - headR * 0.75, headR * 2, 6 * s, 3 * s); g.fill(); g.stroke();
      rr(g, headR - 2 * s, hy - headR * 0.6, 10 * s, 4 * s, 2 * s); g.fill(); g.stroke();
      break;
    case 'mecha':
      g.fillStyle = '#3a4148';
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 1.02, Math.PI, 0); g.fill(); g.stroke();
      g.fillStyle = pal.accent;
      g.beginPath(); g.moveTo(-headR, hy - 4 * s); g.lineTo(-headR - 6 * s, hy - 16 * s); g.lineTo(-headR + 2 * s, hy - 10 * s); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(headR, hy - 4 * s); g.lineTo(headR + 6 * s, hy - 16 * s); g.lineTo(headR - 2 * s, hy - 10 * s); g.closePath(); g.fill(); g.stroke();
      break;
    case 'batmask':
      g.fillStyle = '#2c3038';
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 1.0, Math.PI, 0); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-9 * s, hy - headR * 0.8); g.lineTo(-11 * s, hy - headR * 1.5); g.lineTo(-4 * s, hy - headR * 0.95); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(9 * s, hy - headR * 0.8); g.lineTo(11 * s, hy - headR * 1.5); g.lineTo(4 * s, hy - headR * 0.95); g.closePath(); g.fill(); g.stroke();
      break;
    case 'panda':
      g.fillStyle = '#3a3a3a';
      g.beginPath(); g.arc(-10 * s, hy - headR * 0.85, 6 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.arc(10 * s, hy - headR * 0.85, 6 * s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(-5.5 * s, hy, 4.5 * s, 5.5 * s, -0.3, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(5.5 * s, hy, 4.5 * s, 5.5 * s, 0.3, 0, Math.PI * 2); g.fill();
      break;
    case 'ice':
      g.fillStyle = pal.hair;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 7 * s - 4 * s, hy - headR * 0.55);
        g.lineTo(i * 7 * s, hy - headR * 1.35 - Math.abs(2 - i) * -2 * s);
        g.lineTo(i * 7 * s + 4 * s, hy - headR * 0.55);
        g.closePath(); g.fill(); g.stroke();
      }
      break;
    case 'wukong':
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 2 * s, headR * 0.96, Math.PI, 0); g.fill(); g.stroke();
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(i * 6 * s - 3 * s, hy - headR * 0.85);
        g.lineTo(i * 8 * s, hy - headR * 1.5);
        g.lineTo(i * 6 * s + 3 * s, hy - headR * 0.85);
        g.closePath(); g.fill(); g.stroke();
      }
      g.fillStyle = pal.accent;
      rr(g, -headR * 0.9, hy - headR * 0.62, headR * 1.8, 5 * s, 2.5 * s); g.fill(); g.stroke();
      break;
    case 'chef':
      g.fillStyle = '#f2f2ee';
      rr(g, -headR * 0.8, hy - headR * 1.55, headR * 1.6, headR * 0.9, 6 * s); g.fill(); g.stroke();
      rr(g, -headR * 0.7, hy - headR * 0.72, headR * 1.4, 5 * s, 2 * s); g.fill(); g.stroke();
      break;
    case 'none':
    default:
      g.fillStyle = pal.hair;
      g.beginPath(); g.arc(0, hy - 1 * s, headR * 0.96, Math.PI * 0.9, Math.PI * 2.1); g.fill(); g.stroke();
      break;
  }
}

/** 头像（HUD/卡片用） */
export function drawPortraitLook(look: Look, size = 96): string {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d')!;
  const s = size / 44;
  g.save();
  g.translate(size / 2, size * 0.62);
  g.beginPath(); g.arc(0, -size * 0.12, size * 0.46, 0, Math.PI * 2); g.clip();
  drawUnit(g, 0, size * 0.34, s * 1.35, look, {});
  g.restore();
  return c.toDataURL();
}
