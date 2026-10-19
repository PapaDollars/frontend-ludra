'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Check, Lock, Mail, Phone, RefreshCw, User } from 'lucide-react';

import {
  emailSchema, registerStep3Schema,
  type EmailForm, type RegisterStep3Form,
} from '@/utilis/auth_validations';
import { authService } from '@/services/auth.service';
import { Field, errorProps } from '@/components/ui/Form';
import { cn } from '@/utilis/utils';
import URL from '@/utilis/url/url_front';
import { AuthAlert, AuthButton, AuthCard, IconInput, PasswordInput } from './AuthUI';

interface RegisterFormProps {
  redirectTo?: string;
}

type Step = 1 | 2 | 3;

const STEPS = ['Email', 'Vérification', 'Informations'] as const;

/** Indicateur d'étapes (même langage visuel que le parcours « Publier »). */
function RegisterSteps({ step }: { step: Step }) {
  return (
    <ol aria-label="Étapes de l'inscription" className="mb-6 flex items-start">
      {STEPS.map((label, i) => {
        const n = (i + 1) as Step;
        const done = step > n;
        const active = step === n;
        return (
          <li key={label} aria-current={active ? 'step' : undefined} className="relative flex flex-1 flex-col items-center">
            {i > 0 && <span className={cn('absolute top-3.5 right-1/2 h-0.5 w-full', step >= n ? 'bg-brand' : 'bg-slate-200')} aria-hidden="true" />}
            <span className={cn(
              'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
              active ? 'bg-brand text-white ring-4 ring-brand-100' : done ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500',
            )}>
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cn('mt-1.5 text-[11px]', active ? 'font-semibold text-brand' : 'text-slate-500')}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function RegisterForm({ redirectTo }: RegisterFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const step1Form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const step3Form = useForm<RegisterStep3Form>({ resolver: zodResolver(registerStep3Schema) });
  const step1Errors = step1Form.formState.errors;
  const step3Errors = step3Form.formState.errors;
  const msg = (m?: string) => (m ? t(m) : undefined);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async (data: EmailForm) => {
    setIsLoading(true);
    setError('');
    try {
      await authService.sendCode(data.email);
      setEmail(data.email);
      setOtp(Array(6).fill(''));
      setCooldown(60);
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'envoyer le code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await authService.sendCode(email);
      setOtp(Array(6).fill(''));
      setCooldown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du renvoi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Entrez les 6 chiffres du code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await authService.verifyEmailCode(email, code);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code invalide');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterStep3Form) => {
    setIsLoading(true);
    setError('');
    try {
      await authService.register({ ...data, email, role: 'user' });
      const result = await signIn('credentials', {
        emailOrPhone: email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        router.push(URL.auth.login + '?message=Compte créé. Connectez-vous.');
        return;
      }
      router.push(redirectTo || URL.v2.feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title={t('auth.register.title')}
      footer={<>{t('auth.register.hasAccount')}{' '}<Link href={URL.auth.login} className="font-semibold text-brand hover:underline">{t('auth.register.signin')}</Link></>}
    >
      <RegisterSteps step={step} />
      {error && <AuthAlert>{error}</AuthAlert>}

      {/* ── Étape 1 : email ── */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleSendCode)} className="flex flex-col gap-4" noValidate>
          <p className="text-sm text-slate-500">Entrez votre email pour recevoir un code de vérification.</p>
          <Field label={t('auth.register.email')} htmlFor="reg-email" error={msg(step1Errors.email?.message)}>
            <IconInput
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder={t('auth.placeholder.email')}
              disabled={isLoading}
              {...step1Form.register('email')}
              {...errorProps('reg-email', step1Errors.email?.message)}
            />
          </Field>
          <AuthButton loading={isLoading}>{isLoading ? 'Envoi en cours…' : 'Recevoir le code'}</AuthButton>
        </form>
      )}

      {/* ── Étape 2 : code reçu par email ── */}
      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
          <p className="text-sm text-slate-500">
            Code à 6 chiffres envoyé à <strong className="font-semibold text-navy break-all">{email}</strong>
          </p>
          <div role="group" aria-label="Code de vérification" className="flex justify-between gap-2" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Chiffre ${i + 1}`}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={isLoading}
                className={cn(
                  'h-12 w-full min-w-0 max-w-12 rounded-lg border bg-white text-center text-xl font-bold outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-100',
                  digit ? 'border-brand text-brand' : 'border-slate-200 text-navy',
                )}
              />
            ))}
          </div>
          <AuthButton loading={isLoading} disabled={otp.join('').length < 6}>{isLoading ? 'Vérification…' : 'Vérifier le code'}</AuthButton>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setStep(1); setError(''); }} className="inline-flex items-center gap-1 text-slate-500 hover:text-navy">
              <ArrowLeft className="w-4 h-4" /> Changer l&apos;email
            </button>
            <button type="button" onClick={handleResend} disabled={cooldown > 0 || isLoading} className="inline-flex items-center gap-1 font-medium text-brand disabled:text-slate-400">
              <RefreshCw className="w-4 h-4" /> {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
            </button>
          </div>
        </form>
      )}

      {/* ── Étape 3 : informations du compte ── */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(handleRegister)} className="flex flex-col gap-4" noValidate>
          <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-trust-50 px-3 py-1 text-xs font-medium text-green-800">
            <BadgeCheck className="w-3.5 h-3.5" /> Email vérifié : <span className="break-all">{email}</span>
          </p>
          <Field label={t('auth.register.name')} htmlFor="reg-name" error={msg(step3Errors.name?.message)}>
            <IconInput icon={User} autoComplete="name" placeholder={t('auth.placeholder.name')} disabled={isLoading}
              {...step3Form.register('name')} {...errorProps('reg-name', step3Errors.name?.message)} />
          </Field>
          <Field label={t('auth.register.phone')} htmlFor="reg-phone" error={msg(step3Errors.phone?.message)}>
            <IconInput icon={Phone} type="tel" autoComplete="tel" placeholder="+237612345678" disabled={isLoading}
              {...step3Form.register('phone')} {...errorProps('reg-phone', step3Errors.phone?.message)} />
          </Field>
          <Field label={t('auth.register.password')} htmlFor="reg-password" error={msg(step3Errors.password?.message)}
            hint="Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre">
            <PasswordInput icon={Lock} autoComplete="new-password" placeholder={t('auth.placeholder.password')} disabled={isLoading}
              {...step3Form.register('password')} {...errorProps('reg-password', step3Errors.password?.message)} />
          </Field>
          <Field label={t('auth.register.confirmPassword')} htmlFor="reg-confirm" error={msg(step3Errors.confirmPassword?.message)}>
            <PasswordInput icon={Lock} autoComplete="new-password" placeholder={t('auth.placeholder.confirmPassword')} disabled={isLoading}
              {...step3Form.register('confirmPassword')} {...errorProps('reg-confirm', step3Errors.confirmPassword?.message)} />
          </Field>
          <AuthButton loading={isLoading}>{isLoading ? t('auth.register.loading') : t('auth.register.submit')}</AuthButton>
        </form>
      )}
    </AuthCard>
  );
}
