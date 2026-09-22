import { useEffect, useRef, useState } from 'react'
import type { Debris, FloatText } from '@/types/game'
import { Barrel, Bottle, Chest, Cloth, Cone, SharkFin, WoodPlank } from './art'

const KIND_STYLE: Record<Debris['kind'], { label: string; color: string }> = {
  wood:    { label: '+1 木材', color: '#e8b04b' },
  plastic: { label: '+1 塑料', color: '#f0946a' },
  cloth:   { label: '+1 碎布', color: '#f0d98a' },
  barrel:  { label: '+2木材 +1塑料', color: '#e8b04b' },
  chest:   { label: '宝箱！', color: '#f0c93f' },
}

function spawnDebris(id: number, fromEdge = true): Debris {
  const roll = Math.random()
  const kind: Debris['kind'] = roll < 0.4 ? 'wood' : roll < 0.58 ? 'plastic' : roll < 0.74 ? 'cloth' : roll < 0.9 ? 'barrel' : 'chest'
  return {
    id, kind,
    x: fromEdge ? 105 : 10 + Math.random() * 85,
    y: 8 + Math.random() * 84,
    vx: -(2.5 + Math.random() * 2.5), // %/s
    bob: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.5,
  }
}

export function OceanScene({ onCollect }: { onCollect: (kind: Debris['kind']) => void }) {
  const idRef = useRef(0)
  const fidRef = useRef(0)
  const [debris, setDebris] = useState<Debris[]>(() =>
    Array.from({ length: 6 }, () => spawnDebris(++idRef.current, false))
  )
  const [floats, setFloats] = useState<FloatText[]>([])
  const [sharkX, setSharkX] = useState(-15)
  const debrisRef = useRef(debris)
  debrisRef.current = debris

  // 漂浮物生成 & 移动
  useEffect(() => {
    const tick = setInterval(() => {
      setDebris(list => {
        let next = list
          .map(d => ({ ...d, x: d.x + d.vx * 0.5, bob: d.bob + 0.08 }))
          .filter(d => d.x > -14)
        if (next.length < 9 && Math.random() < 0.55) next = [...next, spawnDebris(++idRef.current)]
        return next
      })
    }, 500)
    return () => clearInterval(tick)
  }, [])

  // 鲨鱼巡游
  useEffect(() => {
    const t = setInterval(() => {
      setSharkX(x => {
        if (x > 115) return -20
        return x + 0.35
      })
    }, 120)
    return () => clearInterval(t)
  }, [])

  const handleClick = (d: Debris, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const parent = (e.currentTarget as HTMLElement).parentElement!.getBoundingClientRect()
    const fx = rect.left - parent.left + rect.width / 2
    const fy = rect.top - parent.top
    const style = KIND_STYLE[d.kind]
    const id = ++fidRef.current
    setFloats(f => [...f, { id, x: fx, y: fy, text: style.label, color: style.color }])
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1200)
    setDebris(list => list.filter(x => x.id !== d.id))
    onCollect(d.kind)
  }

  return (
    <div className="absolute inset-0 overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg,#4a7fd4 0%,#3563b8 30%,#26488f 65%,#1a3370 100%)' }}>
      {/* 波光 */}
      <svg className="absolute inset-0 w-full h-full opacity-25" preserveAspectRatio="none">
        <defs>
          <pattern id="waves" width="180" height="90" patternUnits="userSpaceOnUse">
            <path d="M10 30 Q25 22 40 30 T70 30" fill="none" stroke="#8fb8ee" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M100 70 Q115 62 130 70 T160 70" fill="none" stroke="#8fb8ee" strokeWidth="2.5" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="200%" height="100%" fill="url(#waves)" className="wave-drift" />
      </svg>
      {/* 远处光斑 */}
      <div className="absolute w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: '#9fd0f0', top: '10%', left: '-10%' }} />
      <div className="absolute w-56 h-56 rounded-full opacity-15 blur-3xl" style={{ background: '#7fb8e8', bottom: '5%', right: '-15%' }} />
      {/* 水下废墟剪影 */}
      <svg className="absolute bottom-0 left-0 w-full opacity-15" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ height: '30%' }}>
        <path d="M0 120 L0 70 L30 70 L35 40 L60 40 L65 75 L110 75 L120 30 L150 30 L158 80 L210 80 L220 50 L260 55 L268 85 L320 85 L330 45 L360 45 L368 78 L400 78 L400 120 Z" fill="#0e1f4a" />
      </svg>

      {/* 漂浮物 */}
      {debris.map(d => (
        <button key={d.id} onClick={e => handleClick(d, e)}
          className="absolute cursor-pointer transition-transform active:scale-90"
          style={{
            left: `${d.x}%`, top: `${d.y}%`,
            transform: `translate(-50%,-50%) scale(${d.scale}) translateY(${Math.sin(d.bob) * 4}px)`,
            zIndex: 10, background: 'none', border: 'none', padding: 6,
          }}>
          {d.kind === 'wood' && <WoodPlank />}
          {d.kind === 'plastic' && <Bottle />}
          {d.kind === 'cloth' && <Cloth />}
          {d.kind === 'barrel' && <Barrel />}
          {d.kind === 'chest' && <Chest />}
          {/* 水圈 */}
          <svg className="absolute left-1/2 top-[70%] -translate-x-1/2" width="56" height="16" viewBox="0 0 56 16" style={{ opacity: .5 }}>
            <ellipse cx="28" cy="8" rx="24" ry="5" fill="none" stroke="#cfe6ff" strokeWidth="2" />
          </svg>
        </button>
      ))}

      {/* 鲨鱼 */}
      {sharkX > -18 && sharkX < 112 && (
        <div className="absolute pointer-events-none" style={{ left: `${sharkX}%`, top: '62%', zIndex: 5 }}>
          <SharkFin />
        </div>
      )}
      {/* 路锥装饰 */}
      <div className="absolute pointer-events-none" style={{ left: '8%', top: '78%', opacity: .9, transform: 'rotate(-8deg)' }}><Cone /></div>
      <div className="absolute pointer-events-none" style={{ right: '6%', top: '30%', opacity: .9, transform: 'rotate(10deg)' }}><Cone /></div>

      {/* 漂浮文字 */}
      {floats.map(f => (
        <div key={f.id} className="float-up absolute pointer-events-none font-bold whitespace-nowrap"
          style={{ left: f.x, top: f.y, color: f.color, textShadow: '0 2px 0 #1c2a4a, 0 0 6px #1c2a4a', zIndex: 30, fontSize: 15 }}>
          {f.text}
        </div>
      ))}
    </div>
  )
}
