import { NextRequest, NextResponse } from 'next/server';
import { saveConversation, getConversations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    // Validate required fields
    if (!message || !sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, sessionId, userId' },
        { status: 400 }
      );
    }

    // TODO: Integrate with AI chatbot service
    // For now, return a mock response
    const response = {
      id: Date.now().toString(),
      message: `AI Response to: "${message}"`,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      type: 'chatbot_response'
    };

    // Store conversation in Supabase
    try {
      await saveConversation({
        session_id: sessionId,
        user_id: userId,
        message,
        response: response.message,
        timestamp: response.timestamp
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with response even if DB fails
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');

  if (!sessionId || !userId) {
    return NextResponse.json(
      { error: 'Missing required parameters: sessionId, userId' },
      { status: 400 }
    );
  }

  try {
    // Fetch conversation history from Supabase
    const conversations = await getConversations(sessionId);
    
    const conversation = {
      sessionId,
      userId,
      messages: conversations,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
