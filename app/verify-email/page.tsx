'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useAuth } from '@/lib/context';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useAuth();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), check_available: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        setDemoCode(data.code || '');
        toast(data.message || 'Verification code sent', 'success');
      } else {
        const msg = data.detail || data.error || 'Failed to send verification code';
        setError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error connecting to server';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsVerified(true);
        toast(data.message || 'Email successfully verified!', 'success');
      } else {
        const msg = data.detail || data.error || 'Verification failed';
        setError(msg);
        toast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Error checking verification code';
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
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/40">
                  VERIFIER
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">EMAIL VERIFICATION CHECKER</p>
            </div>
          </Link>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Verify email address ownership to unlock Verified Buyer badges and genuine reviewer trust markers.
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
              EMAIL CHECKER
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider block text-[10px] text-rose-400 mb-0.5">
                  Verification Error
                </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!isVerified ? (
            <div className="space-y-4">
              <form onSubmit={handleSendCode} className="space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                  Account Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@realbuy.io"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none transition-all font-mono"
                    />
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold uppercase transition-all shrink-0 border border-neutral-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </form>

              {demoCode && (
                <div className="p-3 rounded-xl bg-[#1a1200] border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wide block">
                        TEST VERIFICATION CODE
                      </span>
                      <span className="font-mono text-white text-sm font-black tracking-widest">{demoCode}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCode(demoCode)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-mono font-bold uppercase transition-colors"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              {codeSent && (
                <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300">
                      Enter 6-Digit Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-[#2c2c2c] bg-[#0c0c0c] text-neutral-200 placeholder:text-neutral-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 focus:outline-none transition-all font-mono tracking-widest font-bold"
                      />
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>VERIFYING CODE...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>CONFIRM & ACTIVATE BADGE</span>
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
                  <span className="text-emerald-400 font-mono font-bold">{email}</span> is confirmed. Verified Buyer trust badges are now active on your reviews.
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
