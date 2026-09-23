// 庇护所主页：基地场景 + 建造/升级 + 挂机产出 + 入口导航
import { useEffect, useRef, useState } from 'react';
import { drawUnit } from '../game/chibi';
import { BUILDINGS, BUILDING_MAP, HERO_MAP } from '../meta/gamedata';
import {
  buildingCost, buildingUnlocked, type MetaState,
} from '../meta/store';
import { dayEvent, dayQuest, phaseOf, MAX_DAY } from '../meta/daycurve';

// 建筑 → 固定地块（9 建筑 9 地块一一对应）
const PLOT_OF: Record<string, number> = {
  workbench: 0, storage: 1, fence: 2, bed: 3, farm: 4, filter: 5, medstation: 6, tower: 7, forge: 8,
};

interface SceneProps {
  meta: MetaState;
  onPlotClick: (buildingId: string | null, plotIndex: number) => void;
}

function usePlots(W: number, H: number) {
  const size = Math.min(W, H) * 0.155;
  const gapX = size * 1.22, gapY = size * 1.18;
  const cx = W / 2, cy = H * 0.46;
  const plots: { x: number; y: number; s: number }[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      plots.push({ x: cx + (c - 1) * gapX, y: cy + (r - 1) * gapY, s: size });
    }
  }
  return plots;
}

