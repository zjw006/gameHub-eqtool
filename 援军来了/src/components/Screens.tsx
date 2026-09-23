import { useState } from 'react'
import { SOLDIERS, DTYPE_NAME, COUNTERS, CAT_NAME } from '../game/data'
import type { RunStats } from '../game/types'

// ---------- 主菜单 ----------
interface MenuProps {
  coins: number
  trainLevel: number
  trainCost: number
  bestWave: number
  onStart: () => void
  onTrain: () => void
}

export function MenuScreen({ coins, trainLevel, trainCost, bestWave, onStart, onTrain }: MenuProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [showBarracks, setShowBarracks] = useState(false)
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-[#2e4a2a] via-[#3d5c34] to-[#233a20] text-white px-6">
      <div className="text-5xl mb-1">🪖</div>
      <h1 className="text-4xl font-black tracking-widest" style={{ textShadow: '0 3px 0 #1a2b16, 0 0 20px rgba(255,225,74,0.3)' }}>
        援军突围
      </h1>
      <p className="mt-1 text-white/60 text-sm tracking-wider">肉鸽塔防 · 守住城墙，撑过 12 波</p>

      <div className="mt-6 w-full max-w-xs rounded-xl bg-black/30 p-4 text-sm">
        <div className="flex justify-between py-1">
          <span className="text-white/70">🪙 军需币</span><span className="font-bold text-amber-300">{coins}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-white/70">🏅 最佳战绩</span><span className="font-bold">{bestWave > 0 ? `第 ${bestWave} 波` : '—'}</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-white/70">💪 全队特训 Lv.{trainLevel}</span>
          <button
            onClick={onTrain}
            disabled={coins < trainCost}
            className="px-3 py-1 rounded-lg bg-amber-500 text-yellow-950 font-bold text-xs disabled:opacity-40 active:scale-95"
          >
            升级（{trainCost}币）
          </button>
        </div>
        <div className="text-white/40 text-[11px] mt-1">特训：全队伤害 +8%/级，永久生效（保存在本机浏览器）</div>
      </div>

      <button
        onClick={onStart}
        className="mt-6 w-full max-w-xs py-4 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-yellow-950 text-xl font-black tracking-widest shadow-[0_6px_0_#92600e] active:translate-y-1 active:shadow-none"
      >
        开始战斗
      </button>
      <div className="mt-3 flex gap-3 w-full max-w-xs">
        <button onClick={() => setShowBarracks(true)} className="flex-1 py-2 rounded-xl bg-white/10 text-sm active:scale-95">兵种图鉴</button>
        <button onClick={() => setShowHelp(true)} className="flex-1 py-2 rounded-xl bg-white/10 text-sm active:scale-95">玩法说明</button>
      </div>

      {showHelp && (
        <Overlay onClose={() => setShowHelp(false)}>
          <h2 className="font-black text-lg mb-2">玩法说明</h2>
          <ul className="text-sm text-white/80 space-y-2 leading-relaxed">
            <li>🎯 敌人从上方进攻，抵达城墙会持续削减耐久，耐久归零即失败。</li>
            <li>🃏 每清完一波，从 3 张技能卡中选 1 张：增援新兵、全队增益或派系强化，一局中无限叠加。</li>
            <li>⚔️ 三大伤害系互相克制：<b className="text-emerald-300">弹道克机械</b>、<b className="text-orange-300">爆炸克装甲</b>、<b className="text-violet-300">能量克生化</b>，克制 +30%，被克 -30%。</li>
            <li>🪖 同名兵种会自动叠放在同一槽位（最多5个），点击两个槽位可以互换位置。</li>
            <li>🚁 飞行单位只有狙击手、火箭兵、电磁炮能打到。</li>
          </ul>
        </Overlay>
      )}
      {showBarracks && (
        <Overlay onClose={() => setShowBarracks(false)}>
          <h2 className="font-black text-lg mb-2">兵种图鉴</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {SOLDIERS.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                <div className="text-xl">{s.dtype === 'ballistic' ? '🔫' : s.dtype === 'explosive' ? '💥' : '⚡'}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold">
                    {s.name}
                    <span className="ml-2 text-[10px] text-white/50">{DTYPE_NAME[s.dtype]}系 · 克{CAT_NAME[COUNTERS[s.dtype]]}</span>
                  </div>
                  <div className="text-[11px] text-white/60">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Overlay>
      )}
    </div>
  )
}

// ---------- 结算 ----------
interface EndProps {
  victory: boolean
  stats: RunStats
  coinsEarned: number
  onRetry: () => void
  onMenu: () => void
}

export function EndScreen({ victory, stats, coinsEarned, onRetry, onMenu }: EndProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-6 text-white">
      <div className="text-6xl mb-2">{victory ? '🏆' : '💥'}</div>
      <h2 className={`text-3xl font-black tracking-widest ${victory ? 'text-amber-300' : 'text-red-400'}`}>
        {victory ? '防线守住了！' : '城墙被攻破'}
      </h2>
      <div className="mt-5 w-full max-w-xs rounded-xl bg-white/10 p-4 text-sm space-y-2">
        <Row k="坚守波次" v={`${stats.wavesCleared} / 12`} />
        <Row k="击杀敌人" v={String(stats.kills)} />
        <Row k="总伤害" v={String(Math.round(stats.dmgDealt))} />
        <Row k="获得军需币" v={`+${coinsEarned}`} gold />
      </div>
      <div className="mt-3 w-full max-w-xs">
        <div className="text-xs text-white/50 mb-1">本局技能构筑：</div>
        <div className="flex flex-wrap gap-1">
          {stats.skillsTaken.map((s, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10">{s}</span>
          ))}
        </div>
      </div>
      <button
        onClick={onRetry}
        className="mt-6 w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 text-yellow-950 text-lg font-black tracking-widest shadow-[0_5px_0_#92600e] active:translate-y-1 active:shadow-none"
      >
        再来一局
      </button>
      <button onClick={onMenu} className="mt-3 text-white/60 text-sm underline underline-offset-4">返回主菜单</button>
    </div>
  )
}

function Row({ k, v, gold }: { k: string; v: string; gold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{k}</span>
      <span className={`font-bold ${gold ? 'text-amber-300' : ''}`}>{v}</span>
    </div>
  )
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-6" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[#2b3527] p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-white/10 text-sm active:scale-95">关闭</button>
      </div>
    </div>
  )
}
