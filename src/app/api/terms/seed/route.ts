import { NextResponse } from "next/server";
import * as bkend from "@/lib/bkend";
import { getBuiltinTerms, invalidateCache } from "@/lib/terminology";

export async function POST() {
  try {
    const builtinTerms = getBuiltinTerms();

    if (builtinTerms.length === 0) {
      return NextResponse.json(
        { error: "내장 용어 사전을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Get existing terms to avoid duplicates
    const existingTerms = await bkend.getTerms();
    const existingSet = new Set(existingTerms.map((t) => t.term));

    let created = 0;
    for (const term of builtinTerms) {
      if (existingSet.has(term.term)) continue;

      try {
        await bkend.createTerm({
          term: term.term,
          aliases: term.aliases || [],
          category: term.category || "dev_concept",
          description: term.description || "",
          source: "initial",
        });
        created++;
      } catch (e) {
        console.error(`Failed to seed term: ${term.term}`, e);
      }
    }

    invalidateCache();

    return NextResponse.json({
      message: `${created}개 용어가 시딩되었습니다. (전체 ${builtinTerms.length}개 중 ${existingTerms.length}개는 이미 존재)`,
      created,
      skipped: builtinTerms.length - created,
    });
  } catch (error) {
    console.error("seed error:", error);
    return NextResponse.json(
      { error: "시딩 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
