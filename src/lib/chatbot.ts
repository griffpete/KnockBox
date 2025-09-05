import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is provided)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// System prompt for VR door-to-door training
const SYSTEM_PROMPT = `You are an AI assistant for VR door-to-door sales training. Your role is to simulate realistic customer interactions to help salespeople practice their skills.

Guidelines:
- Respond as a realistic customer would
- Vary your personality and responses (friendly, skeptical, busy, interested, etc.)
- Ask realistic questions about products/services
- Provide objections that salespeople commonly face
- Keep responses conversational and natural
- Don't break character or mention you're an AI
- Respond in 1-3 sentences typically

Scenarios you might encounter:
- Product demonstrations
- Price negotiations
- Objection handling
- Closing techniques
- Building rapport

Remember: You're helping someone practice real-world sales skills in a safe VR environment.`;

export interface ChatbotRequest {
  message: string;
  sessionId: string;
  userId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatbotResponse {
  id: string;
  message: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  type: 'chatbot_response';
  tokensUsed?: number;
}

export async function generateChatbotResponse(request: ChatbotRequest): Promise<ChatbotResponse> {
  // Ensure OpenAI is configured
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  // Build conversation history for context
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT,
    },
  ];

  // Add conversation history if provided
  if (request.conversationHistory) {
    request.conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: request.message,
  });

  // Generate response using OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', // Cost-effective model
    messages,
    max_tokens: 150, // Keep responses concise
    temperature: 0.8, // Add some randomness for variety
    presence_penalty: 0.6, // Encourage topic variety
  });

  const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I didn\'t understand that. Could you please repeat?';

  return {
    id: Date.now().toString(),
    message: aiResponse,
    sessionId: request.sessionId,
    userId: request.userId,
    timestamp: new Date().toISOString(),
    type: 'chatbot_response',
    tokensUsed: completion.usage?.total_tokens,
  };
}

