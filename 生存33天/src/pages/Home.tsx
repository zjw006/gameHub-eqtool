// 场景总控：庇护所 ⇄ 探索战斗，资源/天数/养成结算
import { useCallback, useEffect, useState } from 'react';
import Base from './Base';
import Battle from './Battle';
import GachaModal from '../components/GachaModal';
import RosterModal from '../components/RosterModal';
import ClearModal from '../components/ClearModal';
import {
  loadMeta, saveMeta, computePerks, computePower, heroStats, tickProduction,
  type MetaState,
} from '../meta/store';
import { HERO_MAP } from '../meta/gamedata';
import { dayEvent, dayQuest, MAX_DAY } from '../meta/daycurve';
import type { BattleOptions, ResultData } from '../game/engine';

export default function Home() {
  const [meta, setMeta] = useState<MetaState>(() => loadMeta());
  const [scene, setScene] = useState<'base' | 'battle'>('base');
  const [battleKey, setBattleKey] = useState(0);
  const [showGacha, setShowGacha] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showClear, setShowClear] = useState(false);

  // 进入时结算挂机产出
  useEffect(() => {
    setMeta(prev => {
      const next = { ...prev, res: { ...prev.res } };
      tickProduction(next);
      saveMeta(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene === 'base']);

  const updateMeta = useCallback((next: MetaState) => {
    next.power = computePower(next);
    saveMeta(next);
    setMeta({ ...next });
  }, []);

  const buildBattleOptions = useCallback((): BattleOptions => {
    const squad = meta.formation.map(id => {
      if (!id) return null;
      const def = HERO_MAP[id];
      const lv = meta.roster[id] ?? 1;
      const st = heroStats(id, lv);
      return {
        id: def.id, name: def.name, job: def.job,
        look: def.look, weapon: def.weapon, level: lv,
        maxHp: st.maxHp, atk: st.atk, range: st.range, cdMax: st.cdMax,
      };
    });
    return { squad, day: meta.day, perks: computePerks(meta), event: dayEvent(meta.day), quest: dayQuest(meta.day) };
  }, [meta]);

  // 战斗结算回写（事件奖励倍率作用于击杀产出的木石）
  const handleExit = useCallback((mode: 'base' | 'retry', result: ResultData | null) => {
    const next: MetaState = { ...meta, res: { ...meta.res }, stats: { ...meta.stats } };
    let clearedNow = false;
    if (result?.win) {
      const rm = result.rewardMul ?? 1;
      next.res.supplies += result.cans;
      next.res.tickets += result.chest ? 2 : 1;
      next.res.wood += 20 + Math.round(result.kills * 2 * rm);
      next.res.stone += 15 + Math.round(result.kills * rm);
      next.res.food += 12;
      next.res.water += 12;
      if (result.chest) next.gems += 20;
      next.bonusPower = (next.bonusPower ?? 0) + result.powerGain;
      next.stats.totalKills += result.kills;
      next.stats.totalCans += result.cans;
      if (result.chest) next.stats.totalChests += 1;
      if (meta.day === MAX_DAY && !meta.cleared) { next.cleared = true; clearedNow = true; }
      next.day += 1;
    }
    updateMeta(next);
    if (mode === 'base') {
      setScene('base');
      if (clearedNow) setShowClear(true);
    } else setBattleKey(k => k + 1);
  }, [meta, updateMeta]);

  // 通关后重新挑战：保留英雄/建筑/资源，回到第 1 天
  const restartChallenge = useCallback(() => {
    const next: MetaState = { ...meta, day: 1, bonusPower: 0 };
    updateMeta(next);
    setShowClear(false);
  }, [meta, updateMeta]);

  const canExplore = meta.formation.some(id => !!id);

  if (scene === 'battle') {
    return (
      <Battle
        key={battleKey}
        options={buildBattleOptions()}
        power={meta.power}
        gems={meta.gems}
        onExit={handleExit}
      />
    );
  }

  return (
    <>
      <Base
        meta={meta}
        onChange={updateMeta}
        onExplore={() => canExplore && setScene('battle')}
        onOpenGacha={() => setShowGacha(true)}
        onOpenRoster={() => setShowRoster(true)}
      />
      {showGacha && <GachaModal meta={meta} onChange={updateMeta} onClose={() => setShowGacha(false)} />}
      {showRoster && <RosterModal meta={meta} onChange={updateMeta} onClose={() => setShowRoster(false)} />}
      {showClear && <ClearModal meta={meta} onContinue={() => setShowClear(false)} onRestart={restartChallenge} />}
    </>
  );
}
