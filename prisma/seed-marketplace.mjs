/** biome-ignore-all lint/suspicious/noConsole: seed script progress output */
// Dev marketplace seed (plain Node — no TS runner required).
// Populates Postgres with a realistic browsing dataset so the landing page,
// header menus, and tutor directory render ACTUAL database rows instead of
// hardcoded marketing copy: tutors with profiles + performance, students,
// completed sessions, and reviews.
//
// Idempotent: users/profiles/settings upsert by stable keys; sessions and
// reviews are only created when this script hasn't seeded them before.
// DEV ONLY — never wire into `prisma db seed` (production bootstraps via
// prisma/seed.mjs, which only creates the admin + taxonomy).
//
//   DATABASE_URL="postgresql://…" node prisma/seed-marketplace.mjs
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TUTORS = [
  {
    name: 'Amara Okafor', email: 'amara.o@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Maths', 'Physics'], languages: ['English', 'Igbo'],
    education: 'MSc Mathematics, University of Lagos',
    bio: 'I turn maths anxiety into confidence. My lessons start from what you already know and build up in small, verifiable steps — fractions today, calculus by term end.',
    rating: 4.9, hours: 320,
  },
  {
    name: 'Tunde Adeyemi', email: 'tunde.a@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Physics', 'Chemistry'], languages: ['English', 'Yoruba'],
    education: 'BSc Mechanical Engineering, University of Ibadan',
    bio: 'Physics finally makes sense when you can see it. I teach with everyday examples — danfo braking distances, ceiling-fan rotation — then formalize the maths behind them.',
    rating: 4.8, hours: 210,
  },
  {
    name: 'Ngozi Eze', email: 'ngozi.e@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['English', 'French'], languages: ['English', 'Igbo', 'French'],
    education: 'BA English Language, University of Nigeria Nsukka',
    bio: 'From WAEC essays to DELF preparation, I coach writing the way athletes train: short drills, instant feedback, and steady progression you can feel each week.',
    rating: 4.9, hours: 410,
  },
  {
    name: 'Funke Alabi', email: 'funke.a@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Yoruba', 'English'], languages: ['Yoruba', 'English'],
    education: 'BA Linguistics, Obafemi Awolowo University',
    bio: 'Yoruba is learned by speaking it, not memorizing it. Expect proverbs, songs, and real conversation from your very first lesson — heritage learners especially welcome.',
    rating: 5.0, hours: 95,
  },
  {
    name: 'Chidi Obi', email: 'chidi.o@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Igbo', 'Maths'], languages: ['Igbo', 'English'],
    education: 'BSc Mathematics Education, Nnamdi Azikiwe University',
    bio: 'I teach Igbo the living way — greetings you will actually use, stories your grandmother would approve of — alongside primary and junior-secondary maths.',
    rating: 4.7, hours: 60,
  },
  {
    name: 'Aisha Bello', email: 'aisha.b@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Hausa', 'English'], languages: ['Hausa', 'English'],
    education: 'BA Hausa Language, Bayero University Kano',
    bio: 'Sannu! Whether you are reconnecting with family roots or preparing for exams, my Hausa lessons balance grammar structure with confident, natural speech.',
    rating: 4.8, hours: 130,
  },
  {
    name: 'Emeka Nwosu', email: 'emeka.n@mojo.dev', timezone: 'Africa/Lagos',
    subjects: ['Python', 'Business'], languages: ['English'],
    education: 'BSc Computer Science, Covenant University',
    bio: 'Learn Python by shipping: we build small real tools from lesson one — calculators, scrapers, shop trackers — and the business maths to price your work.',
    rating: 4.9, hours: 180,
  },
  {
    name: 'Oliver Davies', email: 'oliver.d@mojo.dev', timezone: 'Europe/London',
    subjects: ['Piano', 'Guitar'], languages: ['English'],
    education: 'Grade 8 ABRSM Piano & Guitar, London',
    bio: 'Evening lessons for busy people. Thirty focused minutes on technique plus a practice plan that fits around school or work — beginners progress fastest with me.',
    rating: 4.6, hours: 45,
  },
  {
    name: 'Sarah Mensah', email: 'sarah.m@mojo.dev', timezone: 'Africa/Accra',
    subjects: ['Spanish', 'English'], languages: ['English', 'Spanish', 'Twi'],
    education: 'BA Spanish, University of Ghana',
    bio: 'Hola, ¡bienvenidos! My Spanish lessons are conversation-first: you will introduce yourself, order food, and tell stories in Spanish within the first month.',
    rating: 4.8, hours: 150,
  },
  {
    name: 'Grace Mwangi', email: 'grace.m@mojo.dev', timezone: 'Africa/Nairobi',
    subjects: ['Biology', 'Chemistry'], languages: ['English', 'Swahili'],
    education: 'BSc Biochemistry, University of Nairobi',
    bio: 'Biology sticks when you draw it. My lessons are diagram-heavy and exam-smart — KCSE and WAEC candidates learn exactly how markers award points.',
    rating: 4.7, hours: 110,
  },
];

