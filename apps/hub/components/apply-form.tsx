'use client';

import {
  Alert,
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
} from '@mojo/shared/ui';
import { CheckCircle2, Plus, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SUBJECT_OPTIONS = [
  'Spanish',
  'French',
  'English',
  'Maths',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Python',
  'Guitar',
  'Piano',
  'Yoruba',
  'Igbo',
  'Hausa',
  'Art & Design',
  'Business',
];

const EXPERIENCE_OPTIONS = ['Less than a year', '1–3 years', '3–5 years', '5+ years'];

const STEPS = [
  { label: 'Subjects', description: 'What you teach' },
  { label: 'About you', description: 'Your teaching style' },
  { label: 'Experience', description: 'Credentials' },
  { label: 'Intro video', description: 'Optional' },
  { label: 'Your account', description: 'Where we reach you' },
  { label: 'Review', description: 'Ready to go' },
];

export function ApplyForm({
  signedIn,
  name: initialName,
  email: initialEmail,
}: {
  signedIn: boolean;
  name: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certDraft, setCertDraft] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function canContinue(): boolean {
    if (step === 0) return subjects.length > 0;
    if (step === 1) return bio.trim().length >= 30;
    if (step === 2) return Boolean(yearsExperience);
    if (step === 3) return true;
    if (step === 4) {
      if (signedIn) return true;
      return (
        name.trim().length > 0 && emailIsValid && password.length >= 10 && password === confirm
      );
    }
    return true;
  }

  function toggleSubject(subject: string) {
    setSubjects((current) =>
      current.includes(subject) ? current.filter((s) => s !== subject) : [...current, subject],
    );
  }

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
          bio: `${yearsExperience ? `Teaching for ${yearsExperience}; ` : ''}${bio.trim()}`,
          certifications,
          introVideoUrl: introVideoUrl.trim(),
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
      {error && <Alert variant="danger">{error}</Alert>}

      {step === 0 && (
        <FieldGroup>
          <Field>
            <FieldLabel>What do you want to teach?</FieldLabel>
            <FieldDescription>
              Pick as many as you like. You can refine this later.
            </FieldDescription>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((subject) => {
                const active = subjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    aria-pressed={active}
                    className={
                      active
                        ? 'rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-headline transition-colors'
                        : 'rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-headline'
                    }
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
            <FieldDescription>
              {subjects.length === 0
                ? 'No subjects selected yet.'
                : `Selected: ${subjects.join(', ')}`}
            </FieldDescription>
          </Field>
        </FieldGroup>
      )}

      {step === 1 && (
        <FieldGroup>
          <Field>
            <FieldLabel>Introduce yourself</FieldLabel>
            <FieldDescription>
              What&apos;s your teaching style? How long have you taught, and what makes your lessons
              click? A few friendly sentences beat a wall of text.
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

      {step === 3 && (
        <FieldGroup>
          <Field>
            <FieldLabel>Intro video (optional)</FieldLabel>
            <FieldDescription>
              A 30–60 second intro helps students feel the vibe before they book. Paste a YouTube,
              Loom, or Google Drive link.
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

      {step === 4 &&
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
              <FieldDescription>What students will see when you&apos;re approved.</FieldDescription>
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
                <FieldDescription>That doesn&apos;t look like a valid email yet.</FieldDescription>
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

      {step === 5 && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Subjects
              </p>
              <p className="mt-1 text-sm font-medium text-headline">{subjects.join(', ') || '—'}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Experience
              </p>
              <p className="mt-1 text-sm font-medium text-headline">{yearsExperience ?? '—'}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Intro video
              </p>
              <p className="mt-1 text-sm font-medium text-headline">
                {introVideoUrl ? 'Added' : 'Not added (still fine)'}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Credentials
              </p>
              <p className="mt-1 text-sm font-medium text-headline">
                {certifications.length > 0 ? certifications.join(' · ') : 'None yet'}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your intro
            </p>
            <p className="mt-1 text-sm text-foreground">
              {yearsExperience ? `Teaching for ${yearsExperience}; ` : ''}
              {bio.trim() || '—'}
            </p>
          </div>
          {!signedIn && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your account
              </p>
              <p className="mt-1 text-sm text-foreground">
                {name.trim() || '—'} · {email.trim() || '—'}
              </p>
            </div>
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
  );
}
