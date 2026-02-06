"use client";

import { useState, useEffect, useCallback } from "react";
import { TermEntry, TERM_CATEGORIES } from "@/types/term";

export default function TermsPage() {
  const [terms, setTerms] = useState<TermEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  // Add term modal
  const [showAdd, setShowAdd] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newAliases, setNewAliases] = useState("");
  const [newCategory, setNewCategory] = useState("dev_concept");
  const [newDescription, setNewDescription] = useState("");

  // Edit term modal
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTerm, setEditTerm] = useState("");
  const [editAliases, setEditAliases] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete confirmation
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");

  const limit = 30;

  const fetchTerms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (category) params.set("category", category);

      const res = await fetch(`/api/terms?${params}`);
      const data = await res.json();
      setTerms(data.terms || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error("fetch terms error:", e);
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  async function handleAdd() {
    if (!newTerm.trim()) return;

    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: newTerm.trim(),
          aliases: newAliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          category: newCategory,
          description: newDescription.trim(),
        }),
      });

      if (res.ok) {
        setShowAdd(false);
        setNewTerm("");
        setNewAliases("");
        setNewDescription("");
        fetchTerms();
      }
    } catch (e) {
      console.error("add term error:", e);
    }
  }

  function openEdit(term: TermEntry) {
    setEditId(term._id || "");
    setEditTerm(term.term);
    setEditAliases(term.aliases.join(", "));
    setEditCategory(term.category);
    setEditDescription(term.description);
    setShowEdit(true);
  }

  async function handleEdit() {
    if (!editId || !editTerm.trim()) return;
    try {
      const res = await fetch(`/api/terms/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: editTerm.trim(),
          aliases: editAliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          category: editCategory,
          description: editDescription.trim(),
        }),
      });
      if (res.ok) {
        setShowEdit(false);
        fetchTerms();
      }
    } catch (e) {
      console.error("edit term error:", e);
    }
  }

  function openDelete(term: TermEntry) {
    setDeleteId(term._id || "");
    setDeleteName(term.term);
    setShowDelete(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/terms/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDelete(false);
        fetchTerms();
      }
    } catch (e) {
      console.error("delete term error:", e);
    }
  }

  async function handleConfluenceSync() {
    setSyncing(true);
    setSyncMessage("");

    try {
      const res = await fetch("/api/confluence", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setSyncMessage(data.message || "동기화 완료");
        fetchTerms();
      } else {
        setSyncMessage(data.error || "동기화 실패");
      }
    } catch {
      setSyncMessage("Confluence 동기화 중 오류가 발생했습니다.");
    } finally {
      setSyncing(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">용어 사전</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 용어 추가
        </button>
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="검색어 입력..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(TERM_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setCategory("");
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !category
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체 ({total})
        </button>
        {Object.entries(TERM_CATEGORIES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setCategory(key);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              category === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Term Table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">
          로딩 중...
        </div>
      ) : terms.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          {search || category ? "검색 결과가 없습니다." : "용어가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  용어
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">
                  별칭
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-700 md:table-cell">
                  설명
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 w-24">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {terms.map((term, i) => (
                <tr key={term._id || term.id || i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {term.term}
                    </div>
                    <span className="mt-0.5 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      {TERM_CATEGORIES[term.category] || term.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {term.aliases.slice(0, 5).join(", ")}
                    {term.aliases.length > 5 && (
                      <span className="text-gray-400">
                        {" "}
                        +{term.aliases.length - 5}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    <p className="line-clamp-2">{term.description}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {term._id && (
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(term)}
                          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => openDelete(term)}
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {total}개 용어 | 페이지 {page}/{totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Confluence Sync */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-medium text-gray-700">
          Confluence 동기화
        </h3>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleConfluenceSync}
            disabled={syncing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? "동기화 중..." : "Confluence에서 용어 가져오기"}
          </button>
          {syncMessage && (
            <p className="text-sm text-gray-600">{syncMessage}</p>
          )}
        </div>
      </div>

      {/* Edit Term Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              용어 수정
            </h2>
            <div className="flex flex-col gap-3">
              <input
                placeholder="용어 (정식 표기)"
                value={editTerm}
                onChange={(e) => setEditTerm(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="별칭 (쉼표로 구분)"
                value={editAliases}
                onChange={(e) => setEditAliases(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {Object.entries(TERM_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="설명"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowEdit(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleEdit}
                disabled={!editTerm.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              용어 삭제
            </h2>
            <p className="text-sm text-gray-600">
              <strong>{deleteName}</strong> 용어를 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              용어 추가
            </h2>
            <div className="flex flex-col gap-3">
              <input
                placeholder="용어 (정식 표기)"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <input
                placeholder="별칭 (쉼표로 구분)"
                value={newAliases}
                onChange={(e) => setNewAliases(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                {Object.entries(TERM_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="설명"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTerm.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
