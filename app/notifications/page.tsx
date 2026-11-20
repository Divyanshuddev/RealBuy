'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '@/lib/context';
import { Notification } from '@/lib/types';

export default function NotificationsPage() {
  const { user, toast } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all' }),
      });
      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
      toast('All notifications marked as read', 'success');
    } catch (err) {
      toast('Failed to mark notifications', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-retro-orange fill-retro-orange" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-3.5 h-3.5 text-retro-orange" />;
      case 'verified_purchase':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-retro-orange" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-retro-orange" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 space-y-6 font-mono">
      <div className="flex items-center justify-between pb-4 border-b border-retro-border">
        <div>
          <h1 className="text-base md:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-5 h-5 text-retro-orange" />
            <span>NOTIFICATIONS // REALBUY FEED</span>
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Real-time updates on likes, comments, verified buyer approvals, and creator follows.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-lg border border-retro-border bg-retro-black text-xs font-bold text-neutral-300 hover:text-white hover:border-retro-orange/40 flex items-center gap-1.5 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5 text-retro-orange" />
            <span>MARK ALL READ</span>
          </button>
        )}
      </div>

      <div className="bg-retro-surface rounded-xl border border-retro-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-400 uppercase tracking-widest">[ LOADING_NOTIFICATIONS ... ]</div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Bell className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-xs font-bold text-neutral-300 uppercase">[ NO NOTIFICATIONS YET ]</h3>
            <p className="text-xs text-neutral-500 font-sans">When community members interact with your hardware reviews, updates will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-retro-border">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 md:p-5 flex items-start gap-3.5 transition-colors ${
                  !n.is_read ? 'bg-retro-orange/5' : 'hover:bg-neutral-900/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-retro-black border border-retro-border shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="text-xs text-neutral-200 font-sans leading-snug">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-neutral-500 block font-mono">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                {!n.is_read && (
                  <div className="w-2 h-2 rounded-full bg-retro-orange shrink-0 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
