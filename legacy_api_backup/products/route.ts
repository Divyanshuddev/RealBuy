import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const sort = url.searchParams.get('sort') || 'popular'; // popular, highest_rated, recent, price_asc, price_desc
    const minRating = parseFloat(url.searchParams.get('minRating') || '0');

    const currentUser = getCurrentUser();
    const db = getDb();

    let query = `
      SELECT 
        p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.specs_json, p.created_at,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT CASE WHEN r.is_verified_purchase = 1 THEN r.id END) as verified_review_count,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COALESCE(AVG(r.quality_rating), 0) as avg_quality,
        COALESCE(AVG(r.value_rating), 0) as avg_value,
        COALESCE(AVG(r.durability_rating), 0) as avg_durability,
        COALESCE(MIN(r.purchase_price), 0) as min_price,
        COALESCE(MAX(r.purchase_price), 0) as max_price,
        COALESCE(AVG(r.purchase_price), 0) as avg_price,
        ai.recommendation as ai_recommendation,
        ai.sentiment_score as ai_sentiment_score,
        ai.confidence_level as ai_confidence_level
        ${currentUser ? `, EXISTS(SELECT 1 FROM saved_products WHERE user_id = '${currentUser.id}' AND product_id = p.id) as is_saved` : ', 0 as is_saved'}
      FROM products p
      LEFT JOIN product_reviews r ON p.id = r.product_id
      LEFT JOIN ai_product_analyses ai ON p.id = ai.product_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (category && category !== 'All') {
      query += ` AND LOWER(p.category) = LOWER(?)`;
      params.push(category);
    }

    if (search) {
      query += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.brand) LIKE ? OR LOWER(p.model) LIKE ? OR LOWER(p.category) LIKE ?)`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY p.id`;

    if (minRating > 0) {
      query += ` HAVING avg_rating >= ${minRating}`;
    }

    switch (sort) {
      case 'highest_rated':
        query += ` ORDER BY avg_rating DESC, review_count DESC`;
        break;
      case 'most_reviewed':
      case 'popular':
        query += ` ORDER BY review_count DESC, avg_rating DESC`;
        break;
      case 'recent':
        query += ` ORDER BY p.created_at DESC`;
        break;
      case 'price_asc':
        query += ` ORDER BY min_price ASC`;
        break;
      case 'price_desc':
        query += ` ORDER BY max_price DESC`;
        break;
      default:
        query += ` ORDER BY review_count DESC, avg_rating DESC`;
    }

    const rows = db.prepare(query).all(...params);

    const products = rows.map((r: any) => ({
      ...r,
      avg_rating: Number(Number(r.avg_rating).toFixed(1)),
      avg_quality: Number(Number(r.avg_quality).toFixed(1)),
      avg_value: Number(Number(r.avg_value).toFixed(1)),
      avg_durability: Number(Number(r.avg_durability).toFixed(1)),
      min_price: Math.round(r.min_price),
      max_price: Math.round(r.max_price),
      avg_price: Math.round(r.avg_price),
      is_saved: Boolean(r.is_saved),
      specs: r.specs_json ? JSON.parse(r.specs_json) : {},
    }));

    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { name, brand, model, category, description, thumbnail_url, specs } = await req.json();

    if (!name || !brand || !category) {
      return NextResponse.json({ error: 'Name, brand, and category are required' }, { status: 400 });
    }

    const db = getDb();
    const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const specsJson = JSON.stringify(specs || {});

    db.prepare(`
      INSERT INTO products (id, name, brand, model, category, description, thumbnail_url, specs_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), brand.trim(), model?.trim() || '', category.trim(), description?.trim() || '', thumbnail_url?.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', specsJson);

    return NextResponse.json({ id, message: 'Product created successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
