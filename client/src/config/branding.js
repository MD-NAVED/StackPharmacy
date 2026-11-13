/**
 * Single source of truth for application branding and product constants.
 * Rename-in-progress safe: changing BRAND_NAME or BRAND_TAGLINE here
 * updates the onboarding page and all related public displays.
 */

export const BRAND_NAME = 'TrackPharmacy';
export const BRAND_TAGLINE = 'Smart Stock & Expiry Management for Chemist Stores';
export const BRAND_SHORT_DESC = 'The simple phone app for Indian pharmacy owners to scan purchase bills, update stock in seconds, and get expiry alerts.';

export const PRICING_MONTHLY = '₹299';
export const PRICING_SUMMARY = 'First month free. Then ₹299 per month.';

// Official support WhatsApp contact for customer onboarding assistance
export const SUPPORT_WHATSAPP_NUMBER =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPPORT_WHATSAPP_NUMBER) ||
  '919753880839';
export const SUPPORT_WHATSAPP_LINK = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello ${BRAND_NAME} team, I am a pharmacy owner and I need help getting started.`)}`;

// Support email: only rendered when explicitly configured (no fake placeholders)
export const SUPPORT_EMAIL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPPORT_EMAIL) || '';
