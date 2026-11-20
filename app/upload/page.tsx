'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UploadCloud,
  Star,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
  DollarSign,
  Calendar,
  Store,
  CheckCircle2,
  Lock,
  PlusSquare,
  Package,
  Layers,
  ThumbsUp,
  ThumbsDown,
  Zap,
  ArrowRight,
  Upload,
  Trash2,
  AlertCircle,
  X,
  MoveUp,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/context';
import { Product } from '@/lib/types';

function detectStoreName(url: string): string {
  try {
    const raw = url.trim().toLowerCase();
    if (!raw) return '';
    if (raw.includes('amazon.') || raw.includes('amzn.')) return 'Amazon';
    if (raw.includes('bestbuy.')) return 'Best Buy';
    if (raw.includes('apple.com')) return 'Apple Store';
    if (raw.includes('walmart.')) return 'Walmart';
    if (raw.includes('target.com')) return 'Target';
    if (raw.includes('ebay.')) return 'eBay';
    if (raw.includes('flipkart.')) return 'Flipkart';
    if (raw.includes('newegg.')) return 'Newegg';
    if (raw.includes('bhphotovideo.')) return 'B&H Photo';
    if (raw.includes('aliexpress.')) return 'AliExpress';
    const match = raw.match(/^(?:https?:\/\/)?(?:www\.)?([^\/:]+)/i);
    if (match && match[1]) {
      const parts = match[1].split('.');
      const domain = parts[0] === 'store' || parts[0] === 'shop' ? (parts[1] || parts[0]) : parts[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  } catch (e) {
    // ignore
  }
  return '';
}

function UploadFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, toast } = useAuth();

  const initialTab = searchParams.get('tab') === 'new_product' ? 'product' : 'review';
  const initialProductId = searchParams.get('productId') || '';

  const [activeTab, setActiveTab] = useState<'product' | 'review'>(initialTab);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);

  // New Product State (Blank by default)
  const [newBrand, setNewBrand] = useState('');
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newCategory, setNewCategory] = useState('Electronics');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  // Multiple Store Links State: Array of { title: string, url: string }
  const [storeLinks, setStoreLinks] = useState<Array<{ title: string; url: string }>>([]);
  const [storeUrlInput, setStoreUrlInput] = useState('');
  const [storeNameInput, setStoreNameInput] = useState('');
  // Product Images State: Min 1, Max 5 (Blank by default)
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [specs, setSpecs] = useState<Record<string, string>>({});

  // Review & Rating State
  const [title, setTitle] = useState('');
  const [positivePoints, setPositivePoints] = useState('');
  const [negativePoints, setNegativePoints] = useState('');
  const [content, setContent] = useState('');
  const [overallRating, setOverallRating] = useState(5);
  const [durabilityRating, setDurabilityRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  // Purchase & Receipt Verification
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasedFrom, setPurchasedFrom] = useState('');
  const [hasReceipt, setHasReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [storeName, setStoreName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          if (!selectedProductId) {
            setSelectedProductId(data.products[0].id);
          }
        }
      });
  }, []);

  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setSpecs({ ...specs, [newSpecKey.trim()]: newSpecVal.trim() });
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpec = (key: string) => {
    const next = { ...specs };
    delete next[key];
    setSpecs(next);
  };

  const handleStoreUrlChange = (val: string) => {
    setStoreUrlInput(val);
    const detected = detectStoreName(val);
    if (detected && (!storeNameInput || ['Amazon', 'Best Buy', 'Apple Store', 'Walmart', 'Target', 'eBay', 'Flipkart', 'Newegg', 'B&H Photo', 'AliExpress'].includes(storeNameInput))) {
      setStoreNameInput(detected);
    }
  };

  const handleAddStoreLink = () => {
    let url = storeUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (storeLinks.some((l) => l.url.toLowerCase() === url.toLowerCase())) {
      toast('This store link has already been added', 'info');
      return;
    }
    const detected = detectStoreName(url);
    const title = storeNameInput.trim() || detected || 'Store';
    setStoreLinks([...storeLinks, { title, url }]);
    setStoreUrlInput('');
    setStoreNameInput('');
    toast(`Added ${title} link!`, 'success');
  };

  const handleRemoveStoreLink = (index: number) => {
    const item = storeLinks[index];
    setStoreLinks(storeLinks.filter((_, i) => i !== index));
    toast(`Removed ${item?.title || 'store'} link`, 'info');
  };

  // Product Image Management: Min 1, Max 5
  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (productImages.length + files.length > 5) {
      toast(`Maximum 5 images allowed. You can only add ${Math.max(0, 5 - productImages.length)} more.`, 'error');
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          toast(data.error || `Failed to upload ${file.name}`, 'error');
        }
      }
      if (uploadedUrls.length > 0) {
        setProductImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
        toast(`Uploaded ${uploadedUrls.length} image(s)!`, 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Error uploading image files', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (productImages.length >= 5) {
      toast('Maximum 5 product images allowed.', 'error');
      return;
    }
    if (productImages.includes(url)) {
      toast('This image URL has already been added.', 'info');
      return;
    }
    setProductImages([...productImages, url]);
    setImageUrlInput('');
    toast('Image added!', 'success');
  };

  const handleRemoveImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
    toast('Image removed', 'info');
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = productImages[index];
    const remaining = productImages.filter((_, i) => i !== index);
    setProductImages([target, ...remaining]);
    toast('Set as Primary Cover Image!', 'success');
  };

  // Submit New Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in to upload product details', 'error');
      return;
    }
    if (!newBrand.trim() || !newName.trim()) {
      toast('Brand and product name are required', 'error');
      return;
    }
    if (productImages.length < 1) {
      toast('Minimum 1 product image is required. Please upload at least one photo.', 'error');
      return;
    }
    if (productImages.length > 5) {
      toast('Maximum 5 product images allowed. Please limit selection to 5.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: newBrand.trim(),
          name: newName.trim(),
          model: newModel.trim(),
          category: newCategory,
          description: newDescription.trim() || `${newBrand.trim()} ${newName.trim()} in ${newCategory}.`,
          thumbnail_url: productImages[0],
          images: productImages,
          product_url: storeLinks.length > 0 ? storeLinks[0].url : '',
          store_links: storeLinks,
          specs: specs,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Product "${newName}" created successfully with ${productImages.length} photo(s)!`, 'success');
        router.push(`/product/${data.id}`);
      } else {
        toast(data.detail || data.error || 'Failed to create product', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error creating product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Rating & Review
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast('Please sign in or choose a demo persona to rate products', 'error');
      return;
    }
    if (!selectedProductId) {
      toast('Please select a product to rate', 'error');
      return;
    }
    if (!title.trim() || !content.trim()) {
      toast('Please write a review title and detailed review', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Format content with explicit positive & negative comments if provided
      let fullContent = content.trim();
      if (positivePoints.trim() || negativePoints.trim()) {
        fullContent += `\n\nPROS / WHAT I LIKED:\n${positivePoints.trim()}\n\nCONS / DRAWBACKS:\n${negativePoints.trim()}`;
      }

      const reviewPayload = {
        product_id: selectedProductId,
        rating: overallRating,
        quality_rating: qualityRating,
        value_rating: valueRating,
        durability_rating: durabilityRating,
        title: title.trim(),
        content: fullContent,
        purchase_price: parseFloat(purchasePrice) || 0.0,
        purchase_date: purchaseDate,
        purchased_from: purchasedFrom.trim(),
        media_urls: [],
        receipt_url: hasReceipt ? receiptUrl.trim() : null,
        store_name: hasReceipt ? storeName.trim() : null,
        order_id: hasReceipt ? orderId.trim() : null,
      };

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });

      const data = await res.json();
      if (res.ok) {
        toast('Rating submitted! AI Pros & Cons recalculated.', 'success');
        router.push(`/product/${selectedProductId}`);
      } else {
        toast(data.detail || data.error || 'Failed to submit rating', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Error submitting review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6 font-mono">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#0f0f0f] border border-[#222] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#ff6600] via-orange-400 to-transparent"></div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-black border border-[#ff6600]/60 flex items-center justify-center text-[#ff6600] shadow-[0_0_15px_rgba(255,102,0,0.3)]">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider font-mono">
              PRODUCT UPLOAD & RATING PORTAL
            </h1>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Add new hardware to the catalog or rate durability, quality, and value for existing products.
            </p>
          </div>
        </div>

        {/* Tab Switcher: Upload Product vs Rate Product */}
        <div className="grid grid-cols-2 p-1 mt-6 rounded-xl bg-[#080808] border border-[#242424] max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('product')}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'product'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.35)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Upload Product</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'review'
                ? 'bg-[#ff6600] text-black shadow-[0_0_12px_rgba(255,102,0,0.35)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>2. Rate a Product</span>
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD NEW PRODUCT DETAILS */}
      {activeTab === 'product' && (
        <form
          onSubmit={handleCreateProduct}
          className="p-6 md:p-8 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-6"
        >
          <div className="border-b border-[#222] pb-4">
            <h2 className="text-xs font-bold text-[#ff6600] uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>UPLOAD NEW PRODUCT DETAILS TO CATALOG</span>
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-1">
              Add product specifications and photos so other owners and buyers can rate and review it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase text-neutral-400 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="e.g. Sony, Apple, Bose, Logitech"
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-neutral-400 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. WH-1000XM5 Wireless Headphones"
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-neutral-400 mb-1">Model / Code</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="e.g. WH1000XM5/B"
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase text-neutral-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
              >
                <option value="Electronics">Electronics</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Laptops">Laptops</option>
                <option value="Home appliances">Home appliances</option>
                <option value="Fitness">Fitness</option>
                <option value="Gaming">Gaming</option>
                <option value="Shoes">Shoes</option>
                <option value="Beauty">Beauty</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-neutral-400 mb-1">
              Description & Hardware Overview
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Highlight key design traits, target users, and notable features..."
              className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none font-sans"
            />
          </div>

          {/* E-Commerce & Store Links (Multiple Links Supported) */}
          <div className="p-4 rounded-xl bg-[#0c0c0c] border border-[#262626] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#1c1c1c] pb-2.5">
              <div>
                <label className="text-xs uppercase font-bold text-white flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#ff6600]" />
                  <span>E-COMMERCE / STORE LINKS</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-normal">(OPTIONAL • MULTIPLE)</span>
                </label>
                <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                  Add links from Amazon, Best Buy, Walmart, Apple, or official sites where buyers can view and purchase this product.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1a1a1a] border border-[#333] text-neutral-300">
                [ {storeLinks.length} LINK{storeLinks.length === 1 ? '' : 'S'} ADDED ]
              </span>
            </div>

            {/* Input Row: Store Name + Store URL + Add Button */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={storeNameInput}
                    onChange={(e) => setStoreNameInput(e.target.value)}
                    placeholder="Store (e.g. Amazon, Best Buy)"
                    className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-6">
                  <input
                    type="url"
                    value={storeUrlInput}
                    onChange={(e) => handleStoreUrlChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStoreLink();
                      }
                    }}
                    placeholder="https://www.amazon.com/dp/..."
                    className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddStoreLink}
                    disabled={!storeUrlInput.trim()}
                    className="w-full h-full py-2 px-3 rounded-lg bg-[#202020] hover:bg-[#ff6600] hover:text-black text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              {/* Quick store suggestion badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-neutral-500 font-mono">Quick stores:</span>
                {['Amazon', 'Best Buy', 'Apple Store', 'Walmart', 'Target', 'Official Site'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStoreNameInput(preset)}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#141414] hover:bg-[#202020] border border-[#282828] text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Added Store Links */}
            <div className="space-y-1.5 pt-1">
              {storeLinks.length === 0 ? (
                <p className="text-[11px] text-neutral-500 font-mono italic py-1">
                  // No store links added yet. Paste e-commerce links above so buyers can see where this product is sold.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {storeLinks.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-[#262626] group hover:border-neutral-600 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 shrink-0">
                          {link.title || 'Store'}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-300 hover:text-white truncate font-mono hover:underline flex items-center gap-1"
                          title={link.url}
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500 shrink-0" />
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStoreLink(idx)}
                        className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove store link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dedicated Product Images Upload (Min 1, Max 5) */}
          <div className="p-4 md:p-5 rounded-xl bg-[#0c0c0c] border border-[#262626] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c1c1c] pb-3">
              <div>
                <label className="text-xs uppercase font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#ff6600]" />
                  <span>PRODUCT IMAGES *</span>
                  <span className="text-[10px] text-neutral-400 font-mono font-normal">(MIN 1, MAX 5)</span>
                </label>
                <p className="text-[11px] text-neutral-400 font-sans mt-0.5">
                  Upload between 1 and 5 clear product photos. Image #1 will be the catalog cover photo.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                    productImages.length === 0
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                      : productImages.length >= 5
                      ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                      : 'bg-[#ff6600]/15 border-[#ff6600]/40 text-[#ff6600]'
                  }`}
                >
                  <Package className="w-3 h-3" />
                  <span>
                    [ {productImages.length} / 5 IMAGES ]
                  </span>
                  <span className="text-[9px] opacity-80">
                    {productImages.length === 0
                      ? '• MIN 1 REQUIRED'
                      : productImages.length >= 5
                      ? '• MAX REACHED'
                      : `• ${5 - productImages.length} MORE ALLOWED`}
                  </span>
                </span>
              </div>
            </div>

            {/* Upload Action Zone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* File Upload Zone */}
              <label
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center group ${
                  productImages.length >= 5
                    ? 'border-[#222] bg-[#080808] opacity-50 cursor-not-allowed'
                    : 'border-[#2e2e2e] bg-[#121212] hover:border-[#ff6600]/60 hover:bg-[#161616]'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFiles}
                  disabled={productImages.length >= 5 || uploadingImages}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-black border border-[#ff6600]/40 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">
                    {uploadingImages ? 'UPLOADING PHOTOS...' : 'CLICK OR DRAG PHOTOS'}
                  </p>
                  <p className="text-[10px] text-neutral-400 font-sans">
                    PNG, JPG, WebP supported • Max 5 images total
                  </p>
                </div>
              </label>

              {/* Direct URL Input */}
              <div className="p-3.5 rounded-xl border border-[#222] bg-[#121212] space-y-2.5 flex flex-col justify-between">
                <div>
                  <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Or Add Image via URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      disabled={productImages.length >= 5}
                      className="flex-1 p-2 text-xs rounded-lg border border-[#2c2c2c] bg-[#0c0c0c] text-white focus:border-[#ff6600] focus:outline-none disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!imageUrlInput.trim() || productImages.length >= 5}
                      className="px-3 py-2 rounded-lg bg-[#242424] hover:bg-[#ff6600] hover:text-black text-xs font-bold transition-all disabled:opacity-40"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Image Upload Hint */}
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span className="text-[#ff6600] font-bold">INFO:</span>
                  <span>Upload from device or paste direct image links. Minimum 1 photo, maximum 5.</span>
                </div>
              </div>
            </div>

            {/* Images Grid Preview: Slots 1 to 5 */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-bold uppercase tracking-wider text-white">
                  UPLOADED PRODUCT GALLERY:
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Click &apos;Set Cover&apos; to select catalog hero image
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[0, 1, 2, 3, 4].map((slotIdx) => {
                  const imgUrl = productImages[slotIdx];
                  const isCover = slotIdx === 0;

                  if (imgUrl) {
                    return (
                      <div
                        key={slotIdx}
                        className={`relative aspect-square rounded-xl overflow-hidden border transition-all group ${
                          isCover
                            ? 'border-[#ff6600] ring-2 ring-[#ff6600]/30 shadow-[0_0_15px_rgba(255,102,0,0.2)]'
                            : 'border-[#2a2a2a] bg-[#141414] hover:border-neutral-500'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Product photo ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Top Badges: Slot Number & Cover Badge */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-white backdrop-blur-xs">
                            #{slotIdx + 1}
                          </span>
                          {isCover && (
                            <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-[#ff6600] text-black shadow-xs">
                              ★ COVER
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(slotIdx)}
                              className="p-1 rounded-lg bg-rose-500/80 text-white hover:bg-rose-500 transition-colors shadow-xs"
                              title="Delete photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(slotIdx)}
                              className="w-full py-1 text-[9px] font-mono font-bold bg-[#ff6600] text-black rounded-lg uppercase tracking-wider shadow-sm hover:bg-[#ff771a] transition-all"
                            >
                              Set Cover
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot Placeholder
                  return (
                    <div
                      key={slotIdx}
                      className="aspect-square rounded-xl border border-dashed border-[#222] bg-[#0a0a0a] flex flex-col items-center justify-center p-2 text-center text-neutral-600 font-mono"
                    >
                      <ImageIcon className="w-5 h-5 opacity-40 mb-1" />
                      <span className="text-[10px] font-bold">SLOT #{slotIdx + 1}</span>
                      <span className="text-[8px] opacity-60">EMPTY</span>
                    </div>
                  );
                })}
              </div>

              {productImages.length === 0 && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Validation Warning: You must add at least 1 image before publishing.</span>
                </div>
              )}
            </div>
          </div>

          {/* Specifications Builder */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#222] space-y-3">
            <label className="block text-[11px] uppercase text-neutral-400 font-bold">
              Key Technical Specifications
            </label>
            {Object.keys(specs).length === 0 ? (
              <p className="text-[11px] text-neutral-500 font-mono italic py-1">
                // No technical specifications added yet. Use the fields below to add hardware specs (e.g. Battery Life, Material, Weight).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141414] border border-[#262626] text-xs"
                  >
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase">{k}: </span>
                      <span className="text-white font-bold">{v}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(k)}
                      className="text-neutral-500 hover:text-rose-400 text-xs px-1"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="Spec (e.g. Battery Life)"
                className="flex-1 p-2 text-xs rounded-lg border border-[#262626] bg-[#141414] text-white"
              />
              <input
                type="text"
                value={newSpecVal}
                onChange={(e) => setNewSpecVal(e.target.value)}
                placeholder="Value (e.g. 30 Hours)"
                className="flex-1 p-2 text-xs rounded-lg border border-[#262626] bg-[#141414] text-white"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-3 py-2 rounded-lg bg-[#202020] hover:bg-[#ff6600] hover:text-black text-xs font-bold transition-colors"
              >
                + Add Spec
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] flex items-center justify-center gap-2"
          >
            {submitting ? 'SAVING PRODUCT...' : 'PUBLISH PRODUCT TO CATALOG &rarr;'}
          </button>
        </form>
      )}

      {/* TAB 2: RATE & REVIEW AN EXISTING PRODUCT */}
      {activeTab === 'review' && (
        <form
          onSubmit={handleCreateReview}
          className="p-6 md:p-8 rounded-2xl bg-[#0f0f0f] border border-[#222] space-y-6"
        >
          <div className="border-b border-[#222] pb-4">
            <h2 className="text-xs font-bold text-[#ff6600] uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 fill-[#ff6600]" />
              <span>SUBMIT RATINGS & POSITIVE / NEGATIVE COMMENTS</span>
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-1">
              Rate durability, build quality, and value for money to update the product&apos;s AI pros & cons summary.
            </p>
          </div>

          {/* Product Select */}
          <div>
            <label className="block text-[11px] uppercase text-neutral-400 mb-1">
              Select Product to Review *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#2a2a2a] bg-[#141414] text-white text-xs font-mono focus:border-[#ff6600] focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand} - {p.name} [{p.category}]
                </option>
              ))}
            </select>
          </div>

          {/* 4 Core Parameter Ratings */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#222] space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Score the Core Parameters (1 to 5 Stars)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overall */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Overall Impression:</span>
                  <span className="text-[#ff6600]">{overallRating} / 5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          overallRating >= star
                            ? 'fill-[#ff6600] text-[#ff6600]'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Durability */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Durability & Longevity:</span>
                  <span className="text-[#ff6600]">{durabilityRating} / 5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setDurabilityRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          durabilityRating >= star
                            ? 'fill-[#ff6600] text-[#ff6600]'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Build Quality */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Build Quality & Materials:</span>
                  <span className="text-white">{qualityRating} / 5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setQualityRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          qualityRating >= star
                            ? 'fill-[#ff6600] text-[#ff6600]'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Value For Money */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span>Value for Money:</span>
                  <span className="text-emerald-400">{valueRating} / 5</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setValueRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          valueRating >= star
                            ? 'fill-emerald-400 text-emerald-400'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] uppercase text-neutral-400 mb-1">
              Review Headline / Summary *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent sound and battery, but headband wears after 1 year"
              className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none"
            />
          </div>

          {/* Explicit Positive & Negative Comments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase text-emerald-400 font-bold">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Positive Highlights (What do you praise most?)</span>
              </label>
              <textarea
                rows={3}
                value={positivePoints}
                onChange={(e) => setPositivePoints(e.target.value)}
                placeholder="e.g. Battery holds charge for 30+ hours; noise cancelling shuts down plane noise completely."
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-emerald-500 focus:outline-none font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] uppercase text-rose-400 font-bold">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>Critical Drawbacks (What are the biggest issues?)</span>
              </label>
              <textarea
                rows={3}
                value={negativePoints}
                onChange={(e) => setNegativePoints(e.target.value)}
                placeholder="e.g. Ear cushions get warm in summer; microphone catches too much background chatter."
                className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-rose-500 focus:outline-none font-sans"
              />
            </div>
          </div>

          {/* Full Review Content */}
          <div>
            <label className="block text-[11px] uppercase text-neutral-400 mb-1">
              Detailed Ownership Experience *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share how long you have owned this product, how it has performed day-to-day, whether any parts failed, and if you would recommend it..."
              className="w-full p-2.5 text-xs rounded-xl border border-[#2a2a2a] bg-[#141414] text-white focus:border-[#ff6600] focus:outline-none font-sans"
            />
          </div>

          {/* Purchase Details & Optional Invoice Receipt */}
          <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#222] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Price Paid ($)</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="349"
                  className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Store / Retailer</label>
                <input
                  type="text"
                  value={purchasedFrom}
                  onChange={(e) => setPurchasedFrom(e.target.value)}
                  placeholder="Amazon, Apple Store"
                  className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#141414] text-white"
                />
              </div>
            </div>

            {/* Receipt Verification Toggle */}
            <div className="pt-2 border-t border-[#1c1c1c] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ff6600]" />
                  <span className="text-xs font-bold text-white uppercase">
                    Verify Purchase with Receipt (Earn &quot;Verified Buyer&quot; Badge)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasReceipt}
                  onChange={(e) => setHasReceipt(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#ff6600] cursor-pointer"
                />
              </div>

              {hasReceipt && (
                <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] space-y-2">
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="text-neutral-400">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl('https://images.unsplash.com/photo-1554415707-9e49fa747687?auto=format&fit=crop&w=800&q=80');
                        setStoreName('Amazon');
                        setOrderId('114-8930211-94821');
                        if (!purchasePrice) setPurchasePrice('299');
                      }}
                      className="px-2 py-0.5 rounded bg-[#202020] hover:bg-[#ff6600] hover:text-black border border-[#333]"
                    >
                      Amazon Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptUrl('https://images.unsplash.com/photo-1554415707-9e49fa747687?auto=format&fit=crop&w=800&q=80');
                        setStoreName('Apple Store');
                        setOrderId('W839201948');
                        if (!purchasePrice) setPurchasePrice('1199');
                      }}
                      className="px-2 py-0.5 rounded bg-[#202020] hover:bg-[#ff6600] hover:text-black border border-[#333]"
                    >
                      Apple Store
                    </button>
                  </div>
                  <input
                    type="text"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    placeholder="Receipt image link"
                    className="w-full p-2 text-xs rounded-lg border border-[#2a2a2a] bg-[#0c0c0c] text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[#ff6600] hover:bg-[#ff771a] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,102,0,0.3)] flex items-center justify-center gap-2"
          >
            {submitting ? 'RECALCULATING AI SUMMARY...' : 'SUBMIT RATINGS & REVIEWS &rarr;'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs text-neutral-400">Loading form...</div>}>
      <UploadFormContent />
    </Suspense>
  );
}
