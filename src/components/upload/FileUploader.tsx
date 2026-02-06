"use client";

import { useCallback, useRef, useState } from "react";
import { parseSrt } from "@/lib/srt-parser";
import { SrtFile } from "@/types/srt";

interface FileUploaderProps {
  onFileLoaded: (srtFile: SrtFile, fileName: string) => void;
}

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.toLowerCase().endsWith(".srt")) {
        setError("SRT 파일만 지원합니다.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("5MB 이하 파일만 지원합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          const srtFile = parseSrt(content);
          if (srtFile.entries.length === 0) {
            setError("자막이 없는 파일입니다. SRT 형식을 확인해주세요.");
            return;
          }
          onFileLoaded(srtFile, file.name);
        } catch {
          setError("올바른 SRT 파일이 아닙니다.");
        }
      };
      reader.readAsText(file, "utf-8");
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-8 py-16 transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }`}
      >
        <svg
          className="h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="text-center">
          <p className="text-base font-medium text-gray-700">
            SRT 파일을 여기에 드래그하거나 클릭하여 선택
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Premiere Pro 자막 파일 (.srt) | 최대 5MB
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".srt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}
