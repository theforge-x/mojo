import type { TutorApplication } from '@mojo/tutor-profile/domain';

function hour(now: number, deltaHours: number): string {
  return new Date(now - deltaHours * 3600_000).toISOString();
}

/**
 * The seeded application queue. Lives on the shared demo state — the hub-app
 * store is the single system of record for applications in the demo, and the
 * admin app's review route reads the same store so both apps present and act
 * on one pending queue.
 */
export function seedDemoApplications(store: { applications: Map<string, TutorApplication> }): void {
  const now = Date.now();
  [hour(now, 2), hour(now, 5), hour(now, 9)].forEach((iso, index) => {
    store.applications.set(`app_${index + 1}`, {
      id: `app_${index + 1}`,
      tutorId: `t_new_${index + 1}`,
      displayName: index === 0 ? 'Amara Eze' : index === 1 ? 'Bola Adeyemi' : 'Chidi Nwosu',
      photoUrl: '',
      education:
        index === 0
          ? 'B.Sc. Spanish — UNILAG'
          : index === 1
            ? 'Diploma in Guitar — FAAN Academy'
            : 'M.Sc. Mathematics — OAU',
      subjects: index === 0 ? ['Spanish'] : index === 1 ? ['Guitar'] : ['Maths'],
      languages: index === 0 ? ['English', 'Spanish'] : index === 1 ? ['English'] : ['English'],
      bio:
        index === 0
          ? 'Native speaker with 6 years of online teaching.'
          : 'Patient classroom teacher making the jump to live tutoring.',
      introVideoUrl: '',
      certifications: [],
      timezone: 'Africa/Lagos',
      availability: [
        { id: `app_${index + 1}_w1`, weekday: 2, startMinute: 540, endMinute: 780 },
        { id: `app_${index + 1}_w2`, weekday: 4, startMinute: 960, endMinute: 1140 },
      ],
      status: 'pending',
      reviewNote: '',
      submittedAt: iso,
    });
  });
}
