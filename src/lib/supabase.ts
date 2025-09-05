import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (you'll need to generate these from your Supabase schema)
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface VRSession {
  id: string;
  user_id: string;
  scenario_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'completed' | 'abandoned';
  start_time: string;
  end_time?: string;
  score?: number;
  time_spent?: number;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  user_id: string;
  message: string;
  response: string;
  timestamp: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  total_sessions: number;
  completed_scenarios: number;
  average_score: number;
  current_level: number;
  total_time_spent: number;
  achievements: string[];
  last_session_date?: string;
  created_at: string;
  updated_at: string;
}
