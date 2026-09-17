import { NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { requireRole } from '../../../lib/session';

/** The student's saved cards (last-4 + rail only — never full numbers). */
export async function GET() {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }
  const methods = await getHub().billing.methods(user.id);
  return NextResponse.json({
    ok: true,
    methods: methods.map((m) => ({
      id: m.id,
      rail: m.rail,
      last4: m.last4,
      isDefault: m.isDefault,
    })),
  });
}

/** Attaches the demo stub card (demo mode only — otherwise a real rail intent belongs here). */
export async function POST() {
  const user = await requireRole('student');
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Student sign-in required.' }, { status: 401 });
  }
  try {
    const method = await getHub().billing.provisionDemoMethod(user.id);
    return NextResponse.json(
      {
        ok: true,
        method: {
          id: method.id,
          rail: method.rail,
          last4: method.last4,
          isDefault: method.isDefault,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not add card.' },
      { status: 409 },
    );
  }
}
