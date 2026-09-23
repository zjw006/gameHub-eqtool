import { useCallback, useEffect, useRef, useState } from 'react'
import { Game } from './game/engine'
import GameCanvas from './components/GameCanvas'
import SkillModal from './components/SkillModal'
import HUD from './components/HUD'
import { MenuScreen, EndScreen } from './components/Screens'
import type { SkillDef } from './game/types'

const SAVE_KEY = 'yjtw_save_v1'
interface Save { coins: number; trainLevel: number; bestWave: number }

function loadSave(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) return { coins: 0, trainLevel: 0, bestWave: 0, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { coins: 0, trainLevel: 0, bestWave: 0 }
}

type Phase = 'menu' | 'battle' | 'end'

export default function App() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [save, setSave] = useState<Save>(loadSave)
  const [, forceTick] = useState(0)
  const [selectedPad, setSelectedPad] = useState<number | null>(null)
  const [victory, setVictory] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const [showSkill, setShowSkill] = useState(false)
  const gameRef = useRef<Game | null>(null)

  const persist = (s: Save) => {
    setSave(s)
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
  }

  const startBattle = useCallback(() => {
    const g = new Game()
    g.metaBonus.dmg = save.trainLevel * 0.08
    g.onEvent = (e) => {
      if (e.type === 'wave-clear') {
        setShowSkill(true)
        forceTick(t => t + 1)
      } else if (e.type === 'game-over' || e.type === 'victory') {
        const v = e.type === 'victory'
        setVictory(v)
        const earned = g.stats.kills * 2 + g.stats.wavesCleared * 25 + (v ? 300 : 0)
        setCoinsEarned(earned)
        persist({
          ...save,
          coins: save.coins + earned,
          bestWave: Math.max(save.bestWave, g.stats.wavesCleared + (v ? 1 : 0)),
        })
        // 延迟展示结算，看清最后一击
        setTimeout(() => setPhase('end'), 900)
      }
    }
    gameRef.current = g
    setShowSkill(false)
    setSelectedPad(null)
    setPhase('battle')
    g.startNextWave()
  }, [save])

  // HUD 定时刷新
  useEffect(() => {
    if (phase !== 'battle') return
    const id = setInterval(() => forceTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [phase])

  const g = gameRef.current
  const trainCost = 100 + save.trainLevel * 80

  return (
    <div className="min-h-screen bg-[#141a12] flex items-center justify-center overflow-hidden">
      <div
        className="relative select-none"
        style={{
          width: 'min(100vw, calc(100vh * 0.6))',
          height: 'min(100vh, calc(100vw / 0.6))',
          maxWidth: 540,
          maxHeight: 900,
          aspectRatio: '540 / 900',
        }}
      >
        {(phase === 'battle' || phase === 'end') && g && (
          <>
            <GameCanvas
              game={g}
              selectedPad={selectedPad}
              setSelectedPad={setSelectedPad}
              onPadSwap={(a, b) => { g.swapPads(a, b); forceTick(t => t + 1) }}
            />
            <HUD
              wave={g.wave}
              time={g.time}
              speed={g.speed}
              paused={g.paused}
              onToggleSpeed={() => { g.speed = g.speed === 1 ? 2 : 1; forceTick(t => t + 1) }}
              onTogglePause={() => { g.paused = !g.paused; forceTick(t => t + 1) }}
              onQuit={() => { setPhase('menu') }}
            />
            {showSkill && g.intermission && !g.over && (
              <SkillModal
                offers={g.currentOffers}
                refreshLeft={g.refreshLeft}
                wave={g.wave}
                onPick={(s: SkillDef) => { g.applySkill(s); setShowSkill(false); forceTick(t => t + 1) }}
                onReroll={() => { g.reroll(); forceTick(t => t + 1) }}
              />
            )}
          </>
        )}
        {phase === 'menu' && (
          <MenuScreen
            coins={save.coins}
            trainLevel={save.trainLevel}
            trainCost={trainCost}
            bestWave={save.bestWave}
            onStart={startBattle}
            onTrain={() => {
              if (save.coins >= trainCost) {
                persist({ ...save, coins: save.coins - trainCost, trainLevel: save.trainLevel + 1 })
              }
            }}
          />
        )}
        {phase === 'end' && g && (
          <EndScreen
            victory={victory}
            stats={g.stats}
            coinsEarned={coinsEarned}
            onRetry={startBattle}
            onMenu={() => setPhase('menu')}
          />
        )}
      </div>
    </div>
  )
}
