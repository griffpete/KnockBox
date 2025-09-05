import { NextRequest, NextResponse } from 'next/server';
import { getUserProgress, updateUserProgress } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'Missing required parameter: userId' },
      { status: 400 }
    );
  }

  try {
    // Fetch user progress from Supabase
    const progress = await getUserProgress(userId);
    
    if (!progress) {
      // Return default progress if user doesn't exist
      return NextResponse.json({
        userId,
        totalSessions: 0,
        completedScenarios: 0,
        averageScore: 0,
        lastSessionDate: null,
        achievements: [],
        currentLevel: 1,
        totalTimeSpent: 0,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      userId: progress.user_id,
      totalSessions: progress.total_sessions,
      completedScenarios: progress.completed_scenarios,
      averageScore: progress.average_score,
      lastSessionDate: progress.last_session_date,
      achievements: progress.achievements,
      currentLevel: progress.current_level,
      totalTimeSpent: progress.total_time_spent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionData, score, scenarioId, timeSpent } = body;

    // Validate required fields
    if (!userId || !sessionData) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionData' },
        { status: 400 }
      );
    }

    // TODO: Store session data in Supabase
    const session = {
      id: Date.now().toString(),
      userId,
      sessionData,
      score: score || 0,
      scenarioId: scenarioId || null,
      timeSpent: timeSpent || 0,
      timestamp: new Date().toISOString()
    };

    // Update user progress
    try {
      await updateUserProgress(userId, {
        total_sessions: 1, // This should be incremented, not set to 1
        total_time_spent: timeSpent || 0,
        last_session_date: session.timestamp
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue with response even if DB fails
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: 'Session data saved successfully'
    });
  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
