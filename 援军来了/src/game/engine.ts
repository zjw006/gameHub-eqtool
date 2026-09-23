// 战斗引擎：纯 TS 模拟，与 React 解耦
import {
  SOLDIERS, WAVES, soldierById, enemyById, dmgMul,
  VIEW_W, WALL_Y, WALL_MAX_HP, PAD_POS, INITIAL_UNLOCKED, reinforceSkill, SKILLS,
} from './data'
import type {
  EnemyUnit, Pad, Projectile, FxText, FxCircle, FxBeam,
  SkillDef, GameEvent, RunStats, DamageType,
} from './types'

interface SpawnJob { id: string; left: number; interval: number; timer: number; delay: number }

let uidSeq = 1

export class Game {
  // 状态
  wave = 0
  time = 0
  wallHp = WALL_MAX_HP
  wallMax = WALL_MAX_HP
  pads: Pad[] = []
  enemies: EnemyUnit[] = []
  projectiles: Projectile[] = []
  fxTexts: FxText[] = []
  fxCircles: FxCircle[] = []
  fxBeams: FxBeam[] = []
  aimLines: { x1: number; y1: number; x2: number; y2: number; t: number }[] = []
  spawnJobs: SpawnJob[] = []
  waveActive = false
  intermission = false // 波次间隙（选技能）
  over = false
  victory = false
  speed = 1
  paused = false

  // 增益
  globalDmg = 1
  globalRate = 1
  wallDef = 0 // 减伤比例
  bombard = 0
  dtypeDmg: Record<DamageType, number> = { ballistic: 1, explosive: 1, energy: 1 }
  dtypeAoe: Record<DamageType, number> = { ballistic: 1, explosive: 1, energy: 1 }
  pierceBonus: Record<DamageType, number> = { ballistic: 0, explosive: 0, energy: 0 }
  soldierDmg: Record<string, number> = {}
  soldierRate: Record<string, number> = {}
  chainBonus: Record<string, number> = {}

  cooldowns: Map<number, number> = new Map() // padId -> cd
  skillsTaken: string[] = []
  refreshLeft = 1
  currentOffers: SkillDef[] = []
  stats: RunStats = { kills: 0, dmgDealt: 0, skillsTaken: [], wavesCleared: 0 }
  metaBonus = { dmg: 0 } // 局外养成加成（百分比）

  onEvent: (e: GameEvent) => void = () => {}

  constructor() {
    this.pads = PAD_POS.map((p, i) => ({ id: i, x: p.x, y: p.y, locked: i >= INITIAL_UNLOCKED, unit: null }))
    // 初始编队
    this.pads[0].unit = { soldierId: 'gunner', count: 1 }
    this.pads[1].unit = { soldierId: 'assault', count: 1 }
    this.pads[2].unit = { soldierId: 'rocket', count: 1 }
  }

  // ---------- 流程 ----------
  startNextWave() {
    if (this.wave >= WAVES.length) return
    this.wave++
    this.waveActive = true
    this.intermission = false
    const def = WAVES[this.wave - 1]
    this.spawnJobs = def.spawns.map(s => ({ id: s.id, left: s.count, interval: s.interval, timer: 0, delay: s.delay ?? 0 }))
    // 开局轰炸
    if (this.bombard > 0) {
      for (const e of this.enemies) {
        this.damageEnemy(e, this.bombard, 'explosive', e.x, e.y)
      }
    }
  }

  waveCleared(): boolean {
    return this.waveActive && this.spawnJobs.every(j => j.left <= 0) && this.enemies.length === 0
  }

  onWaveClear() {
    this.waveActive = false
    this.stats.wavesCleared = this.wave
    // 波次喘息：自动修复 8% 城墙
    this.wallHp = Math.min(this.wallMax, this.wallHp + this.wallMax * 0.1)
    if (this.wave >= WAVES.length) {
      this.victory = true
      this.over = true
      this.onEvent({ type: 'victory' })
      return
    }
    this.intermission = true
    this.currentOffers = this.rollOffers()
    this.onEvent({ type: 'wave-clear', wave: this.wave })
  }

