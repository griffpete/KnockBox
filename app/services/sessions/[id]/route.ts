import { NextRequest } from 'next/server';
import { getUserAndClient, okJSON, notFoundJSON } from '@/lib/api-helpers';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } 
) {
  const { id: sid } = await ctx.params;     
  const { sb } = await getUserAndClient(req);

  const { data: session, error: sErr } = await sb
    .from('sessions')
    .select('*')
    .eq('id', sid)
    .single();

  if (sErr || !session) return notFoundJSON();

  const [{ data: obs }, { data: scores }, { data: report }] = await Promise.all([
    sb.from('user_observations')
      .select('*')
      .eq('session_id', sid)
      .order('started_at_ms', { ascending: true }),
    sb.from('scores').select('*').eq('session_id', sid),
    sb.from('reports').select('*').eq('session_id', sid).maybeSingle()
  ]);

  return okJSON({ session, observations: obs ?? [], scores: scores ?? [], report });
}
