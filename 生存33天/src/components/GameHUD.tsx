import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import type { Game, HudSnapshot } from '../game/engine';
import { heroPortrait } from '../meta/portraits';
import { isMuted, setMuted } from '../game/audio';

// ---------- 小组件 ----------
function Flame({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2c1 3-2 4.5-2 7 0 1.2.8 2 2 2s2-.8 2-2c2 1.5 3 3.5 3 5.5A5.5 5.5 0 0 1 12 20a5.5 5.5 0 0 1-5.5-5.5C6.5 9 10 6.5 12 2z" fill="#ff7a1a" stroke="#7a2e00" strokeWidth="1.4" />
      <path d="M12 20a3.2 3.2 0 0 1-3.2-3.2c0-2 1.6-3 3.2-5.4 1.6 2.4 3.2 3.4 3.2 5.4A3.2 3.2 0 0 1 12 20z" fill="#ffd94d" />
    </svg>
  );
}

function Gem({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10l4 6-9 12L3 9l4-6z" fill="#ff7ac2" stroke="#8c1e56" strokeWidth="1.4" />
      <path d="M7 3l5 6 5-6M3 9h18" stroke="#ffc2e2" strokeWidth="1.2" />
    </svg>
  );
}

function RadioIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="11" width="24" height="15" rx="3" fill="#8a94a2" stroke="#2c343f" strokeWidth="2" />
      <circle cx="11" cy="18.5" r="4" fill="#4a5563" stroke="#2c343f" strokeWidth="1.6" />
      <rect x="18" y="15" width="7" height="2.4" rx="1.2" fill="#2c343f" />
      <rect x="18" y="19" width="7" height="2.4" rx="1.2" fill="#2c343f" />
      <path d="M8 11L20 4" stroke="#2c343f" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21" cy="4" r="2" fill="#e5484d" />
    </svg>
  );
}

function HelmetIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M6 20a10 10 0 0 1 20 0v3H6v-3z" fill="#eef2f6" stroke="#2c343f" strokeWidth="2" />
      <rect x="3" y="22" width="26" height="4" rx="2" fill="#c8d2dc" stroke="#2c343f" strokeWidth="1.6" />
      <path d="M16 7v6" stroke="#e5484d" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------- 雷达小地图 ----------
