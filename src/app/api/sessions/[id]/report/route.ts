import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON } from '@/lib/api-helpers';

const Body = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  areasToImprove: z.array(z.string()).default([]),
  drills: z.array(z.any()).default([])
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } 
) {
  const { id } = await ctx.params;         
  const { sb } = await getUserAndClient(req);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const { error } = await sb.from('reports').upsert(
    {
      session_id: id,
      summary: parsed.data.summary,
      strengths: parsed.data.strengths,
      areas_to_improve: parsed.data.areasToImprove,
      drills: parsed.data.drills
    },
    { onConflict: 'session_id' }
  );

  if (error) return badRequestJSON(error.message);
  return okJSON({ ok: true });
}
