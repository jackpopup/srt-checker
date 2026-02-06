import { SrtEntry, SrtFile, SrtFormat } from "@/types/srt";
import { Correction } from "@/types/correction";

// Standard SRT: timecode on its own line
const TIMECODE_REGEX =
  /^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})$/;

// Premiere Pro SRT: "1. 00:00:01,000 --> 00:00:03,500" (index + timecode on same line)
const PREMIERE_LINE_REGEX =
  /^(\d+)\.\s+(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})$/;

function stripBom(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function parseSrt(content: string): SrtFile {
  const raw = content;
  const cleaned = normalizeLineEndings(stripBom(content)).trim();
  const blocks = cleaned.split(/\n\n+/);
  const entries: SrtEntry[] = [];
  let format: SrtFormat = "standard";

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 2) continue;

    // Try Premiere Pro format first: "1. 00:00:01,000 --> 00:00:03,500"
    const premierMatch = lines[0].trim().match(PREMIERE_LINE_REGEX);
    if (premierMatch) {
      format = "premiere";
      const index = parseInt(premierMatch[1], 10);
      const startTime = premierMatch[2];
      const endTime = premierMatch[3];
      const text = lines.slice(1).join("\n").trim();
      if (text) {
        entries.push({ index, startTime, endTime, text });
      }
      continue;
    }

    // Standard SRT format: index, timecode, text on separate lines
    if (lines.length < 3) continue;

    const indexLine = lines[0].trim();
    const index = parseInt(indexLine, 10);
    if (isNaN(index)) continue;

    const timeLine = lines[1].trim();
    const timeMatch = timeLine.match(TIMECODE_REGEX);
    if (!timeMatch) continue;

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];
    const text = lines.slice(2).join("\n").trim();

    entries.push({ index, startTime, endTime, text });
  }

  return { entries, raw, format };
}

export function buildSrt(entries: SrtEntry[], format: SrtFormat = "standard"): string {
  if (format === "premiere") {
    return entries
      .map(
        (entry) =>
          `${entry.index}. ${entry.startTime} --> ${entry.endTime}\n${entry.text}`
      )
      .join("\n\n") + "\n";
  }
  return entries
    .map(
      (entry) =>
        `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`
    )
    .join("\n\n") + "\n";
}

export function applyCorrections(
  entries: SrtEntry[],
  corrections: Correction[],
  selectedIndices: Set<number>
): SrtEntry[] {
  const correctionMap = new Map<number, Correction>();
  corrections.forEach((c, i) => {
    if (selectedIndices.has(i)) {
      correctionMap.set(c.index, c);
    }
  });

  return entries.map((entry) => {
    const correction = correctionMap.get(entry.index);
    if (correction) {
      return { ...entry, text: correction.corrected };
    }
    return entry;
  });
}
