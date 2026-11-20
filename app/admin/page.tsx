'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Package,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  Eye,
  Check,
  X,
  Terminal
} from 'lucide-react';
import { useAuth } from '@/lib/context';
import UserAvatar from '@/components/UserAvatar';

export default function AdminDashboardPage() {
  const { user, toast } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'moderation' | 'verifications' | 'users'>('moderation');

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, modRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/moderation'),
      ]);

      const statsData = await statsRes.json();
      const modData = await modRes.json();

      if (statsData.stats) {
        setStats(statsData.stats);
        setRecentUsers(statsData.recentUsers || []);
      }
      if (modData.reports) setReports(modData.reports);
      if (modData.verifications) setVerifications(modData.verifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve_report', id: reportId, status }),
      });
      const data = await res.json();
      toast(data.message, 'success');
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status } : r)));
    } catch (err) {
      toast('Failed to resolve report', 'error');
    }
  };

  const handleDeleteReportedReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to permanently delete this reported review?')) return;
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_reported_review', reviewId }),
      });
      const data = await res.json();
      toast(data.message, 'success');
      loadAdminData();
    } catch (err) {
      toast('Failed to delete review', 'error');
    }
  };

  const handleVerifyPurchase = async (verifId: string, reviewId: string, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_purchase',
          id: verifId,
          reviewId,
          status,
          notes: status === 'verified' ? 'Approved by Admin Trust & Safety' : 'Insufficient purchase evidence',
        }),
      });
      const data = await res.json();
      toast(data.message, 'success');
      setVerifications(
        verifications.map((v) => (v.id === verifId ? { ...v, status } : v))
      );
    } catch (err) {
      toast('Error updating verification', 'error');
    }
  };

  const handleRecalculateAllAI = async () => {
    setRecalculatingAll(true);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recalculate_all_ai' }),
      });
      const data = await res.json();
      toast(data.message, 'success');
    } catch (err) {
      toast('Error recalculating AI reports', 'error');
    } finally {
      setRecalculatingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8 font-mono">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-retro-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-retro-orange">
            <ShieldCheck className="w-4 h-4" />
            <span>PLATFORM GOVERNANCE & TRUST // SYS.ADMIN</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1 uppercase tracking-tight">
            RealBuy Admin Console
          </h1>
          <p className="text-xs text-neutral-400">
            Moderate community reports, audit buyer invoices, and trigger global AI re-indexing.
          </p>
        </div>

        <button
          onClick={handleRecalculateAllAI}
          disabled={recalculatingAll}
          className="px-4 py-2.5 rounded-lg bg-retro-orange hover:bg-retro-orange-hover text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-retro"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculatingAll ? 'animate-spin' : ''}`} />
          <span>{recalculatingAll ? 'RECALCULATING CATALOG...' : 'GLOBAL AI RE-INDEX'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-retro-surface border border-retro-border">
          <div className="flex items-center justify-between text-neutral-400 text-[11px] font-bold uppercase">
            <span>Total Accounts</span>
            <Users className="w-3.5 h-3.5 text-retro-orange" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.totalUsers || 6}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Platform user accounts</div>
        </div>

        <div className="p-4 rounded-xl bg-retro-surface border border-retro-border">
          <div className="flex items-center justify-between text-neutral-400 text-[11px] font-bold uppercase">
            <span>Catalog Items</span>
            <Package className="w-3.5 h-3.5 text-retro-orange" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {stats?.totalProducts || 10}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Across 8 hardware categories</div>
        </div>

        <div className="p-4 rounded-xl bg-retro-surface border border-retro-border">
          <div className="flex items-center justify-between text-neutral-400 text-[11px] font-bold uppercase">
            <span>Total Reviews</span>
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {stats?.totalReviews || 18}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">{stats?.totalVerifiedReviews || 15} verified with invoice</div>
        </div>

        <div className="p-4 rounded-xl bg-retro-surface border border-retro-border">
          <div className="flex items-center justify-between text-neutral-400 text-[11px] font-bold uppercase">
            <span>AI Analyses Active</span>
            <Sparkles className="w-3.5 h-3.5 text-retro-orange" />
          </div>
          <div className="text-2xl font-black text-retro-orange mt-2">
            {stats?.aiAnalysesCount || 10}
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">Real synthesized review reports</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-retro-surface rounded-xl border border-retro-border">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'moderation'
              ? 'bg-retro-orange text-black shadow-retro'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Moderation Queue ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'verifications'
              ? 'bg-retro-orange text-black shadow-retro'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Invoices to Audit ({verifications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-retro-orange text-black shadow-retro'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Users Directory</span>
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'moderation' && (
        <div className="bg-retro-surface rounded-xl border border-retro-border overflow-hidden">
          <div className="p-4 border-b border-retro-border bg-retro-black font-bold text-xs uppercase tracking-wider text-neutral-400">
            [ PENDING COMMUNITY FLAGS & REPORTS ]
          </div>
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              [ NO PENDING REPORTS // PLATFORM INTEGRITY 100% ]
            </div>
          ) : (
            <div className="divide-y divide-retro-border">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold uppercase px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800">
                        {rep.reason}
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="font-semibold text-white">Target {rep.target_type} ID: {rep.target_id}</span>
                    </div>
                    <p className="text-xs text-neutral-300 font-sans">
                      Reported by @{rep.reporter_username}: &quot;{rep.description || 'Suspicious or inauthentic content'}&quot;
                    </p>
                    <span className="text-[10px] text-neutral-500 block">{new Date(rep.created_at).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="px-3 py-1.5 rounded-lg border border-retro-border bg-retro-black hover:border-neutral-500 text-xs font-bold text-neutral-300"
                    >
                      DISMISS FLAG
                    </button>
                    {rep.target_type === 'review' && (
                      <button
                        onClick={() => handleDeleteReportedReview(rep.target_id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>DELETE REVIEW</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Purchase Invoice Verifications */}
      {activeTab === 'verifications' && (
        <div className="bg-retro-surface rounded-xl border border-retro-border overflow-hidden">
          <div className="p-4 border-b border-retro-border bg-retro-black font-bold text-xs uppercase tracking-wider text-neutral-400">
            [ BUYER ORDER INVOICES SUBMITTED FOR AUDIT ]
          </div>
          {verifications.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              [ NO INVOICES AWAITING AUDIT ]
            </div>
          ) : (
            <div className="divide-y divide-retro-border">
              {verifications.map((v) => (
                <div key={v.id} className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <a
                      href={v.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-16 rounded-lg overflow-hidden border border-retro-border bg-retro-black shrink-0 relative group"
                    >
                      <img src={v.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </a>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{v.product_name}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          v.status === 'verified'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : v.status === 'rejected'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 font-sans">
                        Buyer: <strong>{v.user_name}</strong> (@{v.username}) • Store: {v.store_name} • Order #{v.order_id}
                      </p>
                      <p className="text-[11px] text-neutral-500 font-sans">Review: &quot;{v.review_title}&quot;</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifyPurchase(v.id, v.review_id, 'verified')}
                      className="px-3 py-1.5 rounded-lg bg-retro-orange hover:bg-retro-orange-hover text-black text-xs font-bold uppercase flex items-center gap-1 shadow-retro"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>APPROVE BADGE</span>
                    </button>
                    <button
                      onClick={() => handleVerifyPurchase(v.id, v.review_id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-retro-black border border-retro-border hover:border-rose-600 text-rose-400 text-xs font-bold uppercase flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>REJECT</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Registered Users Table */}
      {activeTab === 'users' && (
        <div className="bg-retro-surface rounded-xl border border-retro-border overflow-hidden">
          <div className="p-4 border-b border-retro-border bg-retro-black font-bold text-xs uppercase tracking-wider text-neutral-400">
            [ REGISTERED PLATFORM USERS ]
          </div>
          <div className="divide-y divide-retro-border">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar name={u.name} avatarUrl={u.avatar_url} size="md" />
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      <span>{u.name}</span>
                      <span className="text-[10px] text-neutral-500">(@{u.username})</span>
                      {u.is_verified ? <ShieldCheck className="w-3.5 h-3.5 text-retro-orange" /> : null}
                    </div>
                    <div className="text-[11px] text-neutral-400">{u.email} • Role: {u.role}</div>
                  </div>
                </div>
                <Link
                  href={`/profile/${u.username}`}
                  className="px-3 py-1.5 rounded-lg border border-retro-border bg-retro-black hover:border-retro-orange/40 text-xs font-bold text-neutral-300 hover:text-white"
                >
                  VIEW PROFILE
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
