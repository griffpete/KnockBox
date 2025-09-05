# Knock Box API Server

Pure backend API server for Knock Box - a VR door-to-door training application.

## Overview

This Next.js API-only server provides:
- **VR Chatbot Communication** - Handles AI conversations during VR training sessions
- **Progress Tracking** - Manages user progress data for the React Native app
- **Session Management** - Tracks VR training sessions and scenarios
- **Supabase Integration** - Database operations for all application data

**Pure API Server** - No frontend UI, optimized for backend services only.

## API Endpoints

### Root
- `GET /` - API server information and available endpoints

### Health Check
- `GET /api/health` - Server health status

### VR Chatbot
- `POST /api/vr/chatbot` - Send message to AI chatbot
- `GET /api/vr/chatbot?sessionId=xxx&userId=xxx` - Get conversation history

### Progress Tracking
- `GET /api/progress?userId=xxx` - Get user progress
- `POST /api/progress` - Save session data and update progress

### Session Management
- `GET /api/sessions?userId=xxx&limit=10` - Get user sessions
- `POST /api/sessions` - Create new VR session

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   CHATBOT_API_KEY=your_chatbot_api_key
   CHATBOT_API_URL=your_chatbot_service_url
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

The API will be available at `http://localhost:3000/api`

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
