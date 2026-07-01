// Gera um WAV silencioso em memória pra manter o iOS achando que o app
// está tocando mídia (necessário pra ativar os controles da tela de bloqueio).

let cachedUrl: string | null = null;

function makeSilentWavUrl(): string {
  const sampleRate = 8000;
  const seconds = 1;
  const numSamples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);
  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples, true);
  for (let i = 0; i < numSamples; i += 1) view.setUint8(44 + i, 128);
  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

let element: HTMLAudioElement | null = null;

export function getSilentAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!element) {
    if (!cachedUrl) cachedUrl = makeSilentWavUrl();
    element = new Audio(cachedUrl);
    element.loop = true;
    element.volume = 0.0001; // ~0 mas iOS exige > 0 pra reconhecer como mídia
  }
  return element;
}
