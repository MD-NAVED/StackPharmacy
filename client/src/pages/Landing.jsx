import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Link,
  Divider
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BrandMark from '../components/BrandMark';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import BoltIcon from '@mui/icons-material/Bolt';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';

import { useAuth } from '../auth';
import {
  BRAND_NAME,
  BRAND_TAGLINE,
  HERO_COPY,
  VIDEO_COPY,
  FEATURES_COPY,
  PRICING_COPY,
  FINAL_CTA_COPY,
  FOOTER_COPY,
  SUPPORT_WHATSAPP_LINK
} from './landingCopy';
import { HeroPhoneMockupSvg, DemoVideoPosterSvg } from '../components/landing/LandingVisuals';

// Check at build time if the local video file is present in public/videos
const videoModules =
  typeof import.meta !== 'undefined' && import.meta.glob
    ? import.meta.glob('/public/videos/demo-60s.mp4', { eager: true })
    : {};
const HAS_LOCAL_VIDEO_FILE = Object.keys(videoModules).length > 0;

export default function Landing() {
  const auth = useAuth ? useAuth() : null;
  const user = auth?.user;

  useEffect(() => {
    document.title = `${BRAND_NAME} — ${BRAND_TAGLINE}`;
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFFFFF',
        color: '#1E293B',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* TOP HEADER */}
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid #E2E8F0',
          py: 1.75,
          px: { xs: 2, sm: 3 },
          bgcolor: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <Container
          maxWidth="md"
          disableGutters
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Brand Logo & Name */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <BrandMark size={36} />
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, color: '#212121', lineHeight: 1.1, fontSize: '1.15rem' }}
              >
                {BRAND_NAME}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}
              >
                Chemist App
              </Typography>
            </Box>
          </Box>

          {/* Header Action: Login / Dashboard */}
          <Stack direction="row" spacing={1} alignItems="center">
            {user ? (
              <Button
                component={RouterLink}
                to="/dashboard"
                variant="contained"
                size="small"
                startIcon={<SpaceDashboardIcon />}
                sx={{
                  bgcolor: '#0F766E',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 1.75,
                  '&:hover': { bgcolor: '#0D5F58' }
                }}
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="text"
                  size="small"
                  sx={{
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    px: 1.5,
                    '&:hover': { bgcolor: '#F1F5F9' }
                  }}
                >
                  Log in
                </Button>
                <Button
                  component={RouterLink}
                  to="/signup"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#0F766E',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 1.75,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#0D5F58', boxShadow: 'none' }
                  }}
                >
                  Start Free
                </Button>
              </>
            )}
          </Stack>
        </Container>
      </Box>

      {/* SECTION 1: HERO */}
      <Box
        component="section"
        sx={{
          pt: { xs: 4, sm: 6 },
          pb: { xs: 5, sm: 7 },
          bgcolor: '#FAFAFA',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Pricing Pill Badge */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Chip
              label={HERO_COPY.badge}
              sx={{
                bgcolor: '#CCFBF1',
                color: '#0F766E',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: '1px solid #99F6E4',
                px: 0.5,
                height: 30
              }}
            />
          </Box>

          {/* Headline (max 8 words, plain English) */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.85rem', sm: '2.35rem' },
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#0F172A',
              letterSpacing: '-0.02em',
              textAlign: 'center',
              mb: 1.75
            }}
          >
            {HERO_COPY.headline}
          </Typography>

          {/* Subheadline (1-2 sentences on saved hours and fewer losses) */}
          <Typography
            variant="body1"
            sx={{
              color: '#475569',
              fontSize: { xs: '0.98rem', sm: '1.08rem' },
              lineHeight: 1.55,
              textAlign: 'center',
              maxWidth: 460,
              mx: 'auto',
              mb: 3.5
            }}
          >
            {HERO_COPY.subheadline}
          </Typography>

          {/* Two Action CTAs */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Button
              component={RouterLink}
              to={HERO_COPY.primaryCtaLink}
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                py: 1.4,
                px: 3,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(15,118,110,0.25)',
                '&:hover': {
                  bgcolor: '#0D5F58',
                  boxShadow: '0 6px 16px rgba(15,118,110,0.35)'
                }
              }}
            >
              {HERO_COPY.primaryCtaText}
            </Button>

            <Button
              component={RouterLink}
              to={HERO_COPY.secondaryCtaLink}
              variant="outlined"
              size="large"
              startIcon={<MenuBookIcon />}
              sx={{
                borderColor: '#CBD5E1',
                color: '#1E293B',
                fontWeight: 700,
                fontSize: '0.95rem',
                py: 1.4,
                px: 2.5,
                borderRadius: 2.5,
                textTransform: 'none',
                bgcolor: '#FFFFFF',
                '&:hover': {
                  borderColor: '#0F766E',
                  bgcolor: '#F0FDFA',
                  color: '#0F766E'
                }
              }}
            >
              {HERO_COPY.secondaryCtaText}
            </Button>
          </Stack>

          {/* Visual: Phone-frame SVG mockup */}
          <HeroPhoneMockupSvg />
        </Container>
      </Box>

      {/* SECTION 2: 60-SECOND DEMO VIDEO */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, sm: 7 },
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.4rem', sm: '1.7rem' },
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.01em',
                mb: 1
              }}
            >
              {VIDEO_COPY.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 440, mx: 'auto', lineHeight: 1.5 }}
            >
              {VIDEO_COPY.subtitle}
            </Typography>
          </Box>

          {/* Missing-File Safe Player: Local file only, no external hosting, zero console errors */}
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
              bgcolor: '#0F172A',
              maxWidth: 540,
              mx: 'auto'
            }}
          >
            {HAS_LOCAL_VIDEO_FILE ? (
              <Box
                component="video"
                src={VIDEO_COPY.videoSrc}
                controls
                muted
                playsInline
                preload="metadata"
                sx={{
                  width: '100%',
                  display: 'block',
                  borderRadius: 3
                }}
              />
            ) : (
              <Box>
                <DemoVideoPosterSvg />
                <Box sx={{ p: 2, bgcolor: '#1E293B', borderTop: '1px solid #334155', textAlign: 'center' }}>
                  <Typography sx={{ color: '#E2E8F0', fontSize: '0.88rem', fontWeight: 600 }}>
                    {VIDEO_COPY.missingCaption}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {/* SECTION 3: "MADE FOR YOUR COUNTER" */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, sm: 7 },
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.4rem', sm: '1.7rem' },
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.01em',
                mb: 1
              }}
            >
              {FEATURES_COPY.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 420, mx: 'auto' }}
            >
              {FEATURES_COPY.subtitle}
            </Typography>
          </Box>

          <Stack spacing={2}>
            {FEATURES_COPY.cards.map((card, idx) => (
              <Card
                key={card.id}
                elevation={0}
                sx={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 3,
                  bgcolor: '#FFFFFF',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(15,118,110,0.08)',
                    borderColor: '#99F6E4'
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2.25, sm: 2.5 }, '&:last-child': { pb: { xs: 2.25, sm: 2.5 } } }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2.5,
                        bgcolor: '#F0FDFA',
                        color: '#0F766E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #CCFBF1'
                      }}
                    >
                      {idx === 0 && <SmartphoneIcon sx={{ fontSize: 24 }} />}
                      {idx === 1 && <BoltIcon sx={{ fontSize: 24 }} />}
                      {idx === 2 && <WhatsAppIcon sx={{ fontSize: 24 }} />}
                    </Box>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem', mb: 0.5, lineHeight: 1.3 }}
                      >
                        {card.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.55 }}>
                        {card.text}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* SECTION 4: PRICING (Honest and Simple) */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, sm: 7 },
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.4rem', sm: '1.7rem' },
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.01em',
                mb: 1
              }}
            >
              {PRICING_COPY.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#64748B', fontSize: '0.92rem', maxWidth: 420, mx: 'auto' }}
            >
              {PRICING_COPY.subtitle}
            </Typography>
          </Box>

          {/* Single Honest Pricing Card */}
          <Card
            elevation={0}
            sx={{
              border: '2px solid #0F766E',
              borderRadius: 3.5,
              bgcolor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(15,118,110,0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Top Teal Pill Header */}
            <Box
              sx={{
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                py: 1,
                px: 2,
                textAlign: 'center'
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                {PRICING_COPY.firstMonth}
              </Typography>
            </Box>

            <CardContent sx={{ p: { xs: 3, sm: 3.5 } }}>
              <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2rem' },
                    fontWeight: 800,
                    color: '#0F172A',
                    mb: 0.5
                  }}
                >
                  {PRICING_COPY.monthlyRate}
                </Typography>
                <Typography sx={{ color: '#0F766E', fontWeight: 600, fontSize: '0.9rem' }}>
                  {PRICING_COPY.guarantee}
                </Typography>
              </Box>

              <Divider sx={{ my: 2.5, borderColor: '#F1F5F9' }} />

              {/* Feature Points */}
              <Stack spacing={1.5} sx={{ mb: 3.5, maxWidth: 360, mx: 'auto' }}>
                {PRICING_COPY.bullets.map((bullet, idx) => (
                  <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon sx={{ color: '#0F766E', fontSize: 20, flexShrink: 0 }} />
                    <Typography sx={{ color: '#334155', fontSize: '0.92rem', fontWeight: 500 }}>
                      {bullet}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              {/* Primary Signup CTA */}
              <Button
                component={RouterLink}
                to={PRICING_COPY.ctaLink}
                variant="contained"
                fullWidth
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#0F766E',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '1rem',
                  py: 1.5,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(15,118,110,0.3)',
                  '&:hover': {
                    bgcolor: '#0D5F58'
                  }
                }}
              >
                {PRICING_COPY.ctaText}
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* SECTION 5: FINAL CTA & FOOTER */}
      <Box
        component="section"
        sx={{
          py: { xs: 5, sm: 6 },
          bgcolor: '#F0FDFA',
          borderBottom: '1px solid #CCFBF1',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              fontSize: { xs: '1.25rem', sm: '1.45rem' },
              mb: 2
            }}
          >
            {FINAL_CTA_COPY.prompt}
          </Typography>
          <Button
            component={RouterLink}
            to={FINAL_CTA_COPY.guideLink}
            variant="outlined"
            size="large"
            endIcon={<ArrowForwardIcon />}
            sx={{
              borderColor: '#0F766E',
              color: '#0F766E',
              bgcolor: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              py: 1.25,
              px: 3,
              borderRadius: 2.5,
              textTransform: 'none',
              '&:hover': {
                bgcolor: '#0F766E',
                color: '#FFFFFF'
              }
            }}
          >
            {FINAL_CTA_COPY.guideLinkText}
          </Button>
        </Container>
      </Box>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          py: { xs: 4, sm: 5 },
          bgcolor: '#0F172A',
          color: '#E2E8F0',
          px: { xs: 2, sm: 3 }
        }}
      >
        <Container maxWidth="sm" disableGutters sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BrandMark size={30} variant="dark" />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.1rem' }}>
              {BRAND_NAME}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.85rem', mb: 2.5, maxWidth: 360, mx: 'auto' }}>
            {BRAND_TAGLINE}
          </Typography>

          {/* Footer Navigation Links */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            divider={<Box sx={{ color: '#475569' }}>•</Box>}
            sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}
          >
            <Link
              component={RouterLink}
              to={FOOTER_COPY.guideLink}
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              {FOOTER_COPY.guideText}
            </Link>
            <Link
              component={RouterLink}
              to={FOOTER_COPY.privacyLink}
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              {FOOTER_COPY.privacyText}
            </Link>
            <Link
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              {FOOTER_COPY.supportText}
            </Link>
          </Stack>

          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.78rem' }}>
            {FOOTER_COPY.copyright}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
