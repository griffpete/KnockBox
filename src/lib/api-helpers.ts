// Keeps routes clean by grabbing the bearer token and returning JSON responses

import { NextRequest, NextResponse } from 'next/server';
import { supabaseFromToken } from './userClient';

export function getBearerToken(req: NextRequest) {
  return (req.headers.get('authorization') || '').replace('Bearer ', '');
}

export async function getUserAndClient(req: NextRequest) {
  const token = getBearerToken(req);
  const sb = supabaseFromToken(token);
  const { data, error } = await sb.auth.getUser();
  if (error || !data?.user) {
    return { user: null as any, sb, unauthorized: true as const };
  }
  return { user: data.user, sb, unauthorized: false as const };
}

export function okJSON(payload: any, status = 200) {
  return NextResponse.json(payload, { status });
}
export function badRequestJSON(message: any) {
  return NextResponse.json({ error: message }, { status: 400 });
}
export function unauthorizedJSON() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
export function notFoundJSON(msg = 'Not found or unauthorized') {
  return NextResponse.json({ error: msg }, { status: 404 });
}
