import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON, unauthorizedJSON } from '@/lib/api-helpers';

const Body = z.object({
  orgId: z.string().uuid().nullable().optional(),
  aiPersonaId: z.string().uuid().nullable().optional(),
  scenarioId: z.string().uuid().nullable().optional(),
  meta: z.record(z.any()).default({})
});

export async function POST(req: NextRequest) {
  const { user, sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return unauthorizedJSON();

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const { data, error } = await sb.from('sessions').insert({
    user_id: user.id,
    org_id: parsed.data.orgId ?? null,
    ai_persona_id: parsed.data.aiPersonaId ?? null,
    scenario_id: parsed.data.scenarioId ?? null,
    meta: parsed.data.meta
  }).select('*').single();

  if (error) return badRequestJSON(error.message);
  return okJSON({ session: data }, 201);
}
