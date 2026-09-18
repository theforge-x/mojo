import type { Metadata } from 'next';
import { DM_Mono, DM_Sans, Manrope } from 'next/font/google';
import '../../../libs/shared/ui/src/styles/globals.css';
import { ThemeProvider } from '@mojo/shared/ui';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { getLandingSubjects } from '../lib/landing-data';
import { currentUser } from '../lib/session';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['500', '700', '800'],
});
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '700'],
});
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-dm-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: {
    default: 'mojo',
    template: '%s — mojo',
  },
  description: 'Find your tutor. Book a lesson. Learn live with mojo.',
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const headerUser = user ? { name: user.name, email: user.email, role: user.role } : null;
  // Shared React cache with the landing page: one subjects query per request.
  const subjects = await getLandingSubjects();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col">
            <SiteHeader user={headerUser} subjects={subjects} />
            <div className="flex-1">{children}</div>
            <SiteFooter user={headerUser} />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
