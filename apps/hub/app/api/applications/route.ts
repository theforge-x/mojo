import { NextResponse } from 'next/server';
import { currentUser } from '../../../lib/session';
import { getHub } from '../../../demo/composition-root';

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Sign-in required.' }, { status: 401 });
  }
  if (user.role === 'tutor') {
    return NextResponse.json({ ok: false, error: 'You are already a tutor.' }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const subjects = Array.isArray(body.subjects) ? body.subjects.filter((s: unknown): s is string => typeof s === 'string') : [];
  const bio = typeof body.bio === 'string' ? body.bio : '';

  const nowIso = new Date().toISOString();
  const application = {
    id: crypto.randomUUID(),
    tutorId: user.id,
    subjects,
    bio,
    introVideoUrl: '',
    certifications: [],
    status: 'pending' as const,
    submittedAt: nowIso,
  };

  try {
    await getHub().profile.submitApplication(application, nowIso);
    return NextResponse.json({ ok: true, applicationId: application.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Could not submit application.' },
      { status: 409 },
    );
  }
}