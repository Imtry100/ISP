# Video Interview Platform

A professional pre-selection interview application where users can view questions, record their answers via webcam, and have videos automatically uploaded to the backend.

## 📁 Project Structure

```
video-interview-platform/
├── backend/
│   ├── server.js           # Express server entry (starts watcher)
│   ├── app.js              # Express app + routes
│   ├── package.json        # Backend dependencies
│   ├── db/                 # PostgreSQL access helpers
│   ├── migrations/         # SQL migrations
│   ├── routes/             # API routes (upload, sessions, questions)
│   ├── services/           # Transcription + LLM + pipeline + watcher
│   ├── middleware/         # Upload, CORS, error handling
│   └── uploads/            # Uploaded videos + evaluations (auto-created)
│
├── frontend/
│   ├── public/
│   │   └── vite.svg        # Vite logo
│   ├── src/
│   │   ├── App.jsx         # Main React component with video recording logic
│   │   ├── main.jsx        # React entry point
│   │   └── index.css       # Tailwind CSS + custom styles
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── postcss.config.js   # PostCSS configuration
│
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL 14+ (required for evaluations + session JSON)
- Python 3.10+ (optional, only if using WhisperX script)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create backend/.env):
   ```bash
   # OpenRouter key for LLM evaluation
   OPENROUTER_API_KEY=sk-...

   # PostgreSQL connection (URL-encode special chars like @ -> %40)
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/video_interview

   # One of the transcription backends:
   # Option A: OpenAI Whisper API
   # OPENAI_API_KEY=sk-...

   # Option B: WhisperX script
   # WHISPERX_SCRIPT_PATH=D:\IS Project\After_video\whisper_pipeline.py

   # Option C: whisper-node (requires ffmpeg)
   # USE_WHISPER_NODE=true
   ```

4. Run migrations:
   ```bash
   npm run migrate
   npm run migrate:eval
   ```

5. Start the server:
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

The backend server will run on `http://localhost:5000`

### Where LLM Evaluation JSON is Saved

- Database: `session_videos.evaluation_json`
- File: `backend/uploads/evaluations/session_<sessionId>.json` (updates per new video)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will open automatically at `http://localhost:5173`

## 🎨 Design Features

### Professional Corporate UI
- **Color Palette**: Clean whites, slate grays, and trusted blue accents
- **Typography**: Inter font family for modern, professional look
- **Minimalist Design**: Distraction-free interface focused on the interview

### Video Overlay System
- Full-screen webcam feed as the main view
- Semi-transparent question card overlaying the video (bottom section)
- Glassmorphism effect for modern appearance
- Recording indicator with live timer

## 🔧 Technical Features

### Frontend (React + Vite + Tailwind)
- **MediaRecorder API** for browser-based video recording
- **Axios** for API communication with upload progress tracking
- **Responsive Design** - works on desktop and mobile
- **State Management** using React hooks

### Backend (Node.js + Express + Multer)
- **RESTful API** endpoint for video uploads
- **Multer** middleware for handling multipart form data
- **Unique Filenames** with timestamps to prevent conflicts
- **CORS** enabled for cross-origin requests
- **File Validation** - only WebM/MP4 videos accepted

## 📝 API Endpoints

### `POST /upload`
Upload a video recording

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `video`: Video file (WebM/MP4)
  - `questionId`: Question identifier
  - `questionText`: The question being answered

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully",
  "data": {
    "filename": "interview-2026-01-28T10-30-00-000Z-123456789.webm",
    "size": 5242880,
    "path": "/uploads/...",
    "questionId": "1",
    "uploadedAt": "2026-01-28T10:30:00.000Z"
  }
}
```

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🎯 Interview Flow

1. User grants camera/microphone permissions
2. Question appears as an overlay on the video feed
3. User clicks "Start Recording" to begin
4. Recording indicator shows live timer
5. User clicks "Stop Recording" when finished
6. User can "Retake" or "Submit Answer"
7. Video is automatically uploaded to the backend
8. Next question appears (or interview completes)

## 📋 Interview Questions

The platform includes 5 sample interview questions:
1. Tell us about yourself and your professional background
2. What motivated you to apply for this position?
3. Describe a challenging project you've worked on
4. Where do you see yourself in 5 years?
5. Do you have any questions for us?

Questions can be easily customized in `App.jsx`.

## 🔒 Security Considerations

- Videos are stored locally on the server
- File type validation prevents malicious uploads
- Maximum file size limit (500MB) prevents storage issues
- CORS configured for specific origins only

## 📦 Production Deployment

### Frontend
```bash
cd frontend
npm run build
```
The built files will be in the `dist/` directory.

### Backend
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use a process manager like PM2
- Consider cloud storage (S3, GCS) for video files

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for your own interviews!