  rollOffers(): SkillDef[] {
    const pool: SkillDef[] = []
    // 全局技能
    for (const s of SKILLS) {
      if (s.soldierId && !this.hasSoldier(s.soldierId)) continue
      if (s.apply === 'wall_heal_30' && this.wallHp >= this.wallMax) continue
      pool.push(s)
    }
    // 增援卡：已有兵种 + 随机新兵种
    const owned = new Set<string>()
    for (const p of this.pads) if (p.unit) owned.add(p.unit.soldierId)
    const candidates = [...owned]
    const notOwned = SOLDIERS.filter(s => !owned.has(s.id)).map(s => s.id)
    if (notOwned.length) candidates.push(notOwned[Math.floor(Math.random() * notOwned.length)])
    for (const sid of candidates) {
      if (this.freePadOrStackable(sid)) {
        // 增援卡双份权重，保证阵容成长
        pool.push(reinforceSkill(sid), reinforceSkill(sid))
      }
    }
    // 稀有度加权
    const weighted: SkillDef[] = []
    for (const s of pool) {
      const w = s.rarity === 'normal' ? 5 : s.rarity === 'rare' ? 3 : 2
      for (let i = 0; i < w; i++) weighted.push(s)
    }
    const picked: SkillDef[] = []
    while (picked.length < 3 && weighted.length) {
      const i = Math.floor(Math.random() * weighted.length)
      const s = weighted[i]
      if (!picked.find(p => p.id === s.id)) picked.push(s)
      weighted.splice(i, 1)
    }
    return picked
  }

  reroll() {
    if (this.refreshLeft <= 0) return
    this.refreshLeft--
    this.currentOffers = this.rollOffers()
  }

  hasSoldier(id: string) {
    return this.pads.some(p => p.unit?.soldierId === id)
  }

  freePadOrStackable(soldierId: string): boolean {
    return this.pads.some(p => !p.locked && (p.unit === null || (p.unit.soldierId === soldierId && p.unit.count < 5)))
  }

  applySkill(s: SkillDef) {
    this.skillsTaken.push(s.name)
    this.stats.skillsTaken = this.skillsTaken
    const a = s.apply
    if (a === 'global_dmg_20') this.globalDmg *= 1.2
    else if (a === 'global_rate_15') this.globalRate *= 1.15
    else if (a === 'wall_heal_30') this.wallHp = Math.min(this.wallMax, this.wallHp + this.wallMax * 0.3)
    else if (a === 'wall_def_15') this.wallDef = Math.min(0.6, this.wallDef + 0.15)
    else if (a === 'unlock_slot') {
      const locked = this.pads.find(p => p.locked)
      if (locked) locked.locked = false
      else this.globalDmg *= 1.12
    }
    else if (a === 'bombard_250') this.bombard += 250
    else if (a === 'dtype_dmg_ballistic_30') this.dtypeDmg.ballistic *= 1.3
    else if (a === 'dtype_dmg_energy_30') this.dtypeDmg.energy *= 1.3
    else if (a === 'dtype_dmg_explosive_30') this.dtypeDmg.explosive *= 1.3
    else if (a === 'dtype_aoe_explosive_35') this.dtypeAoe.explosive *= 1.35
    else if (a === 'pierce_ballistic_1') this.pierceBonus.ballistic += 1
    else if (a === 'soldier_rate_gunner_50') this.soldierRate['gunner'] = (this.soldierRate['gunner'] ?? 1) * 1.5
    else if (a === 'soldier_dmg_sniper_40') this.soldierDmg['sniper'] = (this.soldierDmg['sniper'] ?? 1) * 1.4
    else if (a === 'soldier_chain_tesla_2') this.chainBonus['tesla'] = (this.chainBonus['tesla'] ?? 0) + 2
    else if (a === 'soldier_rocket_25') {
      this.soldierDmg['rocket'] = (this.soldierDmg['rocket'] ?? 1) * 1.25
      this.dtypeAoe.explosive *= 1.12
    }
    else if (a.startsWith('reinforce_')) {
      const sid = a.replace('reinforce_', '')
      const stack = this.pads.find(p => !p.locked && p.unit?.soldierId === sid && p.unit.count < 5)
      if (stack) stack.unit!.count++
      else {
        const free = this.pads.find(p => !p.locked && !p.unit)
        if (free) free.unit = { soldierId: sid, count: 1 }
      }
    }
    // 选完进入下一波
    this.startNextWave()
  }

