import { useEffect, useRef } from 'react'
import { Game } from '../game/engine'
import { render } from '../game/render'
import { VIEW_W, VIEW_H } from '../game/data'

interface Props {
  game: Game
  onPadSwap: (a: number, b: number) => void
  selectedPad: number | null
  setSelectedPad: (i: number | null) => void
}

export default function GameCanvas({ game, onPadSwap, selectedPad, setSelectedPad }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selRef = useRef<number | null>(null)
  selRef.current = selectedPad

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      game.update(dt)
      ctx.save()
      ctx.scale(canvas.width / VIEW_W, canvas.height / VIEW_H)
      render(game, ctx)
      // 选中槽位高亮
      if (selRef.current !== null) {
        const pad = game.pads[selRef.current]
        ctx.strokeStyle = '#ffd94a'
        ctx.lineWidth = 3
        ctx.strokeRect(pad.x - 48, pad.y - 36, 96, 76)
      }
      ctx.restore()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [game])

  const handleClick = (ev: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = ((ev.clientX - rect.left) / rect.width) * VIEW_W
    const y = ((ev.clientY - rect.top) / rect.height) * VIEW_H
    // 找点击的槽位
    const idx = game.pads.findIndex(p => Math.abs(p.x - x) < 48 && Math.abs(p.y - y) < 40)
    if (idx === -1) { setSelectedPad(null); return }
    const pad = game.pads[idx]
    if (pad.locked) { setSelectedPad(null); return }
    if (selectedPad === null) {
      if (pad.unit) setSelectedPad(idx)
    } else {
      if (selectedPad === idx) setSelectedPad(null)
      else { onPadSwap(selectedPad, idx); setSelectedPad(null) }
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W * 2}
      height={VIEW_H * 2}
      onClick={handleClick}
      style={{ width: '100%', height: '100%', display: 'block', touchAction: 'manipulation' }}
    />
  )
}