const STUDENTS = [
  { name: 'Rachel M.', email: 'rachel.m@mojo.dev', timezone: 'Africa/Lagos' },
  { name: 'Kevin L.', email: 'kevin.l@mojo.dev', timezone: 'Africa/Lagos' },
  { name: 'Zainab Y.', email: 'zainab.y@mojo.dev', timezone: 'Africa/Lagos' },
  { name: 'David O.', email: 'david.o@mojo.dev', timezone: 'Africa/Lagos' },
  { name: 'Priya S.', email: 'priya.s@mojo.dev', timezone: 'Asia/Kolkata' },
  { name: 'Michael A.', email: 'michael.a@mojo.dev', timezone: 'Africa/Accra' },
  { name: 'Sofia R.', email: 'sofia.r@mojo.dev', timezone: 'America/New_York' },
  { name: 'James K.', email: 'james.k@mojo.dev', timezone: 'Africa/Nairobi' },
  { name: 'Fatima S.', email: 'fatima.s@mojo.dev', timezone: 'Africa/Lagos' },
  { name: 'Daniel E.', email: 'daniel.e@mojo.dev', timezone: 'Europe/London' },
];

const REVIEW_BODIES = [
  'Patient, prepared, and genuinely invested. Every lesson ends with clear next steps.',
  'My grades moved within a month. The way concepts get broken down just works for me.',
  'Punctual, encouraging, and flexible when school runs late. I always leave lessons energized.',
  'Finally a tutor who checks understanding instead of rushing through topics. Highly recommended.',
  'The trial convinced me on day one. Booking and rescheduling around my timetable is painless.',
  'Explains the why behind every method. I stopped cramming and started actually understanding.',
  'Great with shy learners — my daughter asks for extra sessions now, unprompted.',
  'Worth every kobo. Progress is visible after every single lesson, not just at exam time.',
];

function levelFor(hours) {
  if (hours >= 150) return 'expert';
  if (hours >= 50) return 'established';
  return 'entry';
}

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const tutorIds = [];
  for (const tutor of TUTORS) {
    const user = await prisma.user.upsert({
      where: { email: tutor.email },
      create: {
        name: tutor.name, email: tutor.email, role: 'tutor',
        passwordHash, timezone: tutor.timezone, locale: 'en-NG',
      },
      update: { name: tutor.name, timezone: tutor.timezone },
    });
    await prisma.tutorProfile.upsert({
      where: { tutorId: user.id },
      create: {
        tutorId: user.id, displayName: tutor.name, subjects: tutor.subjects,
        languages: tutor.languages, education: tutor.education, bio: tutor.bio,
      },
      update: {
        displayName: tutor.name, subjects: tutor.subjects, languages: tutor.languages,
        education: tutor.education, bio: tutor.bio,
      },
    });
    await prisma.tutorPerformance.upsert({
      where: { tutorId: user.id },
      create: {
        tutorId: user.id, level: levelFor(tutor.hours),
        cumulativeHoursTaught: tutor.hours, averageRating: tutor.rating,
        responseTimeMinutesAvg: 12 + (tutor.hours % 40),
      },
      update: {
        level: levelFor(tutor.hours), cumulativeHoursTaught: tutor.hours,
        averageRating: tutor.rating,
      },
    });
    await prisma.schedulingSettings.upsert({
      where: { tutorId: user.id },
      create: { tutorId: user.id, timezone: tutor.timezone },
      update: {},
    });
    tutorIds.push({ id: user.id, subjects: tutor.subjects, hours: tutor.hours });
  }
  console.log(`[marketplace] tutors ensured: ${tutorIds.length}`);

  const studentIds = [];
  for (const student of STUDENTS) {
    const user = await prisma.user.upsert({
      where: { email: student.email },
      create: {
        name: student.name, email: student.email, role: 'student',
        passwordHash, timezone: student.timezone, locale: 'en-NG',
      },
      update: { name: student.name, timezone: student.timezone },
    });
    studentIds.push(user.id);
  }
  console.log(`[marketplace] students ensured: ${studentIds.length}`);

  const alreadySeeded = await prisma.session.count({
    where: { tutor: { email: { in: TUTORS.map((t) => t.email) } } },
  });
  if (alreadySeeded > 0) {
    console.log(`[marketplace] sessions already seeded (${alreadySeeded}) — skipping.`);
    return;
  }

  const now = Date.now();
  let sessions = 0;
  let reviews = 0;
  for (let t = 0; t < tutorIds.length; t += 1) {
    const tutor = tutorIds[t];
    const lessonCount = 2 + (t % 3);
    for (let i = 0; i < lessonCount; i += 1) {
      const studentId = studentIds[(t * 3 + i) % studentIds.length];
      const daysAgo = 4 + ((t * 7 + i * 11) % 40);
      const startAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const endAt = new Date(startAt.getTime() + (i % 2 === 0 ? 60 : 30) * 60 * 1000);
      const session = await prisma.session.create({
        data: {
          tutorId: tutor.id, studentId, startAt, endAt,
          status: 'completed', isTrial: i === 0 && t % 2 === 0,
        },
      });
      sessions += 1;
      const rating = (t + i) % 4 === 3 ? 4 : 5;
      await prisma.review.create({
        data: {
          sessionId: session.id, tutorId: tutor.id, studentId,
          rating, body: REVIEW_BODIES[(t * 2 + i) % REVIEW_BODIES.length],
        },
      });
      reviews += 1;
    }
    // One upcoming booking per tutor so schedules look alive.
    const futureStart = new Date(now + (1 + (t % 5)) * 24 * 60 * 60 * 1000);
    await prisma.session.create({
      data: {
        tutorId: tutor.id, studentId: studentIds[t % studentIds.length],
        startAt: futureStart, endAt: new Date(futureStart.getTime() + 60 * 60 * 1000),
        status: 'booked',
      },
    });
    sessions += 1;
  }
  console.log(`[marketplace] sessions created: ${sessions}, reviews created: ${reviews}`);
}

main()
  .catch((error) => {
    console.error('[marketplace] failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
