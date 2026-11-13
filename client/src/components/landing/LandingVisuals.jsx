import React from 'react';
import { Box } from '@mui/material';

/**
 * Hero Phone Mockup SVG
 * Visualizes a paper distributor bill photo converting into an organized live stock list.
 * Palette: Teal #0F766E, Navy #1E293B, White #FFFFFF, Slate #64748B, Soft Teal #F0FDFA.
 */
export function HeroPhoneMockupSvg({ sx = {} }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 340 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Phone mockup showing paper bill photo converting into live medicine stock list"
      sx={{
        width: '100%',
        maxWidth: 340,
        height: 'auto',
        display: 'block',
        mx: 'auto',
        filter: 'drop-shadow(0 12px 24px rgba(15,118,110,0.14))',
        ...sx
      }}
    >
      {/* Phone outer frame */}
      <rect x="10" y="10" width="320" height="440" rx="36" fill="#1E293B" stroke="#0F766E" strokeWidth="3" />
      {/* Phone inner screen */}
      <rect x="20" y="24" width="300" height="412" rx="26" fill="#F8FAFC" />
      {/* Speaker ear-piece & selfie camera notch */}
      <rect x="120" y="16" width="100" height="5" rx="2.5" fill="#334155" />
      <circle cx="170" cy="34" r="3.5" fill="#334155" />

      {/* TOP SECTION: Paper Purchase Bill */}
      <g transform="translate(32, 46)">
        {/* Bill Paper background */}
        <rect x="0" y="0" width="276" height="150" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        
        {/* Bill Header badge */}
        <rect x="12" y="12" width="100" height="18" rx="4" fill="#0F766E" />
        <text x="18" y="25" fill="#FFFFFF" fontSize="9" fontWeight="700" fontFamily="sans-serif">
          DISTRIBUTOR BILL
        </text>

        {/* Invoice details mock lines */}
        <text x="12" y="44" fill="#64748B" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          Inv: #MH-94812 • Date: Today
        </text>
        <line x1="12" y1="52" x2="264" y2="52" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

        {/* Bill Row 1 */}
        <rect x="12" y="60" width="14" height="14" rx="3" fill="#E0F2FE" />
        <text x="32" y="71" fill="#1E293B" fontSize="10" fontWeight="700" fontFamily="sans-serif">
          Dolo 650mg Tab
        </text>
        <text x="220" y="71" fill="#475569" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          50 Tabs
        </text>

        {/* Bill Row 2 */}
        <rect x="12" y="82" width="14" height="14" rx="3" fill="#E0F2FE" />
        <text x="32" y="93" fill="#1E293B" fontSize="10" fontWeight="700" fontFamily="sans-serif">
          Amoxyclav 625mg
        </text>
        <text x="220" y="93" fill="#475569" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          20 Tabs
        </text>

        {/* Bill Row 3 (faded) */}
        <rect x="12" y="104" width="14" height="14" rx="3" fill="#E0F2FE" />
        <text x="32" y="115" fill="#64748B" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          Azithral 500mg
        </text>
        <text x="220" y="115" fill="#94A3B8" fontSize="10" fontWeight="600" fontFamily="sans-serif">
          10 Tabs
        </text>

        {/* Barcode lines at bottom of bill */}
        <rect x="12" y="128" width="2" height="12" fill="#94A3B8" />
        <rect x="16" y="128" width="4" height="12" fill="#94A3B8" />
        <rect x="22" y="128" width="1" height="12" fill="#94A3B8" />
        <rect x="25" y="128" width="3" height="12" fill="#94A3B8" />
        <rect x="30" y="128" width="2" height="12" fill="#94A3B8" />
        <rect x="34" y="128" width="5" height="12" fill="#94A3B8" />
      </g>

      {/* TRANSITION: AI Extraction Beam & Badge */}
      <g transform="translate(32, 204)">
        {/* Glow beam */}
        <rect x="0" y="0" width="276" height="2" fill="#0F766E" />
        <rect x="0" y="2" width="276" height="8" fill="url(#beamGradient)" opacity="0.4" />
        
        {/* Center Pill */}
        <rect x="68" y="5" width="140" height="22" rx="11" fill="#0F766E" filter="drop-shadow(0 2px 4px rgba(15,118,110,0.3))" />
        <circle cx="82" cy="16" r="4" fill="#2DD4BF" />
        <text x="94" y="20" fill="#FFFFFF" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">
          AI Bill Reading
        </text>
      </g>

      {/* BOTTOM SECTION: Live Updated Inventory */}
      <g transform="translate(32, 246)">
        {/* Section title inside phone */}
        <text x="2" y="12" fill="#0F766E" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          LIVE STORE STOCK
        </text>
        <rect x="204" y="2" width="72" height="14" rx="7" fill="#CCFBF1" />
        <text x="212" y="12" fill="#0F766E" fontSize="8" fontWeight="700" fontFamily="sans-serif">
          UPDATED
        </text>

        {/* Stock Item 1 */}
        <rect x="0" y="22" width="276" height="66" rx="10" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
        <circle cx="20" cy="45" r="9" fill="#0F766E" />
        {/* Checkmark */}
        <path d="M16 45L19 48L24 42" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="36" y="42" fill="#1E293B" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          Dolo 650mg Tab
        </text>
        <text x="36" y="56" fill="#64748B" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          Batch: DL-92 • Exp: 12/28 • Rack: A-2
        </text>
        <rect x="210" y="36" width="54" height="20" rx="5" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1" />
        <text x="220" y="50" fill="#0F766E" fontSize="10" fontWeight="800" fontFamily="sans-serif">
          +50 Qty
        </text>

        {/* Stock Item 2 */}
        <rect x="0" y="96" width="276" height="66" rx="10" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
        <circle cx="20" cy="119" r="9" fill="#0F766E" />
        <path d="M16 119L19 122L24 116" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="36" y="116" fill="#1E293B" fontSize="11" fontWeight="800" fontFamily="sans-serif">
          Amoxyclav 625mg
        </text>
        <text x="36" y="130" fill="#64748B" fontSize="9" fontWeight="600" fontFamily="sans-serif">
          Batch: AX-10 • Exp: 06/28 • Rack: B-1
        </text>
        <rect x="210" y="110" width="54" height="20" rx="5" fill="#F0FDFA" stroke="#99F6E4" strokeWidth="1" />
        <text x="220" y="124" fill="#0F766E" fontSize="10" fontWeight="800" fontFamily="sans-serif">
          +20 Qty
        </text>
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="beamGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
        </linearGradient>
      </defs>
    </Box>
  );
}

