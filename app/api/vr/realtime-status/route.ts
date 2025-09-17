import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');

  if (!sessionId || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters: sessionId, userId" },
      { status: 400 }
    );
  }

  // This endpoint can be used to check the status of a realtime session
  // In a production environment, you might want to track active sessions
  // in your database or cache
  
  return NextResponse.json({
    status: 'ready',
    sessionId,
    userId,
    message: "Realtime API integration is available",
    timestamp: new Date().toISOString(),
    instructions: {
      step1: "Call POST /vr/realtime-token to get ephemeral token",
      step2: "Use token to establish WebRTC connection to OpenAI Realtime API",
      step3: "Send audio via WebRTC data channel 'oai-events'",
      step4: "Receive real-time audio responses"
    }
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { sessionId, userId, action } = body;

  if (!sessionId || !userId) {
    return NextResponse.json(
      { error: "Missing required fields: sessionId, userId" },
      { status: 400 }
    );
  }

  // Handle different actions for realtime session management
  switch (action) {
    case 'start':
      return NextResponse.json({
        status: 'started',
        sessionId,
        userId,
        message: "Realtime session started",
        timestamp: new Date().toISOString()
      });
    
    case 'end':
      return NextResponse.json({
        status: 'ended',
        sessionId,
        userId,
        message: "Realtime session ended",
        timestamp: new Date().toISOString()
      });
    
    default:
      return NextResponse.json({
        error: "Invalid action. Use 'start' or 'end'",
        validActions: ['start', 'end']
      }, { status: 400 });
  }
}
