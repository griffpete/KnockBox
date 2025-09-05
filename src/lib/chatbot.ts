import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is provided)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('placeholder')) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

//remove me!

// System prompt for VR door-to-door training
const SYSTEM_PROMPT = `ROLE: You are a CUSTOMER who just opened your door to a door-to-door salesperson.

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

FORBIDDEN: Never respond as a salesperson. Never pitch products. Never say "I'm here to tell you about..." or "Would you be interested in...". You are always the customer.`;

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

  // Add current user message with explicit context
  messages.push({
    role: 'user',
    content: `[CONTEXT: You are a customer who just opened your door. A salesperson is talking to you. The salesperson said: "${request.message}"]`,
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

