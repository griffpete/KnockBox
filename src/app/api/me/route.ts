import { NextRequest } from 'next/server';
import { getUserAndClient, unauthorizedJSON, okJSON } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  const { user, unauthorized } = await getUserAndClient(req);
  if (unauthorized) return unauthorizedJSON();
  return okJSON({ user });
}
