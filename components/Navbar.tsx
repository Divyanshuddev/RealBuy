'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context';
import {
  Home,
  Compass,
  PlusSquare,
  Sparkles,
  Bell,
  Scale,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (data.notifications) {
            const unread = data.notifications.filter((n: any) => !n.is_read).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const navItems = [
    { href: '/', label: 'Feed & Discover', icon: Home },
    { href: '/explore', label: 'Explore Products', icon: Compass },
    { href: '/upload', label: 'Upload Product / Review', icon: PlusSquare },
    { href: '/compare', label: 'Compare Products', icon: Scale },
    { href: '/ai-analysis', label: 'AI Synthesis', icon: Sparkles, badge: 'AI' },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      count: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  if (user?.role === 'admin' || user?.is_admin) {
    navItems.push({ href: '/admin', label: 'Trust & Safety', icon: ShieldCheck, badge: 'MOD' });
  }

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen fixed left-0 top-0 bg-[#0a0a0a] border-r border-[#1c1c1c] p-4 z-40 select-none">
        <div className="space-y-6">
          {/* Brand Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 px-2 py-2 group">
            <div className="w-9 h-9 rounded-xl bg-black border border-[#ff6600]/80 flex items-center justify-center text-[#ff6600] shadow-[0_0_15px_rgba(255,102,0,0.35)] group-hover:scale-105 group-hover:border-[#ff6600] transition-all">
              <span className="font-mono text-xs font-black tracking-tight">RB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-base tracking-tight font-mono">
                  REAL<span className="text-[#ff6600]">BUY</span>
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">
                VERIFIED SHOPPING INTEL
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all group ${
                    isActive
                      ? 'bg-[#1a140f] text-[#ff6600] font-bold border border-[#ff6600]/40 shadow-[0_0_15px_rgba(255,102,0,0.15)]'
                      : 'text-neutral-400 hover:text-white hover:bg-[#121212]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff6600]' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ff6600] text-black">
                      {item.badge}
                    </span>
                  )}
                  {item.count ? (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#ff6600] text-black animate-pulse">
                      {item.count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Account Panel */}
        <div className="pt-4 border-t border-[#1a1a1a]">
          {user ? (
            <div className="p-2.5 rounded-xl bg-[#121212] border border-[#222222] flex items-center justify-between">
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2.5 truncate group flex-1 mr-2"
              >
                <div className="relative shrink-0">
                  <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-black"></span>
                </div>
                <div className="truncate min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#ff6600] transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">@{user.username}</p>
                </div>
              </Link>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-[#1a1a1a] transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login"
                className="w-full py-2.5 px-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black text-xs font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,102,0,0.3)] hover:shadow-[0_0_20px_rgba(255,102,0,0.45)] transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="w-full py-2 px-3 rounded-xl bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] text-neutral-300 hover:text-white text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3 h-3 text-neutral-500" />
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1c1c1c] flex items-center justify-between px-4 z-40">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-black border border-[#ff6600] flex items-center justify-center text-[#ff6600] font-mono font-black text-xs shadow-[0_0_10px_rgba(255,102,0,0.3)]">
            RB
          </div>
          <span className="font-black text-white text-sm font-mono tracking-tight">
            REAL<span className="text-[#ff6600]">BUY</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href={`/profile/${user.username}`}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2a2a2a] text-[#ff6600] flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>@{user.username}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#ff6600] text-black"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1c1c1c] flex items-center justify-around px-2 z-40">
        {navItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative ${
                isActive ? 'text-[#ff6600]' : 'text-neutral-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-1 font-mono">{item.label.split(' ')[0]}</span>
              {item.count ? (
                <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
