import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    service: 'oVRide API Server',
    description: 'Backend for VR Door-to-Door Training Application',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      aiChatbot: 'POST /vr/chatbot',
      progress: 'GET /progress',
      sessions: 'GET /sessions',
      vrAudio: 'POST /vr/audio'
    },
    documentation: 'See README.md for detailed API documentation'
  });
}
