'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import logoImg from '@/assets/img/logo.png';

import {
  emailSchema, registerStep3Schema,
  type EmailForm, type RegisterStep3Form,
} from '@/utilis/auth_validations';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/common/ui/Button';
import { Card } from '@/components/common/ui/Card';
import URL from '@/utilis/url/url_front';

interface RegisterFormProps {
  redirectTo?: string;
}

type Step = 1 | 2 | 3;

export default function RegisterForm({ redirectTo }: RegisterFormProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const step1Form = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const step3Form = useForm<RegisterStep3Form>({ resolver: zodResolver(registerStep3Schema) });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
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

  const handleVerifyCode = async () => {
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
      router.push(redirectTo || URL.public.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const STEPS = ['Email', 'Vérification', 'Informations'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto"
    >
      <Card className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-200">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href={URL.public.home} className="inline-block mb-3 hover:opacity-80 transition-opacity">
            <Image src={logoImg} alt="Ludra-Home" height={48} priority />
          </Link>
          <h2 className="text-2xl font-bold text-primary mb-1">{t('auth.register.title')}</h2>
        </div>

        {/* Indicateur d'étapes */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center gap-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${done ? 'bg-green-500 text-white' : active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : n}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${active ? 'text-primary font-medium' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < 2 && <div className={`w-8 h-0.5 mb-4 transition-colors ${step > n ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Email ── */}
        {step === 1 && (
          <form onSubmit={step1Form.handleSubmit(handleSendCode)} className="flex flex-col gap-5">
            <p className="text-gray-500 text-sm text-center">
              Entrez votre email pour recevoir un code de vérification
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.register.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder={t('auth.placeholder.email')}
                  {...step1Form.register('email')}
                  disabled={isLoading}
                />
              </div>
              {step1Form.formState.errors.email && (
                <span className="text-red-500 text-xs mt-1 block">
                  {t(step1Form.formState.errors.email.message as string)}
                </span>
              )}
            </div>
            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary-600"
              disabled={isLoading}
            >
              {isLoading ? 'Envoi en cours...' : 'Recevoir le code →'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              {t('auth.register.hasAccount')}{' '}
              <Link href={URL.auth.login} className="text-primary font-semibold hover:underline">
                {t('auth.register.signin')}
              </Link>
            </p>
          </form>
        )}

        {/* ── ÉTAPE 2 : Code OTP ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Code envoyé à</p>
              <p className="font-semibold text-gray-800">{email}</p>
            </div>

            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  disabled={isLoading}
                  className={`w-11 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${digit ? 'border-primary text-primary' : 'border-gray-300 text-gray-700'}`}
                />
              ))}
            </div>

            <Button
              type="button"
              className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary-600"
              disabled={isLoading || otp.join('').length < 6}
              onClick={handleVerifyCode}
            >
              {isLoading ? 'Vérification...' : 'Vérifier le code'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Changer l'email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || isLoading}
                className="text-primary font-medium disabled:text-gray-400 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Informations ── */}
        {step === 3 && (
          <form onSubmit={step3Form.handleSubmit(handleRegister)} className="flex flex-col gap-4">
            <p className="text-sm text-green-600 font-medium text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" /> Email vérifié : {email}
            </p>

            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.register.name')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder={t('auth.placeholder.name')}
                  {...step3Form.register('name')}
                  disabled={isLoading}
                />
              </div>
              {step3Form.formState.errors.name && (
                <span className="text-red-500 text-xs mt-1 block">
                  {t(step3Form.formState.errors.name.message as string)}
                </span>
              )}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.register.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="+237612345678"
                  {...step3Form.register('phone')}
                  disabled={isLoading}
                />
              </div>
              {step3Form.formState.errors.phone && (
                <span className="text-red-500 text-xs mt-1 block">
                  {t(step3Form.formState.errors.phone.message as string)}
                </span>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder={t('auth.placeholder.password')}
                  {...step3Form.register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {step3Form.formState.errors.password && (
                <span className="text-red-500 text-xs mt-1 block">
                  {t(step3Form.formState.errors.password.message as string)}
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre</p>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder={t('auth.placeholder.confirmPassword')}
                  {...step3Form.register('confirmPassword')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(v => !v)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {step3Form.formState.errors.confirmPassword && (
                <span className="text-red-500 text-xs mt-1 block">
                  {t(step3Form.formState.errors.confirmPassword.message as string)}
                </span>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold bg-primary hover:bg-primary-600"
              disabled={isLoading}
            >
              {isLoading ? t('auth.register.loading') : t('auth.register.submit')}
            </Button>

            <p className="text-center text-sm text-gray-600">
              {t('auth.register.hasAccount')}{' '}
              <Link href={URL.auth.login} className="text-primary font-semibold hover:underline">
                {t('auth.register.signin')}
              </Link>
            </p>
          </form>
        )}

      </Card>
    </motion.div>
  );
}
