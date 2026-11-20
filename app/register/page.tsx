'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Bot,
  Zap,
  CheckCircle2,
  AtSign,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Check,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useAuth();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Email verification checker state
  const [emailAvailability, setEmailAvailability] = useState<{
    status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
    message: string;
  }>({ status: 'idle', message: '' });
  const [verifyOtpSent, setVerifyOtpSent] = useState(false);
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [demoVerifyOtp, setDemoVerifyOtp] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Debounced email availability check
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    if (!cleanEmail) {
      setEmailAvailability({ status: 'idle', message: '' });
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailAvailability({ status: 'invalid', message: 'Incomplete email address' });
      return;
    }

    setEmailAvailability({ status: 'checking', message: 'Checking email availability...' });

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.available) {
            setEmailAvailability({ status: 'available', message: 'Email is available' });
          } else {
            setEmailAvailability({
              status: 'taken',
              message: 'Email already registered. Please sign in instead.',
            });
          }
        } else {
          setEmailAvailability({ status: 'invalid', message: data.detail || 'Invalid email format' });
        }
      } catch {
        setEmailAvailability({ status: 'idle', message: '' });
      }
    }, 500);

    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, [email]);

  // Request Email Verification OTP
  const handleSendVerificationCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast('Please enter a valid email address first.', 'error');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, check_available: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyOtpSent(true);
        setDemoVerifyOtp(data.code || '');
        toast(data.message || 'Verification code sent to your email', 'success');
      } else {
        const msg = data.detail || data.error || 'Failed to send verification code';
        setVerifyError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error connecting to verification server';
      setVerifyError(msg);
      toast(msg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Confirm Verification Code
  const handleConfirmVerificationCode = async () => {
    if (!verifyOtpInput.trim()) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: verifyOtpInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEmailVerified(true);
        toast(data.message || 'Email successfully verified! Verified Buyer badge unlocked.', 'success');
      } else {
        const msg = data.detail || data.error || 'Invalid or expired code';
        setVerifyError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error checking verification code';
      setVerifyError(msg);
      toast(msg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabels = ['Too short', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast('Please agree to the Community Guidelines to continue', 'error');
      return;
    }
    if (password.length < 6) {
      toast('Password must be at least 6 characters long', 'error');
      return;
    }
    if (emailAvailability.status === 'taken') {
      setErrorMessage('This email is already registered. Please sign in or use a different email.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase().replace(/\s+/g, '_'),
          email: email.trim().toLowerCase(),
          password,
          is_email_verified: isEmailVerified,
          verification_code: verifyOtpInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('realbuy_token', data.token);
        }
        toast(
          isEmailVerified
            ? 'Account created with Verified Buyer badge! Welcome to RealBuy'
            : 'Account created! Welcome to RealBuy',
          'success'
        );
        window.location.href = '/';
      } else {
        const msg = data.detail || data.error || 'Registration failed';
        setErrorMessage(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error creating account';
      setErrorMessage(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulated = async () => {
    toast('Google Sign-Up integration is in verification. Please enter your name, email, and password below.', 'info');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 auth-glow-bg">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-xl bg-black border border-[#ff6600]/60 flex items-center justify-center text-[#ff6600] shadow-[0_0_20px_rgba(255,102,0,0.3)] group-hover:scale-105 group-hover:border-[#ff6600] transition-all">
              <span className="font-mono text-sm font-black tracking-tight">RB</span>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-white uppercase font-mono">
                  Real<span className="text-[#ff6600]">Buy</span>
                </span>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/40">
                  JOIN
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">NEW ACCOUNT SETUP</p>
            </div>
          </Link>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Join 42,000+ buyers sharing real, invoice-verified product experiences synthesized with AI.
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="auth-card-backdrop rounded-2xl border border-neutral-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0a0a0a] border border-[#222222]">
            <Link
              href="/login"
              className="py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white text-center transition-colors"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#ff6600] shadow-[0_0_12px_rgba(255,102,0,0.35)] transition-all"
            >
              Create Account
            </button>
          </div>

          {/* Google Quick Registration */}
          <button
            type="button"
            onClick={handleGoogleSimulated}
            className="w-full py-2.5 px-4 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:bg-[#1a1a1a] hover:border-neutral-500 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-3 transition-all group"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-mono tracking-wide">Sign Up with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#262626] w-full"></div>
            <span className="bg-[#121212] px-3 text-[10px] text-neutral-500 uppercase font-mono tracking-wider">
              Or fill your details
            </span>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                  Registration Error
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                />
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  Username
                </label>
                {username && (
                  <span className="text-[10px] text-neutral-500 font-mono">
                    @{username.toLowerCase().replace(/\s+/g, '_')}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. jordan_reviews"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                />
                <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>

            {/* Email Address with Availability Checker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  Email Address
                </label>
                {emailAvailability.status === 'available' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                    <Check className="w-3 h-3" />
                    Available
                  </span>
                )}
                {emailAvailability.status === 'taken' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-400 font-bold">
                    <XCircle className="w-3 h-3" />
                    Already registered
                  </span>
                )}
                {emailAvailability.status === 'checking' && (
                  <span className="text-[10px] font-mono text-neutral-400 animate-pulse">
                    Checking...
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (isEmailVerified) setIsEmailVerified(false);
                    if (verifyOtpSent) setVerifyOtpSent(false);
                  }}
                  placeholder="jordan@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border ${
                    emailAvailability.status === 'taken'
                      ? 'border-rose-500/80 bg-rose-950/10'
                      : emailAvailability.status === 'available'
                      ? 'border-emerald-500/70 bg-emerald-950/10'
                      : 'border-[#2c2c2c] bg-[#0c0c0c]'
                  } text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono`}
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>

            {/* EMAIL VERIFICATION CHECKER SECTION */}
            <div className="p-3.5 rounded-xl border border-[#2a2a2a] bg-[#121212] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${isEmailVerified ? 'text-emerald-400' : 'text-[#ff6600]'}`}
                  />
                  <div>
                    <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider block">
                      Email Verification Checker
                    </span>
                    <span className="text-[10px] text-neutral-400 font-sans">
                      Verify to earn the Verified Buyer trust badge immediately
                    </span>
                  </div>
                </div>

                {isEmailVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase inline-flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-mono uppercase">
                    Optional Step
                  </span>
                )}
              </div>

              {/* Verification Error */}
              {verifyError && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* State A: Not verified and no OTP sent yet */}
              {!isEmailVerified && !verifyOtpSent && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {email && email.includes('@')
                      ? `Send 6-digit code to ${email}`
                      : 'Enter email above to verify'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={verifyLoading || !email || !email.includes('@') || emailAvailability.status === 'taken'}
                    className="px-3 py-1.5 rounded-lg bg-[#1e1e1e] hover:bg-[#282828] text-neutral-200 border border-[#333333] hover:border-[#ff6600]/60 text-xs font-mono font-bold uppercase transition-all disabled:opacity-40 shrink-0"
                  >
                    {verifyLoading ? 'Sending...' : 'Verify Email (OTP)'}
                  </button>
                </div>
              )}

              {/* State B: OTP Sent - enter code */}
              {!isEmailVerified && verifyOtpSent && (
                <div className="space-y-3 pt-1">
                  {/* Demo test code banner */}
                  {demoVerifyOtp && (
                    <div className="p-2.5 rounded-lg bg-[#1a1200] border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-amber-400 block font-bold">
                            TEST VERIFICATION OTP
                          </span>
                          <span className="text-white text-xs font-bold tracking-widest">{demoVerifyOtp}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyOtpInput(demoVerifyOtp)}
                        className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[9px] font-mono font-bold uppercase"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        maxLength={6}
                        value={verifyOtpInput}
                        onChange={(e) => setVerifyOtpInput(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[#333333] bg-[#0c0c0c] text-white placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none transition-all font-mono tracking-widest font-bold"
                      />
                      <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmVerificationCode}
                      disabled={verifyLoading || !verifyOtpInput.trim()}
                      className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase transition-all disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                    >
                      {verifyLoading ? 'Checking...' : 'Confirm'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500">
                    <span>Code expires in 15 minutes</span>
                    <button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={verifyLoading}
                      className="text-[#ff6600] hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              )}

              {/* State C: Successfully Verified */}
              {isEmailVerified && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-[11px]">
                      Ownership confirmed: <span className="text-white font-bold">{email}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    Badge Activated
                  </span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 rounded-full transition-all ${
                          passwordStrength >= step ? strengthColors[passwordStrength - 1] : 'bg-[#222222]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-neutral-500">Strength:</span>
                    <span
                      className={`font-bold ${
                        passwordStrength <= 1
                          ? 'text-rose-400'
                          : passwordStrength === 2
                          ? 'text-amber-400'
                          : passwordStrength === 3
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {strengthLabels[passwordStrength - 1] || 'Too short'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-neutral-400 hover:text-neutral-300">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#333333] bg-[#0c0c0c] text-[#ff6600] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#ff6600]"
                />
                <span className="text-[11px] leading-relaxed">
                  I agree to RealBuy&apos;s Review Integrity Policy and promise to submit genuine receipts and honest opinions.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || emailAvailability.status === 'taken'}
              className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <span>
                    {isEmailVerified ? 'CREATE VERIFIED ACCOUNT' : 'CREATE REALBUY ACCOUNT'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#1f1f1f] text-center">
            <div className="space-y-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff6600] mx-auto" />
              <p className="text-[9px] text-neutral-400 font-mono">100% Invoice Verified</p>
            </div>
            <div className="space-y-1">
              <Bot className="w-3.5 h-3.5 text-blue-400 mx-auto" />
              <p className="text-[9px] text-neutral-400 font-mono">AI Synthesized Pros/Cons</p>
            </div>
            <div className="space-y-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 mx-auto" />
              <p className="text-[9px] text-neutral-400 font-mono">Zero Sponsored Bias</p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-neutral-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-[#ff6600] hover:underline font-mono ml-1">
            Sign In &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
