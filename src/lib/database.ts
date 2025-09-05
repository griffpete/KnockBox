import { supabase, type VRSession, type Conversation, type UserProgress } from './supabase';

// In-memory storage for development (when Supabase not configured)
const memoryStorage = {
  conversations: new Map<string, Array<Conversation>>(),
  sessions: new Map<string, VRSession>(),
  progress: new Map<string, UserProgress>()
};

// VR Session operations
export async function createVRSession(sessionData: Omit<VRSession, 'id' | 'created_at' | 'updated_at'>) {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    throw new Error('Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  const { data, error } = await supabase
    .from('vr_sessions')
    .insert([sessionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVRSessions(userId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('vr_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function updateVRSession(sessionId: string, updates: Partial<VRSession>) {
  const { data, error } = await supabase
    .from('vr_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Conversation operations
export async function saveConversation(conversationData: Omit<Conversation, 'id' | 'created_at'>) {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    // Use in-memory storage for development
    const conversation: Conversation = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...conversationData,
      created_at: new Date().toISOString()
    };
    
    const sessionId = conversationData.session_id;
    if (!memoryStorage.conversations.has(sessionId)) {
      memoryStorage.conversations.set(sessionId, []);
    }
    
    memoryStorage.conversations.get(sessionId)!.push(conversation);
    console.log(`Conversation saved to memory for session ${sessionId}`);
    return conversation;
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert([conversationData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getConversations(sessionId: string) {
  // Check if Supabase is properly configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    // Use in-memory storage for development
    const conversations = memoryStorage.conversations.get(sessionId) || [];
    console.log(`Retrieved ${conversations.length} conversations from memory for session ${sessionId}`);
    return conversations;
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data;
}

// User Progress operations
export async function getUserProgress(userId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProgress(userId: string, progressData: Partial<UserProgress>) {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      ...progressData,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
