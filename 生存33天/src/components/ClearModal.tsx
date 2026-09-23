// 第 33 天通关结算画面
import type { MetaState } from '../meta/store';

interface Props {
  meta: MetaState;
  onContinue: () => void; // 继续坚守（无尽模式）
  onRestart: () => void; // 重新挑战（保留养成，回到第 1 天）
}

export default function ClearModal({ meta, onContinue, onRestart }: Props) {
  const heroCount = Object.keys(meta.roster).length;
  const buildingLv = Object.values(meta.buildings).reduce((a, b) => a + b, 0);
  const stats: { label: string; value: string; color: string }[] = [
    { label: '存活天数', value: '33 天', color: '#ffd94d' },
    { label: '总战力', value: String(meta.power), color: '#ffb347' },
    { label: '累计击杀', value: String(meta.stats.totalKills), color: '#ff9b9b' },
    { label: '带回物资', value: String(meta.stats.totalCans), color: '#9beeff' },
    { label: '招募幸存者', value: `${heroCount} 名`, color: '#5be08a' },
    { label: '建筑总等级', value: `Lv.${buildingLv}`, color: '#b8c6d4' },
  ];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(6,10,16,0.82)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-5 text-center"
        style={{
          background: '#2c3e52', border: '3px solid #1a2735',
          boxShadow: '0 8px 0 rgba(0,0,0,0.45)', animation: 'popIn .35s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <div
          className="mx-auto -mt-10 mb-3 w-fit rounded-xl px-6 py-2 text-xl font-black"
          style={{
            background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810',
            color: '#5c2e00', textShadow: '0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          33 天生存达成！
        </div>
        <p className="mb-1 text-sm font-black" style={{ color: '#ffd94d' }}>直升机迎着朝阳起飞，你们活下来了</p>
        <p className="mb-4 text-xs font-bold" style={{ color: '#8a9aac' }}>—— 「生存33天」挑战完成 ——</p>
        <div className="mb-4 grid grid-cols-2 gap-2 text-left">
          {stats.map(s => (
            <div key={s.label} className="rounded-lg p-2.5" style={{ background: 'rgba(15,22,30,0.6)' }}>
              <div className="text-xs" style={{ color: '#8a9aac' }}>{s.label}</div>
              <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onContinue}
            className="flex-1 rounded-xl py-3 text-base font-black"
            style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', color: '#5c2e00', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          >
            继续坚守
          </button>
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl py-3 text-base font-black"
            style={{ background: 'linear-gradient(180deg,#5be08a,#2fa85c)', border: '2px solid #1a6a3c', color: '#08301a', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          >
            重新挑战
          </button>
        </div>
        <p className="mt-2 text-[11px] font-bold" style={{ color: '#8a9aac' }}>继续坚守：天数无限延伸，事件循环加剧 · 重新挑战：保留英雄与建筑回到第 1 天</p>
      </div>
    </div>
  );
}
