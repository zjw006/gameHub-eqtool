import type { SkillDef } from '../game/types'
import { RARITY_COLOR, DTYPE_NAME } from '../game/data'

interface Props {
  offers: SkillDef[]
  refreshLeft: number
  onPick: (s: SkillDef) => void
  onReroll: () => void
  wave: number
}

export default function SkillModal({ offers, refreshLeft, onPick, onReroll, wave }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] px-4">
      <div className="mb-4 text-center">
        <div className="inline-block px-8 py-2 bg-gradient-to-r from-amber-500/0 via-amber-400 to-amber-500/0">
          <span className="text-2xl font-black text-yellow-900 tracking-widest drop-shadow">技能选择</span>
        </div>
        <div className="text-white/70 text-sm mt-1">第 {wave} 波已清除 · 三选一强化</div>
      </div>
      <div className="flex gap-3 w-full max-w-md justify-center">
        {offers.map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s)}
            className="flex-1 max-w-36 rounded-xl border-2 bg-gradient-to-b from-slate-100 to-slate-300 p-3 text-left shadow-xl active:scale-95 transition-transform"
            style={{ borderColor: RARITY_COLOR[s.rarity] }}
          >
            <div className="text-3xl mb-1 text-center">{s.icon}</div>
            <div className="font-bold text-slate-800 text-sm text-center leading-tight">{s.name}</div>
            <div className="mt-1 text-center">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: RARITY_COLOR[s.rarity] }}
              >
                {s.dtypeTag === 'global' ? '全局' : DTYPE_NAME[s.dtypeTag]}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-600 leading-snug text-center min-h-10">{s.desc}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onReroll}
        disabled={refreshLeft <= 0}
        className="mt-5 px-6 py-2 rounded-lg bg-sky-500 text-white font-bold text-sm shadow-lg disabled:opacity-40 active:scale-95 transition-transform"
      >
        🎬 刷新（剩余 {refreshLeft} 次）
      </button>
      <div className="mt-2 text-white/50 text-xs">提示：战斗中点击己方槽位可换位调整站位</div>
    </div>
  )
}
