import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Knock Box API Server',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
