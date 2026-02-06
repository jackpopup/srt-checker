import Anthropic from "@anthropic-ai/sdk";
import { Correction } from "@/types/correction";
import { TermEntry } from "@/types/term";
import { buildTermDictForPrompt } from "./terminology";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  timeout: 30_000,
});

const SYSTEM_PROMPT = `당신은 한국어 영상 자막 맞춤법 교정 전문가입니다.
POPUP STUDIO AI의 영상 자막을 검수합니다.
반드시 JSON 형식으로만 응답하세요.`;

function buildUserPrompt(
  subtitles: { index: number; text: string }[],
  termDict: string
): string {
  const subtitleList = subtitles
    .map((s) => `[${s.index}] ${s.text}`)
    .join("\n");

  return `아래 영상 자막의 맞춤법, 띄어쓰기, 오타를 검사해주세요.

## 절대 규칙
1. 오직 대사 내용의 맞춤법, 띄어쓰기, 오타만 자연스럽게 교정하세요.
2. 문맥을 해치지 않는 선에서 수정하세요.
3. 영상 자막이므로 다음 구어적 표현은 수정하지 마세요:
   - 축약형: ~거든요, ~잖아, ~인데, ~같은데, ~하는데, ~건데
   - 종결어미 변형: ~해요, ~하죠, ~할게요, ~할까요, ~거예요
   - 감탄사: 아, 어, 음, 네, 아니, 뭐, 진짜, 진짜요?, 와
   - 구어체 조사: ~는요, ~은요, ~도요
   - 말줄임: ...
4. 다음 용어 사전의 단어와 유사한 표현은 반드시 사전의 정식 표기를 따르세요:
${termDict}

## 자막 목록
${subtitleList}

## 출력 형식
수정이 필요한 자막만 JSON 배열로 반환하세요. 수정이 없으면 빈 배열 []을 반환하세요.
다른 텍스트 없이 JSON만 출력하세요.

\`\`\`json
[
  {
    "index": 자막번호,
    "original": "원본 텍스트",
    "corrected": "수정된 텍스트",
    "reason": "수정 이유 (한국어)",
    "type": "spelling|spacing|typo|terminology|grammar"
  }
]
\`\`\``;
}

function splitIntoBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function parseJsonResponse(text: string): Correction[] {
  // Try to extract JSON array from response
  let cleaned = text.trim();

  // Remove markdown code block if present
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // Try to find JSON array
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    cleaned = arrayMatch[0];
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item: Record<string, unknown>) => ({
    index: Number(item.index),
    original: String(item.original || ""),
    corrected: String(item.corrected || ""),
    reason: String(item.reason || ""),
    type: (["spelling", "spacing", "typo", "terminology", "grammar"].includes(
      String(item.type)
    )
      ? item.type
      : "grammar") as Correction["type"],
  }));
}

export async function checkGrammar(
  subtitles: { index: number; text: string }[],
  terms: TermEntry[],
  batchSize = 50
): Promise<{ corrections: Correction[]; tokensUsed: number }> {
  const termDict = buildTermDictForPrompt(terms);
  const batches = splitIntoBatches(subtitles, batchSize);

  const allCorrections: Correction[] = [];
  let totalTokens = 0;

  for (const batch of batches) {
    const userPrompt = buildUserPrompt(batch, termDict);
    let retries = 0;
    const maxRetries = 2;

    while (retries <= maxRetries) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });

        const textContent = response.content.find((c) => c.type === "text");
        if (!textContent || textContent.type !== "text") {
          throw new Error("No text content in response");
        }

        const corrections = parseJsonResponse(textContent.text);
        allCorrections.push(...corrections);
        totalTokens +=
          (response.usage?.input_tokens || 0) +
          (response.usage?.output_tokens || 0);
        break;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          console.error(
            `Failed after ${maxRetries} retries for batch:`,
            error
          );
          // Continue with next batch instead of failing entirely
        }
      }
    }
  }

  return { corrections: allCorrections, tokensUsed: totalTokens };
}
