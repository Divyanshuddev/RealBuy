'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Scale,
  Laptop,
  Smartphone,
  Headphones,
  Home,
  Activity,
  Gamepad2,
  Footprints,
  Sparkle
} from 'lucide-react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/ProductCard';

const CATEGORIES = [
  { name: 'All', icon: Sparkles },
  { name: 'Electronics', icon: Headphones },
  { name: 'Smartphones', icon: Smartphone },
  { name: 'Laptops', icon: Laptop },
  { name: 'Home appliances', icon: Home },
  { name: 'Fitness', icon: Activity },
  { name: 'Gaming', icon: Gamepad2 },
  { name: 'Beauty', icon: Sparkle },
  { name: 'Shoes', icon: Footprints },
];

export default function ExplorePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [minRating, setMinRating] = useState('0');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, sortBy, minRating]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?sort=${sortBy}&minRating=${minRating}`;
      if (selectedCategory !== 'All') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleToggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 3) {
        alert('You can compare up to 3 products simultaneously');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white font-mono uppercase tracking-tight">
            EXPLORE // PRODUCT DIRECTORY
          </h1>
          <p className="text-xs text-neutral-400 font-sans">
            Search verified buyer telemetry, real prices, and AI buying recommendations.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Sony, iPhone, Nike, category..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-[#2a2a2a] bg-[#121212] text-white focus:outline-none focus:border-[#ff6600]"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
        </form>
      </div>

      {/* Categories Horizontal Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#ff6600] text-black shadow-[0_0_10px_rgba(255,102,0,0.3)]'
                  : 'bg-[#121212] text-neutral-400 border border-[#222] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Sort Bar */}
      <div className="p-3 bg-[#0f0f0f] rounded-xl border border-[#222] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>SORT:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-1 rounded-lg border border-[#2a2a2a] bg-[#171717] text-white text-xs font-mono"
          >
            <option value="popular">Popular & Discussed</option>
            <option value="highest_rated">Highest Community Rating</option>
            <option value="recent">Recently Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-neutral-400">MIN RATING:</span>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="p-1 rounded-lg border border-[#2a2a2a] bg-[#171717] text-white text-xs font-mono"
          >
            <option value="0">All Ratings</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-[#121212] border border-[#222] animate-pulse"></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center bg-[#0f0f0f] rounded-2xl border border-[#222] space-y-2 font-mono">
          <p className="text-xs text-neutral-500">// NO PRODUCTS FOUND MATCHING CRITERIA</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelectForCompare={handleToggleCompare}
              isCompareSelected={compareIds.includes(p.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Compare Action Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#141414] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-[#ff6600]/40">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#ff6600]" />
            <span className="text-xs font-mono font-bold">
              [{compareIds.length}] SELECTED
            </span>
          </div>
          <button
            onClick={() => router.push(`/compare?ids=${compareIds.join(',')}`)}
            disabled={compareIds.length < 2}
            className="px-4 py-1.5 rounded-lg bg-[#ff6600] hover:bg-[#ff7700] disabled:opacity-50 text-black text-xs font-mono font-bold shadow-md transition-colors"
          >
            {compareIds.length < 2 ? 'SELECT 1 MORE' : 'COMPARE NOW'}
          </button>
          <button
            onClick={() => setCompareIds([])}
            className="text-neutral-500 hover:text-white text-xs font-mono"
          >
            CLEAR
          </button>
        </div>
      )}
    </div>
  );
}
