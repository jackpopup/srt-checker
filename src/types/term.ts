export interface TermEntry {
  _id?: string;
  id?: number;
  term: string;
  aliases: string[];
  category: string;
  description: string;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTermRequest {
  term: string;
  aliases: string[];
  category: string;
  description: string;
}

export interface TermsResponse {
  terms: TermEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface SyncLog {
  _id?: string;
  synced_at: string;
  source: string;
  space_key?: string;
  terms_synced: number;
  new_terms: string[];
  updated_terms: string[];
  status: string;
}

export const TERM_CATEGORIES: Record<string, string> = {
  company: "회사/조직",
  product: "자사 제품",
  product_feature: "제품 기능",
  vibe_coding: "바이브 코딩",
  ai_tool: "AI 도구",
  ai_concept: "AI 개념",
  dev_concept: "개발 개념",
  platform: "플랫폼",
  community: "커뮤니티",
  person: "인물",
  vc_company: "VC 기업/서비스",
};
