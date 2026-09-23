// 极简合成音效：无需任何音频资源
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(m: boolean) { muted = m; }
export function isMuted() { return muted; }

function beep(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, low = 400) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = low;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  shoot() { beep(880 + Math.random() * 120, 0.07, 'square', 0.05, -500); },
  melee() { noise(0.08, 0.10, 900); },
  hit() { noise(0.06, 0.08, 500); },
  hurt() { beep(220, 0.12, 'sawtooth', 0.06, -80); },
  heal() { beep(660, 0.15, 'sine', 0.05, 220); },
  pickup() { beep(720, 0.09, 'sine', 0.07, 260); setTimeout(() => beep(1080, 0.1, 'sine', 0.06), 70); },
  chest() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.14, 'triangle', 0.07), i * 80)); },
  slam() { noise(0.3, 0.22, 240); },
  die() { beep(320, 0.25, 'sawtooth', 0.07, -220); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.08), i * 110)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => beep(f, 0.25, 'sawtooth', 0.07), i * 160)); },
  alarm() { beep(980, 0.12, 'square', 0.05); setTimeout(() => beep(980, 0.12, 'square', 0.05), 180); },
};
