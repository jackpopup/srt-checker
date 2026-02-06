"use client";

import { useState } from "react";
import { SrtEntry } from "@/types/srt";
import {
  Correction,
  CheckGrammarResponse,
  CheckStats,
} from "@/types/correction";

export function useCheckGrammar() {
  const [loading, setLoading] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [stats, setStats] = useState<CheckStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function check(entries: SrtEntry[]) {
    setLoading(true);
    setError(null);
    setCorrections([]);
    setStats(null);

    try {
      const subtitles = entries
        .filter((e) => e.text.trim().length > 0)
        .map((e) => ({ index: e.index, text: e.text }));

      const res = await fetch("/api/check-grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtitles }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `검사 실패 (${res.status})`);
      }

      const data: CheckGrammarResponse = await res.json();
      setCorrections(data.corrections);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }

  return { check, loading, corrections, stats, error };
}
