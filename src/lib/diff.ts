export interface DiffSegment {
  type: "equal" | "removed" | "added";
  text: string;
}

/**
 * Simple word-level diff between two strings.
 * Returns segments for original (with "removed") and corrected (with "added").
 */
export function computeWordDiff(
  original: string,
  corrected: string
): { originalSegments: DiffSegment[]; correctedSegments: DiffSegment[] } {
  const origWords = tokenize(original);
  const corrWords = tokenize(corrected);

  const lcs = longestCommonSubsequence(origWords, corrWords);

  const originalSegments = buildSegments(origWords, lcs, "removed");
  const correctedSegments = buildSegments(corrWords, lcs, "added");

  return { originalSegments, correctedSegments };
}

function tokenize(text: string): string[] {
  // Split by word boundaries but keep whitespace attached
  const tokens: string[] = [];
  const regex = /(\S+|\s+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

function longestCommonSubsequence(a: string[], b: string[]): Set<number> {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS indices in both arrays
  const lcsIndicesA = new Set<number>();
  const lcsIndicesB = new Set<number>();
  let i = m,
    j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcsIndicesA.add(i - 1);
      lcsIndicesB.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcsIndicesA;
}

function buildSegments(
  words: string[],
  lcsOrigIndices: Set<number>,
  diffType: "removed" | "added"
): DiffSegment[] {
  // For corrected text, we need to recalculate using a fresh LCS
  // This simplified version uses index-based matching
  const segments: DiffSegment[] = [];

  for (let i = 0; i < words.length; i++) {
    const isCommon = lcsOrigIndices.has(i);
    const type = isCommon ? "equal" : diffType;

    // Merge consecutive segments of the same type
    if (segments.length > 0 && segments[segments.length - 1].type === type) {
      segments[segments.length - 1].text += words[i];
    } else {
      segments.push({ type, text: words[i] });
    }
  }

  return segments;
}

/**
 * Better diff that produces correct segments for both sides
 */
export function computeDiff(
  original: string,
  corrected: string
): { originalSegments: DiffSegment[]; correctedSegments: DiffSegment[] } {
  const origWords = tokenize(original);
  const corrWords = tokenize(corrected);

  const m = origWords.length;
  const n = corrWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origWords[i - 1] === corrWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const ops: Array<
    { type: "equal"; origIdx: number; corrIdx: number } |
    { type: "remove"; origIdx: number } |
    { type: "add"; corrIdx: number }
  > = [];

  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origWords[i - 1] === corrWords[j - 1]) {
      ops.unshift({ type: "equal", origIdx: i - 1, corrIdx: j - 1 });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.unshift({ type: "add", corrIdx: j - 1 });
      j--;
    } else {
      ops.unshift({ type: "remove", origIdx: i - 1 });
      i--;
    }
  }

  const originalSegments: DiffSegment[] = [];
  const correctedSegments: DiffSegment[] = [];

  for (const op of ops) {
    if (op.type === "equal") {
      pushSegment(originalSegments, "equal", origWords[op.origIdx]);
      pushSegment(correctedSegments, "equal", corrWords[op.corrIdx]);
    } else if (op.type === "remove") {
      pushSegment(originalSegments, "removed", origWords[op.origIdx]);
    } else {
      pushSegment(correctedSegments, "added", corrWords[op.corrIdx]);
    }
  }

  return { originalSegments, correctedSegments };
}

function pushSegment(segments: DiffSegment[], type: DiffSegment["type"], text: string) {
  if (segments.length > 0 && segments[segments.length - 1].type === type) {
    segments[segments.length - 1].text += text;
  } else {
    segments.push({ type, text });
  }
}
