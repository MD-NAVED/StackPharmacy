import React from 'react';

/**
 * Step 1: Create your free account
 * Visual: Phone screen showing account sign up with store name and 1-month free badge.
 */
export function Step1RegisterSvg() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Illustration of creating a free pharmacy account on a mobile phone"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#F0FDFA" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#CCFBF1" strokeWidth="2" />

      {/* Phone Body */}
      <rect x="90" y="16" width="140" height="170" rx="18" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" />
      {/* Phone Notch & Speaker */}
      <rect x="135" y="24" width="50" height="4" rx="2" fill="#E2E8F0" />

      {/* Screen Content */}
      <circle cx="160" cy="52" r="14" fill="#0F766E" />
      {/* Store / Person icon inside avatar */}
      <path d="M153 60 C153 55 167 55 167 60 Z" fill="#FFFFFF" />
      <circle cx="160" cy="49" r="5" fill="#FFFFFF" />

      {/* Input Field 1: Store Name */}
      <rect x="105" y="74" width="110" height="18" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="112" y="81" width="50" height="4" rx="2" fill="#0F766E" />

      {/* Input Field 2: Mobile Number */}
      <rect x="105" y="98" width="110" height="18" rx="5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="112" y="105" width="40" height="4" rx="2" fill="#94A3B8" />

      {/* Action Button: Sign Up Free */}
      <rect x="105" y="124" width="110" height="22" rx="6" fill="#0F766E" />
      <text x="160" y="139" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
        Sign Up Free
      </text>

      {/* Home bar */}
      <rect x="140" y="176" width="40" height="3" rx="1.5" fill="#CBD5E1" />

      {/* Floating Badge: 1 Month Free */}
      <g transform="translate(180, 26)">
        <rect width="110" height="30" rx="15" fill="#0F766E" stroke="#FFFFFF" strokeWidth="2" filter="drop-shadow(0px 4px 6px rgba(15, 118, 110, 0.25))" />
        <circle cx="18" cy="15" r="9" fill="#F0FDFA" />
        <path d="M14 15 L17 18 L23 12" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="64" y="19" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
          1 Month Free
        </text>
      </g>
    </svg>
  );
}

/**
 * Step 2: Take a photo of a purchase bill
 * Visual: Distributor bill paper on a desk being photographed by a mobile camera viewfinder.
 */
export function Step2CameraScanSvg() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Illustration of taking a photo of a medicine purchase bill with a phone camera"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#F8FAFC" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#E2E8F0" strokeWidth="2" />

      {/* Distributor Bill Paper in background */}
      <g transform="translate(45, 25)">
        <rect width="140" height="150" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.04))" />
        {/* Invoice Header */}
        <rect x="14" y="14" width="60" height="6" rx="2" fill="#0F766E" />
        <rect x="14" y="24" width="40" height="4" rx="2" fill="#94A3B8" />
        <line x1="14" y1="36" x2="126" y2="36" stroke="#E2E8F0" strokeWidth="1" />
        {/* Bill Line Items */}
        <rect x="14" y="44" width="70" height="4" rx="2" fill="#334155" />
        <rect x="94" y="44" width="24" height="4" rx="2" fill="#64748B" />
        <rect x="14" y="56" width="65" height="4" rx="2" fill="#334155" />
        <rect x="94" y="56" width="24" height="4" rx="2" fill="#64748B" />
        <rect x="14" y="68" width="55" height="4" rx="2" fill="#334155" />
        <rect x="94" y="68" width="24" height="4" rx="2" fill="#64748B" />
        <rect x="14" y="80" width="72" height="4" rx="2" fill="#334155" />
        <rect x="94" y="80" width="24" height="4" rx="2" fill="#64748B" />
        <line x1="14" y1="94" x2="126" y2="94" stroke="#E2E8F0" strokeWidth="1" />
        {/* Total */}
        <rect x="70" y="104" width="48" height="6" rx="2" fill="#0F766E" />
      </g>

      {/* Smartphone Taking Photo */}
      <g transform="translate(150, 20)">
        <rect width="130" height="160" rx="16" fill="#FFFFFF" stroke="#1E293B" strokeWidth="3" filter="drop-shadow(0px 8px 16px rgba(30, 41, 59, 0.12))" />
        {/* Camera Screen Header */}
        <rect x="12" y="12" width="106" height="136" rx="8" fill="#F0FDFA" />
        
        {/* Camera Viewfinder Reticle / Corner Brackets */}
        <path d="M28 35 L28 26 L37 26" fill="none" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M102 35 L102 26 L93 26" fill="none" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 100 L28 109 L37 109" fill="none" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M102 100 L102 109 L93 109" fill="none" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Focus Ring in center */}
        <circle cx="65" cy="68" r="14" fill="none" stroke="#0F766E" strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="65" cy="68" r="3" fill="#0F766E" />

        {/* Shutter Button */}
        <circle cx="65" cy="126" r="12" fill="#0F766E" stroke="#CCFBF1" strokeWidth="3" />
      </g>
    </svg>
  );
}

