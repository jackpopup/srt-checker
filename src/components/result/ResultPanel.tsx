"use client";

import { useState, useMemo } from "react";
import { Correction, CheckStats } from "@/types/correction";
import { SrtEntry, SrtFormat } from "@/types/srt";
import { buildSrt, applyCorrections } from "@/lib/srt-parser";
import CorrectionItem from "./CorrectionItem";

interface ResultPanelProps {
  corrections: Correction[];
  stats: CheckStats;
  entries: SrtEntry[];
  format: SrtFormat;
  fileName: string;
  onReset: () => void;
}

export default function ResultPanel({
  corrections,
  stats,
  entries,
  format,
  fileName,
  onReset,
}: ResultPanelProps) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(corrections.map((_, i) => i))
  );

  const allSelected = selected.size === corrections.length;
  const noneSelected = selected.size === 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(corrections.map((_, i) => i)));
    }
  }

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  const downloadName = useMemo(() => {
    const base = fileName.replace(/\.srt$/i, "");
    return `${base}_checked.srt`;
  }, [fileName]);

  function handleDownload() {
    const corrected = applyCorrections(entries, corrections, selected);
    const srtContent = buildSrt(corrected, format);
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (corrections.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="rounded-xl border border-green-200 bg-green-50 px-8 py-12">
          <svg
            className="mx-auto h-12 w-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-green-800">
            수정할 항목이 없습니다
          </h3>
          <p className="mt-1 text-sm text-green-600">
            {stats.checked_subtitles}개 자막을 검사했습니다. 맞춤법이 모두 정확합니다.
          </p>
          <button
            onClick={onReset}
            className="mt-6 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            새 파일 검사하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {stats.checked_subtitles}
          </p>
          <p className="text-xs text-gray-500">검사한 자막</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {stats.corrections_found}
          </p>
          <p className="text-xs text-gray-500">수정 제안</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{selected.size}</p>
          <p className="text-xs text-gray-500">선택됨</p>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={toggleAll}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {allSelected ? "전체 해제" : "전체 선택"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            새 파일
          </button>
          <button
            onClick={handleDownload}
            disabled={noneSelected}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            수정 적용 & 다운로드 ({selected.size}개)
          </button>
        </div>
      </div>

      {/* Correction list */}
      <div className="flex flex-col gap-3">
        {corrections.map((correction, i) => (
          <CorrectionItem
            key={`${correction.index}-${i}`}
            correction={correction}
            checked={selected.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>

      {/* Bottom download */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleDownload}
          disabled={noneSelected}
          className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          선택한 {selected.size}개 수정 적용 & 다운로드
        </button>
      </div>
    </div>
  );
}
