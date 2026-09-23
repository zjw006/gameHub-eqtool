// 招募电台：雷达扫描抽卡 + 60 抽神话保底
import { useEffect, useRef, useState } from 'react';
import { HEROES, HERO_MAP, PITY_MAX, QUALITY_COLOR } from '../meta/gamedata';
import { pullOnce, type MetaState, type PullResult } from '../meta/store';
import { heroPortrait } from '../meta/portraits';
import { sfx } from '../game/audio';

interface Props {
  meta: MetaState;
  onChange: (m: MetaState) => void;
  onClose: () => void;
}

function RadarAnim({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const S = 200;
    c.width = S * 2; c.height = S * 2;
    let raf = 0;
    const draw = (t: number) => {
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.clearRect(0, 0, S, S);
      const cx = S / 2, cy = S / 2;
      g.fillStyle = 'rgba(10,20,30,0.92)';
      g.beginPath(); g.arc(cx, cy, S / 2 - 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(55,224,255,0.7)';
      g.lineWidth = 3;
      g.stroke();
      for (const r of [0.33, 0.66]) {
        g.strokeStyle = 'rgba(55,224,255,0.2)';
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(cx, cy, (S / 2 - 6) * r, 0, Math.PI * 2); g.stroke();
      }
      g.strokeStyle = 'rgba(55,224,255,0.15)';
      g.beginPath(); g.moveTo(cx, 4); g.lineTo(cx, S - 4); g.moveTo(4, cy); g.lineTo(S - 4, cy); g.stroke();
      const speed = activeRef.current ? 350 : 1400;
      const ang = (t / speed) % (Math.PI * 2);
      const grad = g.createConicGradient(ang, cx, cy);
      grad.addColorStop(0, 'rgba(55,224,255,0.5)');
      grad.addColorStop(0.15, 'rgba(55,224,255,0)');
      grad.addColorStop(1, 'rgba(55,224,255,0)');
      g.fillStyle = grad;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, S / 2 - 5, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#9beeff';
      g.beginPath(); g.arc(cx, cy, 4, 0, Math.PI * 2); g.fill();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ width: 200, height: 200 }} />;
}

export default function GachaModal({ meta, onChange, onClose }: Props) {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<PullResult[] | null>(null);
  const ownedCount = Object.keys(meta.roster).length;
  const left = PITY_MAX - meta.pity;

  const doPull = (n: number) => {
    if (scanning || meta.res.tickets < n) return;
    setScanning(true);
    setResults(null);
    sfx.alarm();
    const next: MetaState = { ...meta, res: { ...meta.res }, roster: { ...meta.roster } };
    next.res.tickets -= n;
    setTimeout(() => {
      const rs: PullResult[] = [];
      for (let i = 0; i < n; i++) rs.push(pullOnce(next));
      sfx.chest();
      setResults(rs);
      setScanning(false);
      onChange({ ...next });
    }, 900);
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(5,8,14,0.78)', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <div
        className="relative flex w-[92%] max-w-sm flex-col items-center rounded-2xl p-5"
        style={{ background: '#2c3e52', border: '3px solid #1a2735', boxShadow: '0 8px 0 rgba(0,0,0,0.5)' }}
      >
        <div className="absolute -top-5 rounded-xl px-5 py-1.5 text-xl font-black" style={{ background: 'linear-gradient(180deg,#9beeff,#37c8e0)', border: '2px solid #1a6a8c', color: '#0c3444' }}>
          招募电台
        </div>
        <button onClick={onClose} className="absolute right-3 top-3 rounded-lg px-2 py-0.5 text-sm font-black text-white" style={{ background: 'rgba(15,22,30,0.7)', border: '1.5px solid #1a2735' }}>✕</button>

        <div className="mt-4" />
        <RadarAnim active={scanning} />

        <div className="mt-1 rounded-lg px-4 py-1.5 text-sm font-black" style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', color: '#5c2e00' }}>
          再抽取 <span style={{ color: '#c02020' }}>{left}</span> 次必定获得 <span style={{ color: '#c02020' }}>神话</span> 幸存者
        </div>
        <div className="mt-1.5 text-xs font-bold" style={{ color: '#8a9aac' }}>
          已获得：{ownedCount}/{HEROES.length} · 剩余招募券：<span style={{ color: '#37e0ff' }}>{meta.res.tickets}</span>
        </div>

        <div className="mt-4 flex w-full gap-3">
          <button
            onClick={() => doPull(1)}
            disabled={scanning || meta.res.tickets < 1}
            className="flex-1 rounded-xl py-3 text-base font-black disabled:opacity-40"
            style={{ background: 'linear-gradient(180deg,#5be08a,#2fa85c)', border: '2px solid #1a6a3c', color: '#08301a', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          >
            招募 ×1
            <div className="text-xs font-bold">券 ×1</div>
          </button>
          <button
            onClick={() => doPull(10)}
            disabled={scanning || meta.res.tickets < 10}
            className="flex-1 rounded-xl py-3 text-base font-black disabled:opacity-40"
            style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', color: '#5c2e00', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
          >
            招募 ×10
            <div className="text-xs font-bold">券 ×10</div>
          </button>
        </div>
        <div className="mt-2 text-[10px] font-bold" style={{ color: '#5c6c7c' }}>
          神话 2% · 传说 8% · 史诗 30% · 精良 60%（重复英雄转化为 60 物资）
        </div>

        {/* 抽卡结果 */}
        {results && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(5,8,14,0.9)' }} onClick={() => setResults(null)}>
            <div className="w-full px-4">
              <div className="mb-3 text-center text-lg font-black" style={{ color: '#9beeff' }}>招募结果（点击关闭）</div>
              <div className={`grid gap-2 ${results.length > 1 ? 'grid-cols-5' : 'grid-cols-1 justify-items-center'}`}>
                {results.map((r, i) => {
                  const def = HERO_MAP[r.heroId];
                  const qc = QUALITY_COLOR[r.quality];
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-xl p-2"
                      style={{
                        background: `linear-gradient(180deg, ${qc}33, ${qc}11)`,
                        border: `2.5px solid ${qc}`,
                        boxShadow: r.quality === '神话' || r.quality === '传说' ? `0 0 16px ${qc}88` : 'none',
                        animation: `popIn 0.3s ease-out ${i * 0.06}s both`,
                      }}
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-full" style={{ background: 'rgba(15,22,30,0.6)', border: `2px solid ${qc}` }}>
                        <img src={heroPortrait(r.heroId)} alt={def.name} className="h-full w-full" draggable={false} />
                      </div>
                      <div className="mt-1 text-center text-[11px] font-black leading-3 text-white">{def.name}</div>
                      <div className="text-[9px] font-black" style={{ color: qc }}>{r.quality}</div>
                      <div className="text-[9px] font-bold" style={{ color: r.isNew ? '#5be08a' : '#8a9aac' }}>
                        {r.isNew ? 'NEW!' : '物资+60'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
