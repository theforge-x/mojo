/**
 * Pure — no I/O, no framework. This is the whole point of putting policy
 * logic in `domain`: it's testable with plain strings and nothing else.
 */
export interface PasswordPolicyResult {
  readonly valid: boolean;
  readonly reasons: readonly string[];
}

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const reasons: string[] = [];
  if (password.length < 10) reasons.push('Must be at least 10 characters.');
  if (!/[A-Z]/.test(password)) reasons.push('Must include an uppercase letter.');
  if (!/[0-9]/.test(password)) reasons.push('Must include a digit.');
  if (/\s/.test(password)) reasons.push('Must not contain whitespace.');
  return { valid: reasons.length === 0, reasons };
}
