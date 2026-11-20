'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Bot,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Check,
  AtSign
} from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function LoginPage() {
  const router = useRouter();
  const { user, toast } = useAuth();
  
  // Views: 'login' | 'forgot_password' | 'verify_email'
  const [activeView, setActiveView] = useState<'login' | 'forgot_password' | 'verify_email'>('login');

  // Login form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot Password Checker state
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotMaskedEmail, setForgotMaskedEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [demoResetCode, setDemoResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Email Verify Checker state
  const [verifyEmailInput, setVerifyEmailInput] = useState('');
  const [verifyOtpInput, setVerifyOtpInput] = useState('');
  const [demoVerifyOtp, setDemoVerifyOtp] = useState('');
  const [verifyOtpSent, setVerifyOtpSent] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Handle Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: emailOrUsername.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('realbuy_token', data.token);
        }
        toast('Logged in successfully', 'success');
        window.location.href = '/';
      } else {
        const msg = data.detail || data.error || 'Invalid credentials';
        setErrorMessage(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error connecting to authentication server';
      setErrorMessage(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSimulated = async () => {
    toast('Google Sign-In integration is in verification. Please use your email and password.', 'info');
  };

  // Forgot Password: Step 1 (Request Code)
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your email or username.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: forgotIdentifier.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotUsername(data.username);
        setForgotMaskedEmail(data.masked_email);
        setDemoResetCode(data.code || '');
        setForgotStep(2);
        toast(data.message || 'Security reset code generated', 'success');
      } else {
        const msg = data.detail || data.error || 'Account check failed';
        setForgotError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error requesting password reset';
      setForgotError(msg);
      toast(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password: Step 2 (Verify Code & Reset Password)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit security code.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: forgotIdentifier.trim(),
          code: forgotCode.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep(3);
        toast(data.message || 'Password updated successfully!', 'success');
      } else {
        const msg = data.detail || data.error || 'Failed to update password';
        setForgotError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error resetting password';
      setForgotError(msg);
      toast(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Standalone Email Verification: Send OTP
  const handleSendVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmailInput.trim() || !verifyEmailInput.includes('@')) {
      setVerifyError('Please enter a valid email address.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmailInput.trim(), check_available: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyOtpSent(true);
        setDemoVerifyOtp(data.code || '');
        toast(data.message || 'Verification code sent', 'success');
      } else {
        const msg = data.detail || data.error || 'Could not send verification code';
        setVerifyError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error connecting to server';
      setVerifyError(msg);
      toast(msg, 'error');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Standalone Email Verification: Confirm OTP
  const handleConfirmVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyOtpInput.trim()) {
      setVerifyError('Please enter your 6-digit code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmailInput.trim(), code: verifyOtpInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifySuccess(true);
        toast(data.message || 'Email successfully verified!', 'success');
      } else {
        const msg = data.detail || data.error || 'Verification failed';
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
                  {activeView === 'forgot_password'
                    ? 'RECOVERY'
                    : activeView === 'verify_email'
                    ? 'VERIFY'
                    : 'SYS.AUTH'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">VERIFIED SHOPPING INTELLIGENCE</p>
            </div>
          </Link>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {activeView === 'forgot_password'
              ? 'Password Recovery Checker: verify your identity to reset your credentials securely.'
              : activeView === 'verify_email'
              ? 'Email Verification Checker: verify any account email address and unlock verified status.'
              : 'Sign in to access your verified reviews, personalized AI product synthesis, and community feed.'}
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="auth-card-backdrop rounded-2xl border border-neutral-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
          
          {/* View Switcher: Sign In vs Create Account vs Verify */}
          {activeView === 'login' ? (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0a0a0a] border border-[#222222]">
              <button
                type="button"
                className="py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-black bg-[#ff6600] shadow-[0_0_12px_rgba(255,102,0,0.35)] transition-all"
              >
                Sign In
              </button>
              <Link
                href="/register"
                className="py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white text-center transition-colors"
              >
                Create Account
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <button
                type="button"
                onClick={() => {
                  setActiveView('login');
                  setForgotError('');
                  setVerifyError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-[#ff6600] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </button>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
                {activeView === 'forgot_password' ? 'PASSWORD RECOVERY' : 'EMAIL VERIFIER'}
              </span>
            </div>
          )}

          {/* VIEW 1: STANDARD LOGIN */}
          {activeView === 'login' && (
            <>
              {/* Social Sign In (Google) */}
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
                <span className="font-mono tracking-wide">Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#262626] w-full"></div>
                <span className="bg-[#121212] px-3 text-[10px] text-neutral-500 uppercase font-mono tracking-wider">
                  Or with credentials
                </span>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                      Sign-In Error
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Standard Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                    Email or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={emailOrUsername}
                      onChange={(e) => setEmailOrUsername(e.target.value)}
                      placeholder="alex@realbuy.io or alexrivers"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                    />
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotIdentifier(emailOrUsername);
                        setActiveView('forgot_password');
                        setForgotStep(1);
                        setForgotError('');
                      }}
                      className="text-[10px] text-[#ff6600] hover:underline font-mono transition-colors font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
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
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-400 hover:text-neutral-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#333333] bg-[#0c0c0c] text-[#ff6600] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#ff6600]"
                    />
                    <span className="text-[11px] font-mono">Keep me signed in</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setVerifyEmailInput(emailOrUsername.includes('@') ? emailOrUsername : '');
                      setActiveView('verify_email');
                      setVerifyError('');
                    }}
                    className="text-[10px] text-neutral-400 hover:text-[#ff6600] font-mono transition-colors"
                  >
                    Verify email address &rarr;
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <span>SIGN IN TO REALBUY</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* VIEW 2: FORGOT PASSWORD CHECKER */}
          {activeView === 'forgot_password' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                <KeyRound className="w-5 h-5 text-[#ff6600] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Password Recovery Checker
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5 leading-relaxed">
                    Verify your account username or email to generate a one-time 6-digit security code.
                  </p>
                </div>
              </div>

              {/* Error banner */}
              {forgotError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                      Recovery Error
                    </span>
                    <span>{forgotError}</span>
                  </div>
                </div>
              )}

              {/* Step 1: Identifier Entry */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Enter Account Email or Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="e.g. alexrivers or alex@realbuy.io"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                      />
                      <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>CHECKING ACCOUNT...</span>
                      </>
                    ) : (
                      <>
                        <span>VERIFY ACCOUNT & SEND CODE</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Code Verification & New Password */}
              {forgotStep === 2 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  {/* Account Found Details */}
                  <div className="p-3 rounded-xl bg-[#0d140e] border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-[11px] text-white">@{forgotUsername}</div>
                        <div className="text-[10px] text-neutral-400">Security code sent to {forgotMaskedEmail}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-[10px] text-emerald-400 underline hover:text-emerald-300"
                    >
                      Change
                    </button>
                  </div>

                  {/* Demo test code banner for instant testing */}
                  {demoResetCode && (
                    <div className="p-3 rounded-xl bg-[#1a1200] border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wide block">
                            TEST SECURITY CODE
                          </span>
                          <span className="font-mono text-white text-sm font-black tracking-widest">{demoResetCode}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForgotCode(demoResetCode)}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotCode}
                        onChange={(e) => setForgotCode(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono tracking-widest font-bold"
                      />
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                      />
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                      />
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>UPDATING PASSWORD...</span>
                      </>
                    ) : (
                      <>
                        <span>VERIFY & RESET PASSWORD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 3: Success Screen */}
              {forgotStep === 3 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                      Password Successfully Reset
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                      Your account credentials have been updated. You can now log in with your new password.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailOrUsername(forgotIdentifier);
                      setPassword('');
                      setActiveView('login');
                      setForgotStep(1);
                    }}
                    className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)]"
                  >
                    Proceed to Sign In &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: EMAIL VERIFICATION CHECKER */}
          {activeView === 'verify_email' && (
            <div className="space-y-5">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Email Verification Checker
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-sans mt-0.5 leading-relaxed">
                    Verify account email ownership using a 6-digit cryptographic verification code.
                  </p>
                </div>
              </div>

              {/* Error banner */}
              {verifyError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                      Verification Error
                    </span>
                    <span>{verifyError}</span>
                  </div>
                </div>
              )}

              {!verifySuccess ? (
                <div className="space-y-4">
                  {/* Step A: Request Code */}
                  <form onSubmit={handleSendVerifyCode} className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Target Email Address
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="email"
                          required
                          value={verifyEmailInput}
                          onChange={(e) => setVerifyEmailInput(e.target.value)}
                          placeholder="e.g. alex@realbuy.io"
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                        />
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                      </div>
                      <button
                        type="submit"
                        disabled={verifyLoading}
                        className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold uppercase transition-all shrink-0 border border-neutral-700 disabled:opacity-50"
                      >
                        {verifyLoading ? 'Sending...' : 'Send Code'}
                      </button>
                    </div>
                  </form>

                  {/* Demo code banner */}
                  {demoVerifyOtp && (
                    <div className="p-3 rounded-xl bg-[#1a1200] border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wide block">
                            TEST VERIFICATION OTP
                          </span>
                          <span className="font-mono text-white text-sm font-black tracking-widest">{demoVerifyOtp}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyOtpInput(demoVerifyOtp)}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  {/* Step B: Enter Code */}
                  {verifyOtpSent && (
                    <form onSubmit={handleConfirmVerifyCode} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                          Enter 6-Digit Verification Code
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={verifyOtpInput}
                            onChange={(e) => setVerifyOtpInput(e.target.value)}
                            placeholder="e.g. 123456"
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none transition-all font-mono tracking-widest font-bold"
                          />
                          <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={verifyLoading}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                      >
                        {verifyLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            <span>VERIFYING CODE...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>CONFIRM & ACTIVATE VERIFICATION</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                      Email Address Verified
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                      <span className="text-emerald-400 font-mono font-bold">{verifyEmailInput}</span> has been confirmed. Verified Buyer trust badges are now active.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailOrUsername(verifyEmailInput);
                      setActiveView('login');
                      setVerifySuccess(false);
                      setVerifyOtpSent(false);
                    }}
                    className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)]"
                  >
                    Return to Sign In &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

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
          New to RealBuy?{' '}
          <Link href="/register" className="font-bold text-[#ff6600] hover:underline font-mono ml-1">
            Create an Account &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
