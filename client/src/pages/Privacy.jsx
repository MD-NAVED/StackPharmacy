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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BrandMark from '../components/BrandMark';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import {
  BRAND_NAME,
  BRAND_TAGLINE,
  POLICY_METADATA,
  PRIVACY_SECTIONS,
  SUPPORT_WHATSAPP_LINK,
  SUPPORT_EMAIL
} from './privacyCopy';

export default function Privacy() {
  useEffect(() => {
    document.title = `${BRAND_NAME} — Privacy Policy`;
    window.scrollTo(0, 0);
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
      {/* TOP APP HEADER */}
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
                sx={{ fontWeight: 800, color: '#0F766E', lineHeight: 1.1, fontSize: '1.15rem' }}
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

          {/* Navigation link back to home */}
          <Button
            component={RouterLink}
            to="/"
            variant="text"
            size="small"
            startIcon={<ArrowBackIcon />}
            sx={{
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 1.5,
              '&:hover': { bgcolor: '#F1F5F9', color: '#0F766E' }
            }}
          >
            Home
          </Button>
        </Container>
      </Box>

      {/* HERO / DOCUMENT TITLE */}
      <Box
        component="section"
        sx={{
          pt: { xs: 4, sm: 5 },
          pb: { xs: 4, sm: 5 },
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip
              icon={<ShieldIcon sx={{ fontSize: '1rem !important', color: '#0F766E !important' }} />}
              label={POLICY_METADATA.version}
              size="small"
              sx={{
                bgcolor: '#CCFBF1',
                color: '#0F766E',
                fontWeight: 700,
                fontSize: '0.78rem',
                border: '1px solid #99F6E4'
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Effective date: {POLICY_METADATA.effectiveDate}
            </Typography>
          </Stack>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.25rem' },
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              mb: 1.5
            }}
          >
            {POLICY_METADATA.title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: '#475569',
              fontSize: { xs: '0.98rem', sm: '1.08rem' },
              lineHeight: 1.55,
              maxWidth: 620
            }}
          >
            {POLICY_METADATA.subtitle}
          </Typography>
        </Container>
      </Box>

      {/* POLICY CONTENT SECTIONS */}
      <Container maxWidth="md" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 4, sm: 6 } }}>
        <Stack spacing={4}>
          {PRIVACY_SECTIONS.map((sec) => (
            <Card
              key={sec.number}
              elevation={0}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: 3,
                bgcolor: '#FFFFFF',
                boxShadow: sec.number === 3 ? '0 4px 16px rgba(15,118,110,0.08)' : 'none',
                borderColor: sec.number === 3 ? '#99F6E4' : '#E2E8F0',
                overflow: 'hidden'
              }}
            >
              {/* Highlight bar for section 3 (Bill photos & AI processing) */}
              {sec.number === 3 && (
                <Box
                  sx={{
                    bgcolor: '#0F766E',
                    color: '#FFFFFF',
                    py: 0.6,
                    px: 2,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Important AI Transparency Notice
                </Box>
              )}

              <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.15rem', sm: '1.3rem' },
                    fontWeight: 800,
                    color: '#0F172A',
                    mb: 1,
                    lineHeight: 1.3
                  }}
                >
                  {sec.title}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: '#475569', fontSize: '0.92rem', mb: 2.5, lineHeight: 1.6 }}
                >
                  {sec.intro}
                </Typography>

                <Stack spacing={2}>
                  {sec.items.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: sec.number === 3 && idx === 1 ? '#F0FDFA' : '#F8FAFC',
                        border: '1px solid',
                        borderColor: sec.number === 3 && idx === 1 ? '#99F6E4' : '#F1F5F9'
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-start">
                        <CheckCircleOutlineIcon
                          sx={{
                            color: '#0F766E',
                            fontSize: 20,
                            flexShrink: 0,
                            mt: 0.2
                          }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: '#0F172A',
                              fontSize: '0.92rem',
                              mb: 0.5
                            }}
                          >
                            {item.heading}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.6 }}
                          >
                            {item.body}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>

                {/* Section 10: Interactive Contact Action Cards */}
                {sec.number === 10 && (
                  <Box sx={{ mt: 3 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      {/* WhatsApp Button */}
                      <Button
                        component="a"
                        href={SUPPORT_WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        startIcon={<WhatsAppIcon />}
                        sx={{
                          bgcolor: '#0F766E',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textTransform: 'none',
                          borderRadius: 2,
                          py: 1.25,
                          px: 2.5,
                          boxShadow: 'none',
                          '&:hover': { bgcolor: '#0D5F58', boxShadow: 'none' }
                        }}
                      >
                        WhatsApp Support (+91 9753880839)
                      </Button>

                      {/* Optional Email Row: only rendered if SUPPORT_EMAIL is configured */}
                      {Boolean(SUPPORT_EMAIL) && (
                        <Button
                          component="a"
                          href={`mailto:${SUPPORT_EMAIL}`}
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          sx={{
                            borderColor: '#CBD5E1',
                            color: '#1E293B',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textTransform: 'none',
                            borderRadius: 2,
                            py: 1.25,
                            px: 2.5,
                            '&:hover': { borderColor: '#0F766E', bgcolor: '#F0FDFA' }
                          }}
                        >
                          Email Support ({SUPPORT_EMAIL})
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>

      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          py: { xs: 4, sm: 5 },
          bgcolor: '#0F172A',
          color: '#E2E8F0',
          px: { xs: 2, sm: 3 },
          borderTop: '1px solid #1E293B'
        }}
      >
        <Container maxWidth="md" disableGutters sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BrandMark size={30} variant="dark" />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.1rem' }}>
              {BRAND_NAME}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: '#94A3B8', fontSize: '0.85rem', mb: 2.5, maxWidth: 360, mx: 'auto' }}
          >
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
              to="/"
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              Home
            </Link>
            <Link
              component={RouterLink}
              to="/onboarding"
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              5-Step Guide
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              sx={{ color: '#2DD4BF', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}
            >
              Privacy Policy
            </Link>
            <Link
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#2DD4BF' } }}
            >
              WhatsApp Support
            </Link>
          </Stack>

          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.78rem' }}>
            © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
