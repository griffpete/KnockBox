// app/api/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseFromToken } from '@/lib/userClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const Body = z.object({ name: z.string().min(2) });

export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const sb = supabaseFromToken(token);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: userData, error: authErr } = await sb.auth.getUser();
  if (authErr || !userData?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1) Create the org as the caller (RLS applies)
  const { data: org, error: orgErr } = await sb
    .from('organizations')
    .insert({ name: parsed.data.name, created_by: userData.user.id })
    .select('*')
    .single();
  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 400 });

  // 2) Seed the first membership as OWNER via admin client (bypasses RLS)
  const admin = supabaseAdmin();
  const { error: memErr } = await admin
    .from('memberships')
    .upsert({ org_id: org.id, user_id: userData.user.id, role: 'owner' });
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

  return NextResponse.json({ org }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const sb = supabaseFromToken(token);

  const { data, error } = await sb
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ organizations: data ?? [] });
}
