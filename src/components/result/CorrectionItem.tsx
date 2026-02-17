"use client";

import { useState, useRef, useEffect } from "react";
import { Correction, CorrectionType } from "@/types/correction";
import DiffView from "./DiffView";

const TYPE_STYLES: Record<CorrectionType, { label: string; color: string }> = {
  spelling: { label: "맞춤법", color: "bg-blue-100 text-blue-700" },
  spacing: { label: "띄어쓰기", color: "bg-green-100 text-green-700" },
  typo: { label: "오타", color: "bg-red-100 text-red-700" },
  terminology: { label: "용어", color: "bg-purple-100 text-purple-700" },
  grammar: { label: "어법", color: "bg-amber-100 text-amber-700" },
};

function formatTimecode(tc: string): string {
  // "00:01:23,456" → "00:01:23"  (drop ms for compact display)
  return tc.replace(/[,.]\d{3}$/, "");
}

interface CorrectionItemProps {
  correction: Correction;
  checked: boolean;
  startTime?: string;
  endTime?: string;
  editedText?: string;
  onToggle: () => void;
  onEdit: (newText: string) => void;
}

export default function CorrectionItem({
  correction,
  checked,
  startTime,
  endTime,
  editedText,
  onToggle,
  onEdit,
}: CorrectionItemProps) {
  const style = TYPE_STYLES[correction.type] || TYPE_STYLES.grammar;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayCorrected = editedText ?? correction.corrected;
  const isEdited = editedText !== undefined && editedText !== correction.corrected;

  function startEdit() {
    setDraft(displayCorrected);
    setEditing(true);
  }

  function saveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== correction.corrected) {
      onEdit(trimmed);
    } else if (trimmed === correction.corrected) {
      // Reset to original suggestion
      onEdit(correction.corrected);
    }
    setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
  }

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        checked
          ? "border-blue-200 bg-blue-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          {startTime && endTime && (
            <span className="text-xs text-gray-400">
              {formatTimecode(startTime)} → {formatTimecode(endTime)}
            </span>
          )}
          {isEdited && (
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-600">
              수정됨
            </span>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.color}`}
        >
          {style.label}
        </span>
      </div>

      {editing ? (
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded bg-gray-50 px-3 py-2">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              원본
            </span>
            <p className="leading-relaxed">{correction.original}</p>
          </div>
          <div className="rounded bg-blue-50 px-3 py-2">
            <span className="mb-1 block text-xs font-medium text-blue-600">
              직접 수정
            </span>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") cancelEdit();
              }}
              rows={2}
              className="mt-1 w-full resize-none rounded border border-blue-300 bg-white px-2 py-1.5 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={saveEdit}
                className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <DiffView
            original={correction.original}
            corrected={displayCorrected}
          />
          <button
            onClick={startEdit}
            title="직접 수정"
            className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">{correction.reason}</p>
    </div>
  );
}
