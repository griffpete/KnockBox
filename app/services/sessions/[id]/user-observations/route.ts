import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON } from '@/lib/api-helpers';

const Item = z.object({
  speaker: z.enum(['user','avatar','system']),
  text: z.string().min(1),
  startedAtMs: z.number().int().nonnegative().default(0),
  endedAtMs: z.number().int().nonnegative().default(0),
  confidence: z.number().min(0).max(1).optional(),
  extra: z.record(z.any()).optional()
});
const Body = z.object({ items: z.array(Item).min(1) });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;         
  const { sb } = await getUserAndClient(req);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const rows = parsed.data.items.map(i => ({
    session_id: id,
    speaker: i.speaker,
    text: i.text,
    started_at_ms: i.startedAtMs,
    ended_at_ms: i.endedAtMs,
    confidence: i.confidence ?? null,
    extra: i.extra ?? {}
  }));

  const { error } = await sb.from('user_observations').insert(rows);
  if (error) return badRequestJSON(error.message);
  return okJSON({ ok: true });
}
