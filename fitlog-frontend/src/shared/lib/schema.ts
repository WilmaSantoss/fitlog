import { z } from 'zod';

export const optionalDecimalString = z
  .string()
  .transform((v) => v.trim())
  .superRefine((val, ctx) => {
    if (val === '') return;
    const n = Number(val.replace(',', '.'));
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: 'custom', message: 'Número inválido.' });
      return;
    }
    if (n < 0) {
      ctx.addIssue({ code: 'custom', message: 'Não pode ser negativo.' });
    }
  })
  .transform((val) => (val === '' ? null : Number(val.replace(',', '.'))));

export const optionalIntString = z
  .string()
  .transform((v) => v.trim())
  .superRefine((val, ctx) => {
    if (val === '') return;
    const n = Number(val);
    if (!Number.isInteger(n)) {
      ctx.addIssue({ code: 'custom', message: 'Número inteiro.' });
      return;
    }
    if (n < 0) {
      ctx.addIssue({ code: 'custom', message: 'Não pode ser negativo.' });
    }
  })
  .transform((val) => (val === '' ? null : Number(val)));

import { parseRestSeconds } from './format';

export const optionalRestString = z
  .string()
  .transform((v) => v.trim())
  .superRefine((val, ctx) => {
    if (val === '') return;
    const parsed = parseRestSeconds(val);
    if (parsed === null) {
      ctx.addIssue({ code: 'custom', message: 'Use 90 ou 1:30.' });
      return;
    }
    if (parsed < 0) {
      ctx.addIssue({ code: 'custom', message: 'Não pode ser negativo.' });
    }
  })
  .transform((val) => (val === '' ? null : parseRestSeconds(val)));

export const optionalRepsString = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, ''))
  .superRefine((val, ctx) => {
    if (val === '') return;
    if (/^\d+(\+\d+)+$/.test(val)) return; // blocos: 4+4+4+4
    const m = /^(\d+)(?:-(\d+))?$/.exec(val);
    if (!m) {
      ctx.addIssue({ code: 'custom', message: 'Use 8, 5-9 ou 4+4+4.' });
      return;
    }
    const a = Number(m[1]);
    if (a < 0) {
      ctx.addIssue({ code: 'custom', message: 'Não pode ser negativo.' });
      return;
    }
    if (m[2] !== undefined) {
      const b = Number(m[2]);
      if (b < a) {
        ctx.addIssue({ code: 'custom', message: 'Intervalo inválido.' });
      }
    }
  })
  .transform((val): string | null => {
    if (val === '') return null;
    if (/^\d+(\+\d+)+$/.test(val)) return val; // preserva blocos
    const m = /^(\d+)(?:-(\d+))?$/.exec(val);
    if (!m) return null;
    return m[2] !== undefined ? `${m[1]}-${m[2]}` : (m[1] as string);
  });

export const optionalString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length === 0 ? null : v));
