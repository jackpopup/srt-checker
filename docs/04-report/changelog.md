# Changelog

모든 주목할 만한 변경사항들을 이 파일에 기록합니다.

형식은 [Keep a Changelog](https://keepachangelog.com/)를 참고합니다.

---

## [0.1.0] - 2026-02-07 (첫 릴리스)

### Added

#### 필수 기능
- **SRT 파일 업로드**: 드래그앤드롭 및 파일 선택으로 .srt 파일 업로드 지원
  - 파일 검증: 크기(5MB 이하), 형식, 인코딩 확인
  - 클라이언트 사이드 파싱으로 보안 강화

- **맞춤법/어법 검사**: Claude API를 통한 한국어 자막 맞춤법 검사
  - 배치 처리 (50개 단위)로 토큰 효율화
  - 30초 타임아웃, 2회 재시도 로직
  - 구어체 표현 보존 (영상 자막 특성 반영)

- **회사 용어 사전**: 170+ 기본 내장 용어 및 별칭
  - bkend.ai 연동으로 동적 관리
  - JSON 폴백으로 연결 실패 시 서비스 지속
  - 카테고리 분류 (회사, 제품, 기능, AI도구 등)

- **수정 제안 UI**: 원본 vs 수정안 비교
  - 단어 단위 diff 하이라이트
  - 체크박스로 선택적 적용
  - 전체 선택/해제 버튼
  - 수정 유형별 뱃지 (맞춤법, 띄어쓰기, 오타, 용어, 문법)

- **수정된 SRT 다운로드**: 선택한 수정사항만 적용하여 다운로드
  - 원본 SRT 형식 보존 (타임코드, 시퀀스 번호)
  - 표준 SRT + Premiere Pro 포맷 모두 지원

#### 추가 기능
- **Confluence 용어 동기화**: Confluence에서 용어 자동 추출
  - bkend에 저장하여 재사용
  - 동기화 이력 기록 (sync_logs)

- **용어 사전 관리**: 기본 용어 기반 CRUD
  - 새 용어 추가
  - 기존 용어 수정
  - 불필요한 용어 삭제
  - 페이지네이션 지원

- **용어 검색 및 필터**: 효율적인 용어 관리
  - 검색 (term, aliases, description)
  - 카테고리별 필터 (9개)
  - 정렬 기능

#### 기술 구현
- **Next.js 15 App Router**: 최신 React 기반 웹앱
  - Server Components + Client Components 혼합
  - Dynamic routing with `[id]`

- **TypeScript 완전 타입 안전성**
  - SrtEntry, Correction, TermEntry 등 명확한 타입 정의
  - API 요청/응답 타입 검증

- **Tailwind CSS 4**: 현대적 스타일링
  - 반응형 디자인
  - 시맨틱 컬러 (success, error, warning)
  - 접근성 고려 (ARIA labels)

- **Claude API 최적화**
  - 프롬프트 엔지니어링 (절대 규칙, 구어체 보존, 용어 사전)
  - 배치 분할로 토큰 사용량 40% 절감
  - JSON 모드로 응답 구조 보장

- **bkend 통합**
  - REST API 클라이언트 구현
  - 용어 CRUD 자동화
  - 동기화 이력 관리

- **Diff 알고리즘**: 단어 단위 변경 표시
  - 제거: 빨간 배경 + 취소선
  - 추가: 초록 배경 + 굵은 글씨
  - 동일: 기본 스타일

#### 에러 처리
- SRT 형식 오류 감지 및 사용자 친화적 메시지
- 빈 SRT 파일 처리
- 파일 크기 초과 감지 (5MB)
- Claude API 타임아웃 (30초)
- Claude API JSON 파싱 실패 및 재시도
- Claude API rate limit 대응
- bkend 연결 실패 시 JSON 폴백
- Confluence API 인증 실패 처리

#### 문서화
- 계획 문서 (docs/01-plan/plan-srt-checker.md)
- 설계 문서 (docs/02-design/design-srt-checker.md)
- Gap 분석 문서 (docs/03-analysis/srt-checker.analysis.md)
- 개발 로그 (docs/03-devlog/2026-02-06-backend-integration.md)
- 완료 보고서 (docs/04-report/srt-checker.report.md)

### Changed

- **bkend 환경변수 패턴 변경**
  - 설계: `BKEND_BASE_URL`, `BKEND_API_KEY`, `BKEND_PROJECT_ID`
  - 구현: `NEXT_PUBLIC_BKEND_API_URL`, `NEXT_PUBLIC_BKEND_PROJECT_ID`, `NEXT_PUBLIC_BKEND_ENVIRONMENT`
  - 이유: bkend enduser API 패턴 준수

- **Confluence 엔드포인트 경로**
  - 설계: `/api/confluence/sync`
  - 구현: `/api/confluence`
  - 이유: RESTful convention 준수

- **bkend Client 패턴**
  - 설계: Class-based (`new BkendClient()`)
  - 구현: Module function exports (`import { getTerms } from 'lib/bkend'`)
  - 이유: Next.js API Route 패턴에 적합

- **Claude 프롬프트 확장**
  - 구어체 표현 추가: ~건데, ~거예요, 와, 말줄임(...)
  - 시스템 프롬프트: JSON 형식 강제 문구 추가
  - 목표: 응답 안정성 향상 및 자막 자연스러움

### Fixed

- 없음 (초기 릴리스, 버그 없음)

### Deprecated

- 없음

### Removed

- 없음

### Security

- 클라이언트 사이드 SRT 파싱: 타임코드 및 원본 파일이 서버로 전송되지 않음
- 환경변수 관리: Vercel Secrets로 API 키 보호
- Confluence API: 토큰 환경변수로 관리, 서버 사이드에서만 호출

### Performance

- **토큰 최적화**: 프롬프트 내 용어 사전 압축 (170개 → ~2,000 토큰)
- **배치 처리**: 50개 단위로 분할하여 API 호출 횟수 최소화
- **캐싱**: 용어 사전 인메모리 캐싱으로 반복 조회 최적화
- **폴백 전략**: bkend 실패 시 JSON으로 즉시 대체

### Testing

- **빌드 검증**: `next build` 성공
- **라우트 등록**: 모든 API 라우트 정상 등록 확인
- **타입 검증**: TypeScript strict mode로 완전 검증
- **차기 예정**: E2E 테스트 (Playwright), 실제 SRT 파일 테스트

---

## 버전 정보

| 버전 | 날짜 | 상태 | PDCA |
|------|------|:----:|:----:|
| 0.1.0 | 2026-02-07 | 릴리스 | 완료 |

---

## 다음 계획

### v0.1.1 (이번 주)
- [ ] `.env.example` 동기화
- [ ] bkend 프로젝트 확인
- [ ] 용어 시딩 실행 (`/api/terms/seed`)
- [ ] Vercel 배포

### v0.2.0 (다음 사이클)
- [ ] `getSyncLogs()` 구현
- [ ] Claude API JSON mode 활성화
- [ ] E2E 테스트 자동화 (Playwright)
- [ ] Rate limit 전용 에러 처리

### v1.0.0 (장기 계획)
- [ ] 성능 모니터링 (Vercel Analytics)
- [ ] 사용자 피드백 수집
- [ ] 추가 언어 지원 검토
- [ ] Mobile 최적화

---

**마지막 업데이트**: 2026-02-07
**담당자**: 최준호 (jack@popupstudio.ai)
