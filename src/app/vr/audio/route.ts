import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { saveConversation, getConversations } from "@/lib/database";
import { generateChatbotResponse } from "@/lib/chatbot";

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
      `VR Audio Processing: ${audioFile.name}, size: ${audioFile.size} bytes, session: ${sessionId}`
    );

     // 🔹 Step 1: Transcribe + fetch conversation history in parallel
     const arrayBuffer = await audioFile.arrayBuffer();
     const buffer = Buffer.from(arrayBuffer);
     const audioBlob = new File([buffer], audioFile.name, { type: audioFile.type });

     const [transcription, conversations] = await Promise.all([
       openai.audio.transcriptions.create({
         file: audioBlob,
         model: 'whisper-1',
         language: 'en',
         response_format: 'text'
       }),
       getConversations(sessionId).catch((err) => {
         console.warn("Conversation fetch failed:", err);
         return [];
       }),
     ]);

    const userMessage = transcription;
    console.log("Transcription successful:", userMessage);

    // Convert conversations to OpenAI chat format
    const conversationHistory = conversations.flatMap((conv) => [
      { role: "user" as const, content: conv.message },
      { role: "assistant" as const, content: conv.response },
    ]);

    // 🔹 Step 2: Generate AI response
    const aiResponseData = await generateChatbotResponse({
      message: userMessage,
      sessionId,
      userId,
      conversationHistory,
    });
    const aiResponse = aiResponseData.message;
    console.log("AI Response:", aiResponse);

     // 🔹 Step 3: Convert response to speech
     const speech = await openai.audio.speech.create({
       model: 'tts-1',
       voice: 'alloy',
       input: aiResponse,
       response_format: 'mp3'  // MP3 format only
     });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    console.log(
      "TTS generation successful, MP3 size:",
      audioBuffer.length,
      "bytes"
    );

    // 🔹 Step 4: Save to DB (fire & forget)
    saveConversation({
      session_id: sessionId,
      user_id: userId,
      message: userMessage,
      response: aiResponse,
      timestamp: aiResponseData.timestamp,
    }).catch((err) => console.error("DB save error:", err));

    // 🔹 Step 5: Return MP3 audio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Content-Disposition": 'inline; filename="ai_response.mp3"',
        "X-Transcript": encodeURIComponent(userMessage),
        "X-AI-Response": encodeURIComponent(aiResponse),
      },
    });
  } catch (error: unknown) {
    console.error("VR Audio Processing error:", error);

    if (error instanceof Error) {
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
    }

    return NextResponse.json(
      { error: "VR audio processing failed. Please try again." },
      { status: 500 }
    );
  }
}
