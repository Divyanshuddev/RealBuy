'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ShieldCheck,
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ThumbsUp,
  MoreHorizontal,
  Send,
  CornerDownRight,
  Flag,
  Store,
  Check
} from 'lucide-react';
import { Review, Comment } from '@/lib/types';
import { useAuth } from '@/lib/context';
import AIReportModal from './AIReportModal';
import UserAvatar from './UserAvatar';

interface ReviewCardProps {
  review: Review;
  onRefresh?: () => void;
}

export default function ReviewCard({ review, onRefresh }: ReviewCardProps) {
  const { user, toast } = useAuth();
  const [liked, setLiked] = useState(review.is_liked || false);
  const [likesCount, setLikesCount] = useState(review.likes_count || 0);
  const [helpful, setHelpful] = useState(review.is_helpful || false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedText, setExpandedText] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDesc, setReportDesc] = useState('');

  const mediaList = review.media || [];

  const handleLike = async () => {
    if (!user) {
      toast('Please sign in to like reviews', 'info');
      return;
    }
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/reviews/${review.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      } else {
        setLiked(prevLiked);
        setLikesCount(prevCount);
        toast(data.error || 'Failed to like', 'error');
      }
    } catch (err) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleHelpful = async () => {
    if (!user) {
      toast('Please sign in to vote', 'info');
      return;
    }
    const prevHelpful = helpful;
    const prevCount = helpfulCount;
    setHelpful(!prevHelpful);
    setHelpfulCount(prevHelpful ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/reviews/${review.id}/helpful`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setHelpful(data.helpful);
        setHelpfulCount(data.helpful_count);
        toast(data.helpful ? 'Marked as helpful' : 'Removed helpful vote', 'success');
      } else {
        setHelpful(prevHelpful);
        setHelpfulCount(prevCount);
      }
    } catch (err) {
      setHelpful(prevHelpful);
      setHelpfulCount(prevCount);
    }
  };

  const handleSaveProduct = async () => {
    if (!user) {
      toast('Please sign in to save products', 'info');
      return;
    }
    try {
      const res = await fetch(`/api/products/${review.product_id}/save`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
        toast(data.message, 'success');
      }
    } catch (err) {
      toast('Failed to save product', 'error');
    }
  };

  const toggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await fetch(`/api/reviews/${review.id}/comments`);
        const data = await res.json();
        if (data.comments) setComments(data.comments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in to comment', 'info');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/reviews/${review.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments([...comments, data.comment]);
        setNewComment('');
        toast('Comment posted', 'success');
      }
    } catch (err) {
      toast('Error posting comment', 'error');
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!user) {
      toast('Please sign in to reply', 'info');
      return;
    }
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/comments/${commentId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, replies: [...(c.replies || []), data.reply] } : c
          )
        );
        setReplyToId(null);
        setReplyText('');
        toast('Reply posted', 'success');
      }
    } catch (err) {
      toast('Error replying', 'error');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/product/${review.product_id}`;
    if (navigator.share) {
      navigator.share({
        title: `${review.product?.brand} ${review.product?.name} Review`,
        text: review.title,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast('Product review link copied to clipboard', 'success');
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'review',
          target_id: review.id,
          reason: reportReason,
          description: reportDesc,
        }),
      });
      const data = await res.json();
      toast(data.message || 'Report submitted', 'success');
      setShowReportModal(false);
    } catch (err) {
      toast('Error submitting report', 'error');
    }
  };

  return (
    <article className="bg-[#0f0f0f] rounded-2xl border border-[#222222] shadow-[0_4px_24px_rgba(0,0,0,0.6)] overflow-hidden transition-all hover:border-[#2d2d2d]">
      {/* Review Header: User details + Product Link */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${review.user?.username}`} className="relative group shrink-0">
            <UserAvatar
              name={review.user?.name || review.user?.username}
              avatarUrl={review.user?.avatar_url}
              size="md"
            />
            {review.user?.is_verified && (
              <span className="absolute -bottom-1 -right-1 bg-[#ff6600] text-black rounded-full p-0.5 z-10" title="Verified Creator">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/profile/${review.user?.username}`} className="font-bold text-xs text-white hover:text-[#ff6600] transition-colors">
                {review.user?.name}
              </Link>
              <span className="text-[11px] text-neutral-500 font-mono">@{review.user?.username}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
              {review.purchased_from && (
                <>
                  <span className="text-neutral-600">//</span>
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Store className="w-3 h-3 text-[#ff6600]" /> {review.purchased_from}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Verified Purchase Shield Badge */}
          {review.is_verified_purchase ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/30 text-[10px] font-mono font-bold"
              title="Purchase verified with invoice"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>VERIFIED BUYER</span>
            </div>
          ) : (
            <span className="text-[10px] text-neutral-500 font-mono">COMMUNITY</span>
          )}

          <button
            onClick={() => setShowReportModal(true)}
            className="p-1.5 text-neutral-500 hover:text-white rounded-lg hover:bg-[#1a1a1a] transition-colors"
            title="Report Content"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Highlight Banner */}
      <div className="p-3.5 mx-4 md:mx-5 my-3.5 rounded-xl bg-[#141414] border border-[#222222] flex items-center justify-between">
        <Link href={`/product/${review.product_id}`} className="flex items-center gap-3 truncate group">
          <img
            src={review.product?.thumbnail_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=200&q=80'}
            alt={review.product?.name || 'Product'}
            className="w-12 h-12 rounded-lg object-cover border border-[#2c2c2c] group-hover:border-[#ff6600] transition-colors shrink-0"
          />
          <div className="truncate">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#ff6600]">
              {review.product?.brand} // {review.product?.category}
            </span>
            <h4 className="text-xs font-bold text-white truncate group-hover:text-[#ff6600] transition-colors">
              {review.product?.name}
            </h4>
            {review.purchase_price > 0 && (
              <span className="text-[11px] font-mono font-bold text-[#ff6600]">
                ${review.purchase_price.toFixed(2)}
              </span>
            )}
          </div>
        </Link>

        {/* View AI Report Button - High Contrast Retro */}
        <button
          onClick={() => setShowAiModal(true)}
          className="shrink-0 ml-3 px-3.5 py-2 rounded-lg bg-[#ff6600] hover:bg-[#ff7700] text-black text-[11px] font-mono font-black shadow-[0_0_12px_rgba(255,102,0,0.25)] flex items-center gap-1.5 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          <span>AI REPORT</span>
        </button>
      </div>

      {/* Media Gallery Carousel */}
      {mediaList.length > 0 && (
        <div className="relative bg-black aspect-video max-h-[440px] overflow-hidden select-none border-y border-[#1a1a1a]">
          {mediaList[currentMediaIndex]?.media_type === 'video' ? (
            <video
              src={mediaList[currentMediaIndex].url}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              src={mediaList[currentMediaIndex].url}
              alt="Product photo"
              className="w-full h-full object-cover"
            />
          )}

          {mediaList.length > 1 && (
            <>
              <button
                onClick={() => setCurrentMediaIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/70 text-white hover:text-[#ff6600] border border-[#333] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMediaIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black/70 text-white hover:text-[#ff6600] border border-[#333] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {/* Pagination Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-[#333]">
                {mediaList.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentMediaIndex ? 'w-4 bg-[#ff6600]' : 'w-1.5 bg-neutral-600'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Review Content & Ratings */}
      <div className="p-4 md:p-5 space-y-3">
        {/* Rating stars & metrics breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-[#ff6600]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(review.rating)
                      ? 'fill-[#ff6600] text-[#ff6600]'
                      : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-white">
              {review.rating.toFixed(1)} / 5.0
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-neutral-300">
              Durability: <strong className="text-white">{review.durability_rating}★</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-neutral-300">
              Quality: <strong className="text-white">{review.quality_rating}★</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-neutral-300">
              Value: <strong className="text-emerald-400">{review.value_rating}★</strong>
            </span>
          </div>
        </div>

        {/* Written Review Title & Body */}
        <div>
          <h3 className="text-sm font-bold text-white leading-snug">
            {review.title}
          </h3>
          <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed font-sans">
            {expandedText || review.content.length <= 160
              ? review.content
              : `${review.content.slice(0, 160)}... `}
            {review.content.length > 160 && (
              <button
                onClick={() => setExpandedText(!expandedText)}
                className="text-[#ff6600] font-mono text-[11px] font-semibold hover:underline ml-1"
              >
                {expandedText ? '[- LESS]' : '[+ MORE]'}
              </button>
            )}
          </p>
        </div>

        {/* Action Buttons: Like, Comment, Helpful, Share, Save */}
        <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${
                liked ? 'text-[#ff6600]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-[#ff6600] text-[#ff6600]' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{review.comments_count || comments.length}</span>
            </button>

            {/* Helpful vote */}
            <button
              onClick={handleHelpful}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                helpful
                  ? 'bg-[#ff6600]/15 border-[#ff6600]/50 text-[#ff6600]'
                  : 'border-[#262626] text-neutral-400 hover:border-neutral-600 hover:text-white'
              }`}
            >
              <ThumbsUp className={`w-3 h-3 ${helpful ? 'fill-[#ff6600]' : ''}`} />
              <span>HELPFUL ({helpfulCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#1a1a1a] transition-colors"
              title="Share Review"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSaveProduct}
              className={`p-1.5 rounded-lg transition-colors ${
                saved
                  ? 'text-[#ff6600] bg-[#ff6600]/10'
                  : 'text-neutral-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}
              title="Save Product to Collection"
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-[#ff6600]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Comment Thread Drawer */}
        {showComments && (
          <div className="pt-3 border-t border-[#1a1a1a] space-y-3">
            {loadingComments ? (
              <p className="text-xs text-neutral-500 font-mono text-center py-2">// LOADING COMMENTS...</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-neutral-500 font-mono text-center py-2">// NO COMMENTS YET. ASK THE OWNER.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {comments.map((c) => (
                  <div key={c.id} className="text-xs space-y-1 p-2.5 rounded-xl bg-[#141414] border border-[#222222]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserAvatar name={c.user?.name || c.user?.username} avatarUrl={c.user?.avatar_url} size="xs" />
                        <Link href={`/profile/${c.user?.username}`} className="font-bold text-white hover:text-[#ff6600]">
                          {c.user?.name}
                        </Link>
                        <span className="text-[10px] text-neutral-500 font-mono">@{c.user?.username}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-neutral-300 text-[11px]">{c.content}</p>

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="pl-3 pt-1 space-y-1 border-l border-[#ff6600]/40 mt-1">
                        {c.replies.map((r) => (
                          <div key={r.id} className="text-[11px]">
                            <span className="font-bold text-white">{r.user?.name}: </span>
                            <span className="text-neutral-300">{r.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyToId === c.id ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write reply..."
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[#333] bg-[#0c0c0c] text-white focus:outline-none focus:border-[#ff6600]"
                        />
                        <button
                          onClick={() => handleAddReply(c.id)}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#ff6600] text-black rounded-lg"
                        >
                          REPLY
                        </button>
                        <button
                          onClick={() => setReplyToId(null)}
                          className="text-[10px] text-neutral-500 hover:text-neutral-300"
                        >
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyToId(c.id);
                          setReplyText('');
                        }}
                        className="text-[10px] font-mono text-[#ff6600] hover:underline flex items-center gap-1 pt-0.5"
                      >
                        <CornerDownRight className="w-2.5 h-2.5" /> REPLY
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ask owner a question..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#282828] bg-[#141414] text-white focus:outline-none focus:border-[#ff6600]"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-[#ff6600] text-black hover:bg-[#ff7700] transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* AI Product Report Modal */}
      {showAiModal && (
        <AIReportModal
          productId={review.product_id}
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-2xl p-6 border border-[#2a2a2a] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                REPORT REVIEW CONTENT
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-neutral-500 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-neutral-400">REASON</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-white"
                >
                  <option value="spam">Spam or Promotion</option>
                  <option value="fake_review">Fake or Inauthentic</option>
                  <option value="harassment">Offensive / Inappropriate</option>
                  <option value="misleading">Misleading Specs</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono text-neutral-400">DETAILS</label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Explain why this content should be reviewed..."
                  rows={3}
                  className="w-full mt-1 p-2 text-xs rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-400 rounded-lg hover:bg-[#1a1a1a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm"
                >
                  SUBMIT REPORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
