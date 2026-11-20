'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  Sparkles,
  Bookmark,
  Scale,
  Zap,
  Check,
  X,
  ArrowRight,
  PlusSquare,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from 'lucide-react';
import { Product } from '@/lib/types';
import { useAuth } from '@/lib/context';
import AIReportModal from './AIReportModal';

interface ProductCardProps {
  product: Product;
  onSelectForCompare?: (id: string) => void;
  isCompareSelected?: boolean;
}

export default function ProductCard({
  product,
  onSelectForCompare,
  isCompareSelected,
}: ProductCardProps) {
  const { user, toast } = useAuth();
  const [saved, setSaved] = useState(product.is_saved || false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast('Please sign in to save products', 'info');
      return;
    }
    try {
      const res = await fetch(`/api/products/${product.id}/save`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSaved(data.saved);
        toast(data.message, 'success');
      }
    } catch (err) {
      toast('Error saving product', 'error');
    }
  };

  const rec = product.ai_recommendation;
  const pros = product.ai_pros || [];
  const cons = product.ai_cons || [];

  return (
    <>
      <div className="group relative bg-[#0f0f0f] rounded-2xl border border-[#222222] hover:border-[#ff6600]/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-all duration-300 flex flex-col overflow-hidden">
        {/* Product Image & Top Overlays */}
        <Link
          href={`/product/${product.id}`}
          className="relative block aspect-[16/10] bg-black overflow-hidden border-b border-[#1c1c1c]"
        >
          <img
            src={
              product.thumbnail_url ||
              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          />

          {/* AI Recommendation Badge */}
          {rec && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/85 text-[#ff6600] border border-[#ff6600]/50 text-[9px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{rec}</span>
            </div>
          )}

          {/* Bookmark Button */}
          <button
            onClick={handleSave}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-lg backdrop-blur-md transition-colors ${
              saved
                ? 'bg-[#ff6600] text-black'
                : 'bg-black/60 text-neutral-400 hover:text-white border border-[#333]'
            }`}
            title="Save product"
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-black' : ''}`} />
          </button>
        </Link>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              <span>{product.brand}</span>
              <span>// {product.category}</span>
            </div>

            <Link href={`/product/${product.id}`} className="block mt-1">
              <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff6600] transition-colors leading-snug">
                {product.name}
              </h3>
            </Link>

            {/* Overall Rating & Pricing */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1a1a1a]">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#ff6600] text-[#ff6600]" />
                <span className="text-sm font-mono font-bold text-white">
                  {product.avg_rating || 0}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  / 5.0 ({product.review_count || 0} ratings)
                </span>
              </div>

              {product.min_price ? (
                <div className="text-xs font-mono font-bold text-[#ff6600]">
                  ${product.min_price}
                  {product.max_price && product.max_price > product.min_price
                    ? ` - $${product.max_price}`
                    : ''}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-neutral-500">MSRP VARIES</span>
              )}
            </div>

            {/* Detailed Parameters Row (Durability, Quality, Value) */}
            <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-[#1a1a1a] text-center font-mono">
              <div className="p-1 rounded bg-[#141414] border border-[#222]">
                <span className="text-[8px] text-neutral-500 block uppercase">Durability</span>
                <span className="text-[11px] font-bold text-white">
                  {product.avg_durability ? `${product.avg_durability}★` : '—'}
                </span>
              </div>
              <div className="p-1 rounded bg-[#141414] border border-[#222]">
                <span className="text-[8px] text-neutral-500 block uppercase">Quality</span>
                <span className="text-[11px] font-bold text-white">
                  {product.avg_quality ? `${product.avg_quality}★` : '—'}
                </span>
              </div>
              <div className="p-1 rounded bg-[#141414] border border-[#222]">
                <span className="text-[8px] text-neutral-500 block uppercase">Value</span>
                <span className="text-[11px] font-bold text-[#ff6600]">
                  {product.avg_value ? `${product.avg_value}★` : '—'}
                </span>
              </div>
            </div>

            {/* AI Synthesized Pros & Cons in Bullet Points */}
            <div className="mt-3 p-2.5 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] space-y-1.5 font-sans">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span className="flex items-center gap-1 text-[#ff6600]">
                  <Sparkles className="w-2.5 h-2.5" /> AI PROS & CONS
                </span>
                {product.ai_sentiment_score && (
                  <span className="text-emerald-400">{product.ai_sentiment_score}% Positive</span>
                )}
              </div>

              {pros.length > 0 ? (
                <div className="space-y-1">
                  {pros.slice(0, 2).map((pro, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-neutral-300">
                      <span className="text-emerald-400 font-mono font-bold text-xs leading-none shrink-0">
                        +
                      </span>
                      <span className="line-clamp-1">{pro}</span>
                    </div>
                  ))}
                  {cons.slice(0, 1).map((con, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-neutral-400">
                      <span className="text-rose-400 font-mono font-bold text-xs leading-none shrink-0">
                        -
                      </span>
                      <span className="line-clamp-1">{con}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 italic">
                  Awaiting owner ratings to generate pros & cons summary.
                </p>
              )}
            </div>
          </div>

          {/* Card Action Buttons */}
          <div className="pt-2 border-t border-[#1c1c1c] flex items-center justify-between gap-2">
            <Link
              href={`/product/${product.id}`}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#1a140f] hover:bg-[#ff6600] text-[#ff6600] hover:text-black border border-[#ff6600]/40 hover:border-[#ff6600] text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>VIEW FULL AI REPORT</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            <Link
              href={`/upload?productId=${product.id}`}
              className="p-1.5 rounded-lg border border-[#262626] bg-[#141414] hover:border-[#ff6600]/50 hover:text-[#ff6600] text-neutral-400 transition-colors"
              title="Rate this product"
            >
              <PlusSquare className="w-3.5 h-3.5" />
            </Link>

            {(() => {
              const primaryLink = (product.store_links && product.store_links.length > 0)
                ? product.store_links[0]
                : (product.product_url ? { title: 'Store', url: product.product_url } : null);

              if (!primaryLink?.url) return null;

              return (
                <a
                  href={primaryLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-[#262626] bg-[#141414] hover:border-emerald-500/50 text-neutral-400 hover:text-emerald-400 transition-colors"
                  title={`View on ${primaryLink.title || 'store'}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              );
            })()}

            {onSelectForCompare && (
              <button
                onClick={() => onSelectForCompare(product.id)}
                className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isCompareSelected
                    ? 'bg-[#ff6600] border-[#ff6600] text-black font-bold'
                    : 'border-[#262626] text-neutral-400 hover:border-neutral-500 hover:text-white bg-[#141414]'
                }`}
                title="Compare with another product"
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showAiModal && (
        <AIReportModal
          productId={product.id}
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </>
  );
}
