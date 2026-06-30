// Sons sintetizados via Web Audio (sem assets externos).
// Cada som é uma sequência curta de notas com envelope simples.

let cachedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!cachedCtx) cachedCtx = new Ctor();
  // alguns browsers suspendem o ctx até interação do usuário
  if (cachedCtx.state === 'suspended') void cachedCtx.resume();
  return cachedCtx;
}

type Note = { freq: number; offset: number; duration: number };

function play(notes: readonly Note[], gain = 0.18): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = note.freq;
    osc.type = 'triangle';
    g.gain.setValueAtTime(0, now + note.offset);
    g.gain.linearRampToValueAtTime(gain, now + note.offset + 0.015);
    g.gain.exponentialRampToValueAtTime(
      0.0001,
      now + note.offset + note.duration,
    );
    osc.connect(g).connect(ctx.destination);
    osc.start(now + note.offset);
    osc.stop(now + note.offset + note.duration + 0.05);
  }
}

// Arpejo ascendente C5-E5-G5-C6 (acorde maior, sensação de "subiu de nível")
export function playLevelUp(): void {
  play([
    { freq: 523.25, offset: 0.0, duration: 0.18 },
    { freq: 659.25, offset: 0.09, duration: 0.18 },
    { freq: 783.99, offset: 0.18, duration: 0.22 },
    { freq: 1046.5, offset: 0.28, duration: 0.32 },
  ]);
}

// Som mais "fanfarra" pra PR all-time: duas notas rápidas + sustain
export function playFanfare(): void {
  play(
    [
      { freq: 523.25, offset: 0.0, duration: 0.12 },
      { freq: 783.99, offset: 0.08, duration: 0.12 },
      { freq: 1046.5, offset: 0.18, duration: 0.45 },
      { freq: 1318.51, offset: 0.18, duration: 0.45 },
    ],
    0.16,
  );
}
