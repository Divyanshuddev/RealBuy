import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateAIProductAnalysis } from '@/lib/ai-engine';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const currentUser = getCurrentUser();
    const productId = params.id;

    const product = db.prepare(`
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
        COALESCE(AVG(r.purchase_price), 0) as avg_price
        ${currentUser ? `, EXISTS(SELECT 1 FROM saved_products WHERE user_id = '${currentUser.id}' AND product_id = p.id) as is_saved` : ', 0 as is_saved'}
      FROM products p
      LEFT JOIN product_reviews r ON p.id = r.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(productId) as any;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Load AI Analysis or compute if missing
    let analysis = db.prepare('SELECT * FROM ai_product_analyses WHERE product_id = ?').get(productId) as any;
    if (!analysis) {
      analysis = calculateAIProductAnalysis(productId);
    } else {
      analysis = {
        ...analysis,
        pros: analysis.pros_json ? JSON.parse(analysis.pros_json) : [],
        cons: analysis.cons_json ? JSON.parse(analysis.cons_json) : [],
        positive_feedback: analysis.positive_feedback_json ? JSON.parse(analysis.positive_feedback_json) : [],
        negative_feedback: analysis.negative_feedback_json ? JSON.parse(analysis.negative_feedback_json) : [],
      };
    }

    // Ratings distribution
    const ratingsDist = db.prepare(`
      SELECT 
        SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as stars_5,
        SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) as stars_4,
        SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) as stars_3,
        SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) as stars_2,
        SUM(CASE WHEN rating < 1.5 THEN 1 ELSE 0 END) as stars_1
      FROM product_reviews
      WHERE product_id = ?
    `).get(productId) as any;

    // Similar products
    const similarProducts = db.prepare(`
      SELECT id, name, brand, category, thumbnail_url,
        (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = products.id) as avg_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = products.id) as review_count
      FROM products
      WHERE category = ? AND id != ?
      LIMIT 4
    `).all(product.category, productId);

    return NextResponse.json({
      product: {
        ...product,
        avg_rating: Number(Number(product.avg_rating).toFixed(1)),
        avg_quality: Number(Number(product.avg_quality).toFixed(1)),
        avg_value: Number(Number(product.avg_value).toFixed(1)),
        avg_durability: Number(Number(product.avg_durability).toFixed(1)),
        min_price: Math.round(product.min_price),
        max_price: Math.round(product.max_price),
        avg_price: Math.round(product.avg_price),
        is_saved: Boolean(product.is_saved),
        specs: product.specs_json ? JSON.parse(product.specs_json) : {},
      },
      analysis,
      ratingsDist,
      similarProducts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
