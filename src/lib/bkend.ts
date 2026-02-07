import { TermEntry } from "@/types/term";

const BKEND_API_URL = process.env.NEXT_PUBLIC_BKEND_API_URL || "https://api-enduser.bkend.ai";
const BKEND_PROJECT_ID = process.env.NEXT_PUBLIC_BKEND_PROJECT_ID || "";
const BKEND_ENVIRONMENT = process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT || "dev";

function headers() {
  return {
    "Content-Type": "application/json",
    "X-Project-Id": BKEND_PROJECT_ID,
    "X-Environment": BKEND_ENVIRONMENT,
  };
}

function url(collection: string, id?: string) {
  const base = `${BKEND_API_URL}/data/${collection}`;
  return id ? `${base}/${id}` : base;
}

interface ApiResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

export async function getTerms(
  filter?: Record<string, unknown>
): Promise<TermEntry[]> {
  const params = new URLSearchParams();
  if (filter) {
    params.set("filter", JSON.stringify(filter));
  }
  params.set("limit", "500");

  const res = await fetch(`${url("terms")}?${params}`, {
    headers: headers(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("bkend getTerms failed:", res.status);
    return [];
  }

  const json: ApiResponse<TermEntry> = await res.json();
  return json.data.items;
}

export async function createTerm(
  term: Omit<TermEntry, "_id">
): Promise<TermEntry> {
  const res = await fetch(url("terms"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      ...term,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) throw new Error(`createTerm failed: ${res.status}`);
  return res.json();
}

export async function updateTerm(
  id: string,
  data: Partial<TermEntry>
): Promise<TermEntry> {
  const res = await fetch(url("terms", id), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      ...data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) throw new Error(`updateTerm failed: ${res.status}`);
  return res.json();
}

export async function deleteTerm(id: string): Promise<void> {
  const res = await fetch(url("terms", id), {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) throw new Error(`deleteTerm failed: ${res.status}`);
}

export async function createSyncLog(
  data: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(url("sync_logs"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`createSyncLog failed: ${res.status}`);
  return res.json();
}
