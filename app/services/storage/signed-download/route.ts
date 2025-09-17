import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { okJSON, badRequestJSON } from '@/lib/api-helpers';

const Body = z.object({
  bucket: z.enum(['session-audio','reports']),
  path: z.string(),                 
  expiresIn: z.number().int().positive().max(3600).default(600)
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return badRequestJSON(parsed.error.flatten());

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage
    .from(parsed.data.bucket)
    .createSignedUrl(parsed.data.path, parsed.data.expiresIn);

  if (error) return badRequestJSON(error.message);
  return okJSON({ url: data.signedUrl });
}
