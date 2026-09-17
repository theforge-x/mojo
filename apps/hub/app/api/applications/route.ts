import { WeakPasswordError } from '@mojo/identity/application';
import type { Weekday } from '@mojo/scheduling/domain';
import { isValidTimezone } from '@mojo/shared/util';
import type { AvailabilityWindow } from '@mojo/tutor-profile/domain';
import { type NextRequest, NextResponse } from 'next/server';
import { getHub } from '../../../demo/composition-root';
import { isBridgeRequest } from '../../../lib/bridge';
import { sessionCookieOptions } from '../../../lib/session';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Estimates the upload weight of a photo URL. `data:` URLs carry the bytes
 * inline (base64 ≈ 4/3 overhead); remote URLs are measured as transmitted
 * text — the previous check compared `string.length` to a byte budget, so a
 * 6MB data-URL photo sailed through.
 */
function photoByteSize(photoUrl: string): number {
  if (photoUrl.startsWith('data:')) {
    const comma = photoUrl.indexOf(',');
    const payload = comma >= 0 ? photoUrl.slice(comma + 1) : '';
    return Math.floor(payload.length * 0.75);
  }
  return new TextEncoder().encode(photoUrl).length;
}

function isAllowedPhotoUrl(photoUrl: string): boolean {
  if (photoUrl.startsWith('data:image/')) return true;
  try {
    return new URL(photoUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseWindows(raw: unknown): AvailabilityWindow[] {
  if (!Array.isArray(raw)) return [];
  const windows = raw.filter((w): w is Record<string, unknown> => typeof w === 'object' && !!w);
  return windows.flatMap((w) => {
    const weekday = w.weekday;
    const startMinute = w.startMinute;
    const endMinute = w.endMinute;
    if (
      typeof weekday !== 'number' ||
      ![0, 1, 2, 3, 4, 5, 6].includes(weekday) ||
      typeof startMinute !== 'number' ||
      typeof endMinute !== 'number' ||
      !Number.isInteger(startMinute) ||
      !Number.isInteger(endMinute) ||
      startMinute < 0 ||
      endMinute > 1440 ||
      startMinute >= endMinute
    ) {
      return [];
    }
    return [{ id: crypto.randomUUID(), weekday: weekday as Weekday, startMinute, endMinute }];
  });
}

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
  const languages = Array.isArray(body.languages)
    ? body.languages.filter((l: unknown): l is string => typeof l === 'string')
    : [];
  const bio = typeof body.bio === 'string' ? body.bio : '';
  const introVideoUrl = typeof body.introVideoUrl === 'string' ? body.introVideoUrl : '';
  const certifications = Array.isArray(body.certifications)
    ? body.certifications.filter((c: unknown): c is string => typeof c === 'string')
    : [];
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const education = typeof body.education === 'string' ? body.education.trim() : '';
  const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : '';
  const timezone = typeof body.timezone === 'string' ? body.timezone : '';
  const availability = parseWindows(body.availability);

  if (subjects.length === 0 || bio.trim().length < 30) {
    return NextResponse.json(
      { ok: false, error: 'Add at least one subject and a short intro of 30+ characters.' },
      { status: 422 },
    );
  }

  const activeSubjects = new Set((await hub.catalog.options()).flatMap((group) => group.subjects));
  const unknown = subjects.filter((subject: string) => !activeSubjects.has(subject));
  if (unknown.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `These subjects are no longer offered: ${unknown.join(', ')}. Pick from the current list.`,
      },
      { status: 422 },
    );
  }

  if (languages.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Pick at least one language you can teach in.' },
      { status: 422 },
    );
  }

  if (displayName.length < 2) {
    return NextResponse.json(
      { ok: false, error: 'Tell us your display name (at least 2 characters).' },
      { status: 422 },
    );
  }

  if (!timezone || !isValidTimezone(timezone)) {
    return NextResponse.json(
      { ok: false, error: 'Pick the timezone you plan to teach in.' },
      { status: 422 },
    );
  }

  if (availability.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Add at least one weekly window when you are available.' },
      { status: 422 },
    );
  }

  if (photoUrl.length > 0) {
    if (!isAllowedPhotoUrl(photoUrl)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'That photo URL looks unsafe — use an https: link or an image upload.',
        },
        { status: 422 },
      );
    }
    if (photoByteSize(photoUrl) > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'That photo is too large — use a smaller image.' },
        { status: 413 },
      );
    }
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
    displayName,
    photoUrl,
    education,
    subjects,
    languages: languages.slice(0, 8),
    bio,
    introVideoUrl,
    certifications: certifications.slice(0, 12),
    timezone,
    availability,
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

  try {
    await hub.scheduling.saveAvailability(
      tutorId,
      availability.map((window) => ({
        id: window.id,
        weekday: window.weekday,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      })),
    );
    await hub.scheduling.updateSettings({ tutorId, timezone });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Application saved but scheduling could not be persisted — try again.',
      },
      { status: 500 },
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
    const options = sessionCookieOptions();
    response.cookies.set('mojo_user', sessionToken, options);
    response.cookies.set('mojo_role', role, options);
    return response;
  }

  return NextResponse.json(
    { ok: true, applicationId: application.id, createdAccount: false },
    { status: 201 },
  );
}

export async function GET(request: NextRequest) {
  const hub = getHub();
  // Closed endpoint: the admin console reads the queue either as a signed-in
  // admin or via the server-to-server demo bridge (`x-mojo-bridge`). The
  // previous open dump exposed applicant PII to anyone.
  if (!isBridgeRequest(request)) {
    const token = request.cookies.get('mojo_user')?.value;
    const user = token ? await hub.identity.userByToken(token) : null;
    if (user?.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Admin sign-in required.' }, { status: 401 });
    }
  }
  const applications = await hub.profile.applications();
  return NextResponse.json({
    ok: true,
    applications: applications.map((app) => ({
      id: app.id,
      tutorId: app.tutorId,
      displayName: app.displayName,
      photoUrl: app.photoUrl,
      education: app.education,
      subjects: app.subjects,
      languages: app.languages,
      bio: app.bio,
      introVideoUrl: app.introVideoUrl,
      certifications: app.certifications,
      timezone: app.timezone,
      availability: app.availability,
      status: app.status,
      submittedAt: app.submittedAt,
    })),
  });
}
