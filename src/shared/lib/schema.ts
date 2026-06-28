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

export const optionalString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length === 0 ? null : v));
