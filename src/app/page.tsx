"use client";

import { useState } from "react";
import { SrtFile } from "@/types/srt";
import { AppState } from "@/types/correction";
import { useCheckGrammar } from "@/hooks/useCheckGrammar";
import FileUploader from "@/components/upload/FileUploader";
import ResultPanel from "@/components/result/ResultPanel";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [srtFile, setSrtFile] = useState<SrtFile | null>(null);
  const [fileName, setFileName] = useState("");
  const { check, loading, corrections, stats, error } = useCheckGrammar();

  function handleFileLoaded(file: SrtFile, name: string) {
    setSrtFile(file);
    setFileName(name);
    setState("file_loaded");
  }

  async function handleCheck() {
    if (!srtFile) return;
    setState("checking");
    await check(srtFile.entries);
  }

  function handleReset() {
    setState("idle");
    setSrtFile(null);
    setFileName("");
  }

  // Sync state from hook
  if (loading && state !== "checking") setState("checking");
  if (!loading && corrections.length >= 0 && state === "checking" && !error) {
    setState("result");
  }
  if (error && state === "checking") setState("error");

  return (
    <div>
      {/* Idle: Upload */}
      {state === "idle" && (
        <div className="py-12 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            SRT 맞춤법 검사기
          </h1>
          <p className="mb-8 text-gray-600">
            Premiere Pro 자막 파일의 맞춤법, 띄어쓰기, 오타를 검사합니다
          </p>
          <FileUploader onFileLoaded={handleFileLoaded} />
        </div>
      )}

      {/* File Loaded: Show info + start button */}
      {state === "file_loaded" && srtFile && (
        <div className="mx-auto max-w-xl py-12 text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <svg
              className="mx-auto h-10 w-10 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              {fileName}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {srtFile.entries.length}개 자막
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                다른 파일
              </button>
              <button
                onClick={handleCheck}
                className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                맞춤법 검사 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checking: Progress */}
      {state === "checking" && (
        <div className="mx-auto max-w-md py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-medium text-gray-700">
            맞춤법 검사 중...
          </p>
          <p className="mt-1 text-xs text-gray-500">
            자막 수에 따라 시간이 걸릴 수 있습니다
          </p>
        </div>
      )}

      {/* Result */}
      {state === "result" && srtFile && stats && (
        <ResultPanel
          corrections={corrections}
          stats={stats}
          entries={srtFile.entries}
          format={srtFile.format}
          fileName={fileName}
          onReset={handleReset}
        />
      )}

      {/* Error */}
      {state === "error" && (
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="rounded-xl border border-red-200 bg-red-50 px-8 py-8">
            <svg
              className="mx-auto h-10 w-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="mt-3 text-base font-semibold text-red-800">
              검사 중 오류 발생
            </h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                새 파일
              </button>
              <button
                onClick={handleCheck}
                className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
