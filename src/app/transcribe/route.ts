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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI
    const audioBlob = new File([buffer], audioFile.name, { type: audioFile.type });

    console.log(`Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

    // Transcribe using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
      response_format: 'text'
    });

    console.log('Transcription successful:', transcription);

    return NextResponse.json({
      transcript: transcription,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Transcription error:', error);
    
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
      { error: 'Transcription failed. Please try again.' },
      { status: 500 }
    );
  }
}
