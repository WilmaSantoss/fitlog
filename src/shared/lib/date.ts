import {
  format,
  formatDistanceToNow,
  parseISO,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function nowUtcIso(): string {
  return new Date().toISOString();
}

export function toIsoUtc(date: Date): string {
  return date.toISOString();
}

export function fromIso(iso: string): Date {
  return parseISO(iso);
}

export function formatDate(iso: string, pattern = "dd 'de' MMM 'de' yyyy"): string {
  return format(parseISO(iso), pattern, { locale: ptBR });
}

export function formatDateShort(iso: string): string {
  return format(parseISO(iso), 'dd MMM', { locale: ptBR });
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR });
}

export function isThisWeek(iso: string): boolean {
  const date = parseISO(iso);
  const today = new Date();
  return isWithinInterval(date, {
    start: startOfWeek(today, { weekStartsOn: 1 }),
    end: endOfWeek(today, { weekStartsOn: 1 }),
  });
}

export function todayIsoDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateInputToIsoUtc(value: string): string {
  return new Date(`${value}T12:00:00.000Z`).toISOString();
}

export function isoToDateInput(iso: string): string {
  return iso.slice(0, 10);
}
