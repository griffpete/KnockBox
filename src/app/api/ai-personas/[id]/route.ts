import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserAndClient } from '@/lib/api-helpers';

const PatchBody = z.object({
  name: z.string().min(2).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  config: z.record(z.any()).optional(),
  orgId: z.string().uuid().nullable().optional()
});

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const { data, error } = await sb.from('ai_personas').select('*').eq('id', id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ aiPersona: data });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const update: any = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.difficulty !== undefined) update.difficulty = parsed.data.difficulty;
  if (parsed.data.config !== undefined) update.config = parsed.data.config;
  if (parsed.data.orgId !== undefined) update.org_id = parsed.data.orgId;

  // RLS: only owner can update
  const { data, error } = await sb.from('ai_personas').update(update).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ aiPersona: data });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  // RLS: only owner can delete
  const { error } = await sb.from('ai_personas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
