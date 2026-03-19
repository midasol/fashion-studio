# Fashion Studio

AI-powered fashion simulation app. Upload your full-body photo, describe a style or provide clothing reference images, and get a realistic styled image. Generate street fashion walking videos from the result.

## Features

- **AI Fashion Styling** — Apply any fashion style to your photo while preserving your face and body proportions
- **Reference Image Support** — Upload up to 5 clothing reference images for more accurate style matching
- **Street Fashion Video** — Generate cinematic walking videos from your styled image (9:16 vertical format)
- **Model Selection** — Choose between fast and high-quality AI models for both image and video generation
- **Download** — Save generated images and videos directly to your device

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **AI**: Google Gemini (image generation) + Veo (video generation) via `@google/genai` SDK

## Available AI Models

### Image Generation
| Model ID | Display Name |
|---|---|
| `gemini-3.1-flash-image-preview` | Nano Banana2 (Fast) |
| `gemini-3-pro-image-preview` | Nano Banana Pro (High Quality) |

### Video Generation
| Model ID | Display Name |
|---|---|
| `veo-3.1-fast-generate-preview` | Veo 3.1 Fast |
| `veo-3.1-generate-preview` | Veo 3.1 (High Quality) |

## Setup

### Prerequisites

- Node.js 18+
- Google AI Studio API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Install all dependencies (root, backend, frontend)
npm run install:all
```

### Configuration

```bash
# Copy the example env file
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your API key:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Run

```bash
npm run dev
```

This starts both the backend (port 8000) and frontend (port 3000) simultaneously.

Open http://localhost:3000 in your browser.

## Project Structure

```
fashion-studio/
├── backend/
│   └── src/
│       ├── index.ts            # Express server entry point
│       ├── config.ts           # Settings, model definitions
│       ├── types.ts            # Zod request validation schemas
│       ├── routes/
│       │   ├── image.ts        # POST /api/generate-image
│       │   └── video.ts        # POST /api/generate-video, GET /api/video-status/:id
│       └── services/
│           └── gemini.ts       # Gemini & Veo API integration
├── frontend/
│   └── src/
│       ├── App.tsx             # Main application component
│       ├── types.ts            # Model type definitions
│       ├── services/
│       │   └── apiService.ts   # Backend API client
│       ├── utils/
│       │   └── imageUtils.ts   # Base64/file conversion utilities
│       └── components/
│           ├── Header.tsx       # App header
│           ├── ImageUpload.tsx  # Photo & reference image upload (drag-drop, paste)
│           ├── StyleInput.tsx   # Style prompt input
│           ├── ModelSelector.tsx # AI model selection dropdowns
│           └── ResultView.tsx   # Generated image/video display & download
└── package.json                # Root scripts (dev, install:all, build)
```

## Usage

1. Upload your full-body photo
2. (Optional) Upload clothing reference images
3. Select AI models for image and video generation
4. Describe the style you want (e.g., "minimalist Korean street fashion with oversized blazer")
5. Click **Generate** to create the styled image
6. Click **Generate Street Video** to create a walking video from the result
7. Download the image or video

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate-image` | Generate a styled image |
| POST | `/api/generate-video` | Start video generation (returns operationId) |
| GET | `/api/video-status/:id` | Poll video generation status |

## License

Private project.
