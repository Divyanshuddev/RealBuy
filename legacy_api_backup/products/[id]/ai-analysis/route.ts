import { NextResponse } from 'next/server';
import { calculateAIProductAnalysis } from '@/lib/ai-engine';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const productId = params.id;
    const analysis = calculateAIProductAnalysis(productId);
    return NextResponse.json({
      message: 'AI analysis recalculated successfully',
      analysis: {
        ...analysis,
        pros: JSON.parse(analysis.pros_json),
        cons: JSON.parse(analysis.cons_json),
        positive_feedback: JSON.parse(analysis.positive_feedback_json),
        negative_feedback: JSON.parse(analysis.negative_feedback_json),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
