'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Award,
  Zap,
  Terminal,
  Cpu
} from 'lucide-react';
import { AIAnalysis } from '@/lib/types';

interface AIReportModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIReportModal({ productId, isOpen, onClose }: AIReportModalProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      loadAnalysis();
    }
  }, [isOpen, productId]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (data.product) {
        setProductName(`${data.product.brand} ${data.product.name}`);
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await fetch(`/api/products/${productId}/ai-analysis`, { method: 'POST' });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  if (!isOpen) return null;

  const pros: string[] = analysis?.pros || (analysis?.pros_json ? JSON.parse(analysis.pros_json) : []);
  const cons: string[] = analysis?.cons || (analysis?.cons_json ? JSON.parse(analysis.cons_json) : []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0d0d0d] rounded-2xl border border-[#2a2a2a] shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#141414] border-b border-[#222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#ff6600] flex items-center justify-center text-[#ff6600] shadow-[0_0_10px_rgba(255,102,0,0.3)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-tight text-white uppercase">
                  AI PRODUCT INTELLIGENCE // REPORT
                </h2>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#ff6600] text-black">
                  SYS_ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono truncate max-w-md">{productName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="p-1.5 text-neutral-400 hover:text-[#ff6600] rounded-lg hover:bg-[#1a1a1a] transition-colors"
              title="Recalculate AI analysis"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin text-[#ff6600]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-7 h-7 text-[#ff6600] animate-spin" />
              <p className="text-xs font-mono text-neutral-400">// PROCESSING CUSTOMER REVIEW TELEMETRY...</p>
            </div>
          ) : !analysis ? (
            <div className="text-center py-12 text-xs font-mono text-neutral-500">
              // NO REVIEW DATA AVAILABLE YET FOR AI SYNTHESIS.
            </div>
          ) : (
            <>
              {/* Confidence Notice if Low */}
              {analysis.confidence_level === 'low' && (
                <div className="p-3 rounded-xl bg-[#1c140d] border border-[#ff6600]/40 flex items-start gap-2.5 text-xs text-neutral-300">
                  <AlertTriangle className="w-4 h-4 text-[#ff6600] shrink-0 mt-0.5" />
                  <div className="text-[11px] font-mono leading-relaxed">
                    <strong className="text-[#ff6600]">NOTICE:</strong> Analysis based on &lt; 3 reviews. Model recalculates automatically as new verified buyer invoices arrive.
                  </div>
                </div>
              )}

              {/* Recommendation Banner */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-black border border-[#ff6600]/50 flex items-center justify-center text-[#ff6600] shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#ff6600]">
                      // AI BUYING RECOMMENDATION
                    </div>
                    <div className="text-base font-black text-white font-mono uppercase">
                      [{analysis.recommendation}]
                    </div>
                    <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{analysis.recommendation_reason}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black font-mono text-[#ff6600]">{analysis.sentiment_score}%</div>
                  <div className="text-[10px] font-mono text-neutral-500">SATISFACTION</div>
                </div>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#121212] border border-[#222]">
                  <span className="text-[10px] font-mono text-neutral-500 block">COMMUNITY RATING</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {analysis.avg_rating} <span className="text-xs font-normal text-neutral-500">/ 5.0</span>
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 mt-1">{analysis.reviews_analyzed_count} REVIEWS</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121212] border border-[#222]">
                  <span className="text-[10px] font-mono text-neutral-500 block">BUILD QUALITY</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {analysis.quality_score} <span className="text-xs font-normal text-neutral-500">/ 5.0</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#ff6600] mt-1">FIT & MATERIALS</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121212] border border-[#222]">
                  <span className="text-[10px] font-mono text-neutral-500 block">VALUE FOR MONEY</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {analysis.value_score} <span className="text-xs font-normal text-neutral-500">/ 5.0</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#ff6600] mt-1">UTILITY RATIO</div>
                </div>

                <div className="p-3 rounded-xl bg-[#121212] border border-[#222]">
                  <span className="text-[10px] font-mono text-neutral-500 block">DURABILITY INDEX</span>
                  <div className="text-lg font-bold font-mono text-white mt-0.5">
                    {analysis.durability_score} <span className="text-xs font-normal text-neutral-500">/ 5.0</span>
                  </div>
                  <div className="text-[10px] font-mono text-[#ff6600] mt-1">LONGEVITY</div>
                </div>
              </div>

              {/* Sentiment Gauge Bar */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[#121212] border border-[#222]">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#ff6600] font-bold">{analysis.positive_pct}% POSITIVE</span>
                  <span className="text-neutral-500">{analysis.neutral_pct}% NEUTRAL</span>
                  <span className="text-neutral-400">{analysis.negative_pct}% CRITICAL</span>
                </div>
                <div className="h-2 w-full bg-[#1c1c1c] rounded-full overflow-hidden flex">
                  <div style={{ width: `${analysis.positive_pct}%` }} className="bg-[#ff6600] h-full"></div>
                  <div style={{ width: `${analysis.neutral_pct}%` }} className="bg-neutral-600 h-full"></div>
                  <div style={{ width: `${analysis.negative_pct}%` }} className="bg-neutral-800 h-full"></div>
                </div>
              </div>

              {/* AI Executive Summary */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#222] space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#ff6600] uppercase">
                  <Cpu className="w-3.5 h-3.5" />
                  // AI EXECUTIVE SUMMARY
                </div>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">{analysis.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs border-t border-[#1f1f1f]">
                  <div>
                    <span className="font-mono text-[10px] text-[#ff6600] uppercase block">WHO SHOULD BUY:</span>
                    <p className="text-neutral-400 text-[11px] mt-0.5">{analysis.target_audience}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-neutral-500 uppercase block">WHO SHOULD AVOID:</span>
                    <p className="text-neutral-400 text-[11px] mt-0.5">{analysis.who_should_avoid}</p>
                  </div>
                </div>
              </div>

              {/* Pros & Cons Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Pros */}
                <div className="p-4 rounded-xl bg-[#111111] border border-[#222] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#ff6600] uppercase">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>PRAISED ADVANTAGES (PROS)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-300">
                    {pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#ff6600] font-mono font-bold">[+]</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div className="p-4 rounded-xl bg-[#111111] border border-[#222] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-400 uppercase">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>REPORTED COMPLAINTS (CONS)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-neutral-300">
                    {cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-neutral-500 font-mono font-bold">[-]</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Durability & Verified Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#121212] border border-[#222] space-y-1">
                  <div className="font-mono text-[10px] text-[#ff6600] uppercase flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    DURABILITY & PERFORMANCE INSIGHT
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">{analysis.durability_insights}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#121212] border border-[#222] space-y-1">
                  <div className="font-mono text-[10px] text-[#ff6600] uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    VERIFIED INVOICE CROSS-CHECK
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">{analysis.verified_vs_unverified_insights}</p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1c1c1c] text-[10px] font-mono text-neutral-500">
                <span>ANALYSIS_SAMPLES: {analysis.reviews_analyzed_count} VERIFIED REVIEWS</span>
                <span>LAST_SYNC: {new Date(analysis.last_analyzed_at).toLocaleDateString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Link */}
        <div className="p-4 bg-[#141414] border-t border-[#222] flex items-center justify-between">
          <Link
            href={`/product/${productId}`}
            onClick={onClose}
            className="text-xs font-mono font-bold text-[#ff6600] hover:underline flex items-center gap-1.5"
          >
            OPEN FULL PRODUCT PAGE <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#222] hover:bg-[#2c2c2c] text-white transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
