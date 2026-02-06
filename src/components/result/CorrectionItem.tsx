"use client";

import { Correction, CorrectionType } from "@/types/correction";
import DiffView from "./DiffView";

const TYPE_STYLES: Record<CorrectionType, { label: string; color: string }> = {
  spelling: { label: "맞춤법", color: "bg-blue-100 text-blue-700" },
  spacing: { label: "띄어쓰기", color: "bg-green-100 text-green-700" },
  typo: { label: "오타", color: "bg-red-100 text-red-700" },
  terminology: { label: "용어", color: "bg-purple-100 text-purple-700" },
  grammar: { label: "어법", color: "bg-amber-100 text-amber-700" },
};

interface CorrectionItemProps {
  correction: Correction;
  checked: boolean;
  onToggle: () => void;
}

export default function CorrectionItem({
  correction,
  checked,
  onToggle,
}: CorrectionItemProps) {
  const style = TYPE_STYLES[correction.type] || TYPE_STYLES.grammar;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        checked
          ? "border-blue-200 bg-blue-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            #{correction.index}
          </span>
        </label>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.color}`}
        >
          {style.label}
        </span>
      </div>

      <DiffView
        original={correction.original}
        corrected={correction.corrected}
      />

      <p className="mt-2 text-xs text-gray-500">{correction.reason}</p>
    </div>
  );
}
