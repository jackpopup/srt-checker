import { NextRequest, NextResponse } from "next/server";
import * as bkend from "@/lib/bkend";
import { getAllTerms, invalidateCache } from "@/lib/terminology";

export async function POST(request: NextRequest) {
  const confluenceUrl = process.env.CONFLUENCE_URL;
  const confluenceEmail = process.env.CONFLUENCE_EMAIL;
  const confluenceToken = process.env.CONFLUENCE_API_TOKEN;

  if (!confluenceUrl || !confluenceEmail || !confluenceToken) {
    return NextResponse.json(
      { error: "Confluence 연결 설정이 되어있지 않습니다. 환경변수를 확인해주세요." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const spaceKey = body.space_key;

    const auth = Buffer.from(`${confluenceEmail}:${confluenceToken}`).toString(
      "base64"
    );

    // Build CQL with optional space_key filter
    let cql = 'type = page AND (text ~ "bkit" OR text ~ "bkend" OR text ~ "bkamp" OR text ~ "바이브 코딩")';
    if (spaceKey) {
      cql = `space.key = "${spaceKey}" AND ${cql}`;
    }

    const res = await fetch(
      `${confluenceUrl}/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=20&expand=body.storage`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Confluence API error:", res.status, text);
      return NextResponse.json(
        {
          error: `Confluence 연결 실패 (${res.status}). API 토큰 권한을 확인해주세요.`,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const pages = data.results || [];

    // Extract terms from page content
    const extractedTerms: string[] = [];
    for (const page of pages) {
      const pageBody = page.body?.storage?.value || "";
      const boldMatches = pageBody.match(/<strong>(.*?)<\/strong>/g) || [];
      for (const match of boldMatches) {
        const term = match.replace(/<\/?strong>/g, "").trim();
        if (term.length >= 2 && term.length <= 50) {
          extractedTerms.push(term);
        }
      }
    }

    const uniqueTerms = [...new Set(extractedTerms)];

    // Save new terms to bkend
    const existingTerms = await getAllTerms();
    const existingSet = new Set(existingTerms.map((t) => t.term.toLowerCase()));
    const newTerms: string[] = [];
    const errors: string[] = [];

    for (const termName of uniqueTerms) {
      if (existingSet.has(termName.toLowerCase())) continue;
      try {
        await bkend.createTerm({
          term: termName,
          aliases: [],
          category: "dev_concept",
          description: `Confluence에서 자동 추출된 용어`,
          source: "confluence",
        });
        newTerms.push(termName);
      } catch (e) {
        errors.push(`${termName}: ${e instanceof Error ? e.message : "저장 실패"}`);
      }
    }

    if (newTerms.length > 0) {
      invalidateCache();
    }

    // Log sync result
    try {
      await bkend.createSyncLog({
        synced_at: new Date().toISOString(),
        source: "confluence",
        space_key: spaceKey || "all",
        terms_synced: newTerms.length,
        new_terms: newTerms,
        updated_terms: [],
        status: errors.length === 0 ? "success" : "partial",
      });
    } catch {
      // Sync log failure is non-critical
    }

    return NextResponse.json({
      synced_count: newTerms.length,
      new_terms: newTerms,
      updated_terms: [],
      errors,
      pages_scanned: pages.length,
      message: `${pages.length}개 페이지에서 ${uniqueTerms.length}개 후보 추출, ${newTerms.length}개 신규 저장${errors.length > 0 ? `, ${errors.length}개 오류` : ""}`,
    });
  } catch (error) {
    console.error("confluence sync error:", error);
    return NextResponse.json(
      { error: "Confluence 동기화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
