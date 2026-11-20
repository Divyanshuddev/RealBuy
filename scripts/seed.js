const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'realbuy.db'));

console.log('Seeding RealBuy database with node:sqlite...');

// Drop existing tables
db.exec(`
  DROP TABLE IF EXISTS reports;
  DROP TABLE IF EXISTS notifications;
  DROP TABLE IF EXISTS ai_product_analyses;
  DROP TABLE IF EXISTS saved_products;
  DROP TABLE IF EXISTS follows;
  DROP TABLE IF EXISTS helpful_votes;
  DROP TABLE IF EXISTS likes;
  DROP TABLE IF EXISTS comment_replies;
  DROP TABLE IF EXISTS comments;
  DROP TABLE IF EXISTS purchase_verifications;
  DROP TABLE IF EXISTS review_media;
  DROP TABLE IF EXISTS product_reviews;
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS users;
`);

// Create tables
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_verified INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT DEFAULT '',
    category TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    images_json TEXT DEFAULT '[]',
    product_url TEXT DEFAULT '',
    store_links_json TEXT DEFAULT '[]',
    specs_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE product_reviews (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    rating REAL NOT NULL,
    quality_rating REAL NOT NULL,
    value_rating REAL NOT NULL,
    durability_rating REAL NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    purchase_price REAL DEFAULT 0,
    purchase_date TEXT DEFAULT '',
    purchased_from TEXT DEFAULT '',
    is_verified_purchase INTEGER DEFAULT 0,
    verification_status TEXT DEFAULT 'unverified',
    helpful_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE review_media (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE purchase_verifications (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    receipt_url TEXT NOT NULL,
    store_name TEXT DEFAULT '',
    order_id TEXT DEFAULT '',
    purchase_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE comment_replies (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    review_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, review_id)
  );

  CREATE TABLE helpful_votes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    review_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, review_id)
  );

  CREATE TABLE follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE saved_products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
  );

  CREATE TABLE ai_product_analyses (
    id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL,
    recommendation TEXT NOT NULL,
    recommendation_reason TEXT NOT NULL,
    summary TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    who_should_avoid TEXT NOT NULL,
    sentiment_score REAL NOT NULL,
    positive_pct REAL NOT NULL,
    negative_pct REAL NOT NULL,
    neutral_pct REAL NOT NULL,
    avg_rating REAL NOT NULL,
    quality_score REAL NOT NULL,
    value_score REAL NOT NULL,
    durability_score REAL NOT NULL,
    pros_json TEXT NOT NULL DEFAULT '[]',
    cons_json TEXT NOT NULL DEFAULT '[]',
    positive_feedback_json TEXT NOT NULL DEFAULT '[]',
    negative_feedback_json TEXT NOT NULL DEFAULT '[]',
    durability_insights TEXT NOT NULL,
    value_analysis TEXT NOT NULL,
    verified_vs_unverified_insights TEXT NOT NULL,
    confidence_level TEXT NOT NULL DEFAULT 'high',
    reviews_analyzed_count INTEGER NOT NULL DEFAULT 0,
    last_analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const passwordHash = bcrypt.hashSync('password123', 10);

// Users
const users = [
  {
    id: 'u1',
    username: 'alexrivers',
    email: 'alex@realbuy.io',
    password_hash: passwordHash,
    name: 'Alex Rivers',
    bio: 'Hardware engineer & acoustic audiophile. Testing real longevity & battery claims across devices.',
    avatar_url: '',
    is_verified: 1,
    is_admin: 0,
    role: 'user'
  },
  {
    id: 'u2',
    username: 'sarah_chen',
    email: 'sarah@realbuy.io',
    password_hash: passwordHash,
    name: 'Sarah Chen',
    bio: 'Industrial product designer in SF. Obsessed with ergonomics, clean aesthetics, and durability.',
    avatar_url: '',
    is_verified: 1,
    is_admin: 0,
    role: 'user'
  },
  {
    id: 'u3',
    username: 'marcus_fit',
    email: 'marcus@realbuy.io',
    password_hash: passwordHash,
    name: 'Marcus Brody',
    bio: 'Marathon runner & endurance athlete. Taking fitness trackers and running footwear to the absolute limit.',
    avatar_url: '',
    is_verified: 1,
    is_admin: 0,
    role: 'user'
  },
  {
    id: 'u4',
    username: 'elena_r',
    email: 'elena@realbuy.io',
    password_hash: passwordHash,
    name: 'Elena Rostova',
    bio: 'Home barista & smart appliances enthusiast. Finding appliances that actually save time and hold up.',
    avatar_url: '',
    is_verified: 1,
    is_admin: 0,
    role: 'user'
  },
  {
    id: 'u5',
    username: 'david_kim',
    email: 'david@realbuy.io',
    password_hash: passwordHash,
    name: 'David Kim',
    bio: 'Game dev & tech writer. Building desk setups and dissecting build quality vs marketing hype.',
    avatar_url: '',
    is_verified: 0,
    is_admin: 0,
    role: 'user'
  },
  {
    id: 'u6',
    username: 'admin',
    email: 'admin@realbuy.io',
    password_hash: passwordHash,
    name: 'RealBuy Admin',
    bio: 'RealBuy Platform Quality & Integrity Trust Team.',
    avatar_url: '',
    is_verified: 1,
    is_admin: 1,
    role: 'admin'
  }
];

const insertUser = db.prepare(`
  INSERT INTO users (id, username, email, password_hash, name, bio, avatar_url, is_verified, is_admin, role)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
users.forEach(u => insertUser.run(u.id, u.username, u.email, u.password_hash, u.name, u.bio, u.avatar_url, u.is_verified, u.is_admin, u.role));

// Products
const products = [
  {
    id: 'p1',
    name: 'WH-1000XM5 Wireless Noise-Canceling Headphones',
    brand: 'Sony',
    model: 'WH-1000XM5 Black',
    category: 'Electronics',
    description: 'Industry-leading noise cancellation optimized with two processors and 8 microphones. Up to 30-hour battery life with quick charging, ultra-comfortable lightweight design.',
    thumbnail_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Noise Cancellation": "Dual Processor V1 + HD QN1",
      "Battery Life": "30 Hours (ANC On), 40 Hours (ANC Off)",
      "Bluetooth": "5.2 with LDAC, AAC, SBC",
      "Weight": "250g",
      "Charging": "USB-C Quick Charge (3 min for 3 hrs)"
    })
  },
  {
    id: 'p2',
    name: 'iPhone 16 Pro 256GB',
    brand: 'Apple',
    model: 'Natural Titanium',
    category: 'Smartphones',
    description: 'Grade 5 titanium design with thinner borders, A18 Pro chip, 48MP Fusion camera with 5x Telephoto, Camera Control touch button, and all-day battery life.',
    thumbnail_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Display": "6.3-inch Super Retina XDR OLED 120Hz",
      "Processor": "Apple A18 Pro 3nm",
      "Camera": "48MP Main + 48MP Ultra-Wide + 12MP 5x Telephoto",
      "Material": "Grade 5 Titanium & Ceramic Shield",
      "Port": "USB-C USB 3.0 (up to 10Gb/s)"
    })
  },
  {
    id: 'p3',
    name: 'MacBook Air M3 15-inch',
    brand: 'Apple',
    model: 'Midnight 16GB / 512GB',
    category: 'Laptops',
    description: 'Strikingly thin design with the lightning-fast M3 chip. Liquid Retina display, up to 18 hours of battery life, dual external display support, and silent fanless cooling.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Screen": "15.3-inch Liquid Retina Display 500 nits",
      "Chip": "Apple M3 (8-core CPU, 10-core GPU)",
      "Memory": "16GB Unified RAM",
      "Storage": "512GB SSD",
      "Battery": "Up to 18 Hours video playback",
      "Weight": "1.51 kg"
    })
  },
  {
    id: 'p4',
    name: 'V15 Detect Absolute Cordless Vacuum',
    brand: 'Dyson',
    model: 'V15 Detect Gold/Iron',
    category: 'Home appliances',
    description: 'Dyson most powerful intelligent cordless vacuum. Laser reveals microscopic dust, Piezo sensor automatically optimizes suction power based on debris volume.',
    thumbnail_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Suction Power": "230 AW Boost Mode",
      "Run Time": "Up to 60 Minutes",
      "Bin Volume": "0.76 L",
      "Weight": "3.1 kg",
      "Filtration": "Whole-machine HEPA filtration"
    })
  },
  {
    id: 'p5',
    name: 'Fenix 7 Pro Sapphire Solar GPS Watch',
    brand: 'Garmin',
    model: '47mm Carbon Gray DLC Titanium',
    category: 'Fitness',
    description: 'Premium multisport GPS smartwatch with solar charging lens, built-in LED flashlight, endurance and hill score metrics, and multiband GPS navigation.',
    thumbnail_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Battery Life": "Up to 22 Days with Solar",
      "Display": "1.3-inch Sunlight-visible MIP Sapphire",
      "Water Rating": "10 ATM (100 meters)",
      "Sensors": "Multi-Band GPS, Elevate Gen 5 Heart Rate, Pulse Ox",
      "Flashlight": "Integrated Variable LED"
    })
  },
  {
    id: 'p6',
    name: 'PlayStation 5 Slim Digital Edition',
    brand: 'Sony',
    model: 'CFI-2000 Slim',
    category: 'Gaming',
    description: 'Packed inside a sleek and compact console design with 1TB SSD storage, ray tracing support, Tempest 3D AudioTech, and ultra-high-speed SSD load times.',
    thumbnail_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Storage": "1TB Custom High-Speed NVMe SSD",
      "Graphics": "AMD RDNA 2 GPU with Hardware Ray Tracing",
      "Output": "4K 120Hz, 8K support, VRR",
      "Weight": "2.6 kg (18% lighter than original)",
      "Audio": "Tempest 3D AudioTech"
    })
  },
  {
    id: 'p7',
    name: 'Airwrap Multi-Styler Complete Long',
    brand: 'Dyson',
    model: 'Nickel / Copper',
    category: 'Beauty',
    description: 'Styles hair without extreme heat using the Coanda airflow effect. Barrels to curl and wave in both directions, brushes to control and shape, and multifunctional smoothing dryer.',
    thumbnail_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Airflow": "13.5 liters/sec (Dyson Digital Motor V9)",
      "Heat Control": "Intelligent thermistor checks heat 40x per second",
      "Power": "1300 Watts",
      "Attachments": "6 re-engineered styling barrels and smoothing brushes"
    })
  },
  {
    id: 'p8',
    name: 'Air Zoom Pegasus 41 Road Running Shoes',
    brand: 'Nike',
    model: 'Pegasus 41 Black/Volt',
    category: 'Shoes',
    description: 'Energized cushioning for everyday road running. Experience lighter-weight energy return with dual Air Zoom units and an upgraded ReactX foam midsole.',
    thumbnail_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Midsole": "Upgraded Nike ReactX Foam",
      "Cushioning": "Forefoot & Heel Air Zoom Units",
      "Drop": "10mm (37mm heel / 27mm forefoot)",
      "Upper": "Engineered Breathable Mesh",
      "Weight": "297g (Men size 10)"
    })
  },
  {
    id: 'p9',
    name: 'Barista Express Espresso Machine BES870XL',
    brand: 'Breville',
    model: 'Brushed Stainless Steel',
    category: 'Home appliances',
    description: 'Create third wave specialty coffee at home from bean to espresso in under a minute. Integrated conical burr grinder, precise digital PID temperature control, and microfoam milk texturing.',
    thumbnail_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Pump Pressure": "15 Bar Italian Pump",
      "Grinder": "Integrated Stainless Steel Conical Burr Grinder",
      "Water Tank": "2.0 Liters with Charcoal Filter",
      "Heating System": "1600W Thermocoil with PID Control",
      "Steam Wand": "360-degree Swivel Stainless Steel"
    })
  },
  {
    id: 'p10',
    name: 'Kindle Paperwhite Signature Edition 32GB',
    brand: 'Amazon',
    model: '6.8-inch Metallic Jade',
    category: 'Electronics',
    description: 'Everything in the Kindle Paperwhite plus wireless charging, auto-adjusting front light, and 32GB storage. 300 ppi glare-free display that reads like real paper, up to 10 weeks battery.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    specs_json: JSON.stringify({
      "Display": "6.8-inch Paperwhite with 300 ppi and warm light",
      "Storage": "32GB (holds thousands of books)",
      "Battery": "Up to 10 Weeks on single USB-C charge",
      "Waterproofing": "IPX8 (submersion up to 2m for 60 min)",
      "Charging": "Qi Wireless + USB-C"
    })
  }
];

const insertProduct = db.prepare(`
  INSERT INTO products (id, name, brand, model, category, description, thumbnail_url, specs_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
products.forEach(p => insertProduct.run(p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.specs_json));

// Reviews
const reviews = [
  {
    id: 'r1',
    user_id: 'u1',
    product_id: 'p1',
    rating: 4.8,
    quality_rating: 4.9,
    value_rating: 4.2,
    durability_rating: 4.7,
    title: 'The best ANC on flights, but non-folding hinge takes adjusting',
    content: 'I have logged over 80 hours of travel with the XM5s. The noise cancellation is noticeably cleaner than the XM4s, especially for low-frequency engine hum and chatter in airports. Sound signature is delightfully warm with punchy bass that doesn’t bleed into vocals. Battery life easily delivered 29.5 hours on my coast-to-coast flights with ANC on. My only gripe is the headband doesn’t fold inward like the older generation, making the carrying case noticeably bulkier in my backpack.',
    purchase_price: 398.00,
    purchase_date: '2026-03-12',
    purchased_from: 'Amazon',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 54,
    created_at: '2026-03-15 10:20:00'
  },
  {
    id: 'r2',
    user_id: 'u2',
    product_id: 'p1',
    rating: 4.5,
    quality_rating: 4.8,
    value_rating: 4.0,
    durability_rating: 4.6,
    title: 'Stunning minimalist design & exceptional mic clarity for WFH calls',
    content: 'As an industrial designer, I adore the stepless slider mechanism and soft-fit leather cups. They exert very light clamping pressure, so I can wear them for 6-hour design sprints without crown fatigue. The 8-microphone array makes Zoom calls crystal clear; people don’t even hear my air conditioner running in the background. Highly recommended for creative professionals.',
    purchase_price: 399.99,
    purchase_date: '2026-04-02',
    purchased_from: 'Best Buy',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 38,
    created_at: '2026-04-05 14:10:00'
  },
  {
    id: 'r3',
    user_id: 'u5',
    product_id: 'p1',
    rating: 3.5,
    quality_rating: 4.0,
    value_rating: 3.0,
    durability_rating: 4.0,
    title: 'Great acoustics, but matte finish attracts finger oil very quickly',
    content: 'Acoustics are top-tier and the multipoint pairing between my gaming PC and iPhone works seamlessly. However, the matte black finish is a fingerprint magnet. Within 3 days it showed smudges everywhere. Also, at $400, I expected the companion app EQ to save directly on hardware profiles.',
    purchase_price: 380.00,
    purchase_date: '2026-05-18',
    purchased_from: 'Sony Store',
    is_verified_purchase: 0,
    verification_status: 'unverified',
    helpful_count: 19,
    created_at: '2026-05-20 09:30:00'
  },
  {
    id: 'r4',
    user_id: 'u4',
    product_id: 'p1',
    rating: 4.7,
    quality_rating: 4.9,
    value_rating: 4.4,
    durability_rating: 4.8,
    title: 'Flawless noise cancellation for coffee shop study sessions',
    content: 'Working from bustling cafés used to kill my concentration until I bought these. The Speak-to-Chat feature is surprisingly smart: when the barista speaks to me, it pauses music instantly. Build quality feels very sturdy despite being lightweight.',
    purchase_price: 399.99,
    purchase_date: '2026-06-10',
    purchased_from: 'Amazon',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 27,
    created_at: '2026-06-12 18:00:00'
  },
  {
    id: 'r5',
    user_id: 'u2',
    product_id: 'p2',
    rating: 4.7,
    quality_rating: 5.0,
    value_rating: 3.8,
    durability_rating: 4.9,
    title: 'The Camera Control button and thinner bezels make this a real upgrade',
    content: 'Upgraded from the 14 Pro and the weight difference with grade 5 titanium is immediately noticeable in the wrist. The new Camera Control capacitive button took about two days to get muscle memory for, but sliding exposure and depth of field without touching the screen is unmatched for photography. Battery life easily lasts 1.5 days with moderate use.',
    purchase_price: 1199.00,
    purchase_date: '2026-09-22',
    purchased_from: 'Apple Store',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 67,
    created_at: '2026-09-25 11:45:00'
  },
  {
    id: 'r6',
    user_id: 'u1',
    product_id: 'p2',
    rating: 4.4,
    quality_rating: 4.8,
    value_rating: 3.6,
    durability_rating: 4.7,
    title: 'A18 Pro thermal performance is vastly improved; zero throttling during 4K120',
    content: 'Apple finally addressed the thermal dissipation issues. Shooting 4K 120fps ProRes video to an external SSD over USB-C maintained steady frame rates for 35 straight minutes without getting uncomfortably warm. 5x optical zoom is crisp even in twilight. Price is steep, but it is truly a pocket production camera.',
    purchase_price: 1199.00,
    purchase_date: '2026-09-28',
    purchased_from: 'Apple Fifth Ave',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 42,
    created_at: '2026-10-01 16:20:00'
  },
  {
    id: 'r7',
    user_id: 'u5',
    product_id: 'p2',
    rating: 4.2,
    quality_rating: 4.6,
    value_rating: 3.5,
    durability_rating: 4.6,
    title: 'Fantastic gaming performance on AAA titles, but Camera Control feels sensitive',
    content: 'Running Resident Evil 4 with hardware ray tracing feels unreal on a phone. The 120Hz ProMotion panel is breathtaking. However, when gripping the phone in landscape mode while gaming, my palm occasionally brushes against the Camera Control sensor and triggers the camera UI.',
    purchase_price: 1249.00,
    purchase_date: '2026-10-05',
    purchased_from: 'Best Buy',
    is_verified_purchase: 0,
    verification_status: 'unverified',
    helpful_count: 24,
    created_at: '2026-10-07 20:15:00'
  },
  {
    id: 'r8',
    user_id: 'u1',
    product_id: 'p3',
    rating: 4.9,
    quality_rating: 5.0,
    value_rating: 4.7,
    durability_rating: 4.9,
    title: 'The ultimate laptop for 95% of users. Completely silent and 16-hr battery',
    content: 'I run VS Code, multiple Docker containers, and 30+ browser tabs simultaneously. The M3 handles all of it without a single fan squeak because it is entirely fanless! The 15.3-inch screen strikes the sweet spot between portability and real workspace screen real estate. The Midnight finish fingerprint anodization is genuinely improved over the M2.',
    purchase_price: 1499.00,
    purchase_date: '2026-04-15',
    purchased_from: 'Apple Store',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 89,
    created_at: '2026-04-18 12:30:00'
  },
  {
    id: 'r9',
    user_id: 'u4',
    product_id: 'p3',
    rating: 4.8,
    quality_rating: 4.9,
    value_rating: 4.5,
    durability_rating: 4.8,
    title: 'Lightweight powerhouse with speakers that blow away other thin laptops',
    content: 'Carrying a 15-inch laptop that weighs barely 3.3 lbs feels magical in my tote bag. The six-speaker sound system with force-cancelling woofers sounds better than many dedicated Bluetooth speakers. Battery lasts two full workdays on light writing and web browsing.',
    purchase_price: 1499.00,
    purchase_date: '2026-05-02',
    purchased_from: 'B&H Photo',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 34,
    created_at: '2026-05-06 17:40:00'
  },
  {
    id: 'r10',
    user_id: 'u4',
    product_id: 'p4',
    rating: 4.6,
    quality_rating: 4.8,
    value_rating: 3.9,
    durability_rating: 4.5,
    title: 'The green laser illumination will disgust and delight you simultaneously',
    content: 'You think your hard floors are clean until you click the Fluffy Optic laser head on. It illuminates invisible dust you could never see with normal room lights. The auto-suction adjustment based on the piezo sensor saves battery when moving from tiles to thick rugs. Emptying the bin is mess-free with the point-and-shoot mechanism.',
    purchase_price: 749.99,
    purchase_date: '2026-01-20',
    purchased_from: 'Dyson.com',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 61,
    created_at: '2026-01-23 15:10:00'
  },
  {
    id: 'r11',
    user_id: 'u3',
    product_id: 'p4',
    rating: 4.1,
    quality_rating: 4.5,
    value_rating: 3.4,
    durability_rating: 4.2,
    title: 'Top tier suction power, but slightly heavy for prolonged overhead cleaning',
    content: 'Suction power easily rivals plugged corded vacuums. It picks up dog hair and trail sand effortlessly. My only small drawback is that holding down the trigger while lifting it overhead to clean ceiling fans and curtains can fatigue the forearm after 15 minutes due to the top-heavy battery motor placement.',
    purchase_price: 720.00,
    purchase_date: '2026-02-14',
    purchased_from: 'Costco',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 29,
    created_at: '2026-02-17 19:25:00'
  },
  {
    id: 'r12',
    user_id: 'u3',
    product_id: 'p5',
    rating: 4.9,
    quality_rating: 5.0,
    value_rating: 4.6,
    durability_rating: 5.0,
    title: 'Indestructible multisport watch. 20-day battery and built-in flashlight is a game changer',
    content: 'Ran a 50k mountain ultra with full GPS tracking and offline topo maps enabled. At the finish line, the battery was still at 82%! The titanium bezel has struck granite rocks multiple times with zero scratches on the sapphire crystal. And the white/red LED flashlight seemed like a gimmick until I had to pack my tent in pitch dark at 5 AM. Pure utility.',
    purchase_price: 799.99,
    purchase_date: '2026-02-05',
    purchased_from: 'REI',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 73,
    created_at: '2026-02-09 08:50:00'
  },
  {
    id: 'r13',
    user_id: 'u1',
    product_id: 'p5',
    rating: 4.6,
    quality_rating: 4.8,
    value_rating: 4.3,
    durability_rating: 4.9,
    title: 'Elevate Gen 5 sensor matches chest strap accuracy for interval training',
    content: 'Heart rate tracking during sudden HIIT bursts is remarkably rapid. Sleep tracking, HRV status, and training readiness scores genuinely correlate with how my body feels each morning. It is hefty on the wrist, but the durability and solar efficiency are peerless.',
    purchase_price: 799.99,
    purchase_date: '2026-03-01',
    purchased_from: 'Garmin Official',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 31,
    created_at: '2026-03-04 13:00:00'
  },
  {
    id: 'r14',
    user_id: 'u5',
    product_id: 'p6',
    rating: 4.7,
    quality_rating: 4.8,
    value_rating: 4.6,
    durability_rating: 4.7,
    title: 'Much sleeker in the media console and 1TB storage upgrade was sorely needed',
    content: 'The reduction in volume makes it fit into TV cabinets where the launch model was an eyesore. Having a full usable 850GB out of the box means 8-10 massive modern games fit comfortably. DualSense haptic feedback in Astro Bot and Spider-Man 2 remains the most immersive gaming experience on the market.',
    purchase_price: 449.99,
    purchase_date: '2026-01-10',
    purchased_from: 'Target',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 52,
    created_at: '2026-01-14 21:10:00'
  },
  {
    id: 'r15',
    user_id: 'u2',
    product_id: 'p7',
    rating: 4.8,
    quality_rating: 5.0,
    value_rating: 3.9,
    durability_rating: 4.8,
    title: 'Zero heat damage blowout at home. Steep learning curve but life changing results',
    content: 'It completely replaced my traditional curling wand, flat iron, and blow dryer. My hair is noticeably softer and split ends have vanished because it styles using air vortexes under 302°F. You do need to watch a couple tutorial videos to get the tension right on damp hair. Worth every single penny if you style your hair 3+ times a week.',
    purchase_price: 599.99,
    purchase_date: '2026-04-10',
    purchased_from: 'Sephora',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 85,
    created_at: '2026-04-14 16:30:00'
  },
  {
    id: 'r16',
    user_id: 'u3',
    product_id: 'p8',
    rating: 4.5,
    quality_rating: 4.7,
    value_rating: 4.8,
    durability_rating: 4.6,
    title: 'The ReactX foam upgrade brings noticeable bounce back to the daily workhorse',
    content: 'I have logged 220 miles on this pair so far. The new ReactX foam midsole gives about 13% more bounce than the Pegasus 40 while reducing carbon footprint. The waffle rubber outsole has barely shown wear on city pavement. True to size with a comfortable lockdown in the midfoot.',
    purchase_price: 140.00,
    purchase_date: '2026-06-01',
    purchased_from: 'Nike.com',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 46,
    created_at: '2026-06-05 10:15:00'
  },
  {
    id: 'r17',
    user_id: 'u4',
    product_id: 'p9',
    rating: 4.8,
    quality_rating: 4.9,
    value_rating: 4.7,
    durability_rating: 4.8,
    title: 'Paid for itself in 4 months. Cafe-quality microfoam and rich espresso crema',
    content: 'I used to spend $7 every morning at local coffee shops. With fresh beans dialed in at grind size 4, I pull sweet, velvety 36g double shots with thick tiger-striped crema. The steam wand produces silky microfoam perfect for latte art. Machine has run 2 shots a day for 9 months with zero mechanical issues. Just remember to descale regularly.',
    purchase_price: 699.95,
    purchase_date: '2026-01-05',
    purchased_from: 'Williams Sonoma',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 92,
    created_at: '2026-01-10 09:40:00'
  },
  {
    id: 'r18',
    user_id: 'u1',
    product_id: 'p10',
    rating: 4.9,
    quality_rating: 4.9,
    value_rating: 4.8,
    durability_rating: 4.9,
    title: 'The warm light and wireless charging make this the pinnacle of reading devices',
    content: 'The 6.8-inch display is crisp as printed paperback paper. The auto-adjusting warm amber backlight lets me read in pitch-black bedrooms without eye fatigue or blue light keeping me awake. I drop it on my Qi nightstand pad once every month and half. Took it into the pool and jacuzzi without worry thanks to the IPX8 rating.',
    purchase_price: 189.99,
    purchase_date: '2026-03-20',
    purchased_from: 'Amazon',
    is_verified_purchase: 1,
    verification_status: 'verified',
    helpful_count: 64,
    created_at: '2026-03-24 22:05:00'
  }
];

const insertReview = db.prepare(`
  INSERT INTO product_reviews (
    id, user_id, product_id, rating, quality_rating, value_rating, durability_rating,
    title, content, purchase_price, purchase_date, purchased_from, is_verified_purchase,
    verification_status, helpful_count, created_at
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?
  )
`);
reviews.forEach(r => insertReview.run(
  r.id, r.user_id, r.product_id, r.rating, r.quality_rating, r.value_rating, r.durability_rating,
  r.title, r.content, r.purchase_price, r.purchase_date, r.purchased_from, r.is_verified_purchase,
  r.verification_status, r.helpful_count, r.created_at
));

// Media
const media = [
  { id: 'm1', review_id: 'r1', media_type: 'image', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80' },
  { id: 'm2', review_id: 'r1', media_type: 'image', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { id: 'm3', review_id: 'r2', media_type: 'image', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80' },
  { id: 'm4', review_id: 'r5', media_type: 'image', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80' },
  { id: 'm5', review_id: 'r6', media_type: 'image', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80' },
  { id: 'm6', review_id: 'r8', media_type: 'image', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { id: 'm7', review_id: 'r10', media_type: 'image', url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80' },
  { id: 'm8', review_id: 'r12', media_type: 'image', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { id: 'm9', review_id: 'r14', media_type: 'image', url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80' },
  { id: 'm10', review_id: 'r15', media_type: 'image', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
  { id: 'm11', review_id: 'r16', media_type: 'image', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
  { id: 'm12', review_id: 'r17', media_type: 'image', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80' },
  { id: 'm13', review_id: 'r18', media_type: 'image', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80' }
];

const insertMedia = db.prepare(`
  INSERT INTO review_media (id, review_id, media_type, url)
  VALUES (?, ?, ?, ?)
`);
media.forEach(m => insertMedia.run(m.id, m.review_id, m.media_type, m.url));

// Verifications
const verifications = [
  {
    id: 'v1',
    review_id: 'r1',
    user_id: 'u1',
    receipt_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    store_name: 'Amazon Prime',
    order_id: '114-8930211-5829104',
    purchase_amount: 398.00,
    status: 'verified',
    reviewed_by: 'u6',
    notes: 'Invoice order ID and billing address match verified user account.'
  },
  {
    id: 'v2',
    review_id: 'r5',
    user_id: 'u2',
    receipt_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    store_name: 'Apple Store Online',
    order_id: 'W902384912',
    purchase_amount: 1199.00,
    status: 'verified',
    reviewed_by: 'u6',
    notes: 'Official Apple receipt with matching serial number.'
  },
  {
    id: 'v3',
    review_id: 'r8',
    user_id: 'u1',
    receipt_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    store_name: 'Apple Store Stanford',
    order_id: 'R449210294',
    purchase_amount: 1499.00,
    status: 'verified',
    reviewed_by: 'u6',
    notes: 'In-store digital POS receipt confirmed.'
  },
  {
    id: 'v4',
    review_id: 'r12',
    user_id: 'u3',
    receipt_url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    store_name: 'REI Co-op',
    order_id: 'REI-772918',
    purchase_amount: 799.99,
    status: 'verified',
    reviewed_by: 'u6',
    notes: 'Member dividend purchase receipt validated.'
  }
];

const insertVerification = db.prepare(`
  INSERT INTO purchase_verifications (id, review_id, user_id, receipt_url, store_name, order_id, purchase_amount, status, reviewed_by, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
verifications.forEach(v => insertVerification.run(v.id, v.review_id, v.user_id, v.receipt_url, v.store_name, v.order_id, v.purchase_amount, v.status, v.reviewed_by, v.notes));

// Comments
const comments = [
  { id: 'c1', review_id: 'r1', user_id: 'u2', content: 'Great breakdown Alex! Does the headband feel heavy after 3 hours?' },
  { id: 'c2', review_id: 'r1', user_id: 'u3', content: 'Can confirm regarding airplane travel. The ANC cuts jet engine pitch almost completely.' },
  { id: 'c3', review_id: 'r5', user_id: 'u1', content: 'Have you noticed any scratching on the titanium border from keys or dust in cases?' },
  { id: 'c4', review_id: 'r8', user_id: 'u5', content: 'Does it get warm on your lap when running heavy development compiles?' },
  { id: 'c5', review_id: 'r12', user_id: 'u2', content: 'The solar charging sounds incredible for multi-day backpacking trips!' }
];

const insertComment = db.prepare(`
  INSERT INTO comments (id, review_id, user_id, content)
  VALUES (?, ?, ?, ?)
`);
comments.forEach(c => insertComment.run(c.id, c.review_id, c.user_id, c.content));

// Replies
const replies = [
  { id: 'cr1', comment_id: 'c1', user_id: 'u1', content: 'Not at all Sarah, the memory foam padding has a wider contact patch so the pressure is super well distributed.' },
  { id: 'cr2', comment_id: 'c3', user_id: 'u2', content: 'None so far Alex! The PVD coating on the titanium feels significantly tougher than stainless steel on the 14 Pro.' },
  { id: 'cr3', comment_id: 'c4', user_id: 'u1', content: 'Barely lukewarm! Even during continuous 10-minute node compiles it never reached hot temperatures.' }
];

const insertReply = db.prepare(`
  INSERT INTO comment_replies (id, comment_id, user_id, content)
  VALUES (?, ?, ?, ?)
`);
replies.forEach(r => insertReply.run(r.id, r.comment_id, r.user_id, r.content));

// Likes
const likes = [
  { id: 'l1', user_id: 'u2', review_id: 'r1' },
  { id: 'l2', user_id: 'u3', review_id: 'r1' },
  { id: 'l3', user_id: 'u4', review_id: 'r1' },
  { id: 'l4', user_id: 'u1', review_id: 'r5' },
  { id: 'l5', user_id: 'u3', review_id: 'r5' },
  { id: 'l6', user_id: 'u2', review_id: 'r8' },
  { id: 'l7', user_id: 'u1', review_id: 'r12' },
  { id: 'l8', user_id: 'u2', review_id: 'r17' }
];

const insertLike = db.prepare(`
  INSERT INTO likes (id, user_id, review_id)
  VALUES (?, ?, ?)
`);
likes.forEach(l => insertLike.run(l.id, l.user_id, l.review_id));

// Follows
const follows = [
  { id: 'f1', follower_id: 'u1', following_id: 'u2' },
  { id: 'f2', follower_id: 'u2', following_id: 'u1' },
  { id: 'f3', follower_id: 'u3', following_id: 'u1' },
  { id: 'f4', follower_id: 'u4', following_id: 'u1' },
  { id: 'f5', follower_id: 'u1', following_id: 'u3' },
  { id: 'f6', follower_id: 'u2', following_id: 'u4' }
];

const insertFollow = db.prepare(`
  INSERT INTO follows (id, follower_id, following_id)
  VALUES (?, ?, ?)
`);
follows.forEach(f => insertFollow.run(f.id, f.follower_id, f.following_id));

// Saved Products
const saved = [
  { id: 's1', user_id: 'u1', product_id: 'p2' },
  { id: 's2', user_id: 'u1', product_id: 'p5' },
  { id: 's3', user_id: 'u2', product_id: 'p1' },
  { id: 's4', user_id: 'u2', product_id: 'p7' }
];

const insertSaved = db.prepare(`
  INSERT INTO saved_products (id, user_id, product_id)
  VALUES (?, ?, ?)
`);
saved.forEach(s => insertSaved.run(s.id, s.user_id, s.product_id));

// Notifications
const notifications = [
  {
    id: 'n1',
    user_id: 'u1',
    actor_id: 'u2',
    type: 'like',
    entity_id: 'r1',
    message: 'Sarah Chen liked your review on Sony WH-1000XM5 Headphones'
  },
  {
    id: 'n2',
    user_id: 'u1',
    actor_id: 'u2',
    type: 'comment',
    entity_id: 'r1',
    message: 'Sarah Chen commented: "Great breakdown Alex! Does the headband feel heavy after 3 hours?"'
  },
  {
    id: 'n3',
    user_id: 'u1',
    actor_id: 'u6',
    type: 'verified_purchase',
    entity_id: 'r1',
    message: 'Congratulations! Your purchase receipt for Sony WH-1000XM5 was verified by admin.'
  },
  {
    id: 'n4',
    user_id: 'u2',
    actor_id: 'u1',
    type: 'follow',
    entity_id: 'u1',
    message: 'Alex Rivers started following your reviews.'
  }
];

const insertNotification = db.prepare(`
  INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
  VALUES (?, ?, ?, ?, ?, ?)
`);
notifications.forEach(n => insertNotification.run(n.id, n.user_id, n.actor_id, n.type, n.entity_id, n.message));

// Seed AI Product Analyses for products
const insertAnalysis = db.prepare(`
  INSERT INTO ai_product_analyses (
    id, product_id, recommendation, recommendation_reason, summary,
    target_audience, who_should_avoid, sentiment_score, positive_pct,
    negative_pct, neutral_pct, avg_rating, quality_score, value_score,
    durability_score, pros_json, cons_json, positive_feedback_json,
    negative_feedback_json, durability_insights, value_analysis,
    verified_vs_unverified_insights, confidence_level, reviews_analyzed_count,
    last_analyzed_at
  ) VALUES (
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, ?, ?,
    ?, ?, ?,
    CURRENT_TIMESTAMP
  )
`);

const initialAnalyses = [
  {
    id: 'ai_p1',
    product_id: 'p1',
    recommendation: 'Highly Recommended',
    recommendation_reason: 'Unmatched 92% positive community sentiment with standout 4.8/5 quality rating across 4 verified customer experiences.',
    summary: 'The Sony WH-1000XM5 is an undisputed market benchmark for noise cancellation and call clarity. Reviewers praise the effortless dual-processor ANC and lightweight ergonomics, with the non-folding headband as the sole minor caveat.',
    target_audience: 'Frequent business travelers, daily commuters, and WFH professionals seeking class-leading silence.',
    who_should_avoid: 'Buyers who need an ultra-compact folding headphone for tight gym pouches.',
    sentiment_score: 93,
    positive_pct: 92,
    negative_pct: 3,
    neutral_pct: 5,
    avg_rating: 4.6,
    quality_score: 4.8,
    value_score: 4.2,
    durability_score: 4.7,
    pros_json: JSON.stringify([
      'Industry-leading active noise cancellation for airplanes and cafés',
      'Impressive 29.5-hour verified real-world battery life with ANC on',
      'Ultra-comfortable lightweight clamping pressure for extended wear',
      '8-microphone array delivers pristine Zoom and voice call fidelity'
    ]),
    cons_json: JSON.stringify([
      'Headband does not fold inward, making the travel case bulkier',
      'Matte black finish shows oil and finger smudges easily'
    ]),
    positive_feedback_json: JSON.stringify([
      'The noise cancellation is noticeably cleaner than the XM4s, especially for low-frequency engine hum.',
      '8-microphone array makes Zoom calls crystal clear; people don’t even hear my AC running.'
    ]),
    negative_feedback_json: JSON.stringify([
      'Headband doesn’t fold inward like older generation, making carrying case bulkier.',
      'Matte black finish is a fingerprint magnet.'
    ]),
    durability_insights: 'Verified long-term owners report outstanding hinge longevity and durable headband structure. Holds up remarkably well under daily transit.',
    value_analysis: 'Fair value at $399. Holds resale value well and out-cancels headphones priced $150 higher.',
    verified_vs_unverified_insights: 'Verified purchasers rate this at 4.7/5 across 3 invoice-checked reviews (vs 3.5/5 from unverified accounts).',
    confidence_level: 'high',
    reviews_analyzed_count: 4
  },
  {
    id: 'ai_p2',
    product_id: 'p2',
    recommendation: 'Recommended',
    recommendation_reason: 'Terrific camera innovation and durable titanium chassis, balanced by premium $1,199 entry price.',
    summary: 'The iPhone 16 Pro brings significant practical improvements with lighter Grade 5 titanium, improved thermal performance during 4K120 recording, and the tactile Camera Control button.',
    target_audience: 'Mobile photographers, content creators, and Apple ecosystem users upgrading from iPhone 13/14 or older.',
    who_should_avoid: 'Casual smartphone users on a strict budget who do not need ProRes log capture or 5x optical telephoto.',
    sentiment_score: 88,
    positive_pct: 86,
    negative_pct: 7,
    neutral_pct: 7,
    avg_rating: 4.4,
    quality_score: 4.8,
    value_score: 3.6,
    durability_score: 4.7,
    pros_json: JSON.stringify([
      'Grade 5 titanium chassis is noticeably lighter in the wrist',
      'Camera Control button enables quick aperture and exposure slides',
      'Zero thermal throttling during continuous 4K 120fps video capture',
      '5x optical zoom maintains razor-sharp detail in low light'
    ]),
    cons_json: JSON.stringify([
      'Camera Control capacitive area can be accidentally triggered in landscape gaming',
      'Steep $1,199 entry price for 256GB'
    ]),
    positive_feedback_json: JSON.stringify([
      'Shooting 4K 120fps ProRes video to an external SSD maintained steady frame rates for 35 straight minutes.',
      'Weight difference with grade 5 titanium is immediately noticeable.'
    ]),
    negative_feedback_json: JSON.stringify([
      'When gripping the phone in landscape mode while gaming, palm occasionally touches Camera Control.'
    ]),
    durability_insights: 'Ceramic Shield front and PVD-coated titanium perimeter show strong scratch and drop resistance.',
    value_analysis: 'High absolute price point, but unmatched longevity and 5+ years of software support.',
    verified_vs_unverified_insights: 'Verified owners praise the thermal upgrades, whereas general comments center on retail pricing.',
    confidence_level: 'medium',
    reviews_analyzed_count: 3
  },
  {
    id: 'ai_p3',
    product_id: 'p3',
    recommendation: 'Highly Recommended',
    recommendation_reason: 'Best-in-class portable computing experience with completely silent fanless operation and 16+ hour battery.',
    summary: 'The MacBook Air M3 15-inch dominates thin-and-light laptops. Owners highlight its expansive 15.3-inch screen, phenomenal battery life, and surprising speaker punch.',
    target_audience: 'Students, developers, writers, and business professionals seeking all-day battery without charger anxiety.',
    who_should_avoid: '3D animators and AAA PC gamers requiring dedicated high-power discrete GPUs.',
    sentiment_score: 96,
    positive_pct: 95,
    negative_pct: 2,
    neutral_pct: 3,
    avg_rating: 4.85,
    quality_score: 4.95,
    value_score: 4.6,
    durability_score: 4.85,
    pros_json: JSON.stringify([
      'Completely silent fanless design with zero thermal throttling on day-to-day loads',
      'Genuine 16-18 hour real-world battery endurance',
      'Six-speaker sound system with force-cancelling woofers',
      'Midnight anodization now resists finger smudges much better'
    ]),
    cons_json: JSON.stringify([
      'Upgrade cost for RAM and SSD is higher than PC competitors',
      'External dual-display requires keeping the laptop lid closed'
    ]),
    positive_feedback_json: JSON.stringify([
      'The M3 handles VS Code, Docker, and 30+ tabs without a single fan squeak!',
      'Six-speaker sound system sounds better than many dedicated Bluetooth speakers.'
    ]),
    negative_feedback_json: JSON.stringify([
      'RAM and SSD upgrades at checkout add steep cost.'
    ]),
    durability_insights: 'Unibody recycled aluminum enclosure has zero keyboard flex and robust hinge tension tested over tens of thousands of cycles.',
    value_analysis: 'Outstanding resale retention and exceptional cost-per-year of reliable computing.',
    verified_vs_unverified_insights: '100% verified purchase feedback confirms real-world battery exceeding 15 hours.',
    confidence_level: 'medium',
    reviews_analyzed_count: 2
  }
];

initialAnalyses.forEach(a => {
  insertAnalysis.run(
    a.id, a.product_id, a.recommendation, a.recommendation_reason, a.summary,
    a.target_audience, a.who_should_avoid, a.sentiment_score, a.positive_pct,
    a.negative_pct, a.neutral_pct, a.avg_rating, a.quality_score, a.value_score,
    a.durability_score, a.pros_json, a.cons_json, a.positive_feedback_json,
    a.negative_feedback_json, a.durability_insights, a.value_analysis,
    a.verified_vs_unverified_insights, a.confidence_level, a.reviews_analyzed_count
  );
});

console.log('Seed completed successfully with node:sqlite!');
console.log(`Created ${users.length} users, ${products.length} products, ${reviews.length} reviews.`);
