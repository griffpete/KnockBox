import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON, unauthorizedJSON } from '@/lib/api-helpers';

const Schema = z.object({
  name: z.string().min(2),
  difficulty: z.number().int().min(1).max(5).default(1),
  config: z.record(z.any()).default({}),
  orgId: z.string().uuid().nullable().optional()
});

export async function POST(req: NextRequest) {
  const { user, sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return unauthorizedJSON();

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const { data, error } = await sb.from('ai_personas').insert({
    owner_id: user.id,
    org_id: parsed.data.orgId ?? null,
    name: parsed.data.name,
    difficulty: parsed.data.difficulty,
    config: parsed.data.config
  }).select('*').single();

  if (error) return badRequestJSON(error.message);
  return okJSON({ aiPersona: data }, 201);
}

export async function GET(req: NextRequest) {
  const { sb } = await getUserAndClient(req);
  const { data, error } = await sb.from('ai_personas').select('*').order('created_at', { ascending: false });
  if (error) return badRequestJSON(error.message);
  return okJSON({ aiPersonas: data ?? [] });
}