/**
 * Step 3: AI reads the bill and fills in the items
 * Visual: AI sparkle scan beam extracting printed text into digital medicine cards.
 */
export function Step3AiExtractSvg() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Illustration of AI scanning and reading medicine line items from a bill"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#F0FDFA" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#CCFBF1" strokeWidth="2" />

      {/* Raw Bill Sheet on Left */}
      <g transform="translate(25, 28)">
        <rect width="110" height="144" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="12" y="12" width="50" height="5" rx="2" fill="#64748B" />
        <rect x="12" y="24" width="86" height="3" rx="1.5" fill="#94A3B8" />
        <rect x="12" y="34" width="70" height="3" rx="1.5" fill="#94A3B8" />
        
        {/* Highlighted scanned lines */}
        <rect x="10" y="48" width="90" height="20" rx="4" fill="#CCFBF1" />
        <rect x="16" y="54" width="50" height="4" rx="2" fill="#0F766E" />
        <rect x="16" y="60" width="35" height="3" rx="1.5" fill="#0D9488" />

        <rect x="10" y="74" width="90" height="20" rx="4" fill="#E2E8F0" opacity="0.6" />
        <rect x="16" y="80" width="55" height="4" rx="2" fill="#475569" />
        <rect x="16" y="86" width="30" height="3" rx="1.5" fill="#64748B" />

        <rect x="10" y="100" width="90" height="20" rx="4" fill="#E2E8F0" opacity="0.6" />
        <rect x="16" y="106" width="45" height="4" rx="2" fill="#475569" />
        <rect x="16" y="112" width="40" height="3" rx="1.5" fill="#64748B" />
      </g>

      {/* AI Center Beam with Sparkles */}
      <g transform="translate(138, 70)">
        <line x1="0" y1="30" x2="35" y2="30" stroke="#0F766E" strokeWidth="3" strokeDasharray="4 2" />
        <polygon points="35,26 43,30 35,34" fill="#0F766E" />
        
        {/* Large Sparkle */}
        <path d="M18 10 Q18 20 28 20 Q18 20 18 30 Q18 20 8 20 Q18 20 18 10 Z" fill="#0F766E" />
        {/* Small Sparkle */}
        <path d="M5 45 Q5 50 10 50 Q5 50 5 55 Q5 50 0 50 Q5 50 5 45 Z" fill="#0D9488" />
      </g>

      {/* Extracted Digital Cards on Right */}
      <g transform="translate(178, 22)">
        {/* Card 1 */}
        <rect width="120" height="46" rx="8" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" filter="drop-shadow(0px 2px 4px rgba(15,118,110,0.12))" />
        <circle cx="16" cy="18" r="6" fill="#CCFBF1" />
        <text x="16" y="21" fill="#0F766E" fontSize="8" fontWeight="bold" textAnchor="middle">✓</text>
        <text x="28" y="18" fill="#1E293B" fontSize="9" fontWeight="700" fontFamily="system-ui, sans-serif">Dolo 650 Strip</text>
        <text x="28" y="32" fill="#64748B" fontSize="7.5" fontFamily="system-ui, sans-serif">Batch: DL24 • Qty: 50</text>
        <rect x="86" y="11" width="28" height="14" rx="4" fill="#F0FDFA" />
        <text x="100" y="21" fill="#0F766E" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">₹15.50</text>

        {/* Card 2 */}
        <g transform="translate(0, 52)">
          <rect width="120" height="46" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="16" cy="18" r="6" fill="#CCFBF1" />
          <text x="16" y="21" fill="#0F766E" fontSize="8" fontWeight="bold" textAnchor="middle">✓</text>
          <text x="28" y="18" fill="#1E293B" fontSize="9" fontWeight="700" fontFamily="system-ui, sans-serif">Azithral 500</text>
          <text x="28" y="32" fill="#64748B" fontSize="7.5" fontFamily="system-ui, sans-serif">Batch: AZ91 • Qty: 20</text>
          <rect x="86" y="11" width="28" height="14" rx="4" fill="#F0FDFA" />
          <text x="100" y="21" fill="#0F766E" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">₹72.00</text>
        </g>

        {/* Card 3 */}
        <g transform="translate(0, 104)">
          <rect width="120" height="46" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <circle cx="16" cy="18" r="6" fill="#CCFBF1" />
          <text x="16" y="21" fill="#0F766E" fontSize="8" fontWeight="bold" textAnchor="middle">✓</text>
          <text x="28" y="18" fill="#1E293B" fontSize="9" fontWeight="700" fontFamily="system-ui, sans-serif">Pan 40 Tablet</text>
          <text x="28" y="32" fill="#64748B" fontSize="7.5" fontFamily="system-ui, sans-serif">Batch: PN04 • Qty: 30</text>
          <rect x="86" y="11" width="28" height="14" rx="4" fill="#F0FDFA" />
          <text x="100" y="21" fill="#0F766E" fontSize="8" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">₹9.80</text>
        </g>
      </g>
    </svg>
  );
}

