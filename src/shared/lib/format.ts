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

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s === 0 ? `${m}min` : `${m}min ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm === 0 ? `${h}h` : `${h}h ${rm}min`;
}
