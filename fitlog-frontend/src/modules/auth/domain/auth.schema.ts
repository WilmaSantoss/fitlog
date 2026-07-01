import { z } from 'zod';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Obrigatório.')
  .email('Email inválido.');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Obrigatório.'),
});

export const signupSchema = z
  .object({
    email: emailField,
    password: z.string().min(6, 'Mínimo de 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Obrigatório.'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginFormParsed = z.output<typeof loginSchema>;

export type SignupFormValues = z.input<typeof signupSchema>;
export type SignupFormParsed = z.output<typeof signupSchema>;
