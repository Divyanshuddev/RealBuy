'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Star,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Filter,
  Terminal
} from 'lucide-react';
import { Product } from '@/lib/types';
import AIReportModal from '@/components/AIReportModal';

export default function AIAnalysisHubPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRec, setFilterRec] = useState('All');
  const [search, setSearch] = useState('');
  const [activeModalProductId, setActiveModalProductId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products?sort=popular')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const rec = (p as any).ai_recommendation || '';
    const matchesFilter = filterRec === 'All' || rec === filterRec;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 font-mono">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-xl bg-retro-surface border border-retro-border relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-retro-orange via-orange-400 to-transparent"></div>

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-retro-black border border-retro-orange/30 text-[10px] font-bold text-retro-orange uppercase">
            <Sparkles className="w-3.5 h-3.5 fill-retro-orange" />
            <span>AI PRODUCT INTELLIGENCE HUB // REALBUY SYS.AI</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            Customer Satisfaction & Telemetry Leaderboard
          </h1>
          <p className="text-xs text-neutral-400 font-sans leading-relaxed">
            Continuous synthesis across thousands of verified customer reviews, receipts, and multi-dimensional star ratings.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-retro-surface rounded-xl border border-retro-border flex flex-wrap items-center justify-between gap-4">
        {/* Recommendation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['All', 'Highly Recommended', 'Recommended', 'Consider Before Buying'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterRec(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 ${
                filterRec === tab
                  ? 'bg-retro-orange text-black shadow-retro'
                  : 'bg-retro-black text-neutral-400 border border-retro-border hover:border-retro-orange/40 hover:text-white'
              }`}
            >
              [ {tab} ]
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hardware..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-retro-border bg-retro-black text-neutral-200 focus:border-retro-orange focus:outline-none font-mono"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-retro-surface rounded-xl border border-retro-border overflow-hidden">
        <div className="p-4 border-b border-retro-border bg-retro-black flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-retro-orange" />
            <span>ANALYZED PRODUCTS & SATISFACTION SCORES</span>
          </h2>
          <span className="text-[11px] text-neutral-400">{filteredProducts.length} PRODUCTS ANALYZED</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-retro-orange border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">[ LOADING_AI_TELEMETRY ... ]</p>
          </div>
        ) : (
          <div className="divide-y divide-retro-border">
            {filteredProducts.map((p, rank) => {
              const sentiment = (p as any).ai_sentiment_score || 85;
              const rec = (p as any).ai_recommendation || 'Recommended';
              return (
                <div
                  key={p.id}
                  className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-neutral-500 w-8 text-center font-mono">
                      #{String(rank + 1).padStart(2, '0')}
                    </span>
                    <img
                      src={p.thumbnail_url}
                      alt={p.name}
                      className="w-14 h-14 rounded-lg object-cover border border-retro-border bg-retro-black shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-retro-orange">
                          {p.brand} // {p.category}
                        </span>
                        {p.verified_review_count && p.verified_review_count > 0 ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </span>
                        ) : null}
                      </div>
                      <Link
                        href={`/product/${p.id}`}
                        className="text-xs font-bold text-white hover:text-retro-orange transition-colors"
                      >
                        {p.name}
                      </Link>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                        <span className="flex items-center gap-1 text-retro-orange font-bold">
                          <Star className="w-3.5 h-3.5 fill-retro-orange text-retro-orange" />
                          <span>{p.avg_rating}</span>
                        </span>
                        <span>•</span>
                        <span>{p.review_count} REVIEWS</span>
                        <span>•</span>
                        <span className="text-neutral-300 font-bold">${p.min_price || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    {/* Satisfaction Bar */}
                    <div className="text-right">
                      <div className="text-xs font-bold text-retro-orange font-mono">
                        {sentiment}% SATISFACTION
                      </div>
                      <div className="text-[10px] text-neutral-400 uppercase">
                        [ {rec} ]
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModalProductId(p.id)}
                      className="px-3.5 py-2 rounded-lg bg-retro-black border border-retro-border hover:border-retro-orange text-xs font-bold text-neutral-200 hover:text-white uppercase transition-all shadow-xs"
                    >
                      AI REPORT
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Modal */}
      {activeModalProductId && (
        <AIReportModal
          productId={activeModalProductId}
          isOpen={Boolean(activeModalProductId)}
          onClose={() => setActiveModalProductId(null)}
        />
      )}
    </div>
  );
}
