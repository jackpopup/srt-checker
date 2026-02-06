"use client";

import { computeDiff, DiffSegment } from "@/lib/diff";

interface DiffViewProps {
  original: string;
  corrected: string;
}

function renderSegments(segments: DiffSegment[]) {
  return segments.map((seg, i) => {
    if (seg.type === "removed") {
      return (
        <span key={i} className="bg-red-100 text-red-800 line-through">
          {seg.text}
        </span>
      );
    }
    if (seg.type === "added") {
      return (
        <span key={i} className="bg-green-100 font-semibold text-green-800">
          {seg.text}
        </span>
      );
    }
    return <span key={i}>{seg.text}</span>;
  });
}

export default function DiffView({ original, corrected }: DiffViewProps) {
  const { originalSegments, correctedSegments } = computeDiff(
    original,
    corrected
  );

  return (
    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div className="rounded bg-gray-50 px-3 py-2">
        <span className="mb-1 block text-xs font-medium text-gray-500">
          원본
        </span>
        <p className="leading-relaxed">{renderSegments(originalSegments)}</p>
      </div>
      <div className="rounded bg-gray-50 px-3 py-2">
        <span className="mb-1 block text-xs font-medium text-gray-500">
          수정
        </span>
        <p className="leading-relaxed">{renderSegments(correctedSegments)}</p>
      </div>
    </div>
  );
}
