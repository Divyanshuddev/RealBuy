'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  ShieldCheck,
  Star,
  Bookmark,
  FileText,
  ThumbsUp,
  Edit3,
  Check,
  PlusSquare,
  Sparkles,
  UserPlus,
  UserCheck,
  Zap,
  Calendar,
  Layers,
  CheckCircle2,
  Share2,
  Upload,
  Camera,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/lib/context';
import { Review, Product, User } from '@/lib/types';
import ReviewCard from '@/components/ReviewCard';
import ProductCard from '@/components/ProductCard';
import UserAvatar from '@/components/UserAvatar';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { user: currentUser, toast } = useAuth();
  const username = params.username;

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'saved' | 'verified'>('reviews');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Profile modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditAvatar(data.url);
        toast('Profile image uploaded! Click Save Changes to apply.', 'success');
      } else {
        toast(data.error || 'Failed to upload image', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error uploading file', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      if (data.user) {
        setProfileUser(data.user);
        setReviews(data.reviews || []);
        setSavedProducts(data.savedProducts || []);
        setIsFollowing(Boolean(data.user.is_following));
        setFollowersCount(data.user.followers_count || 0);
        setEditName(data.user.name);
        setEditBio(data.user.bio || '');
        setEditAvatar(data.user.avatar_url || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      toast('Please sign in to follow creators', 'info');
      return;
    }
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.following);
        setFollowersCount(data.followersCount);
        toast(data.following ? `Followed @${username}` : `Unfollowed @${username}`, 'success');
      } else {
        toast(data.error || 'Failed to update follow', 'error');
      }
    } catch (err) {
      toast('Error toggling follow', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim(),
          avatar_url: editAvatar.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast('Profile updated successfully', 'success');
        setShowEditModal(false);
        loadProfile();
      } else {
        toast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      toast('Error updating profile', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profileUser?.name} on RealBuy`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Profile link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-[#ff6600] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-400 uppercase tracking-widest">[ LOADING_USER_PROFILE ... ]</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-3 font-mono">
        <h2 className="text-sm font-bold text-white uppercase">[ 404 :: USER_NOT_FOUND ]</h2>
        <Link href="/" className="text-xs text-[#ff6600] hover:underline">
          &lt; RETURN_HOME
        </Link>
      </div>
    );
  }

  const isSelf = currentUser && currentUser.id === profileUser.id;
  const verifiedReviews = reviews.filter((r) => r.is_verified_purchase);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-8 font-mono">
      {/* Profile Header Card */}
      <div className="relative rounded-2xl bg-[#0f0f0f] border border-[#222222] p-6 md:p-8 space-y-6 overflow-hidden shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6600] via-orange-400 to-transparent"></div>
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#ff6600]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <UserAvatar
                name={profileUser.name}
                avatarUrl={profileUser.avatar_url}
                size="xl"
              />
              {profileUser.is_verified && (
                <span
                  className="absolute -bottom-1 -right-1 bg-[#ff6600] text-black rounded-lg p-1 shadow-md z-10"
                  title="Verified Creator"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight font-sans">
                  {profileUser.name}
                </h1>
                {profileUser.is_admin ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    ADMINISTRATOR
                  </span>
                ) : profileUser.is_verified ? (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> VERIFIED CREATOR
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#ff6600]">@{profileUser.username}</p>
              {profileUser.bio ? (
                <p className="text-xs text-neutral-300 font-sans max-w-md pt-1 leading-relaxed">
                  {profileUser.bio}
                </p>
              ) : (
                <p className="text-xs text-neutral-500 font-sans italic">
                  RealBuy community member & verified product reviewer.
                </p>
              )}
            </div>
          </div>

          {/* Action: Edit or Follow or Share */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:border-neutral-500 text-neutral-300 hover:text-white transition-all"
              title="Share profile link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isSelf ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-xl border border-[#2a2a2a] bg-[#141414] hover:border-[#ff6600]/50 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#ff6600]" />
                <span>EDIT PROFILE</span>
              </button>
            ) : (
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,102,0,0.25)] ${
                  isFollowing
                    ? 'bg-[#141414] border border-[#2a2a2a] hover:border-neutral-500 text-neutral-300'
                    : 'bg-[#ff6600] hover:bg-[#ff771a] text-black font-bold'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>[ FOLLOWING ]</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>FOLLOW</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* User Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#1f1f1f] text-center">
          <div className="p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] uppercase text-neutral-500 block">Followers</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">{followersCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] uppercase text-neutral-500 block">Total Reviews</span>
            <span className="text-base font-extrabold text-white mt-0.5 block">
              {profileUser.reviews_count || reviews.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] uppercase text-neutral-500 block">Verified Invoices</span>
            <span className="text-base font-extrabold text-[#ff6600] mt-0.5 block">
              {profileUser.verified_reviews_count || verifiedReviews.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] uppercase text-neutral-500 block">Helpful Votes</span>
            <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
              {profileUser.avg_helpfulness || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar: Reviews, Verified Invoices, Saved */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0f0f0f] rounded-2xl border border-[#222222]">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'reviews'
              ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.3)]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Reviews ({reviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'verified'
              ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.3)]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Invoices ({verifiedReviews.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.3)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedProducts.length})</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="p-12 text-center bg-[#0f0f0f] rounded-2xl border border-[#222222] text-xs text-neutral-400 space-y-3">
              <p>[ NO REVIEWS POSTED YET ]</p>
              {isSelf && (
                <Link
                  href="/upload"
                  className="inline-block px-4 py-2 rounded-xl bg-[#ff6600] text-black font-bold text-xs"
                >
                  Post Your First Review
                </Link>
              )}
            </div>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} onRefresh={loadProfile} />)
          )}
        </div>
      )}

      {activeTab === 'verified' && (
        <div className="space-y-6">
          {verifiedReviews.length === 0 ? (
            <div className="p-12 text-center bg-[#0f0f0f] rounded-2xl border border-[#222222] space-y-2 text-neutral-400">
              <ShieldCheck className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-xs uppercase">[ NO VERIFIED INVOICE REVIEWS YET ]</p>
            </div>
          ) : (
            verifiedReviews.map((r) => <ReviewCard key={r.id} review={r} onRefresh={loadProfile} />)
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {savedProducts.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-[#0f0f0f] rounded-2xl border border-[#222222] text-neutral-400 space-y-2">
              <Bookmark className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs uppercase">[ NO SAVED HARDWARE YET ]</p>
              <Link href="/explore" className="inline-block text-xs text-[#ff6600] hover:underline">
                Explore catalog &rarr;
              </Link>
            </div>
          ) : (
            savedProducts.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-2xl p-6 border border-[#2a2a2a] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-[#ff6600]" />
                <span>EDIT USER PROFILE</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-neutral-500 hover:text-white text-xs"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 font-mono">
              <div>
                <label className="text-[11px] uppercase text-neutral-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] text-neutral-200 focus:border-[#ff6600] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase text-neutral-400 block mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the community about your hardware focus or testing habits..."
                  className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] text-neutral-200 focus:border-[#ff6600] focus:outline-none font-sans"
                />
              </div>

              <div className="space-y-3 p-3.5 rounded-xl bg-[#0c0c0c] border border-[#222222]">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-bold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#ff6600]" />
                    <span>AVATAR PREFERENCE</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      editAvatar
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/30'
                    }`}
                  >
                    {editAvatar ? 'CUSTOM IMAGE' : 'NAME INITIALS (DEFAULT)'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <UserAvatar
                    name={editName || profileUser.name}
                    avatarUrl={editAvatar}
                    size="lg"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] text-neutral-400 font-sans leading-snug">
                      RealBuy displays your name initials by default. You can optionally upload a custom picture.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#181818] hover:bg-[#202020] border border-[#333] hover:border-neutral-500 text-xs font-bold text-neutral-200 flex items-center gap-1.5 transition-all">
                        <Upload className="w-3 h-3 text-[#ff6600]" />
                        <span>{uploadingAvatar ? 'UPLOADING...' : 'UPLOAD PICTURE'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                      {editAvatar ? (
                        <button
                          type="button"
                          onClick={() => setEditAvatar('')}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>USE INITIALS</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Direct Image URL fallback */}
                <div className="pt-2 border-t border-[#1a1a1a]">
                  <label className="text-[10px] text-neutral-500 block mb-1">
                    Or custom image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://... or clear to use initials"
                    className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-neutral-300 focus:border-[#ff6600] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 rounded-xl hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#ff6600] hover:bg-[#ff771a] text-black rounded-xl uppercase tracking-wider shadow-[0_0_12px_rgba(255,102,0,0.3)] transition-all"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
