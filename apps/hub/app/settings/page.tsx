import { redirect } from 'next/navigation';
import { AccountSection } from '../../components/settings/account-section';
import {
  StudentAutoconfirm,
  TutorAutoconfirm,
} from '../../components/settings/autoconfirm-section';
import { StudentCalendar, TutorCalendar } from '../../components/settings/calendar-section';
import { DeleteSection } from '../../components/settings/delete-section';
import { EmailSection } from '../../components/settings/email-section';
import { NotificationsSection } from '../../components/settings/notifications-section';
import { PasswordSection } from '../../components/settings/password-section';
import {
  StudentPaymentHistory,
  TutorPaymentHistory,
} from '../../components/settings/payment-history-section';
import { PaymentMethodsSection } from '../../components/settings/payment-methods-section';
import { SettingsNav } from '../../components/settings/settings-nav';
import {
  SettingsSection,
  type SettingsSectionDef,
} from '../../components/settings/settings-section';
import { getHub } from '../../demo/composition-root';
import { formatMinor } from '../../lib/format';
import { currentUser } from '../../lib/session';

const NAV: readonly SettingsSectionDef[] = [
  { id: 'account', label: 'Account' },
  { id: 'password', label: 'Password' },
  { id: 'email', label: 'Email' },
  { id: 'payment-methods', label: 'Payment methods' },
  { id: 'payment-history', label: 'Payment history' },
  { id: 'autoconfirmation', label: 'Autoconfirmation' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'delete-account', label: 'Delete account' },
];

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'tutor' && user.role !== 'student') redirect('/tutor');

  const hub = getHub();
  const userId = user.id;
  const fullUser = await hub.identity.userById(userId);
  const timezone = fullUser?.timezone ?? 'Africa/Lagos';

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 font-display text-2xl font-bold text-headline">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Account, payments, calendar, and notification preferences.
      </p>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="shrink-0 lg:sticky lg:top-24 lg:w-56">
          <SettingsNav items={NAV} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <SettingsSection id="account" title="Account" description="How you appear on Mojo.">
            <AccountSection
              name={fullUser?.name ?? user.name}
              email={user.email}
              role={user.role}
              timezone={timezone}
            />
          </SettingsSection>

          <SettingsSection
            id="password"
            title="Password"
            description="Rotate the password you sign in with."
          >
            <PasswordSection />
          </SettingsSection>

          <SettingsSection
            id="email"
            title="Email"
            description="Move sign-in and receipts to a new address."
          >
            <EmailSection email={user.email} />
          </SettingsSection>

          <SettingsSection
            id="payment-methods"
            title="Payment methods"
            description={
              user.role === 'student'
                ? 'Cards on file for lesson checkout.'
                : 'Students pay by card; tutors receive through wallet payouts.'
            }
          >
            {user.role === 'student' ? (
              <PaymentMethodsSection />
            ) : (
              <TutorPaymentHistory balance={await tutorBalance()} />
            )}
          </SettingsSection>

          <SettingsSection
            id="payment-history"
            title="Payment history"
            description="Every lesson charge, what it covered, and what came back."
          >
            {user.role === 'student' ? (
              <StudentPaymentHistory {...(await studentHistory())} />
            ) : (
              <TutorPaymentHistory balance={await tutorBalance()} />
            )}
          </SettingsSection>

          <SettingsSection
            id="autoconfirmation"
            title="Autoconfirmation"
            description="How finished lessons confirm and release payouts."
          >
            {user.role === 'student' ? (
              <StudentAutoconfirm pending={await pendingConfirmations()} />
            ) : (
              <TutorAutoconfirm {...(await tutorConfirmStats())} />
            )}
          </SettingsSection>

          <SettingsSection
            id="calendar"
            title="Calendar"
            description="Timezone, availability, and booking windows."
          >
            {user.role === 'tutor' ? (
              <TutorCalendar {...(await tutorCalendar())} />
            ) : (
              <StudentCalendar timezone={timezone} upcomingCount={await upcomingCount()} />
            )}
          </SettingsSection>

          <SettingsSection
            id="notifications"
            title="Notifications"
            description="Reminders, recaps, and where they reach you."
          >
            <NotificationsSection />
          </SettingsSection>

          <SettingsSection
            id="delete-account"
            title="Delete account"
            description="Deactivate your account effective immediately."
          >
            <DeleteSection />
          </SettingsSection>
        </div>
      </div>
    </main>
  );

  async function tutorBalance(): Promise<string> {
    const wallet = await hub.wallet.forTutor(userId);
    return formatMinor(wallet.balance.amountMinor, wallet.balance.currency);
  }

  async function studentHistory() {
    const [charges, refunds] = await Promise.all([
      hub.billing.chargesByStudent(userId),
      hub.billing.refundsByStudent(userId),
    ]);
    const tutorNames = new Map<string, string>();
    for (const charge of charges.slice(0, 5)) {
      if (!tutorNames.has(charge.tutorId)) {
        tutorNames.set(
          charge.tutorId,
          (await hub.profile.byTutor(charge.tutorId))?.displayName ?? 'Your tutor',
        );
      }
    }
    const paidMinor = charges.reduce((sum, c) => sum + c.totalMinor, 0);
    const refundedMinor = refunds.reduce((sum, r) => sum + r.amountMinor, 0);
    return {
      paidMinor,
      refundedMinor,
      recent: charges.slice(0, 5).map((charge) => ({
        id: charge.id,
        tutorName: tutorNames.get(charge.tutorId) ?? 'Your tutor',
        totalMinor: charge.totalMinor,
        status: charge.status,
      })),
    };
  }

  async function pendingConfirmations() {
    const sessions = await hub.scheduling.sessionsByStudent(userId);
    const pending = sessions.filter((s) => s.status === 'confirmed');
    return Promise.all(
      pending.map(async (session) => ({
        id: session.id,
        tutorName: (await hub.profile.byTutor(session.tutorId))?.displayName ?? 'Your tutor',
        startIso: session.startIso,
        endIso: session.endIso,
      })),
    );
  }

  async function tutorConfirmStats() {
    const sessions = await hub.scheduling.sessionsByTutor(userId);
    return {
      awaitingStudent: sessions.filter((s) => s.status === 'confirmed').length,
      upcoming: sessions.filter((s) => s.status === 'booked' || s.status === 'confirmed').length,
    };
  }

  async function tutorCalendar() {
    const [settings, rules] = await Promise.all([
      hub.scheduling.settings(userId),
      hub.scheduling.availabilityRules(userId),
    ]);
    return {
      timezone: settings.timezone,
      bufferMinutes: settings.bufferMinutes,
      minimumNoticeMinutes: settings.minimumNoticeMinutes,
      paused: settings.pausedForNewBookings,
      ruleCount: rules.length,
    };
  }

  async function upcomingCount(): Promise<number> {
    const sessions = await hub.scheduling.sessionsByStudent(userId);
    return sessions.filter((s) => s.status === 'booked' || s.status === 'confirmed').length;
  }
}
