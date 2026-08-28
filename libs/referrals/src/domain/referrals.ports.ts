import type { ReferralConversion, ReferralLink } from './referrals.types';

export interface ReferralRepository {
  findLink(code: string): Promise<ReferralLink | null>;
  saveLink(link: ReferralLink): Promise<void>;
  findConversion(code: string, newUserId: string): Promise<ReferralConversion | null>;
  saveConversion(conversion: ReferralConversion): Promise<void>;
}
