import type { PrismaClient } from '@prisma/client';
import type { ApplicationRepository, TutorProfileRepository } from '../domain/tutor-profile.ports';
import type {
  AvailabilityWindow,
  TutorApplication,
  TutorProfile,
} from '../domain/tutor-profile.types';

export class PrismaApplicationRepository implements ApplicationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(applicationId: string): Promise<TutorApplication | null> {
    const row = await this.prisma.tutorApplication.findUnique({ where: { id: applicationId } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async list(): Promise<TutorApplication[]> {
    const rows = await this.prisma.tutorApplication.findMany();
    return rows.map((row) => this.toDomain(row));
  }

  async save(application: TutorApplication): Promise<void> {
    await this.prisma.tutorApplication.upsert({
      where: { id: application.id },
      create: {
        id: application.id,
        tutorId: application.tutorId,
        displayName: application.displayName,
        photoUrl: application.photoUrl,
        education: application.education,
        subjects: [...application.subjects],
        bio: application.bio,
        introVideoUrl: application.introVideoUrl,
        certifications: [...application.certifications],
        timezone: application.timezone,
        availabilityRules: application.availability as unknown as object,
        status: application.status,
        submittedAt: new Date(application.submittedAt),
      },
      update: {
        displayName: application.displayName,
        photoUrl: application.photoUrl,
        education: application.education,
        subjects: [...application.subjects],
        bio: application.bio,
        introVideoUrl: application.introVideoUrl,
        certifications: [...application.certifications],
        timezone: application.timezone,
        availabilityRules: application.availability as unknown as object,
        status: application.status,
      },
    });
  }

  private toDomain(row: {
    id: string;
    tutorId: string;
    displayName: string;
    photoUrl: string;
    education: string;
    subjects: string[];
    bio: string;
    introVideoUrl: string;
    certifications: string[];
    timezone: string;
    availabilityRules: unknown;
    status: string;
    submittedAt: Date;
  }): TutorApplication {
    return {
      id: row.id,
      tutorId: row.tutorId,
      displayName: row.displayName,
      photoUrl: row.photoUrl,
      education: row.education,
      subjects: row.subjects,
      bio: row.bio,
      introVideoUrl: row.introVideoUrl,
      certifications: row.certifications,
      timezone: row.timezone,
      availability: this.toWindows(row.availabilityRules),
      status: row.status as TutorApplication['status'],
      submittedAt: row.submittedAt.toISOString(),
    };
  }

  private toWindows(value: unknown): AvailabilityWindow[] {
    if (!Array.isArray(value)) return [];
    return value as AvailabilityWindow[];
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
      education: row.education,
      subjects: row.subjects,
      bio: row.bio,
      timezone: row.timezone,
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
        education: profile.education,
        subjects: [...profile.subjects],
        bio: profile.bio,
        timezone: profile.timezone,
        moderationFlagged: profile.moderationFlagged,
      },
      update: {
        displayName: profile.displayName,
        photoUrl: profile.photoUrl || null,
        education: profile.education,
        subjects: [...profile.subjects],
        bio: profile.bio,
        timezone: profile.timezone,
        moderationFlagged: profile.moderationFlagged,
      },
    });
  }
}
