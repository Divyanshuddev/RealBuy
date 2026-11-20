'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  Search,
  PlusSquare,
  Star,
  Zap,
  DollarSign,
  Award,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Headphones,
  Smartphone,
  Laptop,
  Home as HomeIcon,
  Activity,
  Gamepad2,
  Check,
  X,
  FileText
} from 'lucide-react';
import { Product, Review } from '@/lib/types';
import ProductCard from '@/components/ProductCard';
import ReviewCard from '@/components/ReviewCard';
import { useAuth } from '@/lib/context';

const CATEGORIES = [
  'All',
  'Electronics',
  'Smartphones',
  'Laptops',
  'Home appliances',
  'Fitness',
  'Gaming',
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    loadRecentReviews();
  }, [selectedCategory, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?sort=${sortBy}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentReviews = async () => {
    try {
      const res = await fetch('/api/reviews?feed=smart&limit=4');
      const data = await res.json();
      if (data.reviews) {
        setRecentReviews(data.reviews);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-10">
      {/* Hero Header: Product Review & AI Synthesis Engine */}
      <div className="relative rounded-3xl bg-[#0d0d0d] border border-[#222222] p-6 md:p-10 overflow-hidden shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6600] via-amber-500 to-transparent"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#ff6600]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e140a] border border-[#ff6600]/40 text-[11px] font-mono font-bold text-[#ff6600]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>REAL BUYER REVIEWS // AI PROS & CONS SYNTHESIS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Research Products with Real Owner Ratings & <span className="text-[#ff6600]">AI Pros & Cons</span>
          </h1>

          <p className="text-sm text-neutral-300 leading-relaxed max-w-2xl">
            Upload product details, review durability and build quality, and let AI synthesize hundreds of customer experiences into clear pros & cons bullet points.
          </p>

          {/* Quick Search Input */}
          <form onSubmit={handleSearch} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Sony, iPhone, Dell XPS, category..."
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl border border-[#2e2e2e] bg-[#141414] text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600] focus:ring-1 focus:ring-[#ff6600]/40 transition-all font-mono"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,102,0,0.3)] shrink-0"
            >
              Search Reviews
            </button>
          </form>

          {/* Direct Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
            <Link
              href="/upload?tab=new_product"
              className="px-4 py-2.5 rounded-xl bg-[#171717] hover:bg-[#202020] text-white font-bold border border-[#2f2f2f] hover:border-[#ff6600]/50 flex items-center gap-2 transition-all"
            >
              <PlusSquare className="w-4 h-4 text-[#ff6600]" />
              <span>+ Upload New Product Details</span>
            </Link>
            <Link
              href="/upload?tab=review"
              className="px-4 py-2.5 rounded-xl bg-[#171717] hover:bg-[#202020] text-white font-bold border border-[#2f2f2f] hover:border-emerald-500/50 flex items-center gap-2 transition-all"
            >
              <Star className="w-4 h-4 text-emerald-400" />
              <span>Rate a Product You Own</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core Parameters Explanation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#ff6600] uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Durability</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            How well the hardware resists wear, drops, battery decay, and heavy daily usage.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase">
            <Award className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>Build Quality</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Materials, tactile feel, finish, and structural rigidity evaluated by verified owners.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Value For Money</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Whether the product justifies its price tag compared to market alternatives.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Pros & Cons</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans">
            Automatic synthesis extracting key positive points and critical complaints into bullets.
          </p>
        </div>
      </div>

      {/* Products & AI Reviews Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold font-mono text-white uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#ff6600]" />
              <span>Products & AI Summarized Reviews</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Select any product to read bullet pros & cons, parameter scores, and verified user ratings.
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6600]" />
            <span className="text-neutral-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-1.5 rounded-lg border border-[#2b2b2b] bg-[#121212] text-neutral-200 text-xs font-mono focus:border-[#ff6600] focus:outline-none"
            >
              <option value="popular">Most Reviewed</option>
              <option value="highest_rated">Highest Overall Rating</option>
              <option value="recent">Recently Added</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.3)]'
                    : 'bg-[#121212] text-neutral-400 border border-[#242424] hover:text-white hover:bg-[#181818]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-[#121212] border border-[#222] animate-pulse"
              ></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center bg-[#0e0e0e] rounded-2xl border border-[#222] space-y-3 font-mono">
            <p className="text-xs text-neutral-400">// NO PRODUCTS FOUND IN THIS CATEGORY</p>
            <Link
              href="/upload?tab=new_product"
              className="inline-block px-4 py-2 text-xs font-bold bg-[#ff6600] text-black rounded-xl"
            >
              + Be the First to Upload This Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Latest Community Reviews Section */}
      <div className="space-y-6 pt-6 border-t border-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-bold font-mono text-white uppercase tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ff6600]" />
              <span>Latest User Ratings & Parameter Reviews</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Recent honest experiences submitted by product owners with verified purchase invoices.
            </p>
          </div>
          <Link
            href="/upload?tab=review"
            className="text-xs font-mono font-bold text-[#ff6600] hover:underline flex items-center gap-1"
          >
            <span>+ Write a Review</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recentReviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>

      {/* How RealBuy Works Guide */}
      <div className="rounded-3xl bg-[#0f0f0f] border border-[#222] p-6 md:p-8 space-y-6">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[#ff6600]">
            // THE REALBUY PROCESS
          </h3>
          <p className="text-lg font-bold text-white font-sans">
            How Products Are Reviewed & Synthesized
          </p>
          <p className="text-xs text-neutral-400">
            A transparent platform built exclusively for product research and honest buyer feedback.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-[#ff6600]/50 text-[#ff6600] font-mono font-bold text-xs flex items-center justify-center">
              01
            </div>
            <h4 className="text-xs font-bold text-white uppercase font-mono">1. Upload Product Details</h4>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Users add new products to the catalog with brand, model, specifications, approximate price, and photos.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-emerald-500/50 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              02
            </div>
            <h4 className="text-xs font-bold text-white uppercase font-mono">2. Community Rates Parameters</h4>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Owners rate Durability, Build Quality, and Value for Money, and submit positive highlights and critical complaints.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#242424] space-y-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/50 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
              03
            </div>
            <h4 className="text-xs font-bold text-white uppercase font-mono">3. AI Pros & Cons Bullets</h4>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              AI synthesizes all verified owner feedback into concise Pros, Cons, and Durability summaries without sponsored bias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
