import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { saveConversation, getConversations } from '@/lib/database';
import { generateChatbotResponse } from '@/lib/chatbot';

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('sessionId') as string || 'vr-session-1';
    const userId = formData.get('userId') as string || 'vr-user-1';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log(`VR Audio Processing: ${audioFile.name}, size: ${audioFile.size} bytes, session: ${sessionId}`);

    // Step 1: Transcribe audio to text
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBlob = new File([buffer], audioFile.name, { type: audioFile.type });

    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });

    console.log('Transcription successful:', transcription);

    // Step 2: Get conversation history for context
    let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    try {
      const conversations = await getConversations(sessionId);
      conversationHistory = conversations.flatMap(conv => [
        {
          role: 'user' as const,
          content: conv.message,
        },
        {
          role: 'assistant' as const,
          content: conv.response,
        }
      ]);
    } catch (error) {
      console.warn('Could not fetch conversation history:', error);
      conversationHistory = [];
    }

    // Step 3: Generate AI response using existing chatbot logic
    const aiResponseData = await generateChatbotResponse({
      message: transcription,
      sessionId,
      userId,
      conversationHistory,
    });

    const aiResponse = aiResponseData.message;

    console.log('AI Response generated:', aiResponse);

    // Step 4: Convert AI response to speech
    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: aiResponse,
      response_format: 'wav'  // Changed to WAV format for VR compatibility
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    console.log('TTS generation successful, buffer size:', audioBuffer.length);

    // Step 5: Save conversation to memory/database
    try {
      await saveConversation({
        session_id: sessionId,
        user_id: userId,
        message: transcription,
        response: aiResponse,
        timestamp: aiResponseData.timestamp
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with response even if DB fails
    }

    // Step 6: Return the audio response
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Content-Disposition': 'attachment; filename="ai_response.wav"',
        'X-Transcript': transcription,
        'X-AI-Response': aiResponse
      }
    });

  } catch (error) {
    console.error('VR Audio Processing error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('file_size_exceeded')) {
        return NextResponse.json(
          { error: 'Audio file too large. Please use a smaller file.' },
          { status: 413 }
        );
      }
    }

    return NextResponse.json(
      { error: 'VR audio processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
