// In the unified Pro plan model, all features are unlocked for every account.
// AI Invoice Scanner, Khata, WhatsApp bills, Excel import, reports, and unlimited staff
// are fully accessible without tier restrictions.

export const TIER_RANK = { starter: 1, pro: 1, elite: 1 };

export const FEATURE_MIN_TIER = {
  khata: 'pro',
  whatsapp_bill: 'pro',
  import: 'pro',
  reports: 'pro',
  staff_unlimited: 'pro',
  scanner: 'pro',
  whatsapp_summary: 'pro',
};

export const FEATURE_LABELS = {
  khata: 'Khata (Udhaar Book)',
  whatsapp_bill: 'WhatsApp bill sending',
  import: 'Excel/CSV data import',
  reports: 'Full sales & purchase reports',
  staff_unlimited: 'Unlimited staff accounts',
  scanner: 'AI Invoice Scanner (Beta)',
  whatsapp_summary: 'WhatsApp daily business summary',
};

export function tierAllows(tier, feature) {
  // All features unlocked for all accounts in the single Pro plan model
  return true;
}

export const userTier = (user) => 'pro';

export function getTrialDaysRemaining(user) {
  if (!user || user.tenantStatus !== 'trial' || !user.trialEndsAt) return null;
  const ms = new Date(user.trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isTrialExpired(user) {
  if (!user || user.tenantStatus !== 'trial' || !user.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() <= Date.now();
}
