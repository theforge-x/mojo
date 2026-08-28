import { describe, expect, it } from 'vitest';
import { checkPasswordPolicy } from './password-policy';

describe('checkPasswordPolicy', () => {
  it('accepts a password meeting every rule', () => {
    expect(checkPasswordPolicy('Correct9Horse').valid).toBe(true);
  });

  it('rejects a password that is too short', () => {
    const result = checkPasswordPolicy('Sh0rt');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('Must be at least 10 characters.');
  });

  it('reports every violated rule at once, not just the first', () => {
    const result = checkPasswordPolicy('lowercase');
    expect(result.reasons).toEqual(
      expect.arrayContaining(['Must include an uppercase letter.', 'Must include a digit.']),
    );
  });

  it('rejects whitespace even in an otherwise valid password', () => {
    expect(checkPasswordPolicy('Correct 9Horse').valid).toBe(false);
  });
});