function BaseScene({ meta, onPlotClick }: SceneProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const clickRef = useRef(onPlotClick);
  clickRef.current = onPlotClick;

  useEffect(() => {
    const canvas = ref.current!;
    const g = canvas.getContext('2d')!;
    let raf = 0;
    let W = 0, H = 0, dpr = 1;
    // 游荡幸存者状态
    const walkers = [0, 1, 2].map(i => ({
      x: 0, y: 0, tx: 0, ty: 0, walk: 0, pause: i * 2, face: 0,
    }));
    let walkersInit = false;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const drawBuilding = (id: string, x: number, y: number, s: number, lv: number, t: number) => {
      g.save();
      g.translate(x, y);
      const k = s / 100;
      g.lineWidth = 2.5 * k;
      g.strokeStyle = '#14100c';
      switch (BUILDING_MAP[id].icon) {
        case 'workbench':
          g.fillStyle = '#7a5c38'; g.fillRect(-40 * k, -18 * k, 80 * k, 14 * k); g.strokeRect(-40 * k, -18 * k, 80 * k, 14 * k);
          g.fillStyle = '#5c452a'; g.fillRect(-34 * k, -4 * k, 10 * k, 26 * k); g.fillRect(24 * k, -4 * k, 10 * k, 26 * k);
          g.fillStyle = '#9aa6b2'; g.fillRect(-26 * k, -30 * k, 16 * k, 12 * k); g.strokeRect(-26 * k, -30 * k, 16 * k, 12 * k);
          g.fillStyle = '#c9a05c'; g.fillRect(6 * k, -26 * k, 22 * k, 8 * k);
          break;
        case 'storage':
          g.fillStyle = '#6e5638'; g.fillRect(-30 * k, -34 * k, 60 * k, 56 * k); g.strokeRect(-30 * k, -34 * k, 60 * k, 56 * k);
          g.fillStyle = '#7d6440'; g.fillRect(-24 * k, -28 * k, 48 * k, 20 * k);
          g.strokeStyle = '#4c3a24'; g.beginPath(); g.moveTo(-30 * k, -34 * k); g.lineTo(30 * k, 22 * k); g.moveTo(30 * k, -34 * k); g.lineTo(-30 * k, 22 * k); g.stroke();
          break;
        case 'fence':
          g.fillStyle = '#6e5638';
          for (let i = -3; i <= 3; i++) {
            g.fillRect(i * 13 * k - 4 * k, -36 * k, 8 * k, 58 * k);
            g.strokeRect(i * 13 * k - 4 * k, -36 * k, 8 * k, 58 * k);
          }
          g.fillStyle = '#5c452a'; g.fillRect(-46 * k, -20 * k, 92 * k, 8 * k); g.strokeRect(-46 * k, -20 * k, 92 * k, 8 * k);
          break;
        case 'bed':
          g.fillStyle = '#7a5c38'; g.fillRect(-38 * k, -8 * k, 76 * k, 16 * k); g.strokeRect(-38 * k, -8 * k, 76 * k, 16 * k);
          g.fillStyle = '#4a6a9c'; g.fillRect(-36 * k, -22 * k, 72 * k, 16 * k); g.strokeRect(-36 * k, -22 * k, 72 * k, 16 * k);
          g.fillStyle = '#e8e2d4'; g.fillRect(-34 * k, -20 * k, 18 * k, 12 * k);
          break;
        case 'farm': {
          g.fillStyle = '#4c3a24'; g.fillRect(-42 * k, -24 * k, 84 * k, 46 * k); g.strokeRect(-42 * k, -24 * k, 84 * k, 46 * k);
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
              const sway = Math.sin(t * 2 + r + c) * 2 * k;
              g.fillStyle = '#5ba848';
              g.beginPath();
              g.ellipse(-30 * k + c * 20 * k + sway, -14 * k + r * 14 * k, 4 * k, 7 * k, 0, 0, Math.PI * 2);
              g.fill();
            }
          }
          break;
        }
        case 'filter':
          g.fillStyle = '#5a6e8c'; g.fillRect(-22 * k, -40 * k, 44 * k, 62 * k); g.strokeRect(-22 * k, -40 * k, 44 * k, 62 * k);
          g.fillStyle = '#7ac8e8'; g.fillRect(-16 * k, -32 * k, 32 * k, 20 * k);
          g.strokeStyle = '#14100c'; g.beginPath(); g.moveTo(22 * k, -30 * k); g.lineTo(40 * k, -30 * k); g.lineTo(40 * k, 6 * k); g.stroke();
          g.fillStyle = '#4a9ac8'; g.beginPath(); g.ellipse(40 * k, 10 * k + Math.sin(t * 3) * 2 * k, 5 * k, 6 * k, 0, 0, Math.PI * 2); g.fill();
          break;
        case 'med':
          g.fillStyle = '#e8e2d4'; g.beginPath(); g.moveTo(-40 * k, 22 * k); g.lineTo(0, -34 * k); g.lineTo(40 * k, 22 * k); g.closePath(); g.fill(); g.stroke();
          g.fillStyle = '#e5484d'; g.fillRect(-4 * k, -16 * k, 8 * k, 22 * k); g.fillRect(-11 * k, -9 * k, 22 * k, 8 * k);
          break;
        case 'tower':
          g.fillStyle = '#5c452a'; g.fillRect(-22 * k, -8 * k, 10 * k, 30 * k); g.fillRect(12 * k, -8 * k, 10 * k, 30 * k);
          g.fillStyle = '#7a5c38'; g.fillRect(-30 * k, -40 * k, 60 * k, 34 * k); g.strokeRect(-30 * k, -40 * k, 60 * k, 34 * k);
          g.fillStyle = '#4c3a24'; g.beginPath(); g.moveTo(-36 * k, -40 * k); g.lineTo(0, -58 * k); g.lineTo(36 * k, -40 * k); g.closePath(); g.fill(); g.stroke();
          break;
        case 'forge':
          g.fillStyle = '#4a4038'; g.fillRect(-34 * k, -26 * k, 68 * k, 48 * k); g.strokeRect(-34 * k, -26 * k, 68 * k, 48 * k);
          g.fillStyle = '#2c2620'; g.fillRect(14 * k, -52 * k, 14 * k, 28 * k); g.strokeRect(14 * k, -52 * k, 14 * k, 28 * k);
          g.fillStyle = `rgba(255,140,40,${0.6 + 0.4 * Math.sin(t * 5)})`;
          g.beginPath(); g.arc(-8 * k, 2 * k, 10 * k, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#9aa6b2'; g.fillRect(-26 * k, -10 * k, 18 * k, 8 * k); g.strokeRect(-26 * k, -10 * k, 18 * k, 8 * k);
          break;
      }
      // 等级角标
      g.fillStyle = '#ffd94d';
      g.strokeStyle = '#5c2e00';
      g.lineWidth = 2;
      g.beginPath(); g.arc(34 * k, -46 * k, 12 * k, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#5c2e00';
      g.font = `900 ${15 * k}px "PingFang SC", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(lv), 34 * k, -45 * k);
      g.restore();
    };

    const draw = (now: number) => {
      const t = now / 1000;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 夜空
      const sky = g.createLinearGradient(0, 0, 0, H * 0.5);
      sky.addColorStop(0, '#0c1424');
      sky.addColorStop(1, '#1c2c40');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H * 0.5);
      // 星
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97.3) % W, sy = ((i * 57.7) % (H * 0.32));
        g.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(t * 0.8 + i));
        g.fillRect(sx, sy, 2, 2);
      }
      g.globalAlpha = 1;
      // 月亮
      g.fillStyle = '#e8e2c8';
      g.beginPath(); g.arc(W * 0.82, H * 0.1, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0c1424';
      g.beginPath(); g.arc(W * 0.82 - 10, H * 0.1 - 6, 22, 0, Math.PI * 2); g.fill();
      // 远处城市剪影
      g.fillStyle = '#16202e';
      for (let i = 0; i < 9; i++) {
        const bw = 40 + (i * 37) % 60;
        const bh = 50 + (i * 53) % 110;
        g.fillRect(i * (W / 8) - 20, H * 0.5 - bh, bw, bh);
      }
      // 地面
      const gr = g.createLinearGradient(0, H * 0.5, 0, H);
      gr.addColorStop(0, '#2c3a2c');
      gr.addColorStop(1, '#22301f');
      g.fillStyle = gr;
      g.fillRect(0, H * 0.5, W, H * 0.5);
      // 营地光圈
      const cx = W / 2, cy = H * 0.62;
      const glow = g.createRadialGradient(cx, cy, 20, cx, cy, Math.min(W, H) * 0.55);
      glow.addColorStop(0, 'rgba(255,200,110,0.16)');
      glow.addColorStop(1, 'rgba(255,200,110,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, W, H);

      const plots = usePlots(W, H);
      const m = metaRef.current;

      // 围栏（包住所有地块）
      g.strokeStyle = '#5c452a';
      g.lineWidth = 6;
      const fx0 = plots[0].x - plots[0].s * 0.85, fx1 = plots[8].x + plots[8].s * 0.85;
      const fy0 = plots[0].y - plots[0].s * 0.75, fy1 = plots[8].y + plots[8].s * 1.15;
      g.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
      // 围栏木桩
      g.fillStyle = '#5c452a';
      for (let px = fx0; px <= fx1; px += 34) {
        g.fillRect(px - 3, fy0 - 8, 6, 12);
        g.fillRect(px - 3, fy1 - 4, 6, 12);
      }

      // 地块
      for (let i = 0; i < 9; i++) {
        const p = plots[i];
        const bid = Object.keys(PLOT_OF).find(k => PLOT_OF[k] === i && (m.buildings[k] ?? 0) > 0);
        g.save();
        if (bid) {
          g.fillStyle = 'rgba(60,50,36,0.85)';
          g.strokeStyle = '#6a5638';
        } else {
          g.fillStyle = 'rgba(40,46,38,0.6)';
          g.setLineDash([8, 6]);
          g.strokeStyle = 'rgba(180,200,170,0.35)';
        }
        g.lineWidth = 2.5;
        g.beginPath();
        g.roundRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, 10);
        g.fill(); g.stroke();
        g.restore();
        if (bid) {
          drawBuilding(bid, p.x, p.y, p.s * 0.9, m.buildings[bid], t);
          // 产出气泡
          const bubbleOf: Record<string, string> = { workbench: '木', farm: '食', filter: '水', forge: '资' };
          if (bubbleOf[bid]) {
            const by = p.y - p.s * 0.55 - Math.abs(Math.sin(t * 2 + i)) * 8;
            g.fillStyle = 'rgba(20,28,20,0.9)';
            g.beginPath(); g.arc(p.x, by, 13, 0, Math.PI * 2); g.fill();
            g.strokeStyle = '#5be08a'; g.lineWidth = 2; g.stroke();
            g.fillStyle = '#5be08a';
            g.font = '900 13px "PingFang SC", sans-serif';
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(bubbleOf[bid], p.x, by + 1);
          }
        } else {
          g.fillStyle = 'rgba(200,220,190,0.3)';
          g.font = `900 ${p.s * 0.3}px "PingFang SC", sans-serif`;
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('+', p.x, p.y);
        }
      }

      // 篝火
      const fireX = cx - Math.min(W, H) * 0.3, fireY = fy1 - 30;
      g.fillStyle = '#4c3a24';
      g.save();
      g.translate(fireX, fireY);
      g.rotate(0.5); g.fillRect(-16, -3, 32, 6); g.rotate(-1); g.fillRect(-16, -3, 32, 6);
      g.restore();
      for (let i = 0; i < 3; i++) {
        const fh = 18 + Math.sin(t * 7 + i * 2) * 6;
        g.fillStyle = ['#ff7a1a', '#ffd94d', '#fff3c8'][i];
        g.beginPath();
        g.ellipse(fireX, fireY - 8 - i * 3, (10 - i * 3), fh - i * 4, 0, 0, Math.PI * 2);
        g.fill();
      }
      const fglow = g.createRadialGradient(fireX, fireY - 10, 4, fireX, fireY - 10, 90);
      fglow.addColorStop(0, 'rgba(255,160,60,0.3)');
      fglow.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = fglow;
      g.fillRect(fireX - 90, fireY - 100, 180, 180);

      // 幸存者闲逛（取编队前 3 名）
      const heroIds = m.formation.filter((x): x is string => !!x).slice(0, 3);
      if (!walkersInit && W > 0) {
        walkersInit = true;
        walkers.forEach((w, i) => {
          w.x = cx + (i - 1) * 90; w.y = fy1 - 70;
          w.tx = w.x; w.ty = w.y;
        });
      }
      walkers.forEach((w, i) => {
        const hid = heroIds[i];
        if (!hid) return;
        const def = HERO_MAP[hid];
        w.pause -= 1 / 60;
        const dx = w.tx - w.x, dy = w.ty - w.y;
        const dd = Math.hypot(dx, dy);
        if (dd < 6 && w.pause <= 0) {
          w.tx = fx0 + 40 + Math.random() * (fx1 - fx0 - 80);
          w.ty = fy0 + 60 + Math.random() * (fy1 - fy0 - 80);
          w.pause = 1 + Math.random() * 3;
        }
        if (dd > 4) {
          w.face = Math.atan2(dy, dx);
          w.x += dx / dd * 42 / 60;
          w.y += dy / dd * 42 / 60;
          w.walk += 1 / 60;
        }
        drawUnit(g, w.x, w.y, 0.8, def.look, { face: w.face, walk: w.walk, weapon: def.weapon });
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onClick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const plots = usePlots(window.innerWidth, window.innerHeight);
      const m = metaRef.current;
      for (let i = 0; i < 9; i++) {
        const p = plots[i];
        if (Math.abs(mx - p.x) < p.s / 2 && Math.abs(my - p.y) < p.s / 2) {
          const bid = Object.keys(PLOT_OF).find(k => PLOT_OF[k] === i && (m.buildings[k] ?? 0) > 0) ?? null;
          clickRef.current(bid, i);
          return;
        }
      }
    };
    canvas.addEventListener('pointerdown', onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={ref} className="absolute inset-0" style={{ touchAction: 'manipulation' }} />;
}

// ---------- 资源条 ----------
function ResChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md px-1.5 py-0.5" style={{ background: 'rgba(15,22,30,0.75)', border: '1px solid #1a2735' }}>
      <span className="flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-black" style={{ background: color, color: '#14100c' }}>{label}</span>
      <span className="text-xs font-black text-white">{value}</span>
    </div>
  );
}

// ---------- 建造/升级面板 ----------
interface PanelProps {
  meta: MetaState;
  buildingId: string | null;
  onClose: () => void;
  onChange: (m: MetaState) => void;
}

function BuildPanel({ meta, buildingId, onClose, onChange }: PanelProps) {
  const canAfford = (c: { wood: number; stone: number; supplies: number }) =>
    meta.res.wood >= c.wood && meta.res.stone >= c.stone && meta.res.supplies >= c.supplies;

  const build = (id: string) => {
    const lv = meta.buildings[id] ?? 0;
    const cost = buildingCost(id, lv);
    if (!canAfford(cost)) return;
    const next: MetaState = { ...meta, res: { ...meta.res }, buildings: { ...meta.buildings } };
    next.res.wood -= cost.wood; next.res.stone -= cost.stone; next.res.supplies -= cost.supplies;
    next.buildings[id] = lv + 1;
    onChange(next);
  };

  const title = buildingId ? BUILDING_MAP[buildingId].name : '选择建筑';
  const buildable = BUILDINGS.filter(b => !((meta.buildings[b.id] ?? 0) > 0));

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center" style={{ background: 'rgba(5,8,14,0.6)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl p-4 pb-8"
        style={{ background: '#2c3e52', border: '3px solid #1a2735', borderBottom: 'none', animation: 'slideUp 0.25s ease-out', maxHeight: '70%', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg font-black text-white">{title}</span>
          <button onClick={onClose} className="rounded-lg px-2 py-0.5 text-sm font-black text-white" style={{ background: 'rgba(15,22,30,0.7)', border: '1.5px solid #1a2735' }}>✕</button>
        </div>

        {buildingId ? (
          (() => {
            const def = BUILDING_MAP[buildingId];
            const lv = meta.buildings[buildingId];
            const cost = buildingCost(buildingId, lv);
            return (
              <div className="rounded-xl p-3" style={{ background: 'rgba(15,22,30,0.55)' }}>
                <div className="mb-1 text-sm font-black" style={{ color: '#ffd94d' }}>Lv.{lv} <span className="ml-2 text-xs font-bold" style={{ color: '#8a9aac' }}>{def.desc}</span></div>
                <div className="mb-3 text-xs font-bold" style={{ color: '#5be08a' }}>效果：{def.effect}（每级叠加）</div>
                {cost.ok ? (
                  <button
                    onClick={() => build(buildingId)}
                    disabled={!canAfford(cost)}
                    className="w-full rounded-xl py-2.5 text-sm font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(180deg,#5be08a,#2fa85c)', border: '2px solid #1a6a3c', color: '#08301a' }}
                  >
                    升级：木材{cost.wood} 石料{cost.stone} 物资{cost.supplies}
                  </button>
                ) : (
                  <div className="text-center text-sm font-black" style={{ color: '#8a9aac' }}>已满级</div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="space-y-2">
            {buildable.length === 0 && <div className="py-6 text-center text-sm font-bold" style={{ color: '#8a9aac' }}>所有建筑已建成</div>}
            {buildable.map(b => {
              const unlocked = buildingUnlocked(meta, b.id);
              const cost = buildingCost(b.id, 0);
              const preName = b.pre ? BUILDING_MAP[b.pre].name : null;
              return (
                <div key={b.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: 'rgba(15,22,30,0.55)', opacity: unlocked ? 1 : 0.5 }}>
                  <div>
                    <div className="text-sm font-black text-white">{b.name}</div>
                    <div className="text-xs font-bold" style={{ color: unlocked ? '#5be08a' : '#ff9b9b' }}>
                      {unlocked ? b.effect : `需要先建造：${preName}`}
                    </div>
                  </div>
                  <button
                    onClick={() => unlocked && build(b.id)}
                    disabled={!unlocked || !canAfford(cost)}
                    className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810', color: '#5c2e00' }}
                  >
                    建造<br />
                    <span style={{ fontWeight: 700 }}>木{cost.wood} 石{cost.stone}{cost.supplies > 0 ? ` 资${cost.supplies}` : ''}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </div>
  );
}

// ---------- 庇护所主页 ----------
interface Props {
  meta: MetaState;
  onChange: (m: MetaState) => void;
  onExplore: () => void;
  onOpenGacha: () => void;
  onOpenRoster: () => void;
}

export default function Base({ meta, onChange, onExplore, onOpenGacha, onOpenRoster }: Props) {
  const [panel, setPanel] = useState<{ buildingId: string | null } | null>(null);
  const phase = phaseOf(meta.day);
  const quest = dayQuest(meta.day);
  const ev = dayEvent(meta.day);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0b0f16', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}>
      <BaseScene meta={meta} onPlotClick={(bid) => setPanel({ buildingId: bid })} />

      {/* 顶部栏 */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 p-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg px-3 py-1.5 text-sm font-black text-white" style={{ background: 'rgba(20,28,38,0.9)', border: '1.5px solid #1a2735' }}>
            第 <span style={{ color: '#ffd94d' }}>{meta.day}</span>
            {meta.day <= MAX_DAY && <span className="text-xs" style={{ color: '#8a9aac' }}>/{MAX_DAY}</span>} 天
          </div>
          <div className="rounded-lg px-2 py-1 text-xs font-black" style={{ background: 'rgba(20,28,38,0.9)', border: `1.5px solid ${phase.color}`, color: phase.color }}>
            {phase.name}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '2px solid #a06810' }}>
            <span className="text-sm font-black" style={{ color: '#5c2e00' }}>战力 {meta.power}</span>
          </div>
          <div className="flex-1" />
          <div className="rounded-lg px-2 py-1 text-xs font-black text-white" style={{ background: 'rgba(20,28,38,0.9)', border: '1.5px solid #1a2735' }}>
            钻 {meta.gems}
          </div>
        </div>
        {/* 33 天进度条 */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(20,28,38,0.85)', border: '1px solid #1a2735' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (Math.min(meta.day, MAX_DAY) / MAX_DAY) * 100)}%`,
                background: `linear-gradient(90deg,#5be08a,${phase.color})`,
              }}
            />
          </div>
          <span className="text-[10px] font-black" style={{ color: '#8a9aac' }}>
            {meta.day <= MAX_DAY ? `距撤离 ${MAX_DAY - meta.day + 1} 天` : '无尽坚守中'}
          </span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <ResChip label="木" value={meta.res.wood} color="#b08a4a" />
          <ResChip label="石" value={meta.res.stone} color="#8a94a2" />
          <ResChip label="食" value={meta.res.food} color="#7bc86a" />
          <ResChip label="水" value={meta.res.water} color="#4ac8e8" />
          <ResChip label="资" value={meta.res.supplies} color="#ffd94d" />
          <ResChip label="券" value={meta.res.tickets} color="#37e0ff" />
        </div>
      </div>

      {/* 中部提示 */}
      <div className="pointer-events-none absolute left-1/2 top-[22%] -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-black" style={{ background: 'rgba(20,28,38,0.8)', color: '#9beeff', border: '1.5px solid #1a2735' }}>
        点击空地建造设施 · 点击建筑可升级
      </div>

      {/* 今日预报卡：任务 + 事件 */}
      <div className="pointer-events-none absolute bottom-24 left-1/2 w-[min(92%,430px)] -translate-x-1/2 rounded-xl px-3 py-2" style={{ background: 'rgba(20,28,38,0.88)', border: '2px solid #1a2735', boxShadow: '0 3px 0 rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black" style={{ color: '#9beeff' }}>今日任务</span>
          <span className="text-sm font-black text-white">{quest.label} ×{quest.need}</span>
          <div className="flex-1" />
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-black"
            style={{ background: 'rgba(15,22,30,0.8)', color: ev.color, border: `1px solid ${ev.color}` }}
          >
            {ev.icon !== '·' ? `${ev.icon} ` : ''}{ev.name}
          </span>
        </div>
        {ev.id !== 'none' && (
          <div className="mt-1 text-[11px] font-bold" style={{ color: '#b8c6d4' }}>{ev.desc}</div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-3 pb-5">
        <button
          onClick={onOpenRoster}
          className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
          style={{ background: 'rgba(20,28,38,0.92)', border: '2px solid #1a2735', boxShadow: '0 3px 0 rgba(0,0,0,0.4)' }}
        >
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="11" r="6" fill="#eef2f6" stroke="#2c343f" strokeWidth="2" />
            <path d="M5 27c1-6 5-9 11-9s10 3 11 9" fill="#eef2f6" stroke="#2c343f" strokeWidth="2" />
          </svg>
          <span className="text-xs font-black text-white">幸存者</span>
        </button>

        <button
          onClick={onExplore}
          className="rounded-2xl px-8 py-4 text-xl font-black active:translate-y-0.5"
          style={{ background: 'linear-gradient(180deg,#ffd94d,#f0a421)', border: '3px solid #a06810', color: '#5c2e00', boxShadow: '0 5px 0 rgba(0,0,0,0.45)', textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
        >
          出发探索 →
        </button>

        <button
          onClick={onOpenGacha}
          className="flex flex-col items-center gap-1 rounded-xl px-4 py-2"
          style={{ background: 'rgba(20,28,38,0.92)', border: '2px solid #37e0ff', boxShadow: '0 0 12px rgba(55,224,255,0.35)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#37e0ff" strokeWidth="1.8" opacity="0.6" />
            <circle cx="12" cy="12" r="5" stroke="#37e0ff" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="1.8" fill="#37e0ff" />
            <path d="M12 12L18 6" stroke="#9beeff" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-black text-white">招募电台</span>
        </button>
      </div>

      {panel && <BuildPanel meta={meta} buildingId={panel.buildingId} onClose={() => setPanel(null)} onChange={(m) => { onChange(m); }} />}
    </div>
  );
}
