'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Share2,
  Scale,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Zap,
  DollarSign,
  Calendar,
  Filter,
  PlusSquare,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Cpu,
  Layers,
  Terminal,
  Image as ImageIcon,
  ExternalLink,
  Store
} from 'lucide-react';
import { Product, AIAnalysis, Review } from '@/lib/types';
import ReviewCard from '@/components/ReviewCard';
import AskAIWidget from '@/components/AskAIWidget';
import { useAuth } from '@/lib/context';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, toast } = useAuth();
  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [ratingsDist, setRatingsDist] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'helpful' | 'recent' | 'highest' | 'lowest' | 'verified'>('helpful');
  const [saved, setSaved] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    loadProductData();
    loadProductReviews();
  }, [productId]);

  useEffect(() => {
    loadProductReviews();
  }, [reviewFilter]);

  const loadProductData = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.product) {
        setProduct(data.product);
        setAnalysis(data.analysis);
        setRatingsDist(data.ratingsDist);
        setSimilarProducts(data.similarProducts || []);
        setSaved(data.product.is_saved || false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProductReviews = async () => {
    try {
      let feedParam = 'smart';
      if (reviewFilter === 'recent') feedParam = 'recent';
      if (reviewFilter === 'highest') feedParam = 'highest_rated';
      if (reviewFilter === 'verified') feedParam = 'verified';

      const res = await fetch(`/api/reviews?productId=${productId}&feed=${feedParam}`);
      const data = await res.json();
      if (data.reviews) {
        let sorted = data.reviews;
        if (reviewFilter === 'lowest') {
          sorted = [...data.reviews].sort((a, b) => a.rating - b.rating);
        }
        setReviews(sorted);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRecalculateAI = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/products/${productId}/ai-analysis`, { method: 'POST' });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
        toast('AI Product Analysis recalculated!', 'success');
      }
    } catch (err) {
      toast('Failed to recalculate AI analysis', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast('Please sign in to save products', 'info');
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}/save`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
        toast(data.message, 'success');
      }
    } catch (err) {
      toast('Error saving product', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product?.brand} ${product?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast('Product page link copied to clipboard!', 'success');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-retro-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">[ REALBUY :: FETCHING_PRODUCT_INTEL ... ]</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-base font-mono font-bold text-white uppercase">[ 404 :: PRODUCT_NOT_FOUND ]</h2>
        <Link href="/explore" className="inline-block text-xs font-mono text-retro-orange hover:underline">
          &lt; RETURN_TO_CATALOG
        </Link>
      </div>
    );
  }

  const pros: string[] = analysis?.pros || (analysis?.pros_json ? JSON.parse(analysis.pros_json) : []);
  const cons: string[] = analysis?.cons || (analysis?.cons_json ? JSON.parse(analysis.cons_json) : []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between text-xs font-mono text-neutral-500 border-b border-retro-border pb-3">
        <div className="flex items-center gap-2">
          <Link href="/explore" className="hover:text-retro-orange transition-colors">EXPLORE</Link>
          <span>/</span>
          <span className="text-retro-orange font-bold uppercase">{product.category}</span>
          <span>/</span>
          <span className="text-neutral-300 truncate max-w-xs">{product.brand} {product.name}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-400">
          <span>SYS.ID:</span>
          <span className="text-neutral-200">{product.id}</span>
        </div>
      </div>

      {/* Product Hero Card */}
      <div className="bg-retro-surface rounded-xl border border-retro-border p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Product Images Gallery (Min 1, Max 5) */}
          <div className="space-y-3">
            {(() => {
              const galleryImages = (product.images && product.images.length > 0)
                ? product.images
                : [product.thumbnail_url];
              const currentImage = galleryImages[activeImageIndex] || galleryImages[0];

              return (
                <>
                  <div className="relative aspect-square max-h-[440px] w-full rounded-xl overflow-hidden bg-retro-black border border-retro-border group">
                    <img
                      src={currentImage}
                      alt={`${product.name} photo ${activeImageIndex + 1}`}
                      className="w-full h-full object-cover transition-all"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      {product.verified_review_count && product.verified_review_count > 0 ? (
                        <div className="px-2.5 py-1 rounded bg-black/85 border border-retro-orange/40 text-retro-orange text-[10px] font-mono font-bold flex items-center gap-1.5 backdrop-blur-md">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{product.verified_review_count} VERIFIED INVOICES</span>
                        </div>
                      ) : <span />}

                      {galleryImages.length > 1 && (
                        <div className="px-2 py-0.5 rounded bg-black/85 border border-[#333] text-neutral-300 text-[10px] font-mono font-bold backdrop-blur-md">
                          {activeImageIndex + 1} / {galleryImages.length}
                        </div>
                      )}
                    </div>

                    {/* Left/Right Arrows if multi-image */}
                    {galleryImages.length > 1 && (
                      <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                          className="p-2 rounded-full bg-black/75 hover:bg-black text-white pointer-events-auto border border-[#333] transition-colors shadow-lg"
                          title="Previous image"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                          className="p-2 rounded-full bg-black/75 hover:bg-black text-white pointer-events-auto border border-[#333] transition-colors shadow-lg"
                          title="Next image"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Multi-Image Thumbnails Selector */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {galleryImages.map((img, idx) => {
                        const isActive = idx === activeImageIndex;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                              isActive
                                ? 'border-[#ff6600] scale-105 shadow-[0_0_12px_rgba(255,102,0,0.35)]'
                                : 'border-[#262626] opacity-60 hover:opacity-100 hover:border-neutral-400'
                            }`}
                          >
                            <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                            {idx === 0 && (
                              <span className="absolute bottom-0 left-0 right-0 bg-[#ff6600] text-black text-[7px] font-mono font-black text-center uppercase py-0.5">
                                COVER
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Right: Product Info & Meta */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-retro-orange">
                <span>{product.brand}</span>
                <span className="text-neutral-600">//</span>
                <span className="text-neutral-400">{product.category}</span>
                {product.model && (
                  <>
                    <span className="text-neutral-600">//</span>
                    <span className="text-neutral-400">{product.model}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-mono font-extrabold text-white mt-1.5 tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Ratings, Parameters & Price Bar */}
            <div className="space-y-3 py-4 border-y border-retro-border font-mono">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Star className="w-5 h-5 fill-retro-orange text-retro-orange" />
                  <span className="text-2xl font-extrabold text-white">{product.avg_rating}</span>
                  <span className="text-xs text-neutral-400">/ 5.0 ({product.review_count} owner reviews)</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block">Reported Price</span>
                  <span className="text-base font-extrabold text-retro-orange">
                    ${product.min_price || 0} {product.max_price && product.max_price > (product.min_price || 0) ? `- $${product.max_price}` : ''}
                  </span>
                </div>
              </div>

              {/* Parameter Rating Meters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1c1c1c] text-center">
                <div className="p-2 rounded-lg bg-retro-black border border-retro-border">
                  <span className="text-[9px] uppercase text-neutral-500 block">Durability</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{product.avg_durability || 0} ★</span>
                </div>
                <div className="p-2 rounded-lg bg-retro-black border border-retro-border">
                  <span className="text-[9px] uppercase text-neutral-500 block">Build Quality</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">{product.avg_quality || 0} ★</span>
                </div>
                <div className="p-2 rounded-lg bg-retro-black border border-retro-border">
                  <span className="text-[9px] uppercase text-neutral-500 block">Value for Money</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{product.avg_value || 0} ★</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed font-sans">
              {product.description}
            </p>

            {/* E-Commerce Source Store Links */}
            {(() => {
              const links = (product.store_links && product.store_links.length > 0)
                ? product.store_links
                : (product.product_url ? [{ title: 'Store', url: product.product_url }] : []);

              if (links.length === 0) return null;

              return (
                <div className="p-3.5 rounded-xl bg-[#0c0c0c] border border-[#262626] space-y-2.5 font-mono">
                  <div className="flex items-center justify-between text-xs border-b border-[#1c1c1c] pb-2">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#ff6600]" />
                      <span className="text-white uppercase font-bold text-[11px] tracking-wider">
                        Available At {links.length} Store{links.length === 1 ? '' : 's'}:
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500">Official / Verified Sources</span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {links.map((link, idx) => {
                      const title = link.title || 'Store';
                      let hostname = '';
                      try {
                        hostname = new URL(link.url).hostname.replace(/^www\./, '');
                      } catch {
                        hostname = link.url;
                      }

                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1a14] border border-[#2a2a2a] hover:border-[#ff6600]/60 transition-all text-xs"
                          title={`Open ${title} link in new tab`}
                        >
                          <span className="w-2 h-2 rounded-full bg-[#ff6600] group-hover:scale-125 transition-transform shrink-0" />
                          <span className="font-bold text-neutral-200 group-hover:text-white uppercase text-[11px]">
                            {title}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-normal truncate max-w-[120px]">
                            ({hostname})
                          </span>
                          <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-[#ff6600] shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/upload?productId=${product.id}`}
                className="px-4 py-2.5 rounded-lg bg-retro-orange hover:bg-retro-orange-hover text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-retro"
              >
                <Star className="w-4 h-4 fill-black" />
                <span>RATE THIS PRODUCT</span>
              </Link>

              {(() => {
                const links = (product.store_links && product.store_links.length > 0)
                  ? product.store_links
                  : (product.product_url ? [{ title: 'Store', url: product.product_url }] : []);

                if (links.length === 0) return null;

                if (links.length === 1) {
                  return (
                    <a
                      href={links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      title="Open store link in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>BUY ON {links[0].title?.toUpperCase() || 'STORE'} &rarr;</span>
                    </a>
                  );
                }

                return (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      title={`Open ${links[0].title} store link in new tab`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>BUY ON {links[0].title?.toUpperCase() || 'STORE'} &rarr;</span>
                    </a>
                    {links.slice(1).map((extraLink, i) => (
                      <a
                        key={i}
                        href={extraLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1e1e1e] border border-[#333] hover:border-neutral-400 text-neutral-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all"
                        title={`Open ${extraLink.title} in new tab`}
                      >
                        <span>{extraLink.title || 'Store'}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </a>
                    ))}
                  </div>
                );
              })()}

              <button
                onClick={handleSave}
                className={`px-3.5 py-2.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
                  saved
                    ? 'bg-retro-orange/15 border-retro-orange text-retro-orange'
                    : 'bg-retro-black border-retro-border text-neutral-300 hover:text-white hover:border-neutral-500'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-retro-orange' : ''}`} />
                <span>{saved ? '[ SAVED ]' : '[ SAVE ]'}</span>
              </button>

              <button
                onClick={() => router.push(`/compare?ids=${product.id}`)}
                className="px-3.5 py-2.5 rounded-lg border border-retro-border bg-retro-black hover:bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-500 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                title="Compare with another product"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>[ COMPARE ]</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-lg border border-retro-border bg-retro-black hover:bg-neutral-900 text-neutral-300 hover:text-white hover:border-neutral-500 transition-all"
                title="Share link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        {product.specs && Object.keys(product.specs).length > 0 && (
          <div className="mt-8 pt-6 border-t border-retro-border">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-retro-orange" />
              <span>TECHNICAL SPECIFICATIONS</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="p-3 rounded-lg bg-retro-black border border-retro-border">
                  <span className="text-[10px] font-mono uppercase text-neutral-500 block truncate">{k}</span>
                  <span className="text-xs font-mono font-bold text-neutral-200 mt-0.5 block truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CORE FEATURE: AI Product Intelligence Section */}
      <section className="bg-retro-surface rounded-xl border border-retro-border p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Subtle retro top line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-retro-orange via-orange-400 to-transparent"></div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-retro-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-retro-black border border-retro-border flex items-center justify-center text-retro-orange">
              <Sparkles className="w-5 h-5 fill-retro-orange/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-bold text-white uppercase tracking-wider">
                  AI PRODUCT INTELLIGENCE REPORT
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-retro-orange/15 text-retro-orange border border-retro-orange/30">
                  REALBUY SYS.AI
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                ANALYSIS BASED ON {analysis?.reviews_analyzed_count || product.review_count} INDEPENDENT VERIFIED REVIEWS • ZERO SPONSORED DATA
              </p>
            </div>
          </div>

          <button
            onClick={handleRecalculateAI}
            disabled={recalculating}
            className="px-3 py-2 rounded-lg bg-retro-black border border-retro-border hover:border-retro-orange/50 text-xs font-mono font-bold text-neutral-300 hover:text-white flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-retro-orange' : ''}`} />
            <span>{recalculating ? 'RECALCULATING...' : 'RECALCULATE AI REPORT'}</span>
          </button>
        </div>

        {analysis ? (
          <div className="space-y-6">
            {/* Confidence Warning */}
            {analysis.confidence_level === 'low' && (
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/60 flex items-center gap-3 text-xs font-mono text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <strong>[ LOW DATA CONFIDENCE NOTICE ]:</strong> Analysis synthesized from initial reviews. Telemetry will sharpen automatically as more buyers submit verified feedback.
                </div>
              </div>
            )}

            {/* AI Buying Recommendation & Sentiment Score Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 p-5 rounded-lg bg-retro-black border border-retro-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-retro-surface border border-retro-orange/30 text-retro-orange flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-retro-orange">
                      AI BUYING RECOMMENDATION
                    </span>
                    <h3 className="text-lg font-mono font-extrabold text-white">
                      [ {analysis.recommendation.toUpperCase()} ]
                    </h3>
                    <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                      {analysis.recommendation_reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-retro-black border border-retro-border flex flex-col justify-center text-center font-mono">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400">Customer Satisfaction</span>
                <div className="text-3xl font-extrabold text-retro-orange my-1">
                  {analysis.sentiment_score}%
                </div>
                <div className="text-[10px] text-neutral-400">
                  {analysis.positive_pct}% POSITIVE • {analysis.neutral_pct}% NEUTRAL • {analysis.negative_pct}% CRITICAL
                </div>
              </div>
            </div>

            {/* Pros and Cons Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pros */}
              <div className="p-5 rounded-lg bg-retro-black border border-retro-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                  <ThumbsUp className="w-4 h-4 text-emerald-500" />
                  <span>PRAISED STRENGTHS (PROS)</span>
                </div>
                <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                  {pros.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-mono font-bold shrink-0">[+]</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="p-5 rounded-lg bg-retro-black border border-retro-border space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-retro-orange">
                  <ThumbsDown className="w-4 h-4 text-retro-orange" />
                  <span>COMMON COMPLAINTS (CONS)</span>
                </div>
                <ul className="space-y-2 text-xs text-neutral-300 font-sans">
                  {cons.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-retro-orange font-mono font-bold shrink-0">[-]</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Durability, Value, and Target Audience Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-lg bg-retro-black border border-retro-border space-y-1.5">
                <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-retro-orange" /> DURABILITY & PERFORMANCE
                </span>
                <p className="text-neutral-300 font-sans text-xs leading-relaxed">
                  {analysis.durability_insights}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-retro-black border border-retro-border space-y-1.5">
                <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> VALUE-FOR-MONEY
                </span>
                <p className="text-neutral-300 font-sans text-xs leading-relaxed">
                  {analysis.value_analysis}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-retro-black border border-retro-border space-y-1.5">
                <span className="font-bold text-white uppercase flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-retro-orange" /> INVOICE VERIFICATION AUDIT
                </span>
                <p className="text-neutral-300 font-sans text-xs leading-relaxed">
                  {analysis.verified_vs_unverified_insights}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs font-mono text-neutral-400">[ AWAITING USER REVIEWS TO SYNTHESIZE AI REPORT ]</p>
        )}
      </section>

      {/* Two Column Section: Interactive "Ask AI" on Left & Reviews on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ask AI Chatbot */}
        <div className="lg:col-span-5 sticky top-20">
          <AskAIWidget product={product} />
        </div>

        {/* Right Column: Customer Reviews Feed */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-retro-border font-mono">
            <div>
              <h2 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
                <span>COMMUNITY REVIEWS</span>
                <span className="text-retro-orange">({reviews.length})</span>
              </h2>
              <p className="text-[11px] text-neutral-400">Authentic buyer ratings, photos, and verified receipts</p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value as any)}
                className="p-1.5 rounded-lg border border-retro-border bg-retro-black text-xs font-mono font-medium text-neutral-200 focus:border-retro-orange focus:outline-none"
              >
                <option value="helpful">Most Helpful</option>
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
                <option value="verified">Verified Buyers Only</option>
              </select>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center bg-retro-surface rounded-xl border border-retro-border space-y-3 font-mono">
              <p className="text-xs text-neutral-400">[ NO REVIEWS FOUND FOR CURRENT FILTER ]</p>
              <Link
                href="/upload"
                className="inline-block px-4 py-2 text-xs font-bold bg-retro-orange text-black rounded-lg uppercase tracking-wider hover:bg-retro-orange-hover"
              >
                SUBMIT FIRST REVIEW
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} onRefresh={loadProductReviews} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Similar Products Recommendation */}
      {similarProducts.length > 0 && (
        <div className="pt-8 border-t border-retro-border space-y-4">
          <div className="flex items-center justify-between font-mono">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              SIMILAR PRODUCTS IN // {product.category}
            </h3>
            <Link href="/explore" className="text-xs text-retro-orange hover:underline">
              BROWSE ALL &gt;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similarProducts.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group p-3 rounded-xl bg-retro-surface border border-retro-border hover:border-retro-orange/40 transition-all font-mono"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-retro-black border border-retro-border mb-2.5">
                  <img
                    src={p.thumbnail_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="text-[10px] font-bold uppercase text-retro-orange">{p.brand}</div>
                <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-retro-orange transition-colors">
                  {p.name}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-retro-orange">
                  <Star className="w-3.5 h-3.5 fill-retro-orange text-retro-orange" />
                  <span>{Number(p.avg_rating).toFixed(1)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
