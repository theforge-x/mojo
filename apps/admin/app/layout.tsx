import type { Metadata } from 'next';
import { DM_Mono, DM_Sans, Manrope } from 'next/font/google';
import '../../../libs/shared/ui/src/styles/globals.css';
import { ThemeProvider } from '@mojo/shared/ui';
import { AdminShell } from '../components/admin-shell';
import { currentAdmin } from '../lib/session';

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
    default: 'mojo admin',
    template: '%s - mojo admin',
  },
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body>
        <ThemeProvider>
          <AdminShell adminEmail={admin?.email ?? null}>{children}</AdminShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
