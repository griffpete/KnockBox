# Knock Box API Server

Pure backend API server for Knock Box - a VR door-to-door training application.

## Overview

This Next.js API-only server provides:
- **AI Chatbot Communication** - Handles OpenAI-powered conversations during VR training sessions
- **Audio Processing** - Speech-to-text transcription and text-to-speech conversion
- **Progress Tracking** - Manages user progress data for the React Native app
- **Session Management** - Tracks VR training sessions and scenarios
- **Supabase Integration** - Database operations for all application data

**Pure API Server** - No frontend UI, optimized for backend services only.

## API Endpoints

### Root
- `GET /` - API server information and available endpoints

### Health Check
- `GET /health` - Server health status

### AI Chatbot
- `POST /vr/chatbot` - Send message to OpenAI-powered chatbot
- `GET /vr/chatbot?sessionId=xxx&userId=xxx` - Get conversation history

### Audio Processing
- `POST /transcribe` - Convert audio file to text using OpenAI Whisper
- `POST /text-to-speech` - Convert text to speech using OpenAI TTS

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

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