/**
 * Demo Video Poster Frame SVG
 * 16:9 poster displaying a phone scanning a bill and a central prominent play button.
 * Palette: Slate Navy #0F172A / #1E293B, Teal #0F766E, White #FFFFFF.
 */
export function DemoVideoPosterSvg({ sx = {} }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 640 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Video preview frame showing a phone camera scanning a distributor bill with play button"
      sx={{
        width: '100%',
        height: 'auto',
        display: 'block',
        borderRadius: 3,
        ...sx
      }}
    >
      {/* Background canvas */}
      <rect width="640" height="360" rx="16" fill="#0F172A" />
      {/* Subtle grid pattern */}
      <defs>
        <pattern id="posterGrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1E293B" strokeWidth="0.8" />
        </pattern>
        <linearGradient id="playGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="16" fill="url(#posterGrid)" />

      {/* Bill preview on the left inside video frame */}
      <g transform="translate(130, 70)">
        {/* Slanted bill sheet */}
        <rect x="0" y="0" width="160" height="220" rx="8" fill="#FFFFFF" opacity="0.92" />
        <rect x="16" y="20" width="80" height="12" rx="3" fill="#0F766E" />
        <rect x="16" y="44" width="128" height="6" rx="2" fill="#E2E8F0" />
        <rect x="16" y="58" width="100" height="6" rx="2" fill="#E2E8F0" />
        <rect x="16" y="78" width="128" height="10" rx="3" fill="#F1F5F9" />
        <rect x="16" y="96" width="128" height="10" rx="3" fill="#F1F5F9" />
        <rect x="16" y="114" width="128" height="10" rx="3" fill="#F1F5F9" />
        <rect x="16" y="132" width="128" height="10" rx="3" fill="#F1F5F9" />
      </g>

      {/* Phone scanning viewfinder overlay */}
      <g transform="translate(230, 40)">
        {/* Phone chassis */}
        <rect x="0" y="0" width="190" height="280" rx="24" fill="#1E293B" stroke="#334155" strokeWidth="3" />
        <rect x="8" y="12" width="174" height="256" rx="16" fill="#020617" />
        
        {/* Viewfinder crosshairs */}
        <path d="M 28 36 L 44 36 M 28 36 L 28 52" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
        <path d="M 162 36 L 146 36 M 162 36 L 162 52" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
        <path d="M 28 244 L 44 244 M 28 244 L 28 228" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
        <path d="M 162 244 L 146 244 M 162 244 L 162 228" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />

        {/* Laser scan line */}
        <line x1="28" y1="140" x2="162" y2="140" stroke="#14B8A6" strokeWidth="2.5" />
        <line x1="28" y1="140" x2="162" y2="140" stroke="#5EEAD4" strokeWidth="1" strokeDasharray="6 4" />
      </g>

      {/* Prominent Play Button in center */}
      <g transform="translate(320, 180)">
        {/* Glow ripple */}
        <circle cx="0" cy="0" r="48" fill="#0F766E" opacity="0.3" />
        {/* Main button disc */}
        <circle cx="0" cy="0" r="36" fill="url(#playGradient)" filter="drop-shadow(0 4px 14px rgba(15,118,110,0.6))" />
        {/* Play triangle */}
        <polygon points="-8,-14 16,0 -8,14" fill="#FFFFFF" />
      </g>

      {/* Duration Badge */}
      <g transform="translate(490, 310)">
        <rect x="0" y="0" width="124" height="26" rx="6" fill="#000000" opacity="0.75" />
        <circle cx="16" cy="13" r="4" fill="#2DD4BF" />
        <text x="28" y="17" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily="sans-serif">
          60s Demo
        </text>
      </g>
    </Box>
  );
}