/**
 * Step 4: Check and save — stock updates in seconds
 * Visual: Review screen with checkmarks and big green "Save to Stock" button updating inventory.
 */
export function Step4ReviewSaveSvg() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Illustration of reviewing extracted medicine stock and tapping save"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#F8FAFC" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#E2E8F0" strokeWidth="2" />

      {/* Review Box Container */}
      <rect x="35" y="18" width="250" height="164" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.05))" />

      {/* Header bar */}
      <rect x="35" y="18" width="250" height="34" rx="12" fill="#0F766E" />
      <rect x="35" y="40" width="250" height="12" fill="#0F766E" />
      <text x="50" y="39" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="system-ui, sans-serif">Review Scanned Items</text>
      
      {/* Badge: 3 items ready */}
      <rect x="205" y="26" width="68" height="18" rx="9" fill="#F0FDFA" />
      <text x="239" y="38" fill="#0F766E" fontSize="8.5" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">3 Verified</text>

      {/* Row 1 */}
      <rect x="48" y="60" width="224" height="22" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="60" cy="71" r="5" fill="#0F766E" />
      <path d="M58 71 L60 73 L63 69" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="72" y="74" fill="#1E293B" fontSize="8.5" fontWeight="600" fontFamily="system-ui, sans-serif">Augmentin 625 Duo</text>
      <text x="180" y="74" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">10 Packs</text>
      <text x="235" y="74" fill="#0F766E" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif">₹145.00</text>

      {/* Row 2 */}
      <rect x="48" y="87" width="224" height="22" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="60" cy="98" r="5" fill="#0F766E" />
      <path d="M58 98 L60 100 L63 96" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="72" y="101" fill="#1E293B" fontSize="8.5" fontWeight="600" fontFamily="system-ui, sans-serif">Montair LC Tablet</text>
      <text x="180" y="101" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">25 Strips</text>
      <text x="235" y="101" fill="#0F766E" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif">₹18.20</text>

      {/* Row 3 */}
      <rect x="48" y="114" width="224" height="22" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="60" cy="125" r="5" fill="#0F766E" />
      <path d="M58 125 L60 127 L63 123" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="72" y="128" fill="#1E293B" fontSize="8.5" fontWeight="600" fontFamily="system-ui, sans-serif">Combiflam Plus</text>
      <text x="180" y="128" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">40 Strips</text>
      <text x="235" y="128" fill="#0F766E" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif">₹8.50</text>

      {/* Save Button */}
      <rect x="48" y="145" width="224" height="28" rx="8" fill="#0F766E" />
      <text x="160" y="163" fill="#FFFFFF" fontSize="10.5" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">
        ✓ Save to Stock (+75 Items)
      </text>
    </svg>
  );
}

