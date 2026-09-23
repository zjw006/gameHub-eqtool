// 幸存者列表 + 布阵（6 格：前排 3 / 后排 3）
import { useState } from 'react';
import { HERO_MAP, QUALITY_COLOR, type Job } from '../meta/gamedata';
import { heroStats, heroUpgradeCost, type MetaState } from '../meta/store';
import { heroPortrait } from '../meta/portraits';
import { sfx } from '../game/audio';

const JOB_COLOR: Record<Job, string> = { 坦克: '#e5484d', 战士: '#e8912d', 远程: '#4a8cd8', 辅助: '#9a5ae0' };
const MAX_LV = 30;

interface Props {
  meta: MetaState;
  onChange: (m: MetaState) => void;
  onClose: () => void;
}

export default function RosterModal({ meta, onChange, onClose }: Props) {
  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [detail, setDetail] = useState<string | null>(null);
  const [slot, setSlot] = useState(0);

  const owned = Object.keys(meta.roster).filter(id => HERO_MAP[id]);
  const formation = meta.formation;

  const assign = (heroId: string) => {
    const next: MetaState = { ...meta, formation: [...meta.formation] };
    const cur = next.formation.indexOf(heroId);
    if (cur >= 0) next.formation[cur] = null;
    next.formation[slot] = heroId;
    sfx.pickup();
    onChange(next);
  };

  const clearSlot = (i: number) => {
    const next: MetaState = { ...meta, formation: [...meta.formation] };
    next.formation[i] = null;
    onChange(next);
  };

  const upgrade = (heroId: string) => {
    const lv = meta.roster[heroId];
    const cost = heroUpgradeCost(lv);
    if (lv >= MAX_LV) return;
    if (meta.res.supplies < cost.supplies || meta.res.food < cost.food) return;
    const next: MetaState = { ...meta, res: { ...meta.res }, roster: { ...meta.roster } };
    next.res.supplies -= cost.supplies;
    next.res.food -= cost.food;
    next.roster[heroId] = lv + 1;
    sfx.heal();
    onChange(next);
  };

  const card = (id: string, opts?: { small?: boolean; onTap?: () => void; badge?: string }) => {
    const def = HERO_MAP[id];
    const lv = meta.roster[id];
    const qc = QUALITY_COLOR[def.quality];
    return (
      <div
        key={id}
        onClick={opts?.onTap}
        className="relative flex cursor-pointer flex-col items-center rounded-xl p-2 active:scale-95"
        style={{
          background: `linear-gradient(180deg, ${qc}44, ${qc}18)`,
          border: `2.5px solid ${qc}`,
          boxShadow: '0 3px 0 rgba(0,0,0,0.35)',
        }}
      >
        <span
          className="absolute left-0 top-1.5 rounded-r px-1 text-[9px] font-black text-white"
          style={{ background: JOB_COLOR[def.job], border: '1px solid rgba(0,0,0,0.35)', borderLeft: 'none' }}
        >
          {def.job}
        </span>
        {opts?.badge && (
          <span className="absolute right-1 top-1 rounded px-1 text-[9px] font-black" style={{ background: '#2fa85c', color: '#08301a' }}>{opts.badge}</span>
        )}
        <div className={`${opts?.small ? 'h-12 w-12' : 'h-16 w-16'} mt-2 overflow-hidden rounded-full`} style={{ background: 'rgba(15,22,30,0.5)', border: `2px solid ${qc}` }}>
          <img src={heroPortrait(id)} alt={def.name} className="h-full w-full" draggable={false} />
        </div>
        <div className="mt-1 text-xs font-black text-white">{def.name}</div>
        <div className="text-[10px] font-bold" style={{ color: qc }}>{def.quality} · Lv.{lv}</div>
      </div>
    );
  };

  const slotBox = (i: number, label: string) => {
    const id = formation[i];
    const def = id ? HERO_MAP[id] : null;
    const selected = slot === i;
    return (
      <div
        key={i}
        onClick={() => (id ? clearSlot(i) : setSlot(i))}
        className="relative flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl active:scale-95"
        style={{
          background: id ? `linear-gradient(180deg, ${QUALITY_COLOR[def!.quality]}44, ${QUALITY_COLOR[def!.quality]}18)` : 'rgba(15,22,30,0.55)',
          border: selected ? '3px solid #ffd94d' : id ? `2.5px solid ${QUALITY_COLOR[def!.quality]}` : '2.5px dashed #4a5a6a',
          boxShadow: selected ? '0 0 12px rgba(255,217,77,0.5)' : 'none',
        }}
      >
        {def ? (
          <>
            <div className="h-12 w-12 overflow-hidden rounded-full" style={{ background: 'rgba(15,22,30,0.5)' }}>
              <img src={heroPortrait(id!)} alt={def.name} className="h-full w-full" draggable={false} />
            </div>
            <div className="mt-0.5 text-[11px] font-black text-white">{def.name}</div>
            <div className="text-[9px] font-bold" style={{ color: '#8a9aac' }}>点击下阵</div>
          </>
        ) : (
          <>
            <div className="text-2xl font-black" style={{ color: '#4a5a6a' }}>+</div>
            <div className="text-[10px] font-bold" style={{ color: '#4a5a6a' }}>{label}</div>
          </>
        )}
        <span className="absolute left-1 top-1 rounded px-1 text-[9px] font-black" style={{ background: 'rgba(15,22,30,0.8)', color: '#9beeff' }}>
          {i < 3 ? `前排${i + 1}` : `后排${i - 2}`}
        </span>
      </div>
    );
  };

  const detailDef = detail ? HERO_MAP[detail] : null;

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-center justify-center" style={{ background: 'rgba(5,8,14,0.78)', fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }} onClick={onClose}>
      <div
        className="relative flex max-h-[86%] w-[94%] max-w-md flex-col overflow-hidden rounded-2xl"
        style={{ background: '#2c3e52', border: '3px solid #1a2735', boxShadow: '0 8px 0 rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="relative py-2.5 text-center" style={{ background: '#22303f', borderBottom: '2px solid #1a2735' }}>
          <span className="text-lg font-black text-white">幸存者</span>
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[11px] font-bold" style={{ color: '#8a9aac' }}>
            已获得：{owned.length}/12
          </span>
          <button onClick={onClose} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-0.5 text-sm font-black text-white" style={{ background: 'rgba(15,22,30,0.7)', border: '1.5px solid #1a2735' }}>✕</button>
        </div>

        {/* 页签：养成 / 布阵 */}
        <div className="flex" style={{ background: '#1c2836' }}>
          {([['list', '养成'], ['form', '布阵']] as const).map(([k, name]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="flex-1 py-2 text-sm font-black"
              style={{
                background: tab === k ? '#2c3e52' : 'transparent',
                color: tab === k ? '#ffd94d' : '#8a9aac',
                borderBottom: tab === k ? '3px solid #ffd94d' : '3px solid transparent',
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'list' ? (
            <div className="grid grid-cols-3 gap-2.5">
              {owned.map(id => card(id, { onTap: () => setDetail(id), badge: formation.includes(id) ? '上阵' : undefined }))}
            </div>
          ) : (
            <div>
              <div className="mb-1 text-xs font-black" style={{ color: '#ff9b9b' }}>前排（近战/坦克，承受伤害）</div>
              <div className="mb-3 grid grid-cols-3 gap-2">{[0, 1, 2].map(i => slotBox(i, '空位'))}</div>
              <div className="mb-1 text-xs font-black" style={{ color: '#9beeff' }}>后排（远程/辅助，输出治疗）</div>
              <div className="mb-3 grid grid-cols-3 gap-2">{[3, 4, 5].map(i => slotBox(i, '空位'))}</div>
              <div className="mb-1.5 text-xs font-black" style={{ color: '#8a9aac' }}>
                点击下方英雄上阵到「{slot < 3 ? `前排${slot + 1}` : `后排${slot - 2}`}」
              </div>
              <div className="grid grid-cols-4 gap-2">
                {owned.map(id => (
                  <div key={id} className="relative">
                    {card(id, { small: true, onTap: () => assign(id) })}
                    {formation.includes(id) && (
                      <div className="absolute inset-0 flex items-end justify-center rounded-xl pb-1" style={{ background: 'rgba(10,16,24,0.45)' }}>
                        <span className="rounded px-1.5 text-[10px] font-black" style={{ background: '#2fa85c', color: '#eafff2' }}>已上阵</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 英雄详情 / 升级 */}
        {detailDef && detail && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(5,8,14,0.85)' }} onClick={() => setDetail(null)}>
            <div className="w-[80%] rounded-2xl p-4 text-center" style={{ background: '#2c3e52', border: `3px solid ${QUALITY_COLOR[detailDef.quality]}` }} onClick={e => e.stopPropagation()}>
              <div className="mx-auto h-24 w-24 overflow-hidden rounded-full" style={{ background: 'rgba(15,22,30,0.6)', border: `3px solid ${QUALITY_COLOR[detailDef.quality]}` }}>
                <img src={heroPortrait(detail)} alt={detailDef.name} className="h-full w-full" draggable={false} />
              </div>
              <div className="mt-2 text-lg font-black text-white">{detailDef.name} <span className="text-xs" style={{ color: QUALITY_COLOR[detailDef.quality] }}>{detailDef.quality}</span></div>
              <div className="text-xs font-bold" style={{ color: '#8a9aac' }}>{detailDef.job} · Lv.{meta.roster[detail]}</div>
              <p className="mt-1 text-xs font-bold" style={{ color: '#b8c6d4' }}>{detailDef.desc}</p>
              <div className="mx-auto mt-2 grid w-fit grid-cols-2 gap-x-6 text-left text-xs font-bold" style={{ color: '#9beeff' }}>
                {(() => {
                  const st = heroStats(detail, meta.roster[detail]);
                  return (
                    <>
                      <div>生命 {st.maxHp}</div>
                      <div>攻击 {st.atk}</div>
                      <div>射程 {st.range}</div>
                      <div>攻速 {(1 / st.cdMax).toFixed(1)}/s</div>
                    </>
                  );
                })()}
              </div>
              {(() => {
                const lv = meta.roster[detail];
                const cost = heroUpgradeCost(lv);
                const afford = meta.res.supplies >= cost.supplies && meta.res.food >= cost.food;
                return lv >= MAX_LV ? (
                  <div className="mt-3 text-sm font-black" style={{ color: '#8a9aac' }}>已满级</div>
                ) : (
                  <button
                    onClick={() => upgrade(detail)}
                    disabled={!afford}
                    className="mt-3 w-full rounded-xl py-2.5 text-sm font-black disabled:opacity-40"
                    style={{ background: 'linear-gradient(180deg,#5be08a,#2fa85c)', border: '2px solid #1a6a3c', color: '#08301a' }}
                  >
                    升级（物资 {cost.supplies} + 食物 {cost.food}）→ Lv.{lv + 1}
                  </button>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
