// Canvas 渲染器：全部原创矢量绘制
import type { Game } from './engine'
import { soldierById } from './data'
import { VIEW_W, VIEW_H, WALL_Y, FIELD_TOP, WALL_MAX_HP } from './data'
import type { EnemyUnit, Pad } from './types'

const DTYPE_HELMET: Record<string, string> = {
  ballistic: '#5c7a4a',
  explosive: '#a0783c',
  energy: '#5a5aa8',
}

export function render(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H)
  drawField(ctx, g.time)
  drawWall(ctx, g)
  drawAimLines(g, ctx)
  for (const pad of g.pads) drawPad(ctx, pad, g)
  // 敌人按 y 排序画，近大远小错觉
  const sorted = [...g.enemies].sort((a, b) => a.y - b.y)
  for (const e of sorted) drawEnemy(ctx, e, g.time)
  for (const p of g.projectiles) drawProjectile(ctx, p)
  drawFx(g, ctx)
}

// ---------- 场景 ----------
function drawField(ctx: CanvasRenderingContext2D, time: number) {
  // 草地
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H)
  grad.addColorStop(0, '#4a7a3a')
  grad.addColorStop(0.55, '#527f3e')
  grad.addColorStop(1, '#3d5c34')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  // 草地斑块
  ctx.fillStyle = 'rgba(0,0,0,0.06)'
  const patches = [
    [60, 120, 70, 40], [380, 90, 90, 46], [180, 300, 80, 44], [430, 380, 76, 40],
    [70, 480, 90, 42], [300, 540, 84, 40], [470, 200, 60, 36], [250, 160, 60, 34],
  ]
  for (const [x, y, w, h] of patches) {
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill()
  }
  // 土路（两条，向城墙汇合）
  ctx.fillStyle = '#b89a5e'
  ctx.beginPath()
  ctx.moveTo(140, 0); ctx.quadraticCurveTo(170, 300, 230, WALL_Y)
  ctx.lineTo(310, WALL_Y); ctx.quadraticCurveTo(250, 300, 230, 0)
  ctx.closePath(); ctx.fill()
  ctx.beginPath()
  ctx.moveTo(360, 0); ctx.quadraticCurveTo(390, 320, 340, WALL_Y)
  ctx.lineTo(430, WALL_Y); ctx.quadraticCurveTo(470, 320, 450, 0)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.08)'
  ctx.beginPath()
  ctx.moveTo(140, 0); ctx.quadraticCurveTo(170, 300, 230, WALL_Y)
  ctx.lineTo(246, WALL_Y); ctx.quadraticCurveTo(190, 300, 158, 0)
  ctx.closePath(); ctx.fill()

  // 石头点缀
  ctx.fillStyle = 'rgba(90,90,90,0.5)'
  const rocks = [[36, 220], [500, 300], [40, 560], [508, 520], [120, 620], [420, 600]]
  for (const [x, y] of rocks) {
    ctx.beginPath(); ctx.ellipse(x, y, 12, 8, 0.4, 0, Math.PI * 2); ctx.fill()
  }
  // 顶部出场区域暗角
  const top = ctx.createLinearGradient(0, 0, 0, FIELD_TOP + 60)
  top.addColorStop(0, 'rgba(0,0,0,0.35)')
  top.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, VIEW_W, FIELD_TOP + 60)
  void time
}

