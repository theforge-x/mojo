/** biome-ignore-all lint/suspicious/noConsole: seed script progress output */
// Production bootstrap seed (plain Node — no TS runner required).
// Idempotent: safe to re-run on every deploy. Creates the first admin
// account (without which the tutor-review loop can never start) and the
// subject catalogue.
//
// The taxonomy rows mirror DEFAULT_TAXONOMY_SEED in
// libs/admin-config/src/domain/admin-config.types.ts — keep them in sync;
// the admin console remains the runtime editor.
//
//   ADMIN_EMAIL="ops@example.com" ADMIN_PASSWORD="…" npx prisma db seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const TAXONOMY = [
  ['dom_languages', 'Languages', null],
  ['sub_spanish', 'Spanish', 'dom_languages'],
  ['sub_french', 'French', 'dom_languages'],
  ['sub_english', 'English', 'dom_languages'],
  ['sub_yoruba', 'Yoruba', 'dom_languages'],
  ['sub_igbo', 'Igbo', 'dom_languages'],
  ['sub_hausa', 'Hausa', 'dom_languages'],
  ['dom_music', 'Music', null],
  ['sub_guitar', 'Guitar', 'dom_music'],
  ['sub_piano', 'Piano', 'dom_music'],
  ['dom_academics', 'Academics', null],
  ['sub_maths', 'Maths', 'dom_academics'],
  ['sub_physics', 'Physics', 'dom_academics'],
  ['sub_chemistry', 'Chemistry', 'dom_academics'],
  ['sub_biology', 'Biology', 'dom_academics'],
  ['dom_tech_business', 'Technology & Business', null],
  ['sub_python', 'Python', 'dom_tech_business'],
  ['sub_economics', 'Economics', 'dom_tech_business'],
  ['sub_business', 'Business', 'dom_tech_business'],
  ['sub_art_design', 'Art & Design', 'dom_tech_business'],
];

async function main() {
  const prisma = new PrismaClient();
  try {
    const email = (process.env.ADMIN_EMAIL ?? 'admin@mojo.dev').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? 'Password123';
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('[seed] ADMIN_PASSWORD unset — using the demo default. Set a real one in prod.');
    }

    const admin = await prisma.user.upsert({
      where: { email },
      create: {
        name: process.env.ADMIN_NAME?.trim() || 'Mojo Admin',
        email,
        role: 'admin',
        passwordHash: await bcrypt.hash(password, 12),
        timezone: process.env.ADMIN_TIMEZONE?.trim() || 'Africa/Lagos',
        locale: 'en-NG',
      },
      // Never overwrite an existing admin's credentials on re-seed.
      update: {},
    });
    console.log(`[seed] admin: ${admin.email} (${admin.id})`);

    let subjects = 0;
    for (const [id, name, parentId] of TAXONOMY) {
      await prisma.subjectTaxonomyEntry.upsert({
        where: { id },
        create: { id, name, parentId, active: true },
        // Never clobber admin edits (renames, deactivation) on re-seed.
        update: {},
      });
      subjects += 1;
    }
    console.log(`[seed] taxonomy entries ensured: ${subjects}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[seed] failed:', error);
  process.exit(1);
});
