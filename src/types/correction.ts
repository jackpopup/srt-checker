export type CorrectionType =
  | "spelling"
  | "spacing"
  | "typo"
  | "terminology"
  | "grammar";

export interface Correction {
  index: number;
  original: string;
  corrected: string;
  reason: string;
  type: CorrectionType;
}

export interface CheckGrammarRequest {
  subtitles: {
    index: number;
    text: string;
  }[];
}

export interface CheckStats {
  total_subtitles: number;
  checked_subtitles: number;
  corrections_found: number;
  tokens_used: number;
}

export interface CheckGrammarResponse {
  corrections: Correction[];
  stats: CheckStats;
}

export type AppState = "idle" | "file_loaded" | "checking" | "result" | "error";
