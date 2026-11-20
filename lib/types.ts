export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  is_verified?: number | boolean;
  is_admin?: number | boolean;
  role: 'user' | 'admin';
  created_at: string;
  followers_count?: number;
  following_count?: number;
  reviews_count?: number;
  verified_reviews_count?: number;
  avg_helpfulness?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  thumbnail_url: string;
  images?: string[];
  images_json?: string;
  product_url?: string;
  store_links?: Array<{ title?: string; url: string }>;
  store_links_json?: string;
  specs_json?: string;
  specs?: Record<string, string>;
  created_at: string;
  review_count?: number;
  verified_review_count?: number;
  avg_rating?: number;
  avg_quality?: number;
  avg_value?: number;
  avg_durability?: number;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  is_saved?: boolean;
  ai_recommendation?: string;
  ai_sentiment_score?: number;
  ai_pros?: string[];
  ai_cons?: string[];
  ai_durability_insights?: string;
  ai_value_analysis?: string;
}

export interface ReviewMedia {
  id: string;
  review_id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  quality_rating: number;
  value_rating: number;
  durability_rating: number;
  title: string;
  content: string;
  purchase_price: number;
  purchase_date: string;
  purchased_from: string;
  is_verified_purchase: boolean | number;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  product?: Product;
  media?: ReviewMedia[];
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_helpful?: boolean;
}

export interface Comment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
  replies?: CommentReply[];
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface AIAnalysis {
  id: string;
  product_id: string;
  recommendation: 'Highly Recommended' | 'Recommended' | 'Consider Before Buying' | 'Not Recommended';
  recommendation_reason: string;
  summary: string;
  target_audience: string;
  who_should_avoid: string;
  sentiment_score: number;
  positive_pct: number;
  negative_pct: number;
  neutral_pct: number;
  avg_rating: number;
  quality_score: number;
  value_score: number;
  durability_score: number;
  pros_json: string;
  cons_json: string;
  positive_feedback_json: string;
  negative_feedback_json: string;
  durability_insights: string;
  value_analysis: string;
  verified_vs_unverified_insights: string;
  confidence_level: 'high' | 'medium' | 'low';
  reviews_analyzed_count: number;
  last_analyzed_at: string;
  pros?: string[];
  cons?: string[];
  positive_feedback?: string[];
  negative_feedback?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'verified_purchase' | 'ai_report_updated';
  entity_id: string;
  message: string;
  is_read: boolean | number;
  created_at: string;
  actor?: User;
}

export interface PurchaseVerification {
  id: string;
  review_id: string;
  user_id: string;
  receipt_url: string;
  store_name: string;
  order_id: string;
  purchase_amount: number;
  status: 'pending' | 'verified' | 'rejected';
  reviewed_by?: string;
  notes?: string;
  created_at: string;
  user?: User;
  review?: Review;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'review' | 'comment' | 'user';
  target_id: string;
  reason: 'spam' | 'fake_review' | 'harassment' | 'misleading' | 'inappropriate';
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: User;
}
