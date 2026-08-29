import { WeakPasswordError } from '@mojo/identity/application';
import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';

export async function POST(request: NextRequest) {
  const hub = getHub();

  let user: { id: string; role: 'admin' | 'tutor' | 'student' } | null = null;
  const token = request.cookies.get('mojo_user')?.value;
  if (token) {
    const found = await hub.identity.userByToken(token);
    if (found) {
      user = { id: found.id, role: found.role };
    }
  }

  const body = await request.json().catch(() => ({}));
  const subjects = Array.isArray(body.subjects)
    ? body.subjects.filter((s: unknown): s is string => typeof s === 'string')
    : [];
  const bio = typeof body.bio === 'string' ? body.bio : '';
  const introVideoUrl = typeof body.introVideoUrl === 'string' ? body.introVideoUrl : '';
  const certifications = Array.isArray(body.certifications)
    ? body.certifications.filter((c: unknown): c is string => typeof c === 'string')
    : [];

  if (subjects.length === 0 || bio.trim().length < 30) {
    return NextResponse.json(
      { ok: false, error: 'Add at least one subject and a short intro of 30+ characters.' },
      { status: 422 },
    );
  }

  if (user?.role === 'tutor') {
    const existing = await hub.profile.byTutor(user.id);
    if (existing) {
      return NextResponse.json({ ok: false, error: 'You are already a tutor.' }, { status: 409 });
    }
  }

  let tutorId: string;
  let accountCreated = false;
  let email = '';

  if (user) {
    tutorId = user.id;
  } else {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Tell us your name, email and a password so we can create your account.',
        },
        { status: 400 },
      );
    }
    const timezone = typeof body.timezone === 'string' ? body.timezone : 'Africa/Lagos';
    const locale = typeof body.locale === 'string' ? body.locale : 'en-NG';
    try {
      const registered = await hub.identity.register({
        name,
        email,
        password,
        timezone,
        locale,
        role: 'tutor',
      });
      tutorId = registered.id;
      accountCreated = true;
    } catch (error) {
      if (error instanceof WeakPasswordError) {
        return NextResponse.json(
          { ok: false, error: `Password too weak. ${error.reasons.join(' ')}` },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: error instanceof Error ? error.message : 'Could not create your account.',
        },
        { status: 409 },
      );
    }
  }

  const nowIso = new Date().toISOString();
  const application = {
    id: crypto.randomUUID(),
    tutorId,
    subjects,
    bio,
    introVideoUrl,
    certifications: certifications.slice(0, 12),
    status: 'pending' as const,
    submittedAt: nowIso,
  };

  try {
    await hub.profile.submitApplication(application, nowIso);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Could not submit application.',
      },
      { status: 409 },
    );
  }

  if (accountCreated) {
    const { token: sessionToken, role } = await hub.identity.authenticate(
      email,
      body.password as string,
    );
    const response = NextResponse.json(
      { ok: true, applicationId: application.id, createdAccount: true },
      { status: 201 },
    );
    response.cookies.set('mojo_user', sessionToken, { httpOnly: true, sameSite: 'lax', path: '/' });
    response.cookies.set('mojo_role', role, { httpOnly: true, sameSite: 'lax', path: '/' });
    return response;
  }

  return NextResponse.json(
    { ok: true, applicationId: application.id, createdAccount: false },
    { status: 201 },
  );
}
