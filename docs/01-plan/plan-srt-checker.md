# Plan: SRT 한글 맞춤법 검사 서비스

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | SRT Checker - 영상 자막 한글 맞춤법 검사기 |
| **목적** | Premiere Pro SRT 자막 파일의 한글 맞춤법/어법을 검사하고, 사용자가 선택적으로 수정한 뒤 다시 다운로드할 수 있는 웹 서비스 |
| **사용자** | POPUP STUDIO AI 내부 영상 편집팀 (다수 컴퓨터에서 접근) |
| **인증** | 없음 (로그인 불필요) |

## 2. 핵심 요구사항

### 2.1 필수 기능 (MVP)

#### F1. SRT 파일 업로드
- 웹 브라우저에서 .srt 파일을 드래그&드롭 또는 파일 선택으로 업로드
- 파일 파싱: 시퀀스 번호, 타임코드, 대사 텍스트 분리

#### F2. 맞춤법/어법 검사 (Claude API)
- Claude API로 대사 텍스트만 맞춤법 검사
- **타임코드, 시퀀스 번호, SRT 형식은 절대 수정하지 않음**
- 대사 내용의 맞춤법, 띄어쓰기, 오타만 교정
- 문맥을 해치지 않는 선에서 수정
- **구어적 표현은 허용** (영상 자막 특성 반영)

#### F3. 회사 용어 사전 (120개+ 기본 내장)
- POPUP STUDIO 제품명: `popupstudio`, `bkit`, `bkend`, `bkamp`
- 바이브 코딩 생태계 용어, AI 도구/개념, 개발 용어, 플랫폼명 등 포괄
- 유사 단어 뭉치(aliases)가 나오면 정식 용어로 보정
  - 예: "비킷" → "bkit", "비켄드" → "bkend", "앤스로픽" → "Anthropic" 등
- 각 용어에 뜻(description) 포함 → 서비스 내에서 용어 사전 열람 가능
- JSON 기반 용어 사전 (기본 120개 내장, `terminology-dictionary.json`)
- Confluence API 연동으로 수동 용어 갱신 (사용자가 버튼 클릭 시)

#### F4. 수정 제안 UI
- 원본 vs 수정안을 diff 형태로 표시
- 각 수정 항목에 체크박스: 사용자가 선택적으로 적용/거부
- 전체 선택/해제 기능

#### F5. 수정된 SRT 다운로드
- 사용자가 체크한 수정사항만 적용
- 원본 SRT와 동일한 형식(타임코드, 시퀀스 번호 보존)으로 다운로드

### 2.2 추가 기능

#### F6. Confluence 용어 동기화
- Atlassian Confluence REST API 연동
- 사용자가 버튼을 눌러 수동으로 용어를 가져옴
- 가져온 용어는 bkend에 저장하여 재사용

## 3. 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| **Frontend** | Next.js 15 (App Router) | Vercel 배포 최적화, React 기반 |
| **Backend/DB** | bkend.ai | 용어 사전 저장, API 프록시 |
| **맞춤법 엔진** | Anthropic Claude API | 한국어 맞춤법 + 구어체 판별 + 회사 용어 인식 |
| **배포** | Vercel | 간편 배포, 다수 컴퓨터 접근 |
| **스타일** | Tailwind CSS | 빠른 UI 개발 |

## 4. 시스템 아키텍처

```
[Browser]
    │
    ├── SRT 파일 업로드 (클라이언트 파싱)
    │
    ├── POST /api/check-grammar
    │       │
    │       ├── bkend → 용어 사전 조회
    │       │
    │       └── Claude API → 맞춤법 검사
    │               (프롬프트에 용어 사전 포함)
    │
    ├── 사용자 리뷰 & 체크
    │
    └── SRT 재조립 & 다운로드 (클라이언트)
```

### 4.1 데이터 흐름

1. 사용자가 .srt 파일 업로드
2. 클라이언트에서 SRT 파싱 → 시퀀스/타임코드/텍스트 분리
3. 텍스트만 서버(API Route)로 전송
4. 서버에서 bkend로부터 용어 사전 조회
5. Claude API에 텍스트 + 용어 사전 + 프롬프트 전달
6. 응답을 줄 단위로 diff 생성
7. 클라이언트에서 diff UI 표시
8. 사용자가 수정사항 선택
9. 선택된 수정사항 적용 → SRT 재조립 → 다운로드

## 5. Claude API 프롬프트 설계 (핵심)

