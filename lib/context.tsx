'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  switchUser: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  switchUser: async () => {},
  logout: async () => {},
  darkMode: false,
  toggleDarkMode: () => {},
  toast: () => {},
  toastMessage: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const toast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshUser = async () => {
    try {
      const headers: Record<string, string> = {};
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('realbuy_token') : null;
      if (savedToken) {
        headers['Authorization'] = `Bearer ${savedToken}`;
      }
      const res = await fetch('/api/auth/me', { headers });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const switchUser = async (username: string) => {
    try {
      const res = await fetch('/api/auth/switch-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.token) {
          localStorage.setItem('realbuy_token', data.token);
        }
        setUser(data.user);
        toast(`Switched profile to ${data.user.name}`, 'success');
        window.location.reload();
      } else {
        toast(data.error || 'Failed to switch user', 'error');
      }
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('realbuy_token');
      }
      setUser(null);
      toast('Signed out', 'info');
      window.location.href = '/';
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('realbuy_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('realbuy_theme', 'light');
      }
      return next;
    });
  };

  useEffect(() => {
    refreshUser();
    const savedTheme = localStorage.getItem('realbuy_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        switchUser,
        logout,
        darkMode,
        toggleDarkMode,
        toast,
        toastMessage,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border ${
              toastMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-800'
                : toastMessage.type === 'info'
                ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/90 dark:text-sky-200 dark:border-sky-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-800'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
