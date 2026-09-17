import { getHub } from '../demo/composition-root';
import { isBridgeRequest } from './bridge';

/**
 * Guards the cron/worker endpoints. Accepts, in order:
 * - `Authorization: Bearer $CRON_SECRET` (Vercel cron / any scheduler),
 * - the admin→hub demo bridge,
 * - a signed-in hub admin.
 * Everything else gets a 401.
 */
export async function authorizeWorker(
  request: Request,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const denied = () => ({
    ok: false as const,
    response: Response.json(
      { ok: false, error: 'Worker authorization required.' },
      { status: 401 },
    ),
  });
  const configured = process.env.CRON_SECRET;
  if (configured) {
    const header = request.headers.get('authorization') ?? '';
    if (header === `Bearer ${configured}`) return { ok: true };
  }
  if (isBridgeRequest(request)) return { ok: true };
  const hub = getHub();
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)mojo_user=([^;]+)/)?.[1];
  const cookieToken = token ? decodeURIComponent(token) : null;
  const user = cookieToken ? await hub.identity.userByToken(cookieToken) : null;
  if (user?.role === 'admin') return { ok: true };
  return denied();
}