```
당신은 한국어 영상 자막 맞춤법 교정 전문가입니다.

## 규칙
1. 타임코드(숫자)와 SRT 형식은 절대 건드리지 않습니다.
2. 오직 '대사 내용'의 맞춤법, 띄어쓰기, 오타만 자연스럽게 교정합니다.
3. 문맥을 해치지 않는 선에서 수정합니다.
4. 영상 자막이므로 구어적 표현(~거든요, ~잖아, ~인데 등)은 허용합니다.
5. 다음 회사 용어 사전에 있는 단어와 유사한 표현은 사전의 표기를 따릅니다:
   {용어 사전 JSON}

## 출력 형식
각 줄에 대해 수정이 필요한 경우만 JSON 배열로 반환:
[
  {
    "line": 줄번호,
    "original": "원본 텍스트",
    "corrected": "수정된 텍스트",
    "reason": "수정 이유"
  }
]
수정이 필요 없으면 빈 배열 []을 반환합니다.
```

## 6. 데이터 모델 (bkend)

### 6.1 용어 사전 (terminology)
```json
{
  "term": "bkit",
  "aliases": ["비킷", "비kit", "b킷", "bKit"],
  "category": "product",
  "description": "바이브 코딩 키트"
}
```

### 6.2 Confluence 동기화 로그 (sync_logs)
```json
{
  "synced_at": "2026-02-04T12:00:00Z",
  "terms_count": 25,
  "source": "confluence"
}
```

## 7. 화면 설계

### 7.1 메인 페이지 (/)
- 헤더: "SRT Checker" 로고
- 파일 업로드 영역 (드래그&드롭)
- [검사 시작] 버튼

### 7.2 검사 결과 페이지
- 좌: 원본 / 우: 수정안 (diff 뷰)
- 각 수정 항목에 체크박스
- 상단: [전체 선택] [전체 해제] 버튼
- 하단: [수정 적용 & 다운로드] 버튼

### 7.3 용어 사전 페이지 (/terms)
- 카테고리별 용어 목록 표시 (회사/제품/기능/바이브코딩/AI도구/개발개념/플랫폼/커뮤니티/인물)
- 각 용어의 정식 표기, 대체 표기(aliases), 설명(description) 열람
- 검색 기능 (용어명/별칭/설명 검색)
- [Confluence에서 가져오기] 버튼 (수동 트리거)
- 수동 용어 추가/편집/삭제

## 8. 비기능 요구사항

| 항목 | 요구사항 |
|------|----------|
| 인증 | 없음 (공개 접근) |
| 호환성 | Chrome, Edge, Safari 최신 버전 |
| 파일 크기 | SRT 파일 최대 5MB |
| 응답 시간 | Claude API 호출 포함 30초 이내 |
| 다국어 | 한국어 UI |

## 9. 프로젝트 구조

```
srt-checker/
├── docs/
│   ├── 01-plan/
│   └── 02-design/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 (업로드)
│   │   ├── result/page.tsx       # 검사 결과
│   │   ├── terms/page.tsx        # 용어 관리
│   │   └── api/
│   │       ├── check-grammar/route.ts
│   │       ├── terms/route.ts
│   │       └── confluence/route.ts
│   ├── lib/
│   │   ├── srt-parser.ts         # SRT 파싱/조립
│   │   ├── claude.ts             # Claude API 클라이언트
│   │   ├── bkend.ts              # bkend 클라이언트
│   │   └── terminology.ts        # 용어 사전 로직
│   └── components/
│       ├── FileUploader.tsx
│       ├── DiffViewer.tsx
│       ├── CorrectionItem.tsx
│       └── TermManager.tsx
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 10. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Claude API 비용 | 대량 SRT 파일 시 비용 증가 | 텍스트만 전송, 배치 처리로 토큰 최적화 |
| Claude API 응답 불안정 | JSON 파싱 실패 가능 | 재시도 로직 + 응답 검증 |
| SRT 형식 다양성 | Premiere Pro 외 도구의 SRT 호환 | 표준 SRT 스펙 준수 파서 구현 |
| Confluence API 인증 | API 토큰 관리 필요 | 환경변수로 관리, 서버사이드에서만 호출 |

## 11. PDCA 다음 단계

- [ ] **Design**: 상세 API 설계, 컴포넌트 설계, 프롬프트 최적화
- [ ] **Do**: 구현 (Phase 1~6)
- [ ] **Check**: Gap Analysis
- [ ] **Act**: 개선 및 배포
