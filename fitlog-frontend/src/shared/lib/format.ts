const nfWeight = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const nfInt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${nfWeight.format(value)} kg`;
}

export function formatCm(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${nfWeight.format(value)} cm`;
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${nfWeight.format(value)}%`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return nfWeight.format(value);
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return nfInt.format(value);
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

// Soma blocos de um reps planejado tipo "4+4+4+4" → 16.
// Retorna null se não for formato de blocos.
export function sumRepsBlocks(raw: string | null | undefined): number | null {
  if (!raw) return null;
  if (!/^\d+(\+\d+)+$/.test(raw)) return null;
  return raw.split('+').reduce((acc, s) => acc + Number(s), 0);
}

export function parseRestSeconds(raw: string): number | null {
  const v = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (v === '') return null;
  if (/^\d+$/.test(v)) return Number(v);
  const colon = /^(\d+):(\d+)$/.exec(v);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const min = /^(\d+)(?:m|min)(?:(\d+)s?)?$/.exec(v);
  if (min) return Number(min[1]) * 60 + (min[2] ? Number(min[2]) : 0);
  const sec = /^(\d+)s$/.exec(v);
  if (sec) return Number(sec[1]);
  return null;
}

export function isValidRestInput(raw: string): boolean {
  if (raw.trim() === '') return true;
  return parseRestSeconds(raw) !== null;
}

export function formatRestInput(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '';
  if (seconds < 60) return String(seconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}min` : `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s === 0 ? `${m}min` : `${m}min ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}min`;
}
