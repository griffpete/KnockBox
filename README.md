# Knock Box API Server

Pure backend API server for Knock Box - a VR door-to-door training application.

## Overview

This Next.js API-only server provides:
- **VR Audio Processing** - Complete audio workflow for VR door-to-door training
- **AI Chatbot Communication** - OpenAI-powered customer simulation during VR sessions
- **Progress Tracking** - Manages user progress data for the VR application
- **Session Management** - Tracks VR training sessions and scenarios
- **Supabase Integration** - Database operations for all application data

**Pure API Server** - Optimized for VR integration with audio-in/audio-out workflow.

## API Endpoints

### Root
- `GET /` - API server information and available endpoints

### Health Check
- `GET /health` - Server health status

### VR Audio Processing (Primary Endpoint)
- `POST /vr/audio` - Complete VR audio workflow (audio in → audio out)
  - **Input:** Audio file (.wav, .mp3) + sessionId + userId
  - **Output:** AI-generated audio response (.mp3 format)
  - **Process:** Transcribe → AI Response → Text-to-Speech (OPTIMIZED FOR SPEED)
  - **Headers:** X-Transcript, X-AI-Response, X-Processing-Time, X-Optimized (for debugging)

### AI Chatbot (Alternative Text Interface)
- `POST /vr/chatbot` - Send text message to OpenAI-powered chatbot
- `GET /vr/chatbot?sessionId=xxx&userId=xxx` - Get conversation history

### OpenAI Realtime API Integration
- `POST /vr/realtime-token` - Generate ephemeral token for VR realtime communication
- `GET /vr/realtime-status?sessionId=xxx&userId=xxx` - Check realtime session status
- `POST /vr/realtime-status` - Manage realtime session lifecycle

### Progress Tracking
- `GET /progress?userId=xxx` - Get user progress
- `POST /progress` - Save session data and update progress

### Session Management
- `GET /sessions?userId=xxx&limit=10` - Get user sessions
- `POST /sessions` - Create new VR session

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file with:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenAI Configuration (REQUIRED for AI chatbot)
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Set up Supabase database:**
   Create the following tables in your Supabase project:
   - `vr_sessions` - VR training sessions
   - `conversations` - Chatbot conversations
   - `user_progress` - User progress tracking

4. **Run the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## Database Schema

### vr_sessions
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `scenario_id` (string)
- `difficulty` (enum: easy, medium, hard)
- `status` (enum: active, completed, abandoned)
- `start_time` (timestamp)
- `end_time` (timestamp, nullable)
- `score` (integer, nullable)
- `time_spent` (integer, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### conversations
- `id` (uuid, primary key)
- `session_id` (uuid, foreign key)
- `user_id` (uuid, foreign key)
- `message` (text)
- `response` (text)
- `timestamp` (timestamp)
- `created_at` (timestamp)

### user_progress
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `total_sessions` (integer)
- `completed_scenarios` (integer)
- `average_score` (float)
- `current_level` (integer)
- `total_time_spent` (integer)
- `achievements` (json array)
- `last_session_date` (timestamp, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Architecture

- **Next.js App Router** - Modern API routing structure
- **TypeScript** - Type safety throughout the application
- **Supabase** - Database and real-time features
- **Pure API Server** - No frontend dependencies, optimized for backend
- **ESLint** - Code quality and consistency

## VR Integration

### Primary VR Endpoint
Use `POST /vr/audio` for the complete audio workflow:

### Realtime VR Integration
For real-time voice interaction, use the OpenAI Realtime API:

1. **Get Ephemeral Token:**
   ```bash
   POST /vr/realtime-token
   {
     "sessionId": "vr-session-1",
     "userId": "user-123",
     "voice": "alloy"  // optional: alloy, echo, fable, onyx, nova, shimmer
   }
   ```

2. **Establish WebRTC Connection:**
   - URL: `https://api.openai.com/v1/realtime`
   - Use the ephemeral token from step 1
   - Create data channel named `oai-events`
   - Send audio in PCM16 format

3. **Real-time Communication:**
   - Send audio via WebRTC data channel
   - Receive real-time AI responses
   - Automatic turn detection and interruption handling

```bash
curl -X POST https://your-api.vercel.app/vr/audio \
  -F "audio=@user_speech.wav" \
  -F "sessionId=vr-session-123" \
  -F "userId=user-456"
```

**Response:** Audio file (.mp3 format) with AI customer response

### Workflow
1. **VR System** records user speech
2. **POST /vr/audio** processes the audio (OPTIMIZED):
   - 🎤 Transcribes speech to text (Whisper-1, fastest model)
   - 🤖 Generates AI customer response (GPT-3.5, 50 tokens max, short context)
   - 🔊 Converts response to speech (TTS-1, fastest voice)
   - 💾 Saves conversation history (asynchronous, non-blocking)
3. **VR System** receives audio response and plays it

**Single API Call** - No need for multiple endpoints!

### Performance Optimizations
- **Parallel Processing**: Transcription and conversation history fetch in parallel
- **Limited Context**: Only last 3 conversations (6 messages) for faster LLM processing
- **Short Responses**: Max 50 tokens for natural, quick customer reactions
- **Fast Models**: Whisper-1 + GPT-3.5-turbo + TTS-1 (all fastest available)
- **Async DB**: Database saves don't block response
- **Performance Monitoring**: Built-in timing headers for debugging

### Session Management
- Use consistent `sessionId` for conversation continuity
- Use consistent `userId` for progress tracking
- Conversation history is maintained automatically

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
