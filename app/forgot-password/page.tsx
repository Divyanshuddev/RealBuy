'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AtSign
} from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoResetCode, setDemoResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or username.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: identifier.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsername(data.username);
        setMaskedEmail(data.masked_email);
        setDemoResetCode(data.code || '');
        setStep(2);
        toast(data.message || 'Security reset code generated', 'success');
      } else {
        const msg = data.detail || data.error || 'Account check failed';
        setError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error requesting password reset';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit security code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: identifier.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep(3);
        toast(data.message || 'Password updated successfully!', 'success');
      } else {
        const msg = data.detail || data.error || 'Failed to update password';
        setError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error resetting password';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
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
                  RECOVERY
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">PASSWORD RESET CHECKER</p>
            </div>
          </Link>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Verify your account identity to generate a one-time 6-digit security code and set a new password.
          </p>
        </div>

        {/* Main Card */}
        <div className="auth-card-backdrop rounded-2xl border border-neutral-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-[#ff6600] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300">
              PASSWORD CHECKER
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                  Recovery Error
                </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  Account Email or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. alexrivers or alex@realbuy.io"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 focus:outline-none transition-all font-mono"
                  />
                  <AtSign className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>CHECKING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>CHECK ACCOUNT & SEND SECURITY CODE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0d140e] border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-[11px] text-white">@{username}</div>
                    <div className="text-[10px] text-neutral-400">Security code sent to {maskedEmail}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-emerald-400 underline hover:text-emerald-300"
                >
                  Change
                </button>
              </div>

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
                    onClick={() => setCode(demoResetCode)}
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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
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
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] hover:shadow-[0_0_25px_rgba(255,102,0,0.45)] flex items-center justify-center gap-2"
              >
                {loading ? (
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

          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Password Successfully Reset
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Your password has been securely updated. You can now log into RealBuy with your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,102,0,0.3)] text-center"
              >
                Proceed to Sign In &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
