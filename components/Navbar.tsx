'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context';
import {
  Home,
  Compass,
  PlusSquare,
  Sparkles,
  Bell,
  User,
  Scale,
  ShieldCheck,
  LogOut,
  LogIn,
  ChevronDown,
  CheckCircle2,
  Zap,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

const DEMO_USERS = [
  {
    username: 'alexrivers',
    name: 'Alex Rivers',
    role: 'Audiophile & Tech',
    avatar: '',
    verified: true,
  },
  {
    username: 'sarah_chen',
    name: 'Sarah Chen',
    role: 'Product Designer',
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
    role: 'Home & Coffee',
    avatar: '',
    verified: true,
  },
  {
    username: 'david_kim',
    name: 'David Kim',
    role: 'Gaming & Setup',
    avatar: '',
    verified: true,
  },
  {
    username: 'admin',
    name: 'RealBuy Admin',
    role: 'Trust & Safety',
    avatar: '',
    isAdmin: true,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, switchUser, logout } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const demoDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (demoDropdownRef.current && !demoDropdownRef.current.contains(event.target as Node)) {
        setDemoOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Products & Reviews', href: '/', icon: Home },
    { label: 'Search & Explore', href: '/explore', icon: Compass },
    { label: 'Upload / Rate Product', href: '/upload', icon: PlusSquare },
    { label: 'AI Pros & Cons Hub', href: '/ai-analysis', icon: Sparkles, badge: 'AI' },
    { label: 'Compare Hardware', href: '/compare', icon: Scale },
    { label: 'Notifications', href: '/notifications', icon: Bell, count: unreadCount },
    {
      label: 'My Account',
      href: user ? `/profile/${user.username}` : '/login',
      icon: User,
    },
  ];

  if (user?.role === 'admin' || user?.is_admin) {
    navItems.push({ label: 'Admin Console', href: '/admin', icon: ShieldCheck });
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-[#1f1f1f] p-4 z-40 justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <Link href="/" className="flex items-center gap-3 px-2 group">
            <div className="w-10 h-10 rounded-xl bg-black border border-[#ff6600]/60 flex items-center justify-center text-[#ff6600] shadow-[0_0_18px_rgba(255,102,0,0.3)] group-hover:scale-105 group-hover:border-[#ff6600] transition-all">
              <span className="font-mono text-sm font-black tracking-tight">RB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white uppercase font-mono">
                  Real<span className="text-[#ff6600]">Buy</span>
                </span>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/40">
                  SYS.AI
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wider">VERIFIED INTELLIGENCE</p>
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
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#1e140a] text-[#ff6600] border border-[#ff6600]/40 shadow-[0_0_15px_rgba(255,102,0,0.15)] font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-[#141414] border border-transparent'
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

        {/* Footer controls: Persona Switcher & User Account Panel */}
        <div className="space-y-3 pt-4 border-t border-[#1a1a1a]" ref={demoDropdownRef}>
          {/* Quick Persona Switcher Popover */}
          <div className="relative">
            <button
              onClick={() => setDemoOpen(!demoOpen)}
              className="w-full text-left px-3 py-2 rounded-xl bg-[#121212] border border-[#242424] text-xs text-neutral-300 flex items-center justify-between hover:border-[#ff6600]/50 hover:bg-[#181818] transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#ff6600] shadow-[0_0_8px_#ff6600]"></span>
                <span className="text-[11px] truncate font-mono">
                  DEMO: <strong className="text-white font-sans">{user ? user.name : 'Guest Account'}</strong>
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-transform ${
                  demoOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {demoOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2.5 bg-[#121212] rounded-2xl shadow-2xl border border-[#2a2a2a] space-y-1.5 z-50">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono text-[#ff6600] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-[#ff6600]" />
                    <span>Instant Persona Switch</span>
                  </span>
                  <span className="text-neutral-500 text-[9px]">1-click</span>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {DEMO_USERS.map((u) => {
                    const isCurrent = user?.username === u.username;
                    return (
                      <button
                        key={u.username}
                        onClick={() => {
                          switchUser(u.username);
                          setDemoOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-[#1e140a] text-[#ff6600] border border-[#ff6600]/40 font-semibold'
                            : 'hover:bg-[#1a1a1a] text-neutral-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <UserAvatar name={u.name} avatarUrl={u.avatar} size="xs" />
                          <div className="truncate">
                            <div className="font-medium text-white text-[11px] truncate flex items-center gap-1">
                              {u.name}
                              {u.isAdmin && (
                                <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded">ADM</span>
                              )}
                            </div>
                            <div className="text-[9px] text-neutral-500 font-mono truncate">{u.role}</div>
                          </div>
                        </div>
                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Card / Sign In Action */}
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
                <span>Sign In / Demo</span>
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
          <button
            onClick={() => setDemoOpen(!demoOpen)}
            className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2a2a2a] text-[#ff6600] flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600]"></span>
            <span>{user ? `@${user.username}` : 'Guest'}</span>
          </button>
          {!user && (
            <Link
              href="/login"
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-[#ff6600] text-black"
            >
              Sign In
            </Link>
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
