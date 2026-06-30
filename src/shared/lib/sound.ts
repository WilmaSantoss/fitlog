// Sons sintetizados via Web Audio (sem assets externos).
// Cada som é uma sequência curta de notas com envelope simples.

import {
  DEFAULT_SOUND_ID,
  EVENT_FOLDERS,
  SOUND_OPTIONS,
  type SoundEvent,
} from './sound-options';
import { useSoundPrefsStore } from '@/shared/state/sound-prefs.store';

let currentAudio: HTMLAudioElement | null = null;
let currentTimers: number[] = [];

function clearCurrentTimers(): void {
  for (const id of currentTimers) window.clearTimeout(id);
  currentTimers = [];
}

function stopCurrentAudio(): void {
  clearCurrentTimers();
  if (currentAudio) {
    const a = currentAudio;
    currentAudio = null;
    try {
      a.pause();
      a.currentTime = 0;
      a.volume = 0;
      a.src = '';
      a.load();
    } catch {
      // ignorar
    }
  }
}

function playFile(event: SoundEvent, file: string, maxMs?: number): void {
  try {
    stopCurrentAudio();
    const audio = new Audio(`/sounds/${EVENT_FOLDERS[event]}/${file}`);
    const baseVolume = 0.9;
    audio.volume = baseVolume;
    currentAudio = audio;
    audio.addEventListener('ended', () => {
      if (currentAudio === audio) {
        clearCurrentTimers();
        currentAudio = null;
      }
    });
    void audio.play();

    if (maxMs && maxMs > 0) {
      const fadeMs = Math.min(400, maxMs);
      const steps = 8;
      const stepMs = fadeMs / steps;
      const fadeStartAt = Math.max(0, maxMs - fadeMs);
      for (let i = 1; i <= steps; i += 1) {
        const id = window.setTimeout(() => {
          if (currentAudio === audio) audio.volume = baseVolume * (1 - i / steps);
        }, fadeStartAt + stepMs * i);
        currentTimers.push(id);
      }
      const stopId = window.setTimeout(() => {
        if (currentAudio === audio) stopCurrentAudio();
      }, maxMs);
      currentTimers.push(stopId);
    }
  } catch {
    // ignorar erros de autoplay/permissão; cai no synth via caller
  }
}

function playDefault(event: SoundEvent): void {
  if (event === 'restDone') playRestDone();
  else if (event === 'pr') playFanfare();
}

const EVENT_MAX_MS: Partial<Record<SoundEvent, number>> = {
  restDone: 4000,
  pr: 4000,
};

export function playEventSound(event: SoundEvent): void {
  const id = useSoundPrefsStore.getState().prefs[event] ?? DEFAULT_SOUND_ID;
  if (id !== DEFAULT_SOUND_ID) {
    const opt = SOUND_OPTIONS[event].find((o) => o.id === id);
    if (opt) {
      playFile(event, opt.file, EVENT_MAX_MS[event]);
      return;
    }
  }
  playDefault(event);
}

// Preview do som — usado na tela de configuração
export function previewSoundOption(optionId: string, event: SoundEvent): void {
  if (optionId === DEFAULT_SOUND_ID) {
    playDefault(event);
    return;
  }
  const opt = SOUND_OPTIONS[event].find((o) => o.id === optionId);
  if (opt) playFile(event, opt.file);
}

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

// Sino tipo "ding-dong" pra fim de descanso. Soa como um chime suave,
// não como bipe de despertador. Usa sine waves com decay longo e
// uma quinta harmônica pra dar corpo de sino.
export function playRestDone(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  function chime(freq: number, offset: number): void {
    if (!ctx) return;
    const fundamental = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const g = ctx.createGain();
    fundamental.type = 'sine';
    fundamental.frequency.value = freq;
    overtone.type = 'sine';
    overtone.frequency.value = freq * 2.01;
    g.gain.setValueAtTime(0, now + offset);
    g.gain.linearRampToValueAtTime(0.32, now + offset + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.4);
    fundamental.connect(g);
    overtone.connect(g);
    g.connect(ctx.destination);
    fundamental.start(now + offset);
    overtone.start(now + offset);
    fundamental.stop(now + offset + 1.45);
    overtone.stop(now + offset + 1.45);
  }

  // E5 → C5 (ding-dong descendente, padrão clássico de campainha)
  chime(659.25, 0);
  chime(523.25, 0.45);
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
