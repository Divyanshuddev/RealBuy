import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { answerProductQuestion } from '@/lib/ai-engine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { question } = await req.json();
    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const db = getDb();
    const productId = params.id;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name
      FROM product_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.helpful_count DESC
    `).all(productId) as any[];

    let analysis = db.prepare('SELECT * FROM ai_product_analyses WHERE product_id = ?').get(productId) as any;
    if (analysis) {
      analysis = {
        ...analysis,
        pros: analysis.pros_json ? JSON.parse(analysis.pros_json) : [],
        cons: analysis.cons_json ? JSON.parse(analysis.cons_json) : [],
        positive_feedback: analysis.positive_feedback_json ? JSON.parse(analysis.positive_feedback_json) : [],
        negative_feedback: analysis.negative_feedback_json ? JSON.parse(analysis.negative_feedback_json) : [],
      };
    }

    const answer = answerProductQuestion(product, reviews, analysis, question.trim());

    return NextResponse.json({
      question: question.trim(),
      answer,
      reviewsAnalyzed: reviews.length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
