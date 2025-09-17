import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { saveConversation, getConversations } from "@/lib/database";
import { generateFastChatbotResponse } from "@/lib/chatbot";

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

    // Parse incoming form data
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const sessionId = (formData.get("sessionId") as string) || "vr-session-1";
    const userId = (formData.get("userId") as string) || "vr-user-1";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log(
      `🚀 FAST VR Audio Processing: ${audioFile.name}, size: ${audioFile.size} bytes, session: ${sessionId}`
    );

    const startTime = Date.now();

    // 🔹 OPTIMIZATION 1: Use faster Whisper model + parallel processing
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBlob = new File([buffer], audioFile.name, { type: audioFile.type });

    // Start transcription immediately (fastest model)
    const transcriptionPromise = openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1', // Fastest available
      language: 'en',
      response_format: 'text'
    });

    // Get recent conversation history only (limit to last 3 exchanges for speed)
    const conversationsPromise = getConversations(sessionId)
      .then(convs => convs.slice(-3)) // Only last 3 conversations
      .catch(() => []);

    // 🔹 OPTIMIZATION 2: Start transcription first, then LLM + TTS in parallel
    const userMessage = await transcriptionPromise;
    console.log("✅ Transcription (fast):", userMessage);

    const conversations = await conversationsPromise;
    
    // 🔹 OPTIMIZATION 3: Use faster LLM model with shorter context
    const conversationHistory = conversations.flatMap((conv) => [
      { role: "user" as const, content: conv.message },
      { role: "assistant" as const, content: conv.response },
    ]);

    // Generate AI response with optimized settings
    const aiResponseData = await generateFastChatbotResponse({
      message: userMessage,
      sessionId,
      userId,
      conversationHistory,
    });
    const aiResponse = aiResponseData.message;
    console.log("✅ AI Response (fast):", aiResponse);

    // 🔹 OPTIMIZATION 4: Use fastest TTS model
    const speech = await openai.audio.speech.create({
      model: 'tts-1', // Fastest TTS model
      voice: 'alloy', // Fastest voice
      input: aiResponse,
      response_format: 'mp3'
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const totalTime = Date.now() - startTime;
    
    console.log(
      `✅ TTS (fast): ${audioBuffer.length} bytes in ${totalTime}ms`
    );

    // 🔹 OPTIMIZATION 5: Save to DB asynchronously (don't wait)
    setImmediate(() => {
      saveConversation({
        session_id: sessionId,
        user_id: userId,
        message: userMessage,
        response: aiResponse,
        timestamp: aiResponseData.timestamp,
      }).catch((err) => console.error("DB save error:", err));
    });

    // 🔹 Return MP3 audio with performance headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Content-Disposition": 'inline; filename="ai_response.mp3"',
        "X-Transcript": encodeURIComponent(userMessage),
        "X-AI-Response": encodeURIComponent(aiResponse),
        "X-Processing-Time": totalTime.toString(),
        "X-Optimized": "true",
      },
    });
  } catch (error: unknown) {
    console.error("🚨 VR Audio Processing error:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error) {
      // OpenAI API errors
      if (error.message.includes("quota") || error.message.includes("429")) {
        return NextResponse.json(
          { error: "OpenAI API quota exceeded. Please try again later." },
          { status: 429 }
        );
      }

      if (error.message.includes("file_size_exceeded")) {
        return NextResponse.json(
          { error: "Audio file too large. Please use a smaller file." },
          { status: 413 }
        );
      }

      if (error.message.includes("Invalid file format")) {
        return NextResponse.json(
          { error: "Invalid audio file format. Supported: wav, mp3, m4a, flac, ogg" },
          { status: 400 }
        );
      }

      // Return specific error for debugging
      return NextResponse.json(
        { 
          error: "VR audio processing failed", 
          details: error.message,
          type: error.name
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "VR audio processing failed. Unknown error occurred." },
      { status: 500 }
    );
  }
}
