'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  LogIn,
  Lock,
  Mail,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Bot,
  UserCheck,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/context';
import UserAvatar from '@/components/UserAvatar';

const DEMO_PERSONAS = [
  {
    username: 'alexrivers',
    name: 'Alex Rivers',
    role: 'Audiophile & Tech Specialist',
    avatar: '',
    verified: true,
  },
  {
    username: 'sarah_chen',
    name: 'Sarah Chen',
    role: 'Industrial Product Designer',
    avatar: '',
    verified: true,
  },
  {
    username: 'marcus_fit',
    name: 'Marcus Brody',
    role: 'Fitness Athlete',
    avatar: '',
    verified: true,
  },
  {
    username: 'elena_r',
    name: 'Elena Rostova',
    role: 'Home & Coffee Specialist',
    avatar: '',
    verified: true,
  },
  {
    username: 'david_kim',
    name: 'David Kim',
    role: 'Gaming & Setup Enthusiast',
    avatar: '',
    verified: true,
  },
  {
    username: 'admin',
    name: 'RealBuy Admin',
    role: 'Trust & Safety Administrator',
    avatar: '',
    isAdmin: true,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, switchUser, toast } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        toast(data.detail || data.error || 'Invalid credentials', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error connecting to authentication server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaSelect = async (username: string) => {
    setActivePersona(username);
    toast(`Switching to persona @${username}...`, 'info');
    await switchUser(username);
  };

  const handleGoogleSimulated = async () => {
    toast('Authenticating with Google...', 'info');
    await switchUser('alexrivers');
  };

  const handleForgotPassword = () => {
    toast('Tip: For testing, use the 1-Click Demo Personas below to log in instantly.', 'info');
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
                  SYS.AUTH
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">VERIFIED SHOPPING INTELLIGENCE</p>
            </div>
          </Link>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Sign in to access your verified reviews, personalized AI product synthesis, and community feed.
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="auth-card-backdrop rounded-2xl border border-neutral-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 space-y-6">
          {/* Tab Switcher: Sign In vs Create Account */}
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

          {/* Quick Demo Persona Switcher */}
          <div className="rounded-xl bg-[#0c0c0c] border border-[#222222] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#ff6600]">
                <Zap className="w-3.5 h-3.5 fill-[#ff6600]" />
                <span>1-Click Demo Persona Sign-In</span>
              </div>
              <span className="text-[9px] text-neutral-500 font-mono">Instant testing</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = user?.username === p.username || activePersona === p.username;
                return (
                  <button
                    key={p.username}
                    type="button"
                    onClick={() => handlePersonaSelect(p.username)}
                    className={`relative p-2 rounded-xl text-left transition-all border group flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[#1e140a] border-[#ff6600]/60 ring-1 ring-[#ff6600]/50'
                        : 'bg-[#121212] border-[#222222] hover:border-[#ff6600]/40 hover:bg-[#161616]'
                    }`}
                  >
                    <UserAvatar name={p.name} avatarUrl={p.avatar} size="xs" />
                    <div className="truncate min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-white truncate flex items-center gap-1">
                        {p.name.split(' ')[0]}
                        {p.isAdmin ? (
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">ADM</span>
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#ff6600]" />
                        )}
                      </div>
                      <div className="text-[9px] text-neutral-500 truncate font-mono">@{p.username}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
                  onClick={handleForgotPassword}
                  className="text-[10px] text-neutral-500 hover:text-[#ff6600] font-mono transition-colors"
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
