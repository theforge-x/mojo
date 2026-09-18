import { cache } from 'react';
import { sharedPrismaClient } from '../demo/prisma-client';

/**
 * Landing-page dataset, read straight from Postgres (never demo state or
 * hardcoded marketing numbers). Every figure on the guest landing page —
 * subjects, tutors, stats, testimonials — comes from these queries, so the
 * page reflects the actual marketplace.
 */
export interface LandingSubject {
  readonly name: string;
  readonly tutorCount: number;
}

/** Taxonomy domain (parent) with its tutored leaf subjects. */
export interface LandingDomain {
  readonly id: string;
  readonly name: string;
  readonly subjects: readonly LandingSubject[];
}

export interface LandingTutor {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly subjects: readonly string[];
  readonly tagline: string;
  readonly rating: number;
  readonly reviewCount: number;
  readonly hoursTaught: number;
  /** Human badge from the tutor's performance level; null for newcomers. */
  readonly badge: string | null;
}

export interface LandingStats {
  readonly tutorCount: number;
  readonly studentCount: number;
  readonly completedSessions: number;
  readonly averageRating: number;
  readonly reviewCount: number;
  readonly timezones: number;
}

export interface LandingTestimonial {
  readonly quote: string;
  readonly studentName: string;
  readonly tutorName: string;
  readonly subject: string;
  readonly rating: number;
}

export interface LandingUpcoming {
  readonly subject: string;
  readonly tutorName: string;
  readonly when: string;
}

export interface LandingData {
  readonly subjects: readonly LandingSubject[];
  readonly domains: readonly LandingDomain[];
  readonly tutors: readonly LandingTutor[];
  readonly stats: LandingStats;
  readonly testimonials: readonly LandingTestimonial[];
  readonly upcoming: readonly LandingUpcoming[];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || 'MO';
}

function badgeFor(level: string): string | null {
  if (level === 'expert') return 'Expert';
  if (level === 'established') return 'Experienced';
  return null;
}

/** Leaf subjects with at least one tutor, most tutors first. */
export const getLandingSubjects = cache(async (): Promise<readonly LandingSubject[]> => {
  const prisma = sharedPrismaClient();
  const leaves = await prisma.subjectTaxonomyEntry.findMany({
    where: { active: true, parentId: { not: null } },
    select: { name: true },
    orderBy: { name: 'asc' },
  });
  const profiles = await prisma.tutorProfile.findMany({ select: { subjects: true } });
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    for (const subject of profile.subjects) {
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    }
  }
  return leaves
    .map((leaf) => ({ name: leaf.name, tutorCount: counts.get(leaf.name) ?? 0 }))
    .filter((subject) => subject.tutorCount > 0)
    .sort((a, b) => b.tutorCount - a.tutorCount || a.name.localeCompare(b.name));
});

/** Domains with their tutored leaves, busiest domain first. Empty domains hidden. */
export const getSubjectDomains = cache(async (): Promise<readonly LandingDomain[]> => {
  const prisma = sharedPrismaClient();
  const entries = await prisma.subjectTaxonomyEntry.findMany({
    where: { active: true },
    select: { id: true, name: true, parentId: true },
  });
  const parents = entries.filter((entry) => entry.parentId === null);
  const leaves = entries.filter((entry) => entry.parentId !== null);
  const profiles = await prisma.tutorProfile.findMany({ select: { subjects: true } });
  const counts = new Map<string, number>();
  for (const profile of profiles) {
    for (const subject of profile.subjects) {
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    }
  }
  const byParent = new Map<string, LandingSubject[]>();
  for (const leaf of leaves) {
    const tutorCount = counts.get(leaf.name) ?? 0;
    if (tutorCount === 0 || leaf.parentId === null) continue;
    const list = byParent.get(leaf.parentId) ?? [];
    list.push({ name: leaf.name, tutorCount });
    byParent.set(leaf.parentId, list);
  }
  return parents
    .map((parent) => ({
      id: parent.id,
      name: parent.name,
      subjects: (byParent.get(parent.id) ?? []).sort(
        (a, b) => b.tutorCount - a.tutorCount || a.name.localeCompare(b.name),
      ),
    }))
    .filter((domain) => domain.subjects.length > 0)
    .sort(
      (a, b) =>
        b.subjects.reduce((sum, s) => sum + s.tutorCount, 0) -
        a.subjects.reduce((sum, s) => sum + s.tutorCount, 0),
    );
});
/** Top-rated tutors with live aggregates. Empty when nobody teaches yet. */
export const getLandingTutors = cache(async (): Promise<readonly LandingTutor[]> => {
  const prisma = sharedPrismaClient();
  const profiles = await prisma.tutorProfile.findMany({
    include: { user: { select: { name: true } } },
    take: 24,
  });
  const performances = await prisma.tutorPerformance.findMany({
    where: { tutorId: { in: profiles.map((profile) => profile.tutorId) } },
  });
  const perfByTutor = new Map(performances.map((perf) => [perf.tutorId, perf]));
  const aggregates = await prisma.review.groupBy({
    by: ['tutorId'],
    _count: { id: true },
    _avg: { rating: true },
  });
  const byTutor = new Map(aggregates.map((row) => [row.tutorId, row]));
  return profiles
    .map((profile) => {
      const aggregate = byTutor.get(profile.tutorId);
      const perf = perfByTutor.get(profile.tutorId);
      const reviewCount = aggregate?._count.id ?? 0;
      const rating = aggregate?._avg.rating ?? perf?.averageRating ?? 0;
      return {
        id: profile.tutorId,
        name: profile.displayName || profile.user.name,
        initials: initialsOf(profile.displayName || profile.user.name),
        subjects: profile.subjects,
        tagline:
          profile.bio.length > 110 ? `${profile.bio.slice(0, 107).trimEnd()}…` : profile.bio,
        rating: Math.round(rating * 10) / 10,
        reviewCount,
        hoursTaught: Math.round(perf?.cumulativeHoursTaught ?? 0),
        badge: badgeFor(perf?.level ?? 'entry'),
      } satisfies LandingTutor;
    })
    .filter((tutor) => tutor.reviewCount > 0)
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
    .slice(0, 8);
});

