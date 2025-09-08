import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserAndClient, okJSON, badRequestJSON, unauthorizedJSON } from '@/lib/api-helpers';

const Schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  config: z.record(z.any()).default({}),
  orgId: z.string().uuid().nullable().optional()
});

export async function POST(req: NextRequest) {
  const { user, sb, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return unauthorizedJSON();

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const { data, error } = await sb.from('scenarios').insert({
    owner_id: user.id,
    org_id: parsed.data.orgId ?? null,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    config: parsed.data.config
  }).select('*').single();

  if (error) return badRequestJSON(error.message);
  return okJSON({ scenario: data }, 201);
}

export async function GET(req: NextRequest) {
  const { sb } = await getUserAndClient(req);
  const { data, error } = await sb.from('scenarios').select('*').order('created_at', { ascending: false });
  if (error) return badRequestJSON(error.message);
  return okJSON({ scenarios: data ?? [] });
}
