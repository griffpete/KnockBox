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
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    if (text.length > 4096) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 4096 characters.' },
        { status: 400 }
      );
    }

    console.log(`Converting text to speech: "${text.substring(0, 100)}..."`);

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1', // Use tts-1 for faster generation, tts-1-hd for higher quality
      voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      response_format: 'mp3'
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());

    console.log('TTS generation successful, buffer size:', buffer.length);

    // Return the audio file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': 'inline; filename="response.mp3"'
      }
    });

  } catch (error) {
    console.error('TTS error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Text-to-speech conversion failed. Please try again.' },
      { status: 500 }
    );
  }
}
