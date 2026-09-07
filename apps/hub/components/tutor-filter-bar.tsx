'use client';

import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mojo/shared/ui';
import { useRouter, useSearchParams } from 'next/navigation';

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

const LANGUAGE_OPTIONS = ['English', 'French', 'Spanish', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin'];

const LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'established', label: 'Established' },
  { value: 'expert', label: 'Expert' },
];

const MIN_RATING_OPTIONS = ['4.0', '4.5', '5.0'];

const HORIZON_OPTIONS = [
  { value: '2', label: 'Next 2 hours' },
  { value: '24', label: 'This day' },
  { value: '48', label: 'Next 2 days' },
  { value: '72', label: 'Next 3 days' },
];

const CLEAR = '__all__';

export function TutorFilterBar({
  subject,
  level,
  language,
  minRating,
  availableWithinHours,
}: {
  subject: string;
  level: string;
  language: string;
  minRating: string;
  availableWithinHours: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === CLEAR) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.push(query ? `/tutors?${query}` : '/tutors');
  }

  function clear() {
    router.push('/tutors');
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      <Select value={subject || CLEAR} onValueChange={(value) => apply('subject', value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Subject" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={CLEAR}>Any subject</SelectItem>
            {SUBJECT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={language || CLEAR} onValueChange={(value) => apply('language', value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={CLEAR}>Any language</SelectItem>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={level || CLEAR} onValueChange={(value) => apply('level', value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Level" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={CLEAR}>Any level</SelectItem>
            {LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={minRating || CLEAR} onValueChange={(value) => apply('minRating', value)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Min rating" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={CLEAR}>Any rating</SelectItem>
            {MIN_RATING_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}★+
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={availableWithinHours || CLEAR}
        onValueChange={(value) => apply('availableWithinHours', value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Available within" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={CLEAR}>Anytime</SelectItem>
            {HORIZON_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {[subject, level, language, minRating, availableWithinHours].some(Boolean) && (
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