  swapPads(a: number, b: number) {
    const pa = this.pads[a], pb = this.pads[b]
    if (pa.locked || pb.locked) return
    const t = pa.unit
    pa.unit = pb.unit
    pb.unit = t
    this.cooldowns.delete(a)
    this.cooldowns.delete(b)
  }

  // ---------- 主循环 ----------
  update(rawDt: number) {
    if (this.paused || this.over || this.intermission) return
    const dt = Math.min(rawDt, 0.05) * this.speed
    this.time += dt

    // 出兵
    if (this.waveActive) {
      for (const j of this.spawnJobs) {
        if (j.left <= 0) continue
        if (j.delay > 0) { j.delay -= dt; continue }
        j.timer -= dt
        if (j.timer <= 0) {
          j.timer = j.interval
          j.left--
          this.spawnEnemy(j.id)
        }
      }
    }

    // 敌人移动 & 打墙
    for (const e of this.enemies) {
      if (e.dead) continue
      e.wobble += dt * 6
      if (this.time < e.stunUntil) continue
      let spd = e.def.speed
      if (this.time < e.slowUntil) spd *= 1 - e.slowPct
      if (e.y < WALL_Y - e.def.radius) {
        e.y += spd * dt
        e.x += Math.sin(e.wobble) * 8 * dt
      } else {
        // 攻击城墙
        const dps = e.def.wallDmg * (1 - this.wallDef)
        this.wallHp -= dps * dt
        if (Math.random() < dt * 2) {
          this.fxCircles.push({ x: e.x, y: WALL_Y, r: 4, maxR: 18, color: '255,120,60', t: 0.3 })
        }
        if (this.wallHp <= 0) {
          this.wallHp = 0
          this.over = true
          this.victory = false
          this.onEvent({ type: 'game-over' })
          return
        }
      }
    }

    // 士兵攻击
    for (const pad of this.pads) {
      if (pad.locked || !pad.unit) continue
      const def = soldierById(pad.unit.soldierId)
      let cd = (this.cooldowns.get(pad.id) ?? 0) - dt
      if (cd <= 0) {
        const target = this.pickTarget(pad, def.range)
        if (target) {
          const rateMul = this.globalRate * (this.soldierRate[def.id] ?? 1)
          cd = def.interval / rateMul
          this.fire(pad, def, target, pad.unit.count)
        } else {
          cd = 0.1
        }
      }
      this.cooldowns.set(pad.id, cd)
    }

    // 弹道
    for (const p of this.projectiles) {
      const dx = p.tx - p.x, dy = p.ty - p.y
      const dist = Math.hypot(dx, dy)
      const step = p.speed * dt
      if (dist <= step) {
        p.x = p.tx; p.y = p.ty
        this.impact(p)
        p.dmg = -1 // 标记移除
      } else {
        p.x += (dx / dist) * step
        p.y += (dy / dist) * step
        // 追踪目标还活着则更新终点
        const t = this.enemies.find(e => e.uid === p.targetUid && !e.dead)
        if (t) { p.tx = t.x; p.ty = t.y }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.dmg >= 0)

    // 特效衰减
    for (const f of this.fxTexts) { f.t -= dt; f.y -= 34 * dt }
    for (const f of this.fxCircles) { f.t -= dt; f.r += (f.maxR - f.r) * dt * 8 }
    for (const f of this.fxBeams) f.t -= dt
    for (const f of this.aimLines) f.t -= dt
    this.fxTexts = this.fxTexts.filter(f => f.t > 0)
    this.fxCircles = this.fxCircles.filter(f => f.t > 0)
    this.fxBeams = this.fxBeams.filter(f => f.t > 0)
    this.aimLines = this.aimLines.filter(f => f.t > 0)

    // 清理尸体
    this.enemies = this.enemies.filter(e => !e.dead)

    if (this.waveCleared()) this.onWaveClear()
  }

  spawnEnemy(id: string) {
    const def = enemyById(id)
    const hpMul = WAVES[this.wave - 1].hpMul
    const x = 50 + Math.random() * (VIEW_W - 100)
    this.enemies.push({
      uid: uidSeq++, def, x, y: -30 - Math.random() * 60,
      hp: def.hp * hpMul, maxHp: def.hp * hpMul,
      shield: def.cat === 'mech' ? def.hp * hpMul * 0.35 : 0,
      slowUntil: 0, slowPct: 0, stunUntil: 0, wobble: Math.random() * 6, dead: false,
    })
  }

  pickTarget(pad: Pad, range: number): EnemyUnit | null {
    const def = soldierById(pad.unit!.soldierId)
    let best: EnemyUnit | null = null
    let bestY = -Infinity
    for (const e of this.enemies) {
      if (e.dead) continue
      if (e.def.air && !def.canAir) continue
      const d = Math.hypot(e.x - pad.x, e.y - pad.y)
      if (d > range) continue
      // 优先打最靠近城墙的
      if (e.y > bestY) { bestY = e.y; best = e }
    }
    return best
  }

  fire(pad: Pad, def: ReturnType<typeof soldierById>, target: EnemyUnit, count: number) {
    const dmgBase = def.dmg * count * this.globalDmg * this.dtypeDmg[def.dtype]
      * (this.soldierDmg[def.id] ?? 1) * (1 + this.metaBonus.dmg)
    this.aimLines.push({ x1: pad.x, y1: pad.y - 14, x2: target.x, y2: target.y, t: 0.12 })
    if (def.id === 'tesla') {
      // 闪电立即命中 + 连锁
      const chain = def.chain + (this.chainBonus[def.id] ?? 0)
      const pts = [{ x: pad.x, y: pad.y - 14 }, { x: target.x, y: target.y }]
      this.damageEnemy(target, dmgBase, def.dtype, target.x, target.y)
      if (def.slow) { target.slowUntil = this.time + def.slowDur; target.slowPct = def.slow }
      let last = target
      const hit = new Set([target.uid])
      for (let i = 0; i < chain; i++) {
        let next: EnemyUnit | null = null; let nd = 130
        for (const e of this.enemies) {
          if (e.dead || hit.has(e.uid)) continue
          if (e.def.air && !def.canAir) continue
          const d = Math.hypot(e.x - last.x, e.y - last.y)
          if (d < nd) { nd = d; next = e }
        }
        if (!next) break
        pts.push({ x: next.x, y: next.y })
        this.damageEnemy(next, dmgBase * 0.7, def.dtype, next.x, next.y)
        if (def.slow) { next.slowUntil = this.time + def.slowDur; next.slowPct = def.slow }
        hit.add(next.uid); last = next
      }
      this.fxBeams.push({ pts, t: 0.18, color: '120,220,255' })
      return
    }
    const kind = def.dtype === 'ballistic' ? 'bullet' : def.id === 'rocket' ? 'rocket' : 'shell'
    this.projectiles.push({
      x: pad.x, y: pad.y - 16, tx: target.x, ty: target.y, targetUid: target.uid,
      speed: def.dtype === 'ballistic' ? 900 : 520,
      dmg: dmgBase, dtype: def.dtype,
      aoe: def.aoe * this.dtypeAoe[def.dtype],
      pierceLeft: def.pierce + this.pierceBonus[def.dtype],
      hitSet: [], kind,
      stun: def.stun, slow: def.slow, slowDur: def.slowDur,
      fromX: pad.x, fromY: pad.y,
    })
  }

  impact(p: Projectile) {
    if (p.aoe > 0) {
      this.fxCircles.push({ x: p.x, y: p.y, r: 8, maxR: p.aoe, color: p.dtype === 'energy' ? '140,120,255' : '255,160,60', t: 0.3 })
      for (const e of this.enemies) {
        if (e.dead) continue
        if (e.def.air && p.kind === 'shell') continue
        const d = Math.hypot(e.x - p.x, e.y - p.y)
        if (d <= p.aoe + e.def.radius) {
          this.damageEnemy(e, p.dmg, p.dtype, e.x, e.y)
          if (p.stun) e.stunUntil = this.time + p.stun
          if (p.slow) { e.slowUntil = this.time + p.slowDur; e.slowPct = p.slow }
        }
      }
      return
    }
    // 单体（含穿透：命中落点最近敌人，再找身后目标）
    let hit = this.enemies.find(e => e.uid === p.targetUid && !e.dead)
    if (!hit) {
      let nd = 30
      for (const e of this.enemies) {
        if (e.dead || p.hitSet.includes(e.uid)) continue
        const d = Math.hypot(e.x - p.x, e.y - p.y)
        if (d < nd) { nd = d; hit = e }
      }
    }
    if (hit) {
      this.applySingle(hit, p, 1)
      // 穿透：沿射击方向找下一个
      let pierceLeft = p.pierceLeft
      let cur: EnemyUnit = hit
      while (pierceLeft > 0) {
        let next: EnemyUnit | null = null; let nd = 90
        for (const e of this.enemies) {
          if (e.dead || e.uid === cur.uid || p.hitSet.includes(e.uid)) continue
          if (e.def.air) continue
          if (e.y <= cur.y) continue // 只往后穿
          const d = Math.hypot(e.x - cur.x, e.y - cur.y)
          if (d < nd) { nd = d; next = e }
        }
        if (!next) break
        this.applySingle(next, p, 0.8)
        cur = next
        pierceLeft--
      }
    }
  }

  applySingle(e: EnemyUnit, p: Projectile, mul: number) {
    p.hitSet.push(e.uid)
    this.damageEnemy(e, p.dmg * mul, p.dtype, e.x, e.y)
    if (p.stun) e.stunUntil = this.time + p.stun
    if (p.slow) { e.slowUntil = this.time + p.slowDur; e.slowPct = p.slow }
  }

  damageEnemy(e: EnemyUnit, raw: number, dt: DamageType, x: number, y: number) {
    if (e.dead) return
    const mul = dmgMul(dt, e.def.cat)
    let dmg = raw * mul
    // 护盾先吸收（能量系对护盾+30%已在克制里体现）
    if (e.shield > 0) {
      const absorbed = Math.min(e.shield, dmg)
      e.shield -= absorbed
      dmg -= absorbed
    }
    e.hp -= dmg
    this.stats.dmgDealt += dmg
    const shown = Math.max(1, Math.round(dmg + Math.min(e.shield, 0)))
    this.fxTexts.push({
      x: x + (Math.random() * 20 - 10), y: y - e.def.radius - 6,
      text: String(shown),
      color: mul > 1 ? '#ffd94a' : mul < 1 ? '#9aa5b1' : '#ffffff',
      t: 0.7, size: mul > 1 ? 20 : 15,
    })
    if (e.hp <= 0) {
      e.dead = true
      this.stats.kills++
      this.fxCircles.push({ x: e.x, y: e.y, r: 6, maxR: e.def.radius * 2.2, color: '255,220,120', t: 0.35 })
    }
  }
}
