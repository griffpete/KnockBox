import { NextRequest, NextResponse } from 'next/server';
import { getVRSessions, createVRSession } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing required parameter: userId' },
      { status: 400 }
    );
  }

  try {
    // Fetch user sessions from Supabase
    const sessions = await getVRSessions(userId, limit);
    
    const response = {
      userId,
      sessions,
      totalCount: sessions.length,
      limit,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scenarioId, difficulty } = body;

    // Validate required fields
    if (!userId || !scenarioId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, scenarioId' },
        { status: 400 }
      );
    }

    // Create new VR session in Supabase
    const sessionData = {
      user_id: userId,
      scenario_id: scenarioId,
      difficulty: (difficulty || 'medium') as 'easy' | 'medium' | 'hard',
      status: 'active' as 'active' | 'completed' | 'abandoned',
      start_time: new Date().toISOString()
    };

    const session = await createVRSession(sessionData);

    return NextResponse.json({
      success: true,
      session,
      message: 'VR session created successfully'
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
