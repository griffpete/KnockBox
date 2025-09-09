import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseFromToken } from '@/lib/userClient';

const UpsertBody = z.object({
  userId: z.string().uuid(),
  role: z.enum(['member','manager','owner'])
});

// POST /api/orgs/:orgId/memberships  → add/update a member
export async function POST(req: NextRequest, { params }: { params: { orgId: string }}) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const sb = supabaseFromToken(token);

  const parsed = UpsertBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { error } = await sb.from('memberships').upsert({
    org_id: params.orgId,
    user_id: parsed.data.userId,
    role: parsed.data.role
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/orgs/:orgId/memberships?userId=UUID  → remove member
export async function DELETE(req: NextRequest, { params }: { params: { orgId: string }}) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const sb = supabaseFromToken(token);

  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const { error } = await sb.from('memberships')
    .delete()
    .eq('org_id', params.orgId)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
