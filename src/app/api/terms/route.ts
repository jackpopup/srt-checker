import { NextRequest, NextResponse } from "next/server";
import * as bkend from "@/lib/bkend";
import { searchTerms, invalidateCache } from "@/lib/terminology";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const allTerms = await searchTerms(search, category);
    const start = (page - 1) * limit;
    const paged = allTerms.slice(start, start + limit);

    return NextResponse.json({
      terms: paged,
      total: allTerms.length,
      page,
      limit,
    });
  } catch (error) {
    console.error("terms GET error:", error);
    return NextResponse.json(
      { error: "용어 목록 조회 실패" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.term) {
      return NextResponse.json(
        { error: "용어명은 필수입니다." },
        { status: 400 }
      );
    }

    const term = await bkend.createTerm({
      term: body.term,
      aliases: body.aliases || [],
      category: body.category || "dev_concept",
      description: body.description || "",
      source: "manual",
    });

    invalidateCache();
    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    console.error("terms POST error:", error);
    return NextResponse.json(
      { error: "용어 추가 실패" },
      { status: 500 }
    );
  }
}
