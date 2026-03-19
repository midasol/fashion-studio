# Fashion Studio - Design Document

**Date:** 2026-03-19
**Status:** Approved
**Reference Project:** dd-fashion-studio-pro (doll fashion studio)

## Overview

실제 사람이 원하는 옷이나 스타일을 착장한 모습을 AI로 시뮬레이션하고, 도시 거리를 걷는 스트릿 패션 동영상을 생성하는 웹 앱.

기존 dd-fashion-studio-pro(인형 패션 스튜디오)의 코드를 최대한 재활용하되, 인증/DB를 제거하고 사람 패션에 맞게 수정하는 방식(방식 A)으로 진행.

## Architecture

```
Frontend (React/Vite - Port 3000)
  - 사용자 사진 업로드
  - 옷/스타일 레퍼런스 업로드
  - 패션 프롬프트 입력
  - AI 모델 선택 (이미지/비디오)
  - 결과 이미지/비디오 표시 + 다운로드
  * 인증 없음, DB 없음
        │
        │ HTTP/JSON
        ▼
Backend (Express/TypeScript - Port 8000)
  - POST /api/generate-image
  - POST /api/generate-video
  - GET  /api/video-status/:id
  - GET  /health
  - Rate limiting, CORS, Helmet
  * Firebase/Prisma 제거
        │
        │ API Key (서버 사이드)
        ▼
Google AI Services
  - Nano Banana2 (gemini-3.1-flash-image-preview)
  - Nano Banana Pro (gemini-3-pro-image-preview)
  - Veo 3.1 Fast (veo-3.1-fast-generate-preview)
  - Veo 3.1 (veo-3.1-generate-preview)
```

## User Workflow

1. 앱 접속 (localhost:3000) - 인증 없이 바로 사용
2. 내 전신 사진 업로드 (드래그앤드롭 또는 파일 선택)
3. 스타일 설정: 텍스트 프롬프트 입력 + (선택) 레퍼런스 옷 사진 업로드
4. AI 모델 선택: 이미지 모델 + 비디오 모델
5. "이미지 생성" 클릭 → 스타일 적용된 결과 이미지 확인
6. 결과에서 선택: 이미지 다운로드 / 스트릿 영상 생성 / 다시 생성
7. 비디오 생성 시 → 폴링 진행 상태 표시 → 완료 후 재생 + 다운로드

## API Design

### POST /api/generate-image

Request:
```json
{
  "imageBase64": "사용자 전신 사진",
  "prompt": "캐주얼 데님 스트릿 룩",
  "referenceImageBase64": "레퍼런스 옷 사진 (선택)",
  "model": "gemini-3.1-flash-image-preview | gemini-3-pro-image-preview"
}
```

Response:
```json
{ "success": true, "imageBase64": "...", "mimeType": "image/png" }
```

### POST /api/generate-video

Request:
```json
{
  "imageBase64": "생성된 패션 이미지",
  "prompt": "스트릿 워킹 프롬프트",
  "model": "veo-3.1-fast-generate-preview | veo-3.1-generate-preview"
}
```

Response:
```json
{ "success": true, "operationId": "..." }
```

### GET /api/video-status/:operationId

Response:
```json
{
  "status": "processing | completed | failed",
  "videoBase64": "...",
  "mimeType": "video/mp4"
}
```

## Frontend Components

```
App.tsx
├── Header.tsx              - 앱 타이틀
├── ImageUpload.tsx          - 내 사진 업로드 (드래그앤드롭)
├── StyleInput.tsx           - 프롬프트 입력 + 레퍼런스 이미지 업로드
├── ModelSelector.tsx (신규) - 이미지/비디오 모델 선택
└── ResultView.tsx           - 결과 이미지/비디오 표시 + 다운로드
```

Removed from dd-fashion-studio-pro:
- LoginPage.tsx, AdminPage.tsx, AuthContext.tsx

## AI Prompt Strategy

### Image Generation System Prompt

```
You are a professional fashion stylist and image editor.
The user has provided their photo. Apply the requested fashion style
to this person while preserving their face, body shape, and proportions.
The result should look like a natural, realistic photo of the person
wearing the described outfit. Maintain the original background or
place them in a clean, neutral setting.
```

With reference image:
```
The user has also provided a reference image of the clothing/style
they want. Match the clothing style, colors, and overall aesthetic
from the reference image as closely as possible.
```

### Video Generation Prompt Template

```
A person wearing [사용자 스타일] walking naturally down a trendy urban street.
Cinematic street fashion video style. Natural daylight, shallow depth of field.
The person walks confidently toward the camera with a relaxed, natural gait.
City atmosphere with blurred background.
```

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- @google/genai (최신 버전)
- zod (요청 검증)
- cors, helmet, express-rate-limit
- tsx (개발 서버)

### Frontend
- React 18 + TypeScript
- Vite
- Lucide React (아이콘)
- TailwindCSS

### Root
- concurrently (프론트+백엔드 동시 실행)

## Project Structure

```
fashion-studio/
├── package.json              # concurrently로 동시 실행
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts
│       ├── config.ts
│       ├── types.ts
│       ├── routes/
│       │   ├── image.ts
│       │   └── video.ts
│       └── services/
│           └── gemini.ts
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── .env.example
│   └── src/
│       ├── index.tsx
│       ├── App.tsx
│       ├── types.ts
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── ImageUpload.tsx
│       │   ├── StyleInput.tsx
│       │   ├── ModelSelector.tsx
│       │   └── ResultView.tsx
│       ├── services/
│       │   └── apiService.ts
│       └── utils/
│           └── imageUtils.ts
└── docs/
    └── plans/
```

## Execution

```bash
npm install          # 루트 + 프론트엔드 + 백엔드 의존성 설치
npm run dev          # concurrently로 동시 실행 (3000 + 8000)
```

## Decisions

- 인증 없음: Firebase OAuth, 허용목록, Admin 패널 모두 제거
- DB 없음: PostgreSQL, Prisma 모두 제거
- 저장 없음: 생성 결과는 화면 표시 + 다운로드만 제공
- 배포 없음: 로컬 개발 전용 (Cloud Run 배포 스크립트 제거)
- 모델 선택: 사용자가 이미지/비디오 모델을 각각 선택 가능
- @google/genai: 최신 버전 사용