export const getLandingStats = cache(async (): Promise<LandingStats> => {
  const prisma = sharedPrismaClient();
  const [tutorCount, studentCount, completedSessions, ratingAgg, students] = await Promise.all([
    prisma.tutorProfile.count(),
    prisma.user.count({ where: { role: 'student' } }),
    prisma.session.count({ where: { status: 'completed' } }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
    prisma.user.findMany({ where: { role: 'student' }, select: { timezone: true } }),
  ]);
  return {
    tutorCount,
    studentCount,
    completedSessions,
    averageRating: Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10,
    reviewCount: ratingAgg._count.id,
    timezones: new Set(students.map((student) => student.timezone)).size,
  };
});

export const getLandingTestimonials = cache(async (): Promise<readonly LandingTestimonial[]> => {
  const prisma = sharedPrismaClient();
  const reviews = await prisma.review.findMany({
    include: {
      student: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });
  if (reviews.length === 0) return [];
  const tutorIds = [...new Set(reviews.map((review) => review.tutorId))];
  const profiles = await prisma.tutorProfile.findMany({
    where: { tutorId: { in: tutorIds } },
    select: { tutorId: true, displayName: true, subjects: true },
  });
  const byTutor = new Map(profiles.map((profile) => [profile.tutorId, profile]));
  return reviews.slice(0, 3).map((review) => {
    const profile = byTutor.get(review.tutorId);
    return {
      quote: review.body,
      studentName: review.student.name || 'A Mojo learner',
      tutorName: profile?.displayName ?? 'their tutor',
      subject: profile?.subjects[0] ?? 'their subject',
      rating: review.rating,
    } satisfies LandingTestimonial;
  });
});

export const getLandingData = cache(async (): Promise<LandingData> => {
  const [subjects, domains, tutors, stats, testimonials, upcoming] = await Promise.all([
    getLandingSubjects(),
    getSubjectDomains(),
    getLandingTutors(),
    getLandingStats(),
    getLandingTestimonials(),
    getLandingUpcoming(),
  ]);
  return { subjects, domains, tutors, stats, testimonials, upcoming };
});

/** Next few booked lessons, formatted in each tutor's timezone. */
export const getLandingUpcoming = cache(async (): Promise<readonly LandingUpcoming[]> => {
  const prisma = sharedPrismaClient();
  const sessions = await prisma.session.findMany({
    where: { status: { in: ['booked', 'confirmed'] }, startAt: { gte: new Date() } },
    include: { tutor: { select: { name: true, timezone: true } } },
    orderBy: { startAt: 'asc' },
    take: 3,
  });
  if (sessions.length === 0) return [];
  const profiles = await prisma.tutorProfile.findMany({
    where: { tutorId: { in: sessions.map((session) => session.tutorId) } },
    select: { tutorId: true, displayName: true, subjects: true },
  });
  const byTutor = new Map(profiles.map((profile) => [profile.tutorId, profile]));
  return sessions.map((session) => {
    const profile = byTutor.get(session.tutorId);
    let when: string;
    try {
      when = new Intl.DateTimeFormat('en', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: session.tutor.timezone,
      })
        .format(session.startAt)
        .replace(',', ' ·');
    } catch {
      when = session.startAt.toISOString().slice(0, 16).replace('T', ' ');
    }
    return {
      subject: profile?.subjects[0] ?? 'Lesson',
      tutorName: profile?.displayName || session.tutor.name || 'A tutor',
      when,
    } satisfies LandingUpcoming;
  });
});
