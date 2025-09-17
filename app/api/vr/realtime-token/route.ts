import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sessionId, userId, voice = "alloy" } = body;

    // Validate required fields
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, userId" },
        { status: 400 }
      );
    }

    console.log(`🔑 Generating ephemeral token for VR session: ${sessionId}, user: ${userId}`);

    // Generate ephemeral token for OpenAI Realtime API
    const sessionResponse = await openai.beta.realtime.sessions.create({
      model: "gpt-4o-realtime-preview",
      voice: voice,
      instructions: `You are a CUSTOMER who just opened your door to a door-to-door salesperson.

CRITICAL INSTRUCTIONS:
- You are the CUSTOMER, NOT the salesperson
- The person talking to you is trying to sell you something
- You respond as a customer would - with questions, objections, or interest
- You NEVER pitch products or act like a salesperson
- You are always the person who opened the door

CUSTOMER RESPONSES (examples):
- "Oh, hi. What is this about?"
- "I'm not really interested right now"
- "How much does it cost?"
- "I need to think about it"
- "Do you have any references?"
- "I'm busy right now, can you come back later?"

Keep responses natural, conversational, and under 20 words. Be realistic and human-like.`,
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      turn_detection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 200
      },
      tools: [],
      tool_choice: "auto",
      temperature: 0.8,
      max_response_output_tokens: 4096
    });

    // Extract the ephemeral token from the response
    const ephemeralToken = sessionResponse.client_secret;

    if (!ephemeralToken) {
      throw new Error("Failed to generate ephemeral token");
    }

    console.log(`✅ Generated ephemeral token for session: ${sessionId}`);

    // Return the ephemeral token and connection details
    return NextResponse.json({
      success: true,
      ephemeralToken,
      sessionId,
      userId,
      connectionDetails: {
        url: "https://api.openai.com/v1/realtime",
        model: "gpt-4o-realtime-preview",
        voice: voice,
        inputAudioFormat: "pcm16",
        outputAudioFormat: "pcm16",
        dataChannelName: "oai-events"
      },
      expiresAt: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Realtime token generation error:', error);
    
    // Handle specific OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded" },
          { status: 429 }
        );
      }
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { error: "Invalid OpenAI API key" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate ephemeral token" },
      { status: 500 }
    );
  }
}

// GET endpoint to check token status (optional)
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

  return NextResponse.json({
    message: "Use POST to generate ephemeral tokens for OpenAI Realtime API",
    sessionId,
    userId,
    timestamp: new Date().toISOString()
  });
}
