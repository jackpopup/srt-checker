import { NextRequest, NextResponse } from "next/server";
import { checkGrammar } from "@/lib/claude";
import { getAllTerms } from "@/lib/terminology";
import { CheckGrammarRequest, CheckGrammarResponse } from "@/types/correction";

export async function POST(request: NextRequest) {
  try {
    const body: CheckGrammarRequest = await request.json();

    if (!body.subtitles || body.subtitles.length === 0) {
      return NextResponse.json(
        { error: "자막 데이터가 비어있습니다." },
        { status: 400 }
      );
    }

    // Filter out empty subtitles
    const validSubtitles = body.subtitles.filter(
      (s) => s.text && s.text.trim().length > 0
    );

    if (validSubtitles.length === 0) {
      return NextResponse.json(
        { error: "검사할 자막 텍스트가 없습니다." },
        { status: 400 }
      );
    }

    // Get terminology dictionary
    const terms = await getAllTerms();

    // Run grammar check
    const { corrections, tokensUsed } = await checkGrammar(
      validSubtitles,
      terms
    );

    const response: CheckGrammarResponse = {
      corrections,
      stats: {
        total_subtitles: body.subtitles.length,
        checked_subtitles: validSubtitles.length,
        corrections_found: corrections.length,
        tokens_used: tokensUsed,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("check-grammar error:", error);
    return NextResponse.json(
      { error: "맞춤법 검사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
