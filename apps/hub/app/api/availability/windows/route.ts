import { NextResponse } from 'next/server';
import { getHub } from '../../../../demo/composition-root';
import { requireUser } from '../../../../lib/session';

/**
 * A tutor's weekly availability windows plus booking constraints, so move
 * pickers can steer students toward valid slots before the engine says no.
 */
export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  const tutorId = new URL(request.url).searchParams.get('tutorId') ?? '';
  if (!tutorId) {
    return NextResponse.json({ ok: false, error: 'tutorId is required.' }, { status: 400 });
  }
  const hub = getHub();
  const [rules, settings] = await Promise.all([
    hub.scheduling.availabilityRules(tutorId),
    hub.scheduling.settings(tutorId),
  ]);
  return NextResponse.json({
    ok: true,
    windows: rules.map((rule) => ({
      weekday: rule.weekday,
      startMinute: rule.startMinute,
      endMinute: rule.endMinute,
    })),
    bufferMinutes: settings.bufferMinutes,
    minimumNoticeMinutes: settings.minimumNoticeMinutes,
    paused: settings.pausedForNewBookings,
  });
}