function drawWall(ctx: CanvasRenderingContext2D, g: Game) {
  // 城墙带
  const wgrad = ctx.createLinearGradient(0, WALL_Y, 0, WALL_Y + 46)
  wgrad.addColorStop(0, '#9aa4ae')
  wgrad.addColorStop(0.5, '#78828c')
  wgrad.addColorStop(1, '#5c656e')
  ctx.fillStyle = wgrad
  ctx.fillRect(0, WALL_Y, VIEW_W, 46)
  // 铆钉与板缝
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 2
  for (let x = 0; x <= VIEW_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, WALL_Y + 4); ctx.lineTo(x, WALL_Y + 42); ctx.stroke()
    ctx.fillStyle = '#454d55'
    ctx.beginPath(); ctx.arc(x + 30, WALL_Y + 12, 3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(x + 30, WALL_Y + 34, 3, 0, Math.PI * 2); ctx.fill()
  }
  // 墙顶亮边
  ctx.fillStyle = '#c3ccd4'
  ctx.fillRect(0, WALL_Y, VIEW_W, 5)
  // 地面（城墙下）
  const gnd = ctx.createLinearGradient(0, WALL_Y + 46, 0, VIEW_H)
  gnd.addColorStop(0, '#6d7580')
  gnd.addColorStop(1, '#565d66')
  ctx.fillStyle = gnd
  ctx.fillRect(0, WALL_Y + 46, VIEW_W, VIEW_H - WALL_Y - 46)
  // 停机坪标线
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.setLineDash([10, 8])
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(0, 700); ctx.lineTo(VIEW_W, 700); ctx.stroke()
  ctx.setLineDash([])
  // 城墙血条
  const pct = Math.max(0, g.wallHp / WALL_MAX_HP)
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  roundRect(ctx, 60, WALL_Y - 16, VIEW_W - 120, 12, 6); ctx.fill()
  const hpGrad = ctx.createLinearGradient(60, 0, VIEW_W - 60, 0)
  hpGrad.addColorStop(0, pct > 0.3 ? '#5be35b' : '#ff5b5b')
  hpGrad.addColorStop(1, pct > 0.3 ? '#2fbf4a' : '#d33')
  ctx.fillStyle = hpGrad
  if (pct > 0.01) { roundRect(ctx, 62, WALL_Y - 14, (VIEW_W - 124) * pct, 8, 4); ctx.fill() }
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.ceil(g.wallHp)} / ${WALL_MAX_HP}`, VIEW_W / 2, WALL_Y - 20)
}

// ---------- 槽位与士兵 ----------
function drawPad(ctx: CanvasRenderingContext2D, pad: Pad, g: Game) {
  const { x, y } = pad
  // 金属底座
  ctx.fillStyle = pad.locked ? '#3a3f45' : '#4a525b'
  roundRect(ctx, x - 46, y - 34, 92, 72, 10); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  roundRect(ctx, x - 46, y - 34, 92, 72, 10); ctx.stroke()
  ctx.fillStyle = pad.locked ? '#31363c' : '#5a636e'
  ctx.beginPath(); ctx.ellipse(x, y - 2, 30, 20, 0, 0, Math.PI * 2); ctx.fill()

  if (pad.locked) {
    // 锁
    ctx.strokeStyle = '#22262b'
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(x, y - 4, 9, Math.PI, 0); ctx.stroke()
    ctx.fillStyle = '#22262b'
    roundRect(ctx, x - 12, y - 4, 24, 18, 4); ctx.fill()
    ctx.fillStyle = '#5a636e'
    ctx.beginPath(); ctx.arc(x, y + 4, 3, 0, Math.PI * 2); ctx.fill()
    return
  }
  if (!pad.unit) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('空槽位', x, y + 2)
    return
  }
  const def = soldierById(pad.unit.soldierId)
  const n = pad.unit.count
  const offsets = n === 1 ? [[0, 0]] : n === 2 ? [[-13, 0], [13, 0]] : [[-16, 2], [16, 2], [0, -6]]
  const shown = Math.min(n, 3)
  for (let i = shown - 1; i >= 0; i--) {
    drawSoldier(ctx, x + offsets[i][0], y - 6 + offsets[i][1], def.id, g.time + i)
  }
  // 数量牌
  ctx.fillStyle = '#20242a'
  roundRect(ctx, x - 14, y + 20, 28, 16, 4); ctx.fill()
  ctx.fillStyle = '#ffd94a'
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(String(n), x, y + 32)
}

export function drawSoldier(ctx: CanvasRenderingContext2D, x: number, y: number, soldierId: string, t: number) {
  const def = soldierById(soldierId)
  const helmet = DTYPE_HELMET[def.dtype]
  const bob = Math.sin(t * 3) * 1.2
  ctx.save()
  ctx.translate(x, y + bob)
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath(); ctx.ellipse(0, 14 - bob, 14, 5, 0, 0, Math.PI * 2); ctx.fill()
  // 身体
  ctx.fillStyle = '#4e5e52'
  roundRect(ctx, -9, -2, 18, 16, 6); ctx.fill()
  // 武器
  drawWeapon(ctx, soldierId)
  // 头盔
  ctx.fillStyle = helmet
  ctx.beginPath(); ctx.arc(0, -8, 12, Math.PI, 0); ctx.fill()
  roundRect(ctx, -12, -9, 24, 5, 2); ctx.fill()
  if (soldierId === 'sniper') { ctx.fillStyle = '#3c2f22'; ctx.fillRect(-12, -12, 24, 3) }
  if (soldierId === 'mecha') { ctx.fillStyle = '#8f8fd0'; roundRect(ctx, -13, -14, 26, 8, 4); ctx.fill() }
  // 脸
  ctx.fillStyle = '#f2c9a0'
  roundRect(ctx, -8, -6, 16, 9, 4); ctx.fill()
  // 眼睛
  ctx.fillStyle = '#222'
  ctx.beginPath(); ctx.arc(-3.5, -2, 1.6, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(3.5, -2, 1.6, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawWeapon(ctx: CanvasRenderingContext2D, id: string) {
  ctx.fillStyle = '#2c2f33'
  switch (id) {
    case 'gunner':
      roundRect(ctx, 6, 0, 22, 6, 2); ctx.fill()
      ctx.fillStyle = '#565c63'; ctx.fillRect(24, 1, 5, 4)
      break
    case 'sniper':
      roundRect(ctx, 4, -2, 30, 4, 2); ctx.fill()
      ctx.fillStyle = '#565c63'; ctx.beginPath(); ctx.arc(10, -4, 2.5, 0, Math.PI * 2); ctx.fill()
      break
    case 'rocket':
      roundRect(ctx, -2, -16, 10, 26, 4); ctx.fill()
      ctx.fillStyle = '#7a5b30'; ctx.beginPath(); ctx.arc(3, -16, 6, 0, Math.PI * 2); ctx.fill()
      break
    case 'grenadier':
      roundRect(ctx, -4, -18, 12, 18, 5); ctx.fill()
      ctx.fillStyle = '#565c63'; ctx.beginPath(); ctx.arc(2, -18, 7, 0, Math.PI * 2); ctx.fill()
      break
    case 'tanker':
      roundRect(ctx, 4, 0, 18, 9, 3); ctx.fill()
      ctx.fillStyle = '#565c63'; ctx.fillRect(20, 2, 7, 5)
      break
    case 'mortar':
      ctx.save(); ctx.rotate(-0.5)
      roundRect(ctx, 4, -14, 9, 22, 4); ctx.fill()
      ctx.restore()
      break
    case 'tesla':
      roundRect(ctx, 6, -4, 16, 8, 3); ctx.fill()
      ctx.fillStyle = '#9fd8ff'
      ctx.beginPath(); ctx.arc(24, 0, 4, 0, Math.PI * 2); ctx.fill()
      break
    case 'mecha':
      roundRect(ctx, 8, -2, 14, 12, 4); ctx.fill()
      ctx.fillStyle = '#b9a7ff'; ctx.fillRect(18, 0, 6, 8)
      break
    default: // assault
      roundRect(ctx, 6, 0, 20, 5, 2); ctx.fill()
      ctx.fillStyle = '#6b4f35'; ctx.fillRect(6, 3, 6, 5)
  }
}

// ---------- 敌人 ----------
function drawEnemy(ctx: CanvasRenderingContext2D, e: EnemyUnit, t: number) {
  const { x, y, def } = e
  const wob = Math.sin(e.wobble) * 2
  ctx.save()
  ctx.translate(x, y)
  if (def.air) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.beginPath(); ctx.ellipse(0, 26, def.radius * 0.8, 4, 0, 0, Math.PI * 2); ctx.fill()
    ctx.translate(0, -14 + Math.sin(t * 4 + e.uid) * 3)
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath(); ctx.ellipse(0, def.radius * 0.9, def.radius * 0.9, 5, 0, 0, Math.PI * 2); ctx.fill()
  }
  const stunned = t < e.stunUntil
  const slowed = t < e.slowUntil

  switch (def.id) {
    case 'bot': case 'elitebot': {
      const s = def.id === 'elitebot' ? 1.5 : 1
      ctx.scale(s, s)
      ctx.fillStyle = def.id === 'elitebot' ? '#5a6f8f' : '#7d8aa0'
      roundRect(ctx, -11, -10 + wob * 0.3, 22, 18, 6); ctx.fill()
      ctx.fillStyle = '#39424f'
      roundRect(ctx, -13, -14 + wob * 0.3, 26, 8, 4); ctx.fill()
      ctx.fillStyle = '#ff5b5b'
      ctx.beginPath(); ctx.arc(-4, -2 + wob * 0.3, 2.4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(4, -2 + wob * 0.3, 2.4, 0, Math.PI * 2); ctx.fill()
      // 细腿
      ctx.strokeStyle = '#39424f'; ctx.lineWidth = 2.5
      for (const dx of [-9, 9]) {
        ctx.beginPath(); ctx.moveTo(dx, 6); ctx.lineTo(dx * 1.4, 13); ctx.stroke()
      }
      break
    }
    case 'drone': {
      ctx.fillStyle = '#8fa0b8'
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#39424f'
      ctx.beginPath(); ctx.ellipse(0, -2, 8, 4, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#c3ccd4'; ctx.lineWidth = 2
      const spin = (t * 20 + e.uid) % (Math.PI * 2)
      for (const dx of [-12, 12]) {
        ctx.beginPath(); ctx.moveTo(dx - Math.cos(spin) * 7, -6); ctx.lineTo(dx + Math.cos(spin) * 7, -6); ctx.stroke()
      }
      ctx.fillStyle = '#ff5b5b'
      ctx.beginPath(); ctx.arc(0, 2, 2, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'tanklet': case 'boss': {
      const s = def.id === 'boss' ? 2.2 : 1
      ctx.scale(s, s)
      ctx.fillStyle = def.id === 'boss' ? '#4a5262' : '#6b7382'
      roundRect(ctx, -16, -8, 32, 16, 5); ctx.fill()
      ctx.fillStyle = '#3a414d'
      roundRect(ctx, -18, 4, 36, 7, 3); ctx.fill()
      ctx.fillStyle = def.id === 'boss' ? '#5d6778' : '#7d8695'
      roundRect(ctx, -9, -14, 18, 10, 4); ctx.fill()
      ctx.fillStyle = '#2c313a'
      ctx.fillRect(6, -11, 16, 4)
      ctx.fillStyle = '#ffb04a'
      ctx.beginPath(); ctx.arc(-4, -9, 1.8, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(2, -9, 1.8, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'shielder': {
      ctx.fillStyle = '#8a7f6a'
      roundRect(ctx, -9, -8 + wob * 0.3, 18, 15, 5); ctx.fill()
      ctx.fillStyle = '#5d6a78'
      roundRect(ctx, -14, -12 + wob * 0.3, 28, 20, 6); ctx.fill()
      ctx.fillStyle = '#7d8aa0'
      roundRect(ctx, -11, -9 + wob * 0.3, 22, 14, 5); ctx.fill()
      ctx.fillStyle = '#ffdf6b'
      ctx.beginPath(); ctx.arc(0, -2 + wob * 0.3, 2.5, 0, Math.PI * 2); ctx.fill()
      break
    }
    default: { // bio: bug / spitter
      const isSpitter = def.id === 'spitter'
      ctx.fillStyle = isSpitter ? '#9c5cc9' : '#6aa84f'
      ctx.beginPath(); ctx.ellipse(0, wob * 0.4, 13, 10, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = isSpitter ? '#7d45a5' : '#527a3e'
      ctx.beginPath(); ctx.ellipse(0, -6 + wob * 0.4, 9, 6, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = isSpitter ? '#7d45a5' : '#527a3e'; ctx.lineWidth = 2
      for (const dx of [-8, 0, 8]) {
        ctx.beginPath(); ctx.moveTo(dx * 0.7, 6); ctx.lineTo(dx * 1.3, 12); ctx.stroke()
      }
      ctx.fillStyle = '#fff'
      ctx.beginPath(); ctx.arc(-3.5, -7 + wob * 0.4, 2.6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(3.5, -7 + wob * 0.4, 2.6, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#222'
      ctx.beginPath(); ctx.arc(-3.5, -7 + wob * 0.4, 1.2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(3.5, -7 + wob * 0.4, 1.2, 0, Math.PI * 2); ctx.fill()
    }
  }

  // 减速/眩晕表现
  if (slowed) {
    ctx.strokeStyle = 'rgba(120,200,255,0.8)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, def.radius + 4, 0, Math.PI * 2); ctx.stroke()
  }
  if (stunned) {
    ctx.fillStyle = '#ffd94a'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★ ★', 0, -def.radius - 10)
  }
  ctx.restore()

  // 血条（boss 更大）
  const bw = def.id === 'boss' ? 90 : def.radius * 2
  const pct = Math.max(0, e.hp / e.maxHp)
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(x - bw / 2, y - def.radius - (def.air ? 22 : 10), bw, 4)
  ctx.fillStyle = pct > 0.4 ? '#e14b4b' : '#ff8a3c'
  ctx.fillRect(x - bw / 2, y - def.radius - (def.air ? 22 : 10), bw * pct, 4)
  // 护盾条
  if (e.shield > 0) {
    ctx.fillStyle = '#6db6ff'
    ctx.fillRect(x - bw / 2, y - def.radius - (def.air ? 28 : 16), bw * Math.min(1, e.shield / (e.maxHp * 0.35)), 3)
  }
}

// ---------- 弹道与特效 ----------
function drawProjectile(ctx: CanvasRenderingContext2D, p: { x: number; y: number; tx: number; ty: number; kind: string }) {
  const ang = Math.atan2(p.ty - p.y, p.tx - p.x)
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(ang)
  if (p.kind === 'bullet') {
    ctx.fillStyle = '#ffe08a'
    roundRect(ctx, -6, -1.6, 12, 3.2, 1.6); ctx.fill()
  } else if (p.kind === 'rocket') {
    ctx.fillStyle = '#c98145'
    roundRect(ctx, -7, -3, 14, 6, 3); ctx.fill()
    ctx.fillStyle = '#ff8a3c'
    ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-13, -3); ctx.lineTo(-13, 3); ctx.closePath(); ctx.fill()
  } else {
    ctx.fillStyle = '#3a3f45'
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffd94a'
    ctx.beginPath(); ctx.arc(-2, -2, 1.6, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function drawAimLines(g: Game, ctx: CanvasRenderingContext2D) {
  for (const a of g.aimLines) {
    ctx.strokeStyle = `rgba(255,70,70,${a.t * 3})`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke()
  }
}

function drawFx(g: Game, ctx: CanvasRenderingContext2D) {
  for (const c of g.fxCircles) {
    ctx.strokeStyle = `rgba(${c.color},${Math.max(0, c.t * 2.5)})`
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke()
  }
  for (const b of g.fxBeams) {
    ctx.strokeStyle = `rgba(${b.color},${Math.max(0, b.t * 5)})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(b.pts[0].x, b.pts[0].y)
    for (let i = 1; i < b.pts.length; i++) {
      const prev = b.pts[i - 1], cur = b.pts[i]
      const mx = (prev.x + cur.x) / 2 + (Math.random() - 0.5) * 24
      const my = (prev.y + cur.y) / 2 + (Math.random() - 0.5) * 24
      ctx.quadraticCurveTo(mx, my, cur.x, cur.y)
    }
    ctx.stroke()
  }
  for (const f of g.fxTexts) {
    ctx.font = `bold ${f.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.strokeStyle = `rgba(0,0,0,${Math.min(1, f.t * 2)})`
    ctx.lineWidth = 3
    ctx.strokeText(f.text, f.x, f.y)
    ctx.fillStyle = f.color
    ctx.globalAlpha = Math.min(1, f.t * 2)
    ctx.fillText(f.text, f.x, f.y)
    ctx.globalAlpha = 1
  }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
