import type { HudSnapshot } from '../game/engine';
import { heroPortrait } from '../meta/portraits';

interface Props {
  hud: HudSnapshot | null;
  onClose: () => void;
}

const JOB_COLOR: Record<string, string> = { 坦克: '#e5484d', 战士: '#e8912d', 远程: '#4a8cd8', 辅助: '#9a5ae0' };

/** 战斗中幸存者面板：实时血量 */
export default function HeroPanel({ hud, onClose }: Props) {
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(5,8,14,0.72)' }} onClick={onClose}>
      <div
        className="w-[92%] max-w-md overflow-hidden rounded-2xl"
        style={{ background: '#2c3e52', border: '3px solid #1a2735', boxShadow: '0 8px 0 rgba(0,0,0,0.45)', animation: 'popIn 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative py-3 text-center" style={{ background: '#22303f', borderBottom: '2px solid #1a2735' }}>
          <span className="text-xl font-black text-white" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>幸存者列表</span>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#8a9aac' }}>
            存活：{hud?.heroes.filter(h => h.alive).length ?? 0}/{hud?.heroes.length ?? 0}
          </span>
          <button onClick={onClose} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-0.5 text-sm font-black text-white" style={{ background: 'rgba(15,22,30,0.7)', border: '1.5px solid #1a2735' }}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          {(hud?.heroes ?? []).map(h => {
            const hpRatio = h.maxHp > 0 ? h.hp / h.maxHp : 0;
            return (
              <div
                key={h.id}
                className="relative overflow-hidden rounded-xl p-2.5"
                style={{
                  background: h.alive ? 'linear-gradient(180deg,#4a6a9c,#33507a)' : 'linear-gradient(180deg,#5c3a42,#402c33)',
                  border: '2.5px solid #1a2735',
                  boxShadow: '0 3px 0 rgba(0,0,0,0.35)',
                  filter: h.alive ? 'none' : 'grayscale(0.7)',
                }}
              >
                <span
                  className="absolute left-0 top-2 rounded-r-md px-1.5 py-0.5 text-[10px] font-black text-white"
                  style={{ background: JOB_COLOR[h.job] ?? '#666', border: '1.5px solid rgba(0,0,0,0.35)', borderLeft: 'none' }}
                >
                  {h.job}
                </span>
                <div className="mx-auto mt-3 h-20 w-20 overflow-hidden rounded-full" style={{ background: 'rgba(15,22,30,0.45)', border: '2px solid rgba(255,255,255,0.18)' }}>
                  <img src={heroPortrait(h.id)} alt={h.name} className="h-full w-full" draggable={false} />
                </div>
                <div className="mt-1.5 text-center text-sm font-black text-white" style={{ textShadow: '0 1px 0 rgba(0,0,0,0.5)' }}>{h.name}</div>
                <div className="mx-auto mt-1 h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(10,14,20,0.7)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${hpRatio * 100}%`, background: hpRatio > 0.5 ? '#5be08a' : hpRatio > 0.25 ? '#ffd94d' : '#ff6b6b' }}
                  />
                </div>
                <div className="mt-0.5 text-center text-[10px] font-bold" style={{ color: '#c8d6e4' }}>
                  {h.alive ? `${h.hp}/${h.maxHp}` : '已倒下'}
                </div>
                {!h.alive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rotate-[-12deg] rounded-md px-3 py-1 text-lg font-black" style={{ color: '#ff9b9b', border: '2px solid #ff6b6b', background: 'rgba(20,10,10,0.5)' }}>倒下</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="px-4 pb-4 text-center text-xs font-bold" style={{ color: '#8a9aac' }}>
          提示：战斗中无法手动放技能，走位拉扯保护后排
        </div>
      </div>
    </div>
  );
}
