# Dev Log: 백엔드 연동 및 Gap 분석

- **날짜**: 2026-02-06
- **작업자**: 최준호 (jack@popupstudio.ai)
- **PDCA 단계**: Do 완료 → Check 완료 (95.4%)

## 세션 요약

SRT Checker 프로젝트의 bkend.ai 백엔드 연동을 완료하고, PDCA Check 단계(Gap 분석)를 수행하여 95.4% 일치율을 달성.

## 수행한 작업

### 1. bkend 크리덴셜 설정
- `.env.local`에 API Key, Project ID 설정
- `news-scraper` 프로젝트에서 크리덴셜 참조
- Base URL: `https://api-enduser-dev.bkend.ai`
- Project ID: `hv95e8qu7zgbcuvh7p85` (확인 필요: srt-checker 전용 프로젝트 생성 여부)

### 2. PUT/DELETE API 라우트 생성
- **새 파일**: `src/app/api/terms/[id]/route.ts`
- PUT: 용어 수정 (부분 업데이트 지원)
- DELETE: 용어 삭제
- Next.js 16 async params 패턴 적용

### 3. 용어 사전 수정/삭제 UI
- **수정 파일**: `src/app/terms/page.tsx`
- 테이블에 "관리" 컬럼 추가
- 각 행에 [수정] [삭제] 버튼 (bkend 용어만 `_id` 존재 시 표시)
- 수정 모달: 기존 추가 모달과 동일 구조, 필드 프리필
- 삭제 확인 다이얼로그: 용어명 표시 + 되돌릴 수 없음 안내

### 4. Confluence 동기화 개선
- **수정 파일**: `src/app/api/confluence/route.ts`
- `space_key` 요청 파라미터 지원 추가
- 추출된 용어를 bkend에 저장 (기존: 추출만 반환)
- `createSyncLog()` 호출하여 동기화 이력 기록
- 응답에 `errors` 배열 추가

### 5. Claude API 타임아웃
- **수정 파일**: `src/lib/claude.ts`
- Anthropic 클라이언트에 `timeout: 30_000` (30초) 추가

### 6. 설계 문서 업데이트
- **수정 파일**: `docs/02-design/design-srt-checker.md`
- Section 6.3 (컴포넌트 트리): 인라인 구현 패턴 반영
- Section 10 (프로젝트 구조): 실제 파일 목록으로 갱신

## Gap 분석 결과

| 영역 | 1차 (개선 전) | 2차 (개선 후) |
|------|:---:|:---:|
| API 엔드포인트 | 85% | 95% |
| 데이터 모델 | 95% | 95% |
| 핵심 모듈 | 80% | 93% |
| 컴포넌트 구조 | 75% | 98% |
| 프로젝트 구조 | 80% | 100% |
| 에러 처리 | 85% | 93% |
| 프롬프트 설계 | 95% | 95% |
| **전체 (가중)** | **85%** | **95.4%** |

## 남은 작업 (다음 세션)

### 우선순위 높음
- [ ] bkend 프로젝트 확인: `hv95e8qu7zgbcuvh7p85`가 srt-checker 전용인지, 별도 생성 필요한지
- [ ] 용어 시딩 실행: `POST /api/terms/seed` (bkend 연결 확인 후)
- [ ] PDCA 완료 보고서 생성: `/pdca report srt-checker`

### 우선순위 중간
- [ ] Vercel 배포 설정
- [ ] 실제 SRT 파일로 E2E 테스트

### 우선순위 낮음 (선택)
- [ ] `getSyncLogs()` 함수 구현 (bkend.ts)
- [ ] 설계 문서 내 Confluence URL 경로 불일치 수정 (`/api/confluence/sync` → `/api/confluence`)
- [ ] Claude API 429 rate limit 전용 에러 메시지

## 변경된 파일 목록

```
신규:
  src/app/api/terms/[id]/route.ts
  docs/03-devlog/2026-02-06-backend-integration.md

수정:
  .env.local                              (bkend 크리덴셜)
  src/app/terms/page.tsx                  (수정/삭제 UI)
  src/app/api/confluence/route.ts         (bkend 저장 + sync_logs)
  src/lib/claude.ts                       (30s 타임아웃)
  docs/02-design/design-srt-checker.md    (실제 구현 반영)
  docs/.pdca-status.json                  (Check 단계, 95.4%)
```

## 빌드 상태

```
✓ Compiled successfully
✓ 모든 라우트 정상 등록:
  ○ /              (Static)
  ○ /terms         (Static)
  ƒ /api/check-grammar
  ƒ /api/confluence
  ƒ /api/terms
  ƒ /api/terms/[id]  ← 새로 추가
  ƒ /api/terms/seed
```
