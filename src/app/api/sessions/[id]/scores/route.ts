import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON } from '@/lib/api-helpers';

const Item = z.object({
  rubricKey: z.string().min(1),
  value: z.number().min(0).max(1),
  rationale: z.string().optional()
});
const Body = z.object({ scores: z.array(Item).min(1) });

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } 
) {
  const { id } = await ctx.params;          
  const { sb } = await getUserAndClient(req);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const rows = parsed.data.scores.map(s => ({
    session_id: id,
    rubric_key: s.rubricKey,
    value: s.value,
    rationale: s.rationale ?? null
  }));

  const { error } = await sb.from('scores').upsert(rows, { onConflict: 'session_id,rubric_key' });
  if (error) return badRequestJSON(error.message);
  return okJSON({ ok: true });
}
