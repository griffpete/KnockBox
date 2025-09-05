import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    service: 'Knock Box API Server',
    description: 'Backend for VR Door-to-Door Training Application',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      chatbot: 'POST /vr/chatbot',
      progress: 'GET /progress',
      sessions: 'GET /sessions'
    },
    documentation: 'See README.md for detailed API documentation'
  });
}