/**
 * Step 5: Get alerts before medicines expire or run out
 * Visual: Alert bell with notification badge, expiry warning card and low stock alert card.
 */
export function Step5AlertsSvg() {
  return (
    <svg
      viewBox="0 0 320 200"
      width="100%"
      style={{ maxWidth: 320, height: 'auto', display: 'block', margin: '0 auto' }}
      role="img"
      aria-label="Illustration of alert bell with expiry warning and low stock indicators"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="320" height="200" rx="16" fill="#F0FDFA" />
      <rect x="1" y="1" width="318" height="198" rx="15" fill="none" stroke="#CCFBF1" strokeWidth="2" />

      {/* Alert Bell in Center */}
      <g transform="translate(136, 20)">
        <circle cx="24" cy="24" r="28" fill="#FFFFFF" stroke="#0F766E" strokeWidth="2" filter="drop-shadow(0px 4px 8px rgba(15,118,110,0.15))" />
        {/* Bell Body */}
        <path d="M16 30 C16 23 18 16 24 16 C30 16 32 23 32 30 L35 32 L13 32 Z" fill="#0F766E" />
        <circle cx="24" cy="14" r="2" fill="#0F766E" />
        <circle cx="24" cy="34" r="3" fill="#0F766E" />
        {/* Notification Dot */}
        <circle cx="36" cy="14" r="6" fill="#ED6C02" stroke="#FFFFFF" strokeWidth="2" />
      </g>

      {/* Floating Card Left: Expiry Warning */}
      <g transform="translate(20, 90)">
        <rect width="134" height="85" rx="10" fill="#FFFFFF" stroke="#FED7AA" strokeWidth="1.5" filter="drop-shadow(0px 4px 6px rgba(237, 108, 2, 0.08))" />
        <rect x="8" y="10" width="60" height="16" rx="4" fill="#FFF7ED" />
        <circle cx="16" cy="18" r="3" fill="#ED6C02" />
        <text x="24" y="22" fill="#C2410C" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif">Expiry Alert</text>
        
        <text x="10" y="44" fill="#1E293B" fontSize="9.5" fontWeight="700" fontFamily="system-ui, sans-serif">Amoxicillin 500</text>
        <text x="10" y="58" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">Batch: AM21 • 15 Strips</text>
        
        <rect x="10" y="66" width="114" height="12" rx="3" fill="#FEF3C7" />
        <text x="67" y="75" fill="#B45309" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">⚠️ Expires in 30 Days</text>
      </g>

      {/* Floating Card Right: Low Stock Alert */}
      <g transform="translate(166, 90)">
        <rect width="134" height="85" rx="10" fill="#FFFFFF" stroke="#FECDD3" strokeWidth="1.5" filter="drop-shadow(0px 4px 6px rgba(225, 29, 72, 0.08))" />
        <rect x="8" y="10" width="65" height="16" rx="4" fill="#FFF1F2" />
        <circle cx="16" cy="18" r="3" fill="#E11D48" />
        <text x="24" y="22" fill="#BE123C" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif">Low Stock</text>
        
        <text x="10" y="44" fill="#1E293B" fontSize="9.5" fontWeight="700" fontFamily="system-ui, sans-serif">Cetirizine 10mg</text>
        <text x="10" y="58" fill="#64748B" fontSize="8" fontFamily="system-ui, sans-serif">Daily Sales: 8 Strips</text>
        
        <rect x="10" y="66" width="114" height="12" rx="3" fill="#FFE4E6" />
        <text x="67" y="75" fill="#BE123C" fontSize="7.5" fontWeight="700" textAnchor="middle" fontFamily="system-ui, sans-serif">🔴 Only 4 Strips Left</text>
      </g>
    </svg>
  );
}
