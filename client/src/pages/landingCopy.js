/**
 * Landing page copy and constants.
 * Single source of truth for all copy on the public root route "/".
 * All copy follows simple, plain English rules tailored for Indian pharmacy owners.
 */

import {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_SHORT_DESC,
  PRICING_MONTHLY,
  PRICING_SUMMARY,
  SUPPORT_WHATSAPP_LINK,
  SUPPORT_WHATSAPP_NUMBER
} from '../config/branding';

export {
  BRAND_NAME,
  BRAND_TAGLINE,
  BRAND_SHORT_DESC,
  PRICING_MONTHLY,
  PRICING_SUMMARY,
  SUPPORT_WHATSAPP_LINK,
  SUPPORT_WHATSAPP_NUMBER
};

// Section 1: Hero
export const HERO_COPY = {
  badge: PRICING_SUMMARY,
  headline: 'Take a photo. Your stock updates itself.',
  subheadline: 'Save hours of typing every week. Stop medicine expiry losses before they happen.',
  primaryCtaText: 'Start Free Trial',
  primaryCtaLink: '/signup',
  secondaryCtaText: 'See how it works',
  secondaryCtaLink: '/onboarding',
  visualAlt: 'Phone mockup showing a purchase bill photo converting into a live medicine stock list'
};

// Section 2: 60-Second Demo Video
export const VIDEO_COPY = {
  title: 'Watch how it works in 60 seconds',
  subtitle: 'See a real bill scanned and added to stock in less than a minute.',
  videoSrc: '/videos/demo-60s.mp4',
  missingCaption: 'Demo video coming after our first live store demos',
  posterAlt: 'Video preview frame showing a phone camera scanning a distributor bill with play button'
};

// Section 3: "Made for your counter"
export const FEATURES_COPY = {
  title: 'Made for your counter',
  subtitle: 'Built specifically for independent Indian chemist shops.',
  cards: [
    {
      id: 'phone',
      title: 'Works on the phone in your pocket',
      text: 'No computer or barcode scanner needed. Any Android phone works.'
    },
    {
      id: 'setup',
      title: 'Set up in one day, not one week',
      text: 'Create an account and scan your first bill in under two minutes.'
    },
    {
      id: 'support',
      title: 'Help on WhatsApp, in your language',
      text: 'Message our team directly whenever you have a question or need help.'
    }
  ]
};

// Section 4: Simple Honest Pricing
export const PRICING_COPY = {
  title: 'Simple, honest pricing',
  subtitle: 'Clear pricing for every pharmacy owner. No surprises.',
  firstMonth: 'First month — Free',
  monthlyRate: `Then ${PRICING_MONTHLY} per month`,
  guarantee: 'No hidden fees. Cancel anytime.',
  bullets: [
    'Unlimited purchase bill scans',
    'Full stock and expiry tracking',
    'Daily expiry and low stock alerts',
    'Direct WhatsApp support'
  ],
  ctaText: 'Start Your Free Month',
  ctaLink: '/signup'
};

// Section 5: Final CTA & Footer
export const FINAL_CTA_COPY = {
  prompt: 'Want to see every single step first?',
  guideLinkText: 'See the full 5-step guide',
  guideLink: '/onboarding'
};

export const FOOTER_COPY = {
  guideLink: '/onboarding',
  guideText: '5-Step Guide',
  privacyLink: '/privacy',
  privacyText: 'Privacy Policy',
  supportText: 'WhatsApp Support',
  copyright: `© ${new Date().getFullYear()} ${BRAND_NAME}`
};
