// utilis/auth_validations.ts
import * as z from 'zod';

export const emailSchema = z.object({
  email: z.string()
    .min(1, 'auth.validation.email_required')
    .email('auth.validation.email_invalid'),
});

export type EmailForm = z.infer<typeof emailSchema>;

const phoneRegex = /^(\+237|237)?[6|2|3]\d{8}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export const registerStep3Schema = z.object({
  name: z.string()
    .min(1, 'auth.validation.name_required')
    .min(2, 'auth.validation.name_min'),
  phone: z.string()
    .min(1, 'auth.validation.phone_required')
    .refine((v) => phoneRegex.test(v), 'auth.validation.phone_invalid'),
  password: z.string()
    .min(1, 'auth.validation.password_required')
    .min(8, 'auth.validation.password_min')
    .refine((v) => passwordRegex.test(v), 'auth.validation.password_complexity'),
  confirmPassword: z.string()
    .min(1, 'auth.validation.confirmPassword_required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.validation.passwords_match',
  path: ['confirmPassword'],
});

export type RegisterStep3Form = z.infer<typeof registerStep3Schema>;

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'auth.validation.emailOrPhone_required'),
  password: z.string().min(1, 'auth.validation.password_required'),
});

export const registerSchema = z.object({
  name: z.string()
    .min(1, 'auth.validation.name_required')
    .min(2, 'auth.validation.name_min'),
  email: z.string()
    .min(1, 'auth.validation.email_required')
    .email('auth.validation.email_invalid'),
  phone: z.string()
    .min(1, 'auth.validation.phone_required')
    .refine((v) => /^(\+237|237)?[6|2|3]\d{8}$/.test(v), 'auth.validation.phone_invalid'),
  password: z.string()
    .min(1, 'auth.validation.password_required')
    .min(8, 'auth.validation.password_min')
    .refine((v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(v), 'auth.validation.password_complexity'),
  confirmPassword: z.string()
    .min(1, 'auth.validation.confirmPassword_required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'auth.validation.passwords_match',
  path: ['confirmPassword'],
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;