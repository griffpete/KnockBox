import { NextRequest, NextResponse } from 'next/server';
import { saveConversation, getConversations } from '@/lib/database';
import { generateChatbotResponse } from '@/lib/chatbot';

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

    // Get conversation history for context
    let conversationHistory;
    try {
      const conversations = await getConversations(sessionId);
      conversationHistory = conversations.map(conv => ({
        role: 'user' as const,
        content: conv.message,
      })).concat(conversations.map(conv => ({
        role: 'assistant' as const,
        content: conv.response,
      })));
    } catch (error) {
      console.warn('Could not fetch conversation history:', error);
      conversationHistory = [];
    }

    // Generate AI response using OpenAI
    const response = await generateChatbotResponse({
      message,
      sessionId,
      userId,
      conversationHistory,
    });

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
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('OpenAI API key not configured')) {
        return NextResponse.json(
          { error: 'AI service not configured. Please contact administrator.' },
          { status: 503 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'AI service quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again later.' },
      { status: 503 }
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
