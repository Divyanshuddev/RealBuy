import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { calculateAIProductAnalysis } from '@/lib/ai-engine';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'Please provide product ids e.g. ?ids=p1,p2' }, { status: 400 });
    }

    const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean).slice(0, 4);
    if (ids.length < 2) {
      return NextResponse.json({ error: 'Please select at least 2 products to compare' }, { status: 400 });
    }

    const db = getDb();
    const comparisonList = [];

    for (const id of ids) {
      const product = db.prepare(`
        SELECT 
          p.id, p.name, p.brand, p.model, p.category, p.description, p.thumbnail_url, p.specs_json,
          COUNT(DISTINCT r.id) as review_count,
          COUNT(DISTINCT CASE WHEN r.is_verified_purchase = 1 THEN r.id END) as verified_review_count,
          COALESCE(AVG(r.rating), 0) as avg_rating,
          COALESCE(AVG(r.quality_rating), 0) as avg_quality,
          COALESCE(AVG(r.value_rating), 0) as avg_value,
          COALESCE(AVG(r.durability_rating), 0) as avg_durability,
          COALESCE(MIN(r.purchase_price), 0) as min_price,
          COALESCE(MAX(r.purchase_price), 0) as max_price,
          COALESCE(AVG(r.purchase_price), 0) as avg_price
        FROM products p
        LEFT JOIN product_reviews r ON p.id = r.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `).get(id) as any;

      if (!product) continue;

      let analysis = db.prepare('SELECT * FROM ai_product_analyses WHERE product_id = ?').get(id) as any;
      if (!analysis) {
        analysis = calculateAIProductAnalysis(id);
      } else {
        analysis = {
          ...analysis,
          pros: analysis.pros_json ? JSON.parse(analysis.pros_json) : [],
          cons: analysis.cons_json ? JSON.parse(analysis.cons_json) : [],
          positive_feedback: analysis.positive_feedback_json ? JSON.parse(analysis.positive_feedback_json) : [],
          negative_feedback: analysis.negative_feedback_json ? JSON.parse(analysis.negative_feedback_json) : [],
        };
      }

      comparisonList.push({
        ...product,
        avg_rating: Number(Number(product.avg_rating).toFixed(1)),
        avg_quality: Number(Number(product.avg_quality).toFixed(1)),
        avg_value: Number(Number(product.avg_value).toFixed(1)),
        avg_durability: Number(Number(product.avg_durability).toFixed(1)),
        min_price: Math.round(product.min_price),
        max_price: Math.round(product.max_price),
        avg_price: Math.round(product.avg_price),
        specs: product.specs_json ? JSON.parse(product.specs_json) : {},
        analysis,
      });
    }

    // Generate AI Comparative Summary
    const sortedByRating = [...comparisonList].sort((a, b) => b.avg_rating - a.avg_rating);
    const sortedByValue = [...comparisonList].sort((a, b) => b.avg_value - a.avg_value);

    const winnerRating = sortedByRating[0];
    const winnerValue = sortedByValue[0];

    const aiVerdict = {
      overallWinner: winnerRating?.name || '',
      overallWinnerReason: `Holds highest community satisfaction (${winnerRating?.avg_rating}/5) and superior sentiment score (${winnerRating?.analysis?.sentiment_score}%).`,
      bestValue: winnerValue?.name || '',
      bestValueReason: `Delivers the highest customer value-for-money score (${winnerValue?.avg_value}/5) at average price \$${winnerValue?.avg_price}.`,
      recommendationSummary: `If prioritizing ultimate build and raw performance, choose **${winnerRating?.brand} ${winnerRating?.name}**. For maximum feature utility per dollar spent, **${winnerValue?.brand} ${winnerValue?.name}** offers the smartest buy.`
    };

    return NextResponse.json({
      products: comparisonList,
      aiVerdict,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
