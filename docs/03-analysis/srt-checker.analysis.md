# Gap Analysis: SRT Checker

> **Date**: 2026-02-07
> **Feature**: srt-checker
> **Design Doc**: `docs/02-design/design-srt-checker.md`
> **Overall Match Rate**: 91%

---

## 1. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| API Design (2.1~2.6) | 95% | PASS |
| Data Model (3.1~3.2) | 90% | PASS |
| Core Modules (4.1~4.4) | 93% | PASS |
| Claude Prompt (5.1~5.3) | 92% | PASS |
| Components (6.1~6.5) | 95% | PASS |
| Terms Page (7.1) | 95% | PASS |
| Environment Variables (8) | 75% | WARNING |
| Error Handling (9) | 90% | PASS |
| Project Structure (10) | 97% | PASS |
| **Overall** | **91%** | **PASS** |

---

## 2. Missing Features (설계 O, 구현 X)

| # | Item | Design Location | Impact |
|---|------|-----------------|--------|
| 1 | `getSyncLogs()` | Section 4.4 bkend Client | Low |
| 2 | 마지막 동기화 시간 표시 | Section 7.1 용어 사전 페이지 | Low |
| 3 | Rate limit 전용 에러 메시지 | Section 9 에러 처리 | Low |

## 3. Changed Features (설계 != 구현)

| # | Item | Design | Implementation | Impact |
|---|------|--------|----------------|--------|
| 1 | Confluence endpoint URL | `/api/confluence/sync` | `/api/confluence` | Low |
| 2 | bkend 환경변수 | `BKEND_BASE_URL`, `BKEND_API_KEY`, `BKEND_PROJECT_ID` | `NEXT_PUBLIC_BKEND_API_URL`, `NEXT_PUBLIC_BKEND_PROJECT_ID`, `NEXT_PUBLIC_BKEND_ENVIRONMENT` | Medium |
| 3 | bkend client 패턴 | Class-based (`BkendClient`) | Module function exports | Low |
| 4 | CRUD in terminology.ts | `createTerm/updateTerm/deleteTerm` 래핑 | API route에서 bkend 직접 호출 | Low |
| 5 | .env.example 내용 | 설계서 Section 8 일치 | bkend 관련 변수가 구 패턴 그대로 | Medium |

## 4. Added Features (설계 X, 구현 O)

| # | Item | Description | Impact |
|---|------|-------------|--------|
| 1 | `SrtFile.format: SrtFormat` | Premiere Pro 포맷 감지 및 보존 | Positive |
| 2 | `computeDiff()` 개선 함수 | 양쪽 세그먼트를 정확하게 생성하는 개선 diff | Positive |
| 3 | `invalidateCache()` | 용어 캐시 수동 무효화 | Positive |
| 4 | System prompt JSON 강제 문구 | "반드시 JSON 형식으로만 응답하세요." | Positive |
| 5 | 프롬프트 구어체 확장 | ~건데, ~거예요, 와, 말줄임(...) 추가 | Positive |

## 5. Recommended Actions

### 즉시 조치 (Priority)

| # | Action | Files |
|---|--------|-------|
| 1 | `.env.example` 파일을 실제 코드에서 사용하는 환경변수와 동기화 | `.env.example` |
| 2 | 설계 문서 Section 8 환경변수 명세를 enduser API 패턴에 맞게 업데이트 | `docs/02-design/design-srt-checker.md` |

### 설계 문서 업데이트 (선택)

| # | Section | Update |
|---|---------|--------|
| 1 | Section 2.6 | Confluence endpoint URL 변경 반영 |
| 2 | Section 4.4 | bkend Client: Class → Module 함수 패턴 |
| 3 | Section 8 | `NEXT_PUBLIC_BKEND_*` 환경변수 패턴 반영 |
| 4 | SrtFile 타입 | `format: SrtFormat` 필드 추가 |
| 5 | Section 5.2 | 프롬프트 규칙 1 제거, 구어체 확장 반영 |

### 선택적 개선

| # | Item | Description |
|---|------|-------------|
| 1 | `getSyncLogs()` 구현 | 마지막 동기화 시간 표시 활성화 |
| 2 | Rate limit 전용 에러 핸들링 | Claude API 429 응답 시 별도 메시지 |
| 3 | Claude JSON mode 활성화 | API structured output 기능 활용 검토 |

---

## 6. Conclusion

Match Rate **91%** — 설계와 구현이 잘 일치한다.

주요 차이는 bkend enduser API 패턴 리팩터링으로 인한 **의도적 변경**이며, `.env.example` 파일과 설계 문서 Section 8의 환경변수 명세 동기화가 가장 시급한 항목이다.

나머지 차이는 구현 과정에서의 합리적 개선(Premiere Pro 포맷 지원, diff 알고리즘 개선, 프롬프트 구어체 확장 등)이다.
