'use client';

import { AvailabilityEditor } from '@mojo/scheduling/feature';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Stepper,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from '@mojo/shared/ui';
import { isValidTimezone, TIMEZONES } from '@mojo/shared/util';
import type { AvailabilityWindow } from '@mojo/tutor-profile/domain';
import { CheckCircle2, ImagePlus, Link2, Plus, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { WizardArtwork } from './apply-form-artwork';
import { StatTile } from './stat-tile';

const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin'];

const EXPERIENCE_OPTIONS = ['Less than a year', '1–3 years', '3–5 years', '5+ years'];

const STEPS = [
  { label: 'Subjects', description: 'What you teach' },
  { label: 'About you', description: 'Your teaching style' },
  { label: 'Profile', description: 'Name, photo, education' },
  { label: 'Experience', description: 'Credentials' },
  { label: 'Intro video', description: 'Optional' },
  { label: 'Availability', description: 'Time & zone' },
  { label: 'Your account', description: 'Where we reach you' },
  { label: 'Review', description: 'Ready to go' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function defaultTimezone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && isValidTimezone(zone)) return zone;
  }
  return 'Africa/Lagos';
}

function windowLabel(weekday: number, startMinute: number, endMinute: number): string {
  return `${WEEKDAY_LABELS[weekday] ?? '?'} ${clock(startMinute)}–${clock(endMinute)}`;
}

