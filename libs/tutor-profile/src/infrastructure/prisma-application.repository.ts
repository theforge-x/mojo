import type { PrismaClient } from '@prisma/client';
import type { ApplicationRepository, TutorProfileRepository } from '../domain/tutor-profile.ports';
import type { TutorApplication, TutorProfile } from '../domain/tutor-profile.types';

export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(applicationId: string): Promise<TutorApplication | null> {
    const row = await this.prisma.tutorApplication.findUnique({ where: { id: applicationId } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async save(application: TutorApplication): Promise<void> {
    await this.prisma.tutorApplication.upsert({
      where: { id: application.id },
      create: {
        id: application.id,
        tutorId: application.tutorId,
        subjects: [...application.subjects],
        bio: application.bio,
        introVideoUrl: application.introVideoUrl,
        certifications: [...application.certifications],
        status: application.status,
        submittedAt: new Date(application.submittedAt),
      },
      update: { status: application.status },
    });
  }

  private toDomain(row: {
    id: string;
    tutorId: string;
    subjects: string[];
    bio: string;
    introVideoUrl: string;
    certifications: string[];
    status: string;
    submittedAt: Date;
  }): TutorApplication {
    return {
      id: row.id,
      tutorId: row.tutorId,
      subjects: row.subjects,
      bio: row.bio,
      introVideoUrl: row.introVideoUrl,
      certifications: row.certifications,
      status: row.status as TutorApplication['status'],
      submittedAt: row.submittedAt.toISOString(),
    };
  }
}

export class PrismaTutorProfileRepository implements TutorProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTutorId(tutorId: string): Promise<TutorProfile | null> {
    const row = await this.prisma.tutorProfile.findUnique({ where: { tutorId } });
    if (!row) return null;
    return {
      tutorId: row.tutorId,
      displayName: row.displayName,
      photoUrl: row.photoUrl ?? '',
      subjects: row.subjects,
      bio: row.bio,
      moderationFlagged: row.moderationFlagged,
    };
  }

  async save(profile: TutorProfile): Promise<void> {
    await this.prisma.tutorProfile.upsert({
      where: { tutorId: profile.tutorId },
      create: {
        tutorId: profile.tutorId,
        displayName: profile.displayName,
        photoUrl: profile.photoUrl || null,
        subjects: [...profile.subjects],
        bio: profile.bio,
        moderationFlagged: profile.moderationFlagged,
      },
      update: {
        displayName: profile.displayName,
        photoUrl: profile.photoUrl || null,
        subjects: [...profile.subjects],
        bio: profile.bio,
        moderationFlagged: profile.moderationFlagged,
      },
    });
  }
}
