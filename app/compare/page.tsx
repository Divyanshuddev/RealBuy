'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Award,
  Zap,
  DollarSign,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { Product } from '@/lib/types';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idsQuery = searchParams.get('ids') || 'p1,p2';

  const [comparedProducts, setComparedProducts] = useState<any[]>([]);
  const [aiVerdict, setAiVerdict] = useState<any>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToAdd, setSelectedToAdd] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setCatalog(data.products);
      });
  }, []);

  useEffect(() => {
    loadComparison(idsQuery);
  }, [idsQuery]);

  const loadComparison = async (idsStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/compare?ids=${idsStr}`);
      const data = await res.json();
      if (data.products) {
        setComparedProducts(data.products);
        setAiVerdict(data.aiVerdict);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (idToRemove: string) => {
    const currentIds = idsQuery.split(',').filter((id) => id !== idToRemove);
    if (currentIds.length > 0) {
      router.push(`/compare?ids=${currentIds.join(',')}`);
    }
  };

  const handleAddProduct = () => {
    if (!selectedToAdd) return;
    const currentIds = idsQuery.split(',').filter(Boolean);
    if (!currentIds.includes(selectedToAdd)) {
      currentIds.push(selectedToAdd);
      router.push(`/compare?ids=${currentIds.join(',')}`);
      setSelectedToAdd('');
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-retro-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-retro-orange">
            <Scale className="w-4 h-4" />
            <span>CROSS-PRODUCT COMPARATOR // REALBUY SYS.AI</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">
            Side-by-Side Product Intelligence
          </h1>
          <p className="text-xs text-neutral-400">
            Compare specs, reported prices, customer sentiment, and AI buying verdicts side by side.
          </p>
        </div>

        {/* Add Product Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            className="p-2.5 rounded-lg border border-retro-border bg-retro-black text-xs font-mono font-medium text-neutral-200 focus:border-retro-orange focus:outline-none"
          >
            <option value="">+ Add Product to Compare</option>
            {catalog
              .filter((c) => !idsQuery.split(',').includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} - {c.name}
                </option>
              ))}
          </select>
          <button
            onClick={handleAddProduct}
            disabled={!selectedToAdd}
            className="px-4 py-2.5 rounded-lg bg-retro-orange text-black font-bold text-xs uppercase disabled:opacity-40 hover:bg-retro-orange-hover transition-all shadow-retro"
          >
            Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-retro-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-neutral-400 uppercase tracking-widest">[ SYNTHESIZING_CROSS_PRODUCT_VERDICT ... ]</p>
        </div>
      ) : comparedProducts.length === 0 ? (
        <div className="p-12 text-center bg-retro-surface rounded-xl border border-retro-border text-xs text-neutral-400">
          [ SELECT AT LEAST 2 PRODUCTS TO COMPARE SIDE-BY-SIDE ]
        </div>
      ) : (
        <>
          {/* AI Comparative Verdict Banner */}
          {aiVerdict && (
            <div className="p-6 rounded-xl bg-retro-surface border border-retro-border space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-retro-orange via-orange-400 to-transparent"></div>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-retro-orange">
                <Sparkles className="w-4 h-4 fill-retro-orange" />
                <span>AI COMPARATIVE VERDICT // REALBUY ENGINE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-retro-black border border-retro-border space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> HIGHEST SATISFACTION WINNER
                  </div>
                  <div className="text-sm font-extrabold text-white">{aiVerdict.overallWinner}</div>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">{aiVerdict.overallWinnerReason}</p>
                </div>

                <div className="p-4 rounded-lg bg-retro-black border border-retro-border space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-retro-orange flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> BEST VALUE-FOR-MONEY CHOICE
                  </div>
                  <div className="text-sm font-extrabold text-white">{aiVerdict.valueWinner}</div>
                  <p className="text-xs text-neutral-300 font-sans leading-relaxed">{aiVerdict.valueWinnerReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Grid Table */}
          <div className="bg-retro-surface rounded-xl border border-retro-border overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-retro-border bg-retro-black">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-neutral-400 w-44">
                    Product Metric
                  </th>
                  {comparedProducts.map((p) => (
                    <th key={p.id} className="p-4 align-top">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-retro-orange block">
                            {p.brand}
                          </span>
                          <Link
                            href={`/product/${p.id}`}
                            className="text-xs font-bold text-white hover:text-retro-orange transition-colors line-clamp-1"
                          >
                            {p.name}
                          </Link>
                        </div>
                        {comparedProducts.length > 1 && (
                          <button
                            onClick={() => handleRemove(p.id)}
                            className="p-1 rounded text-neutral-500 hover:text-retro-orange hover:bg-neutral-800 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-retro-border text-xs">
                {/* Thumbnail */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Hardware Preview</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      <img
                        src={p.thumbnail_url}
                        alt={p.name}
                        className="w-20 h-20 rounded-lg object-cover border border-retro-border bg-retro-black"
                      />
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Overall Rating</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      <div className="flex items-center gap-1.5 font-bold text-retro-orange">
                        <Star className="w-4 h-4 fill-retro-orange text-retro-orange" />
                        <span className="text-sm">{p.avg_rating}</span>
                        <span className="text-neutral-500 font-normal">({p.review_count} reviews)</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Reported Price */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Reported Price</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 font-bold text-white text-sm">
                      ${p.min_price || 0} {p.max_price && p.max_price > (p.min_price || 0) ? `- $${p.max_price}` : ''}
                    </td>
                  ))}
                </tr>

                {/* AI Satisfaction Score */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">AI Satisfaction Score</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      <div className="inline-block px-2.5 py-1 rounded bg-retro-black border border-retro-orange/30 text-retro-orange font-bold text-xs">
                        {p.aiAnalysis?.sentiment_score || 85}% SATISFACTION
                      </div>
                    </td>
                  ))}
                </tr>

                {/* AI Recommendation */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">AI Recommendation</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      <span className="font-bold text-white uppercase text-[11px]">
                        [ {p.aiAnalysis?.recommendation || 'RECOMMENDED'} ]
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Praised Pros */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Top Strengths</td>
                  {comparedProducts.map((p) => {
                    const pros = p.aiAnalysis?.pros || [];
                    return (
                      <td key={p.id} className="p-4 space-y-1.5 font-sans">
                        {pros.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-neutral-300 text-[11px]">
                            <span className="text-emerald-400 font-mono font-bold shrink-0">[+]</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>

                {/* Common Complaints */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Known Complaints</td>
                  {comparedProducts.map((p) => {
                    const cons = p.aiAnalysis?.cons || [];
                    return (
                      <td key={p.id} className="p-4 space-y-1.5 font-sans">
                        {cons.slice(0, 3).map((item: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-neutral-300 text-[11px]">
                            <span className="text-retro-orange font-mono font-bold shrink-0">[-]</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>

                {/* Durability */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Durability Telemetry</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4 text-neutral-300 font-sans text-xs leading-relaxed">
                      {p.aiAnalysis?.durability_insights || 'No durability issues reported.'}
                    </td>
                  ))}
                </tr>

                {/* Target Audience */}
                <tr>
                  <td className="p-4 text-neutral-400 font-semibold uppercase text-[11px]">Best Use Case</td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="p-4">
                      <Link
                        href={`/product/${p.id}`}
                        className="inline-flex items-center gap-1.5 text-retro-orange hover:underline font-bold text-xs"
                      >
                        <span>VIEW FULL TELEMETRY</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
      <Suspense
        fallback={
          <div className="p-16 flex flex-col items-center justify-center space-y-3 font-mono">
            <div className="w-8 h-8 border-2 border-retro-orange border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-neutral-400 uppercase tracking-widest">[ LOADING_COMPARATOR ... ]</p>
          </div>
        }
      >
        <CompareContent />
      </Suspense>
    </div>
  );
}