function clock(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface ApplyFormInitial {
  readonly subjects: readonly string[];
  readonly languages: readonly string[];
  readonly bio: string;
  readonly displayName: string;
  readonly photoUrl: string;
  readonly education: string;
  readonly certifications: readonly string[];
  readonly introVideoUrl: string;
  readonly timezone: string;
  readonly availability: readonly AvailabilityWindow[];
}

/** Strips the "Teaching for …; " prefix the API composes, so edits don't stack it. */
function stripExperiencePrefix(bio: string): string {
  return bio.replace(/^Teaching for [^;]+; /, '');
}

export function ApplyForm({
  signedIn,
  name: initialName,
  email: initialEmail,
  subjectOptions,
  initial,
}: {
  signedIn: boolean;
  name: string;
  email: string;
  /** Active subjects from the admin-managed catalogue. */
  subjectOptions: readonly string[];
  /** Prefill for resubmits and profile updates. */
  initial?: ApplyFormInitial;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<string[]>(() =>
    [...(initial?.subjects ?? [])].filter((s) => subjectOptions.includes(s)),
  );
  const [languages, setLanguages] = useState<string[]>([...(initial?.languages ?? [])]);
  const [bio, setBio] = useState(initial ? stripExperiencePrefix(initial.bio) : '');
  const [displayName, setDisplayName] = useState(initial?.displayName || initialName);
  const [photoMode, setPhotoMode] = useState<'file' | 'url'>(initial?.photoUrl ? 'url' : 'file');
  const [photoFile, setPhotoFile] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? '');
  const [education, setEducation] = useState(initial?.education ?? '');
  const [yearsExperience, setYearsExperience] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<string[]>([
    ...(initial?.certifications ?? []),
  ]);
  const [certDraft, setCertDraft] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState(initial?.introVideoUrl ?? '');
  const [timezone, setTimezone] = useState(() =>
    initial && isValidTimezone(initial.timezone) ? initial.timezone : defaultTimezone(),
  );
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([
    ...(initial?.availability ?? []),
  ]);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function canContinue(): boolean {
    if (step === 0) return subjects.length > 0 && languages.length >= 1;
    if (step === 1) return bio.trim().length >= 30;
    if (step === 2) return displayName.trim().length >= 2;
    if (step === 3) return Boolean(yearsExperience);
    if (step === 4) return true;
    if (step === 5) return isValidTimezone(timezone) && availability.length >= 1;
    if (step === 6) {
      if (signedIn) return true;
      return (
        name.trim().length > 0 && emailIsValid && password.length >= 10 && password === confirm
      );
    }
    return true;
  }

  function handlePhotoFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoFile(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  }

  const finalPhotoUrl = photoMode === 'url' ? photoUrl.trim() : photoFile;

  function addCertification() {
    const value = certDraft.trim();
    if (!value) return;
    setCertifications((current) => (current.includes(value) ? current : [...current, value]));
    setCertDraft('');
  }

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects,
          languages,
          bio: `${yearsExperience ? `Teaching for ${yearsExperience}; ` : ''}${bio.trim()}`,
          certifications,
          introVideoUrl: introVideoUrl.trim(),
          displayName: displayName.trim(),
          photoUrl: finalPhotoUrl,
          education: education.trim(),
          timezone,
          availability: availability.map(({ id, weekday, startMinute, endMinute }) => ({
            id,
            weekday,
            startMinute,
            endMinute,
          })),
          name: signedIn ? undefined : name.trim(),
          email: signedIn ? undefined : email.trim(),
          password: signedIn ? undefined : password,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not submit application.');
      setAccountCreated(Boolean(body.createdAccount));
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit application.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="size-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-headline">You&apos;re on the list!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {accountCreated
              ? 'We just created your tutor account and signed you in — your application is in review. The moment you\u2019re approved, you\u2019ll start appearing in search.'
              : 'Your application is in. A tutor-reviewer will get back to you, and the moment you\u2019re approved you\u2019ll start appearing in search.'}
          </p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" size="sm">
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Stepper steps={STEPS} currentStep={step} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-6">
            <WizardArtwork
              step={step}
              signedIn={signedIn}
              subjectOptions={[...subjectOptions]}
              subjects={subjects}
              languages={languages}
              bio={bio}
              displayName={displayName}
              photoUrl={finalPhotoUrl}
              education={education}
              yearsExperience={yearsExperience}
              certifications={certifications}
              introVideoUrl={introVideoUrl}
              timezone={timezone}
              availability={availability}
              name={name}
              email={email}
              password={password}
            />
          </div>
        </aside>
        <div className="flex min-w-0 flex-col gap-6">
          {error && <Alert variant="danger">{error}</Alert>}

          {step === 0 && (
            <FieldGroup>
              <Field>
                <FieldLabel>What do you want to teach?</FieldLabel>
                <FieldDescription>
                  Pick as many as you like. You can refine this later.
                </FieldDescription>
                <ToggleGroup
                  type="multiple"
                  className="flex flex-wrap"
                  value={subjects}
                  onValueChange={setSubjects}
                >
                  {subjectOptions.map((subject) => (
                    <ToggleGroupItem key={subject} value={subject} className="rounded-full">
                      {subject}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {subjects.length === 0
                    ? 'No subjects selected yet.'
                    : `Selected: ${subjects.join(', ')}`}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Which languages do you teach in?</FieldLabel>
                <FieldDescription>
                  Students use this to find tutors who speak their language — pick every language
                  you could run a lesson in.
                </FieldDescription>
                <ToggleGroup
                  type="multiple"
                  className="flex flex-wrap"
                  value={languages}
                  onValueChange={setLanguages}
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <ToggleGroupItem key={language} value={language} className="rounded-full">
                      {language}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {languages.length === 0
                    ? 'Pick at least one language to continue.'
                    : `Selected: ${languages.join(', ')}`}
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}

          {step === 1 && (
            <FieldGroup>
              <Field>
                <FieldLabel>Introduce yourself</FieldLabel>
                <FieldDescription>
                  What&apos;s your teaching style? How long have you taught, and what makes your
                  lessons click? A few friendly sentences beat a wall of text.
                </FieldDescription>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. I'm a patient conversation-first tutor. My lessons are 70% talking, 30% grammar — you'll leave saying things, not just memorising rules..."
                  rows={6}
                  required
                />
                <FieldDescription>
                  {bio.trim().length >= 30
                    ? `${bio.trim().length} characters — looks great.`
                    : `Keep going — at least 30 characters (currently ${bio.trim().length}).`}
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}

          {step === 2 && (
            <FieldGroup>
              <Field>
                <FieldLabel>Display name</FieldLabel>
                <FieldDescription>
                  The name students will see on your tutor card and channels.
                </FieldDescription>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Amara Johnson"
                  required
                />
                {displayName.trim().length > 0 && displayName.trim().length < 2 && (
                  <FieldDescription>
                    That&apos;s a little short — a real name reads better.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel>Photo</FieldLabel>
                <FieldDescription>
                  A clear headshot helps students recognise you. Add a photo from your device, or
                  paste a link instead.
                </FieldDescription>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar
                    name={displayName.trim() || 'New tutor'}
                    src={finalPhotoUrl || undefined}
                    size="lg"
                  />
                  <div className="flex flex-col gap-2">
                    <ToggleGroup
                      type="single"
                      value={photoMode}
                      onValueChange={(value) => {
                        if (value) setPhotoMode(value as 'file' | 'url');
                      }}
                    >
                      <ToggleGroupItem value="file" className="gap-1.5 text-xs">
                        <ImagePlus className="size-4" />
                        Upload
                      </ToggleGroupItem>
                      <ToggleGroupItem value="url" className="gap-1.5 text-xs">
                        <Link2 className="size-4" />
                        Paste a link
                      </ToggleGroupItem>
                    </ToggleGroup>
                    {photoMode === 'file' ? (
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                        className="max-w-sm"
                      />
                    ) : (
                      <Input
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://… (or a data: URL)"
                        type="url"
                        className="max-w-sm"
                      />
                    )}
                  </div>
                </div>
                <FieldDescription>
                  Optional — you&apos;ll get initials until you add one.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Education</FieldLabel>
                <FieldDescription>
                  School, degree, or the experience behind your expertise.
                </FieldDescription>
                <Input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. B.Sc. Spanish — University of Lagos"
                />
              </Field>
            </FieldGroup>
          )}

          {step === 3 && (
            <FieldGroup>
              <Field>
                <FieldLabel>How long have you been teaching?</FieldLabel>
                <Select
                  value={yearsExperience ?? undefined}
                  onValueChange={(value) => setYearsExperience(value)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select teaching experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EXPERIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Qualifications & certifications</FieldLabel>
                <FieldDescription>
                  Optional — degrees, certificates, or impressive wins. Press Enter to add each one.
                </FieldDescription>
                <div className="flex max-w-md gap-2">
                  <Input
                    value={certDraft}
                    onChange={(e) => setCertDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCertification();
                      }
                    }}
                    placeholder="e.g. DELE C1, Grade 8 piano…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCertification}
                    aria-label="Add"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((certificate) => (
                      <Badge key={certificate} variant="secondary" className="gap-1">
                        {certificate}
                        <button
                          type="button"
                          aria-label={`Remove ${certificate}`}
                          className="text-inherit opacity-70 hover:opacity-100"
                          onClick={() =>
                            setCertifications((current) => current.filter((c) => c !== certificate))
                          }
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>
            </FieldGroup>
          )}

          {step === 4 && (
            <FieldGroup>
              <Field>
                <FieldLabel>Intro video (optional)</FieldLabel>
                <FieldDescription>
                  A 30–60 second intro helps students feel the vibe before they book. Paste a
                  YouTube, Loom, or Google Drive link.
                </FieldDescription>
                <Input
                  value={introVideoUrl}
                  onChange={(e) => setIntroVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  type="url"
                />
              </Field>
            </FieldGroup>
          )}

          {step === 5 && (
            <FieldGroup>
              <Field>
                <FieldLabel>Your timezone</FieldLabel>
                <FieldDescription>
                  Times below are in your own local time — students see them converted.
                </FieldDescription>
                <Select value={timezone} onValueChange={(value) => setTimezone(value)}>
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>When are you available?</FieldLabel>
                <FieldDescription>
                  Add the weekly windows students can book into. You need at least one to be
                  bookable.
                </FieldDescription>
                <AvailabilityEditor
                  rules={availability}
                  onChange={setAvailability}
                  className="mt-1"
                />
              </Field>
            </FieldGroup>
          )}

          {step === 6 &&
            (signedIn ? (
              <FieldGroup>
                <Field>
                  <FieldLabel>You&apos;re all set</FieldLabel>
                  <FieldDescription>
                    You&apos;re signed in as{' '}
                    <span className="font-medium text-foreground">{email || 'your account'}</span>.
                    We&apos;ll attach this application to your account — no extra sign-up needed.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            ) : (
              <FieldGroup>
                <Field>
                  <FieldLabel>Your name</FieldLabel>
                  <FieldDescription>
                    What students will see when you&apos;re approved.
                  </FieldDescription>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amara Johnson"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <FieldDescription>We&apos;ll send tutor-review updates here.</FieldDescription>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                  {!emailIsValid && email.length > 0 && (
                    <FieldDescription>
                      That doesn&apos;t look like a valid email yet.
                    </FieldDescription>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <FieldDescription>
                    At least 10 characters, one capital letter and one number.
                  </FieldDescription>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Confirm password</FieldLabel>
                  <Input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                  {confirm.length > 0 && confirm !== password && (
                    <FieldDescription>Passwords don&apos;t match yet.</FieldDescription>
                  )}
                </Field>
              </FieldGroup>
            ))}

          {step === 7 && (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                  <Avatar
                    name={displayName.trim() || 'New tutor'}
                    src={finalPhotoUrl || undefined}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Profile
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-headline">
                      {displayName.trim() || '—'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {education.trim() || 'No education listed'}
                    </p>
                  </div>
                </div>
                <StatTile label="Timezone" value={timezone || '—'} />
                <StatTile label="Subjects" value={subjects.join(', ') || '—'} />
                <StatTile label="Languages" value={languages.join(', ') || '—'} />
                <StatTile
                  label="Availability"
                  value={
                    availability
                      .map((w) => windowLabel(w.weekday, w.startMinute, w.endMinute))
                      .join(' · ') || '—'
                  }
                />
                <StatTile label="Experience" value={yearsExperience ?? '—'} />
                <StatTile
                  label="Intro video"
                  value={introVideoUrl ? 'Added' : 'Not added (still fine)'}
                />
                <StatTile
                  label="Credentials"
                  value={certifications.length > 0 ? certifications.join(' · ') : 'None yet'}
                />
              </div>
              <StatTile
                label="Your intro"
                value={
                  <>
                    {yearsExperience ? `Teaching for ${yearsExperience}; ` : ''}
                    {bio.trim() || '—'}
                  </>
                }
                valueClassName="font-normal text-foreground"
              />
              {!signedIn && (
                <StatTile
                  label="Your account"
                  value={
                    <>
                      {name.trim() || '—'} · {email.trim() || '—'}
                    </>
                  }
                  valueClassName="font-normal text-foreground"
                />
              )}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" />
                All done! Submit and a tutor-reviewer will take a look.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0 || busy}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => canContinue() && setStep((current) => current + 1)}
                disabled={!canContinue()}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={busy}>
                {busy ? 'Submitting…' : 'Submit application'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
