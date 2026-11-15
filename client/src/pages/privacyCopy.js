/**
 * Privacy Policy Copy & Constants
 * Grounded in actual code behavior across client and server.
 * Written in simple, readable English for Indian pharmacy owners.
 */

import {
  BRAND_NAME,
  BRAND_TAGLINE,
  SUPPORT_WHATSAPP_LINK,
  SUPPORT_WHATSAPP_NUMBER,
  SUPPORT_EMAIL
} from '../config/branding';

export {
  BRAND_NAME,
  BRAND_TAGLINE,
  SUPPORT_WHATSAPP_LINK,
  SUPPORT_WHATSAPP_NUMBER,
  SUPPORT_EMAIL
};

export const POLICY_METADATA = {
  effectiveDate: 'November 13, 2026',
  version: 'Version 1.0',
  title: 'Privacy Policy',
  subtitle: `How ${BRAND_NAME} protects your pharmacy data, your bills, and your store records.`
};

export const PRIVACY_SECTIONS = [
  {
    number: 1,
    title: '1. What information we collect',
    intro: 'We collect only the information needed to run your pharmacy stock and expiry tracking:',
    items: [
      {
        heading: 'Account Details',
        body: 'When you create an account, we collect your store name, owner name, mobile phone number, and a username. Your password is encrypted using a cryptographic salted hash before it is saved. We never store or see your plain-text password.'
      },
      {
        heading: 'Bill Photos',
        body: 'When you use the bill scan feature, the app captures a photo of your distributor purchase bill using your phone camera.'
      },
      {
        heading: 'Stock and Purchase Records',
        body: 'We store the medicine line items you save: medicine names, batch numbers, expiry dates, quantities, purchase rates, supplier names, invoice numbers, selling prices (MRP), and rack locations.'
      },
      {
        heading: 'Sales and Khata Records (Optional)',
        body: 'If you use the billing or credit book features, we store sale receipts, payment modes (cash, UPI, credit), and customer names or phone numbers you enter for payment reminders.'
      },
      {
        heading: 'Technical and Crash Diagnostics',
        body: 'We collect basic anonymous error logs and crash reports (via Sentry) so we can quickly fix bugs and keep the app running smoothly.'
      }
    ]
  },
  {
    number: 2,
    title: '2. How we use your information',
    intro: 'We use your information solely to provide pharmacy management services to your store:',
    items: [
      {
        heading: 'Automatic Stock Updates',
        body: 'To add purchased medicines, batches, and quantities directly to your store inventory.'
      },
      {
        heading: 'Expiry and Low Stock Alerts',
        body: 'To warn you before medicines expire and notify you when medicines are running out.'
      },
      {
        heading: 'Store Reports and Search',
        body: 'To calculate your daily sales totals, purchase history, and let you search your stock in seconds.'
      },
      {
        heading: 'Account Security',
        body: 'To verify your identity when you log in and protect your store data from unauthorized access.'
      }
    ]
  },
  {
    number: 3,
    title: '3. Bill photos and AI processing',
    intro: 'We are completely transparent about how bill scanning works:',
    items: [
      {
        heading: 'AI Cloud Processing (Google Gemini & NVIDIA NIM Cloud Backup)',
        body: "When you scan a bill, the photo is sent securely to Google's Gemini API so a computer can read the text. It is processed under Google's API terms. As an automated cloud backup when primary services are congested, bill photos may also be processed securely via NVIDIA NIM API endpoints under NVIDIA's API terms."
      },
      {
        heading: 'RAM-Only Processing (Immediate Image Discarding)',
        body: 'Our server processes your bill photo in memory (RAM only) to extract medicine names and numbers. The image is never saved to our database, never written to disk, and is discarded immediately after the items are read.'
      },
      {
        heading: 'You Are Always in Control',
        body: 'The AI output is only a suggestion. You check the extracted medicine names, quantities, and rates on your screen before saving. Nothing is added to your stock until you tap save.'
      }
    ]
  },
  {
    number: 4,
    title: '4. What we never do',
    intro: 'Our business model is a simple software subscription. We protect your store privacy with clear commitments:',
    items: [
      {
        heading: 'We never sell your data',
        body: 'We do not sell, rent, or trade your personal or store information to data brokers or any third party.'
      },
      {
        heading: 'We never share with other pharmacies or distributors',
        body: 'Your medicine stock, purchase prices, customer lists, and distributor names are strictly private to your store. Competitors and distributors cannot see your data.'
      },
      {
        heading: 'We never use your data for advertising',
        body: 'We do not build advertising profiles or use your sales or purchase history for targeted ads. There are no third-party advertisements in our app.'
      }
    ]
  },
  {
    number: 5,
    title: '5. Where your data is stored',
    intro: 'Your data is hosted on modern cloud infrastructure with strict access boundaries:',
    items: [
      {
        heading: 'Cloud Database',
        body: 'Your store records are persisted in a managed PostgreSQL database hosted by Supabase with connection encryption.'
      },
      {
        heading: 'Application Hosting',
        body: 'The web application and API endpoints are hosted on Vercel cloud infrastructure.'
      },
      {
        heading: 'Store-Level Isolation',
        body: 'Every database query is strictly filtered by your unique store ID. One pharmacy can never query or view records belonging to another pharmacy.'
      }
    ]
  },
  {
    number: 6,
    title: '6. How long we keep your data',
    intro: 'We retain your store records as long as your account remains active:',
    items: [
      {
        heading: 'Active Account Retention',
        body: 'We keep your stock, purchases, and sales history while your store account is active so your inventory counts and financial reports remain accurate over time.'
      },
      {
        heading: 'Account Closure',
        body: 'If you stop using the service or close your account, you can request full removal of your store database records.'
      }
    ]
  },
  {
    number: 7,
    title: '7. Your choices and data rights',
    intro: 'You own your store data and have full control over your records:',
    items: [
      {
        heading: 'View and Edit Anytime',
        body: 'You can review, update, or edit any medicine, batch, price, or stock count directly from the app screens at any time.'
      },
      {
        heading: 'Data Export',
        body: 'You can request an export of your inventory and sales data by contacting our team.'
      },
      {
        heading: 'Data Deletion',
        body: 'You can request complete deletion of your account, store profile, and inventory data at any time via WhatsApp support. Once verified, our team will delete your store records from our database.'
      }
    ]
  },
  {
    number: 8,
    title: '8. Security',
    intro: 'We use industry-standard safeguards to protect your business information:',
    items: [
      {
        heading: 'Encrypted Transmission (HTTPS)',
        body: 'All communications between your phone and our servers use secure HTTPS encryption in transit.'
      },
      {
        heading: 'Password Protection',
        body: 'Passwords are salted and hashed using scrypt cryptographic algorithms before storage. Even server administrators cannot view your password.'
      },
      {
        heading: 'Brute-Force Lockout',
        body: 'Our login system limits repeated failed password attempts to protect your account against unauthorized guessing attacks.'
      }
    ]
  },
  {
    number: 9,
    title: '9. Changes to this policy',
    intro: 'As we add new capabilities to the app, we may update this privacy policy:',
    items: [
      {
        heading: 'Policy Updates',
        body: 'Any updates will be published directly on this page. When we update the policy, we will change the "Effective date" and "Version" at the top of this document.'
      }
    ]
  },
  {
    number: 10,
    title: '10. Contact us',
    intro: 'If you have questions about this privacy policy, your store data, or would like to request data deletion, contact our team directly:',
    items: [
      {
        heading: 'WhatsApp Support (Fastest)',
        body: `Message our founder and support team on WhatsApp at +${SUPPORT_WHATSAPP_NUMBER}. We respond in plain Hindi, Hinglish, or English.`
      }
    ]
  }
];
