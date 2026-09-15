/** Shared secret for the admin→hub demo bridge (server-to-server only). */
export function bridgeSecret(): string | null {
  const configured = process.env.INTERNAL_BRIDGE_SECRET;
  if (configured) return configured;
  // Demo default keeps the two-dev-server loop working out of the box.
  // Production (USE_PRISMA=true) has no default — the bridge must be
  // explicitly configured or it never validates.
  if (process.env.USE_PRISMA !== 'true') return 'demo-bridge-dev-only';
  return null;
}

export function isBridgeRequest(request: Request): boolean {
  const expected = bridgeSecret();
  if (!expected) return false;
  return request.headers.get('x-mojo-bridge') === expected;
}
