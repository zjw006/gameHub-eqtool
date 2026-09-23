import { useEffect, useRef, useState } from 'react';
import { Game, type BattleOptions, type HudSnapshot, type ResultData } from '../game/engine';
import GameHUD from '../components/GameHUD';
import HeroPanel from '../components/HeroPanel';

let bannerId = 0;

interface Props {
  options: BattleOptions;
  power: number;
  gems: number;
  onExit: (mode: 'base' | 'retry', result: ResultData | null) => void;
}

export default function Battle({ options, power, gems, onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const hudRef = useRef<HudSnapshot | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [showHeroes, setShowHeroes] = useState(false);
  const [banners, setBanners] = useState<{ id: number; text: string }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const game = new Game(
      canvas,
      s => { hudRef.current = s; setHud(s); },
      text => {
        const id = ++bannerId;
        setBanners(bs => [...bs.slice(-2), { id, text }]);
        setTimeout(() => setBanners(bs => bs.filter(b => b.id !== id)), 2600);
      },
      options
    );
    gameRef.current = game;
    game.start();
    return () => game.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#0b0f16', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: 'none' }} />
      <GameHUD
        hud={hud}
        gameRef={gameRef}
        banners={banners}
        power={power}
        gems={gems}
        onOpenHeroes={() => setShowHeroes(true)}
        onExit={(mode) => onExit(mode, hudRef.current?.result ?? null)}
      />
      {showHeroes && <HeroPanel hud={hud} onClose={() => setShowHeroes(false)} />}
    </div>
  );
}
