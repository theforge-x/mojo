'use client';

import {
  Alert,
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
} from '@mojo/shared/ui';
import Link from 'next/link';
import { type FormEvent, useState, useTransition } from 'react';
import { signupWithDemo } from '../lib/actions';

const POLICY_HINT = 'At least 10 characters, one capital letter and one number.';

export function SignupForm({ subject }: { subject?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');

    if (!name) {
      setError('Please tell us your name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!password) {
      setError('Please choose a password.');
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const locale = navigator.language || 'en';

    startTransition(async () => {
      const result = await signupWithDemo({ name, email, password, timezone, locale, subject });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      window.location.assign(result.redirectTo);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert variant="danger">{error}</Alert>}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="signup-name">Full name</FieldLabel>
          <Input id="signup-name" name="name" placeholder="Ada Obi" autoComplete="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-email">Email</FieldLabel>
          <Input
            id="signup-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-password">Password</FieldLabel>
          <Input
            id="signup-password"
            name="password"
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            required
          />
          <FieldDescription>{POLICY_HINT}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="signup-confirm">Confirm password</FieldLabel>
          <Input
            id="signup-confirm"
            name="confirm"
            type="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            required
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending} size="lg">
        {pending ? 'Creating your account…' : 'Create your account'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
