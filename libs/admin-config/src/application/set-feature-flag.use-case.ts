import type { FeatureFlagRepository } from '../domain/admin-config.ports';
import type { FeatureFlag } from '../domain/admin-config.types';

export class InvalidRolloutPercentError extends Error {
  constructor(percent: number) {
    super(`rolloutPercent must be between 0 and 100, got ${percent}.`);
  }
}

export function makeSetFeatureFlag(deps: { flags: FeatureFlagRepository }) {
  return async function setFeatureFlag(input: FeatureFlag): Promise<void> {
    if (input.rolloutPercent < 0 || input.rolloutPercent > 100) {
      throw new InvalidRolloutPercentError(input.rolloutPercent);
    }
    await deps.flags.save(input);
  };
}
