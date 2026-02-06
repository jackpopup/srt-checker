# SRT Checker

Premiere Pro SRT 자막 파일의 한글 맞춤법/어법을 검사하는 웹 서비스.

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + Tailwind CSS
- **Backend/DB**: bkend.ai (용어 사전 저장)
- **맞춤법 엔진**: Anthropic Claude API
- **배포**: Vercel

## Project Structure
- `src/app/` - Next.js pages and API routes
- `src/lib/` - Core libraries (srt-parser, claude, bkend, terminology, diff)
- `src/components/` - React components (upload, result, terms, layout)
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks
- `docs/` - PDCA documents (plan, design)

## Key Design Decisions
- SRT parsing happens client-side (no file upload to server)
- Only text content is sent to API (timecodes never leave the browser)
- Claude API is called in batches of 50 subtitles
- Terminology dictionary (170+ terms) is loaded from bkend with fallback to built-in JSON
- Colloquial Korean expressions are preserved (subtitle-specific)

## Conventions
- Korean UI text
- Tailwind CSS for styling (no CSS modules)
- Server components by default, "use client" only when needed
