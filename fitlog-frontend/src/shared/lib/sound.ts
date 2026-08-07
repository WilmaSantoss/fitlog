// Sons sintetizados via Web Audio (sem assets externos).
// Cada som é uma sequência curta de notas com envelope simples.

import {
  DEFAULT_SOUND_ID,
  EVENT_FOLDERS,
  SOUND_OPTIONS,
  type SoundEvent,
} from './sound-options';
import { useSoundPrefsStore } from '@/shared/state/sound-prefs.store';

// Diz ao Safari (16.4+) que nosso áudio é "ambiente": toca por cima do
// que já estiver tocando (ex.: Spotify) sem roubar o foco de reprodução.
// Sem isto, o iOS pausa o Spotify e não retoma. No modo ambient a mídia
// respeita o interruptor de silencioso do iPhone, o que é o comportamento
// esperado.
function configureAmbientAudioSession(): void {
  if (typeof navigator === 'undefined') return;
  const nav = navigator as Navigator & {
    audioSession?: { type: string };
  };
  if (!nav.audioSession) return;
  try {
    nav.audioSession.type = 'ambient';
  } catch {
    // ignora — API pode não estar disponível
  }
}

configureAmbientAudioSession();

// Reproduzimos MP3s via Web Audio (decode → BufferSource) em vez de
// <audio> HTML. Motivo: com audioSession=ambient o iOS silencia o
// HTMLAudioElement, mas Web Audio continua tocando normalmente.
// Bônus: buffer decodificado é cacheado, então tocar de novo é
// instantâneo (sem network nem decode).
type CurrentPlayback = {
  source: AudioBufferSourceNode;
  gain: GainNode;
  ctx: AudioContext;
};

let currentPlayback: CurrentPlayback | null = null;
let currentTimers: number[] = [];
const bufferCache = new Map<string, Promise<AudioBuffer>>();

function clearCurrentTimers(): void {
  for (const id of currentTimers) window.clearTimeout(id);
  currentTimers = [];
}

function stopCurrentAudio(): void {
  clearCurrentTimers();
  if (currentPlayback) {
    const { source, gain } = currentPlayback;
    currentPlayback = null;
    try {
      gain.gain.value = 0;
      source.stop();
      source.disconnect();
      gain.disconnect();
    } catch {
      // fonte já parada — ignora
    }
  }
}

function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(url);
  if (cached) return cached;
  const promise = fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf));
  bufferCache.set(url, promise);
  // Se falhar, remove do cache pra permitir retry no próximo play
  promise.catch(() => bufferCache.delete(url));
  return promise;
}

function playFile(event: SoundEvent, file: string, maxMs?: number): void {
  const ctx = getCtx();
  if (!ctx) return;
  stopCurrentAudio();
  const url = `/sounds/${EVENT_FOLDERS[event]}/${file}`;
  const baseVolume = 0.9;
  void loadBuffer(ctx, url)
    .then((buffer) => {
      // Se outra reprodução começou enquanto decodificávamos, desiste
      if (currentPlayback) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = baseVolume;
      source.connect(gain).connect(ctx.destination);
      const playback: CurrentPlayback = { source, gain, ctx };
      currentPlayback = playback;
      source.onended = () => {
        if (currentPlayback === playback) {
          clearCurrentTimers();
          currentPlayback = null;
        }
      };
      const now = ctx.currentTime;
      source.start(now);

      if (maxMs && maxMs > 0) {
        const fadeMs = Math.min(400, maxMs);
        const fadeStartAt = Math.max(0, maxMs - fadeMs) / 1000;
        const stopAt = maxMs / 1000;
        gain.gain.setValueAtTime(baseVolume, now + fadeStartAt);
        gain.gain.linearRampToValueAtTime(0.0001, now + stopAt);
        try {
          source.stop(now + stopAt);
        } catch {
          // ignora
        }
      }
    })
    .catch(() => {
      // erro de fetch/decode — silencioso; caller já lida com fallback
    });
}

function playDefault(event: SoundEvent): void {
  // Interrompe qualquer MP3 em andamento antes de tocar o synth,
  // se não a preview do padrão fica sobreposta ao MP3 anterior.
  stopCurrentAudio();
  if (event === 'restDone') playRestDone();
  else if (event === 'pr') playFanfare();
}

const EVENT_MAX_MS: Partial<Record<SoundEvent, number>> = {
  restDone: 5000,
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
