'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showVerified?: boolean;
}

const COLOR_VARIANTS = [
  'from-[#ff6600]/25 to-amber-500/15 border-[#ff6600]/50 text-[#ff6600]',
  'from-emerald-500/25 to-teal-500/15 border-emerald-500/50 text-emerald-400',
  'from-blue-500/25 to-indigo-500/15 border-blue-500/50 text-blue-400',
  'from-purple-500/25 to-pink-500/15 border-purple-500/50 text-purple-400',
  'from-rose-500/25 to-red-500/15 border-rose-500/50 text-rose-400',
  'from-cyan-500/25 to-sky-500/15 border-cyan-500/50 text-cyan-400',
  'from-amber-500/25 to-yellow-500/15 border-amber-500/50 text-amber-400',
];

export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'RB';
  const clean = name.trim();
  const parts = clean.split(/[\s_.-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function getAvatarColor(name?: string): string {
  if (!name) return COLOR_VARIANTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_VARIANTS.length;
  return COLOR_VARIANTS[index];
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-20 h-20 md:w-24 md:h-24 text-2xl',
};

export default function UserAvatar({
  name = 'User',
  avatarUrl,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name);
  const colorClass = getAvatarColor(name);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const hasCustomImage = Boolean(avatarUrl && avatarUrl.trim() !== '' && !imageError);

  if (hasCustomImage) {
    return (
      <div
        className={`relative rounded-full overflow-hidden shrink-0 border border-[#2a2a2a] bg-[#121212] ${sizeClass} ${className}`}
      >
        <img
          src={avatarUrl!}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Default Initials Avatar
  return (
    <div
      className={`relative rounded-full shrink-0 flex items-center justify-center font-mono font-black uppercase tracking-wider bg-gradient-to-br border shadow-xs select-none ${sizeClass} ${colorClass} ${className}`}
      title={name}
    >
      <span>{initials}</span>
    </div>
  );
}