function Radar({ gameRef }: { gameRef: MutableRefObject<Game | null> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const c = ref.current!;
    const g = c.getContext('2d')!;
    const S = 96;
    c.width = S * 2; c.height = S * 2;
    const draw = (t: number) => {
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.clearRect(0, 0, S, S);
      g.fillStyle = 'rgba(20,32,44,0.85)';
      g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(55,224,255,0.5)';
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = 'rgba(55,224,255,0.18)';
      g.beginPath(); g.arc(S / 2, S / 2, S / 4, 0, Math.PI * 2); g.stroke();
      const ang = (t / 1400) % (Math.PI * 2);
      const grad = g.createConicGradient ? g.createConicGradient(ang, S / 2, S / 2) : null;
      if (grad) {
        grad.addColorStop(0, 'rgba(55,224,255,0.35)');
        grad.addColorStop(0.12, 'rgba(55,224,255,0)');
        grad.addColorStop(1, 'rgba(55,224,255,0)');
        g.fillStyle = grad;
        g.beginPath(); g.moveTo(S / 2, S / 2); g.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); g.fill();
      }
      const data = gameRef.current?.getRadar();
      if (data) {
        const px = (v: number) => 8 + v * (S - 16);
        for (const [x, y] of data.loots) { g.fillStyle = '#ffd94d'; g.fillRect(px(x) - 1.5, px(y) - 1.5, 3, 3); }
        for (const [x, y] of data.foes) { g.fillStyle = '#ff5a4d'; g.beginPath(); g.arc(px(x), px(y), 2.4, 0, Math.PI * 2); g.fill(); }
        if (data.extract) {
          g.fillStyle = '#37e0ff';
          g.beginPath(); g.arc(px(data.extract[0]), px(data.extract[1]), 3.4, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = '#fff';
        g.beginPath(); g.arc(px(data.px), px(data.py), 3, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#37e0ff'; g.lineWidth = 1.4; g.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [gameRef]);
  return <canvas ref={ref} style={{ width: 96, height: 96 }} />;
}

// ---------- 主 HUD ----------
interface Props {
  hud: HudSnapshot | null;
  gameRef: MutableRefObject<Game | null>;
  banners: { id: number; text: string }[];
  power: number;
  gems: number;
  onOpenHeroes: () => void;
  onExit: (mode: 'base' | 'retry') => void;
}

export default function GameHUD({ hud, gameRef, banners, power, gems, onOpenHeroes, onExit }: Props) {
  const [muted, setM] = useState(isMuted());
  const result = hud?.result ?? null;

  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>
      {/* 受伤红晕 */}
      {hud && hud.hurtT > 0 && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(229,72,77,0.35) 100%)' }} />
      )}

      {/* 顶部左：头像 + 战力 */}
      <div className="absolute left-2 top-2 flex items-start gap-2">
        <div className="relative">
          <div className="h-14 w-14 overflow-hidden rounded-xl border-2" style={{ borderColor: '#1a2735', background: '#3a5a78' }}>
            <img src={heroPortrait('police')} alt="" className="h-full w-full" draggable={false} />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1 text-[10px] font-black text-white" style={{ background: '#2c3e52', border: '1px solid #1a2735' }}>2级</div>
          <div className="absolute -bottom-3 left-0 h-1.5 w-14 overflow-hidden rounded-full" style={{ background: '#16202c' }}>
            <div className="h-full rounded-full" style={{ width: '76%', background: '#37c8e0' }} />
          </div>
        </div>
        <div className="mt-0.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', boxShadow: '0 2px 0 rgba(0,0,0,0.35)' }}>
            <Flame />
            <span className="text-lg font-black tracking-wide" style={{ color: '#5c2e00', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
              {power}
            </span>
          </div>
          <div className="self-start rounded-md px-2 py-0.5 text-xs font-black text-white" style={{ background: '#4a6a8c', border: '1.5px solid #1a2735' }}>新兵</div>
        </div>
        <div className="mt-0.5 flex items-center gap-1 rounded-lg px-2 py-1" style={{ background: 'rgba(20,28,38,0.85)', border: '1.5px solid #1a2735' }}>
          <Gem />
          <span className="text-sm font-black text-white">{gems}</span>
          <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-xs font-black" style={{ background: '#ff7ac2', color: '#5c0e36' }}>+</span>
        </div>
      </div>

      {/* 顶部中：天数 + 倒计时 */}
      <div className="absolute left-1/2 top-2 -translate-x-1/2 text-center">
        <div className="rounded-lg px-3 py-1 text-sm font-black text-white" style={{ background: 'rgba(20,28,38,0.85)', border: '1.5px solid #1a2735' }}>
          第 <span style={{ color: '#ffd94d' }}>{hud?.day ?? 1}</span><span className="text-[10px]" style={{ color: '#8a9aac' }}>/33</span> 天 · 地铁站废墟
        </div>
        <div className="mx-auto mt-1 w-fit rounded-md px-2 py-0.5 text-xs font-black" style={{ background: 'rgba(20,28,38,0.7)', color: hud && hud.timeLeft < 30 ? '#ff6b6b' : '#9beeff' }}>
          撤离时限 {hud ? `${Math.floor(hud.timeLeft / 60)}:${String(hud.timeLeft % 60).padStart(2, '0')}` : '4:00'}
        </div>
      </div>

      {/* 顶部右：雷达 + 静音 */}
      <div className="absolute right-2 top-2 flex flex-col items-center gap-1.5">
        <Radar gameRef={gameRef} />
        <button
          className="pointer-events-auto rounded-lg px-2 py-1 text-xs font-black text-white"
          style={{ background: 'rgba(20,28,38,0.85)', border: '1.5px solid #1a2735' }}
          onClick={() => { setMuted(!muted); setM(!muted); }}
        >
          {muted ? '音效 关' : '音效 开'}
        </button>
      </div>

      {/* 横幅公告 */}
      <div className="absolute left-1/2 top-24 flex -translate-x-1/2 flex-col items-center gap-2">
        {banners.map(b => (
          <div
            key={b.id}
            className="whitespace-nowrap rounded-lg px-5 py-2 text-base font-black"
            style={{
              background: 'linear-gradient(180deg,#ffd94d,#f0a421)',
              border: '2px solid #a06810',
              color: '#5c2e00',
              boxShadow: '0 3px 0 rgba(0,0,0,0.4)',
              animation: 'bannerIn 0.25s ease-out',
              textShadow: '0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            {b.text}
          </div>
        ))}
      </div>

      {/* 左下：任务追踪 */}
      <div className="absolute bottom-24 left-2 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: '#f7f1df', border: '2.5px solid #3a3226', boxShadow: '0 3px 0 rgba(0,0,0,0.4)', minWidth: 180 }}>
        <RadioIcon />
        <div>
          <div className="text-sm font-black" style={{ color: '#3a3226' }}>
            {!hud || hud.stage === 0 ? (hud?.questLabel ?? '搜集物资') : '前往撤离点'}
          </div>
          <div className="text-xs font-black" style={{ color: hud && ((hud.stage === 0 && hud.questCur >= hud.questMax) || hud.extractT > 0) ? '#1f8a4c' : '#8a7a5c' }}>
            {!hud || hud.stage === 0
              ? `${hud?.questCur ?? 0}/${hud?.questMax ?? 6}`
              : hud.extractT > 0 ? `撤离中 ${Math.round(hud.extractT * 100)}%` : '0/1'}
          </div>
        </div>
      </div>

      {/* 左下：幸存者按钮 */}
      <button
        onClick={onOpenHeroes}
        className="pointer-events-auto absolute bottom-6 left-2 flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5"
        style={{ background: 'rgba(20,28,38,0.9)', border: '2px solid #1a2735', boxShadow: '0 3px 0 rgba(0,0,0,0.4)' }}
      >
        <HelmetIcon />
        <span className="text-xs font-black text-white">幸存者</span>
        {hud && hud.heroes.some(h => !h.alive) && (
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full" style={{ background: '#e5484d', border: '2px solid #fff' }} />
        )}
      </button>

      {/* 右下：信号雷达按钮 */}
      <div className="absolute bottom-6 right-3 flex flex-col items-center">
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #2a4a5c, #12202c 70%)',
            border: '3px solid #37e0ff',
            boxShadow: '0 0 18px rgba(55,224,255,0.45), inset 0 0 14px rgba(55,224,255,0.25)',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#37e0ff" strokeWidth="1.6" opacity="0.5" />
            <circle cx="12" cy="12" r="5" stroke="#37e0ff" strokeWidth="1.6" opacity="0.8" />
            <circle cx="12" cy="12" r="1.8" fill="#37e0ff" />
            <path d="M12 12L18 6" stroke="#9beeff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {hud && hud.extractActive && (
            <span className="absolute -top-1 -right-1 h-4 w-4 animate-ping rounded-full" style={{ background: '#37e0ff' }} />
          )}
        </div>
        <div className="mt-1 rounded-md px-2.5 py-0.5 text-xs font-black text-white" style={{ background: 'rgba(20,28,38,0.9)', border: '1.5px solid #1a2735' }}>
          {hud?.extractActive ? '撤离信号已开启' : `击杀 ${hud?.kills ?? 0}`}
        </div>
      </div>

      {/* 结算面板 */}
      {result && (
        <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(5,8,14,0.72)' }}>
          <div
            className="w-[86%] max-w-sm rounded-2xl p-5 text-center"
            style={{ background: '#2c3e52', border: '3px solid #1a2735', boxShadow: '0 8px 0 rgba(0,0,0,0.45)', animation: 'popIn 0.3s ease-out' }}
          >
            <div
              className="mx-auto -mt-10 mb-3 w-fit rounded-xl px-6 py-2 text-2xl font-black"
              style={{
                background: result.win ? 'linear-gradient(180deg,#ffd94d,#f0a421)' : 'linear-gradient(180deg,#8a94a2,#5c6672)',
                border: '2px solid #1a2735',
                color: result.win ? '#5c2e00' : '#eef2f6',
                textShadow: result.win ? '0 1px 0 rgba(255,255,255,0.4)' : 'none',
              }}
            >
              {result.win ? '撤离成功' : '探索失败'}
            </div>
            <p className="mb-4 text-sm font-bold" style={{ color: '#b8c6d4' }}>{result.reason}</p>
            <div className="mb-4 grid grid-cols-2 gap-2 text-left">
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(15,22,30,0.6)' }}>
                <div className="text-xs" style={{ color: '#8a9aac' }}>带回物资</div>
                <div className="text-lg font-black" style={{ color: '#ffd94d' }}>× {result.cans}{result.chest ? ' +金宝箱' : ''}</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(15,22,30,0.6)' }}>
                <div className="text-xs" style={{ color: '#8a9aac' }}>击杀丧尸</div>
                <div className="text-lg font-black text-white">{result.kills}</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(15,22,30,0.6)' }}>
                <div className="text-xs" style={{ color: '#8a9aac' }}>探索用时</div>
                <div className="text-lg font-black text-white">{result.timeUsed}s</div>
              </div>
              <div className="rounded-lg p-2.5" style={{ background: 'rgba(15,22,30,0.6)' }}>
                <div className="text-xs" style={{ color: '#8a9aac' }}>招募券</div>
                <div className="text-lg font-black" style={{ color: '#37e0ff' }}>{result.win ? `+${result.chest ? 2 : 1}` : '+0'}</div>
              </div>
              {result.win && result.powerGain > 0 && (
                <div className="col-span-2 rounded-lg p-2 text-center" style={{ background: 'rgba(15,22,30,0.6)' }}>
                  <span className="text-xs" style={{ color: '#8a9aac' }}>战力提升 </span>
                  <span className="text-lg font-black" style={{ color: '#5be08a' }}>+{result.powerGain}</span>
                </div>
              )}
            </div>
            {!result.win && (
              <p className="mb-3 text-xs font-bold" style={{ color: '#ff9b9b' }}>本次搜集的物资已全部丢失</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onExit('base')}
                className="flex-1 rounded-xl py-3 text-base font-black"
                style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', color: '#5c2e00', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
              >
                返回庇护所
              </button>
              <button
                onClick={() => onExit('retry')}
                className="flex-1 rounded-xl py-3 text-base font-black"
                style={{ background: 'linear-gradient(180deg,#5be08a,#2fa85c)', border: '2px solid #1a6a3c', color: '#08301a', boxShadow: '0 4px 0 rgba(0,0,0,0.4)' }}
              >
                {result.win ? '探索下一天' : '重新探索'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bannerIn { from { transform: translateY(-14px) scale(0.9); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
