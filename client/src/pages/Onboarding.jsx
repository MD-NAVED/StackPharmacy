import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Stack,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import BrandMark, { BrandWordmark } from '../components/BrandMark';

import {
  BRAND_NAME,
  BRAND_TAGLINE,
  PRICING_SUMMARY,
  PRICING_MONTHLY,
  SUPPORT_WHATSAPP_LINK
} from '../config/branding';

import {
  Step1RegisterSvg,
  Step2CameraScanSvg,
  Step3AiExtractSvg,
  Step4ReviewSaveSvg,
  Step5AlertsSvg
} from '../components/onboarding/OnboardingIllustrations';

export default function Onboarding() {
  const [expandedFaq, setExpandedFaq] = useState(false);

  const handleFaqChange = (panel) => (event, isExpanded) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFFFFF',
        color: '#1E293B',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        pb: { xs: 16, sm: 18 } // Space for sticky bottom CTA
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
        <Container maxWidth="sm" disableGutters sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrandMark size={36} />
            <Box>
              <BrandWordmark
                variant="light"
                typographyProps={{ variant: 'h6' }}
                sx={{ lineHeight: 1.1, fontSize: '1.15rem' }}
              />
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.72rem', fontWeight: 500 }}>
                Chemist App
              </Typography>
            </Box>
          </Box>

          <Button
            component={RouterLink}
            to="/login"
            size="small"
            variant="outlined"
            sx={{
              color: '#0F766E',
              borderColor: '#0F766E',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              px: 1.75,
              py: 0.5,
              borderRadius: 2,
              '&:hover': {
                borderColor: '#0D9488',
                bgcolor: '#F0FDFA'
              }
            }}
          >
            Sign In
          </Button>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 }, pt: 3 }}>

        {/* SECTION 1: WHAT IS PHARMACYTRACK */}
        <Box component="section" sx={{ mb: 5 }}>
          {/* Tagline Badge */}
          <Chip
            label={PRICING_SUMMARY}
            size="small"
            sx={{
              bgcolor: '#F0FDFA',
              color: '#0F766E',
              fontWeight: 700,
              fontSize: '0.8rem',
              border: '1px solid #CCFBF1',
              mb: 1.5,
              py: 0.5
            }}
          />

          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#1E293B',
              fontSize: { xs: '1.65rem', sm: '2rem' },
              lineHeight: 1.25,
              mb: 1.5
            }}
          >
            What is {BRAND_NAME}?
          </Typography>

          {/* Plain English Paragraph (3 sentences max) */}
          <Typography
            sx={{
              color: '#334155',
              fontSize: { xs: '1rem', sm: '1.05rem' },
              lineHeight: 1.6,
              mb: 3
            }}
          >
            {BRAND_NAME} is an easy stock app made for Indian medical store owners. You take a photo of any purchase bill, and your medicine stock updates on your phone in seconds. It warns you before medicines expire and shows what you need to order next.
          </Typography>

          {/* 3 Benefit Cards */}
          <Stack spacing={2}>
            {/* Benefit Card 1 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#0F766E' }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
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
                    flexShrink: 0
                  }}
                >
                  <AccessTimeFilledIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.98rem', mb: 0.25 }}>
                    Save time on data entry
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.45 }}>
                    No more typing long medicine names, batch numbers, or rates by hand.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Benefit Card 2 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#0F766E' }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: '#FFF7ED',
                    color: '#EA580C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <EventBusyIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.98rem', mb: 0.25 }}>
                    Know expiry dates before they cost you money
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.45 }}>
                    Get clear color alerts before medicines go out of date on your shelf.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Benefit Card 3 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: '#0F766E' }
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: '#FFF1F2',
                    color: '#E11D48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.98rem', mb: 0.25 }}>
                    See low stock before your customers do
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.45 }}>
                    Know which medicines are running out so you can reorder before turning a patient away.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* SECTION 2: HOW IT WORKS (THE CORE OF THE FLOW) */}
        <Box component="section" sx={{ mb: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" sx={{ color: '#0F766E', fontWeight: 800, letterSpacing: 1.2, fontSize: '0.78rem' }}>
              STEP BY STEP
            </Typography>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                fontSize: { xs: '1.5rem', sm: '1.85rem' },
                lineHeight: 1.25,
                mb: 0.5
              }}
            >
              How it works
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.92rem' }}>
              Follow these 5 simple steps to get started with your pharmacy.
            </Typography>
          </Box>

          {/* 5 Numbered Steps Stacked Vertically */}
          <Stack spacing={3}>
            {/* Step 1 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3.5,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ p: { xs: 2.25, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Chip
                    label="Step 1"
                    size="small"
                    sx={{
                      bgcolor: '#0F766E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      height: 24
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.08rem' }}>
                    Create your free account
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, mb: 2 }}>
                  Sign up with your mobile number and store name in one minute. No credit card or computer needed.
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2.5, p: 1, border: '1px solid #F1F5F9' }}>
                  <Step1RegisterSvg />
                </Box>
              </Box>
            </Card>

            {/* Step 2 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3.5,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ p: { xs: 2.25, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Chip
                    label="Step 2"
                    size="small"
                    sx={{
                      bgcolor: '#0F766E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      height: 24
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.08rem' }}>
                    Take a photo of a purchase bill
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, mb: 2 }}>
                  Use your phone camera to snap a clear photo of your distributor bill. Flat table lighting works best.
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2.5, p: 1, border: '1px solid #F1F5F9' }}>
                  <Step2CameraScanSvg />
                </Box>
              </Box>
            </Card>

            {/* Step 3 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3.5,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ p: { xs: 2.25, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Chip
                    label="Step 3"
                    size="small"
                    sx={{
                      bgcolor: '#0F766E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      height: 24
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.08rem' }}>
                    AI reads the bill and fills in the items
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, mb: 2 }}>
                  Smart computer vision reads the medicine names, batch numbers, and prices. It matches them with standard medicine names automatically.
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2.5, p: 1, border: '1px solid #F1F5F9' }}>
                  <Step3AiExtractSvg />
                </Box>
              </Box>
            </Card>

            {/* Step 4 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3.5,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ p: { xs: 2.25, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Chip
                    label="Step 4"
                    size="small"
                    sx={{
                      bgcolor: '#0F766E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      height: 24
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.08rem' }}>
                    Check and save — stock updates in seconds
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, mb: 2 }}>
                  Look over the items on your screen and tap save. Your store inventory and purchase rates update immediately.
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2.5, p: 1, border: '1px solid #F1F5F9' }}>
                  <Step4ReviewSaveSvg />
                </Box>
              </Box>
            </Card>

            {/* Step 5 */}
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 3.5,
                overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <Box sx={{ p: { xs: 2.25, sm: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Chip
                    label="Step 5"
                    size="small"
                    sx={{
                      bgcolor: '#0F766E',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      height: 24
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', fontSize: '1.08rem' }}>
                    Get alerts before medicines expire or run out
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.55, mb: 2 }}>
                  Check your alerts tab any day to see expiring batches and low quantities. Return near-expiry stock to distributors in time to protect your money.
                </Typography>
                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2.5, p: 1, border: '1px solid #F1F5F9' }}>
                  <Step5AlertsSvg />
                </Box>
              </Box>
            </Card>
          </Stack>
        </Box>

        {/* SECTION 3: WHAT YOU NEED */}
        <Box component="section" sx={{ mb: 6 }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="overline" sx={{ color: '#0F766E', fontWeight: 800, letterSpacing: 1.2, fontSize: '0.78rem' }}>
              REQUIREMENTS
            </Typography>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                fontSize: { xs: '1.45rem', sm: '1.75rem' },
                lineHeight: 1.25,
                mb: 0.5
              }}
            >
              What you need
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.92rem' }}>
              Nothing complicated. You can run your whole pharmacy with three everyday things:
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            {/* Requirement 1 */}
            <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    color: '#0F766E',
                    border: '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <SmartphoneIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                    An Android phone
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                    Works on any simple smartphone you already have in your counter.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Requirement 2 */}
            <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    color: '#0F766E',
                    border: '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <PhotoCameraIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                    The phone camera
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                    Use your standard built-in camera to take photos of bills.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Requirement 3 */}
            <Card sx={{ bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    color: '#0F766E',
                    border: '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <SignalCellularAltIcon sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                    A little internet
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                    Small mobile data is enough. 2G, 3G or 4G speeds work fine.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* SECTION 4: COMMON QUESTIONS */}
        <Box component="section" sx={{ mb: 6 }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="overline" sx={{ color: '#0F766E', fontWeight: 800, letterSpacing: 1.2, fontSize: '0.78rem' }}>
              FREQUENTLY ASKED
            </Typography>
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 800,
                color: '#1E293B',
                fontSize: { xs: '1.45rem', sm: '1.75rem' },
                lineHeight: 1.25,
                mb: 0.5
              }}
            >
              Common questions
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.92rem' }}>
              Clear and honest answers for pharmacy owners.
            </Typography>
          </Box>

          <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            {/* Q1: Is my data safe? */}
            <Accordion
              expanded={expandedFaq === 'panel1'}
              onChange={handleFaqChange('panel1')}
              disableGutters
              elevation={0}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0F766E' }} />} sx={{ py: 0.5, px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  Is my data safe?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Yes. Your store records, purchase bills, and medicine prices are private to you. No other pharmacy can see your stock or customer details.
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Q2: Do I need internet to use it? */}
            <Accordion
              expanded={expandedFaq === 'panel2'}
              onChange={handleFaqChange('panel2')}
              disableGutters
              elevation={0}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0F766E' }} />} sx={{ py: 0.5, px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  Do I need internet to use it?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  You need a small internet connection. Scanning uses very little data.
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Q3: What if the scan does not read my bill? */}
            <Accordion
              expanded={expandedFaq === 'panel3'}
              onChange={handleFaqChange('panel3')}
              disableGutters
              elevation={0}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0F766E' }} />} sx={{ py: 0.5, px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  What if the scan does not read my bill?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  You can enter items manually with one tap. Scanning is a fast shortcut, not a requirement.
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Q4: What does it cost after the first month? */}
            <Accordion
              expanded={expandedFaq === 'panel4'}
              onChange={handleFaqChange('panel4')}
              disableGutters
              elevation={0}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0F766E' }} />} sx={{ py: 0.5, px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  What does it cost after the first month?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Your first month is completely free with all features included. After that, it costs {PRICING_MONTHLY.includes('per month') ? PRICING_MONTHLY : `${PRICING_MONTHLY} per month`} with no hidden fees and you can stop anytime.
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Q5: Who do I contact if I need help? */}
            <Accordion
              expanded={expandedFaq === 'panel5'}
              onChange={handleFaqChange('panel5')}
              disableGutters
              elevation={0}
              sx={{
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#0F766E' }} />} sx={{ py: 0.5, px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  Who do I contact if I need help?
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <Typography sx={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, mb: 1 }}>
                  You can message our support team directly on WhatsApp anytime. We are happy to help you set up your store and answer questions.
                </Typography>
                <Link
                  href={SUPPORT_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: '#0F766E',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <WhatsAppIcon sx={{ fontSize: 18, color: '#16A34A' }} />
                  Chat with us on WhatsApp
                </Link>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* TRUST BADGE / SUMMARY */}
        <Box
          sx={{
            textAlign: 'center',
            p: 3,
            bgcolor: '#F0FDFA',
            borderRadius: 3,
            border: '1px solid #CCFBF1',
            mb: 4
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon sx={{ color: '#0F766E', fontSize: 24 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F766E', fontSize: '1.05rem', mb: 0.5 }}>
            Ready to save hours every week?
          </Typography>
          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.88rem', maxWidth: 360, mx: 'auto', mb: 2 }}>
            Made for pharmacy owners across India.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#0F766E',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.92rem',
              py: 1,
              px: 3,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 4px 10px rgba(15,118,110,0.25)',
              '&:hover': { bgcolor: '#0D9488' }
            }}
          >
            Start Your Free Month
          </Button>
        </Box>

      </Container>

      {/* SECTION 5: STICKY BOTTOM CTA BAR ON MOBILE */}
      <Box
        component="footer"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid #E2E8F0',
          py: 1.5,
          px: { xs: 2, sm: 3 },
          zIndex: 50,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#1E293B', fontSize: { xs: '0.9rem', sm: '0.95rem' }, lineHeight: 1.2 }}>
                Start free — first month free
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>
                {PRICING_MONTHLY.includes('per month') ? `Then ${PRICING_MONTHLY}` : `Then ${PRICING_MONTHLY} per month`} • Cancel anytime
              </Typography>
            </Box>

            <Link
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contact support on WhatsApp"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: '#DCFCE7',
                color: '#15803D',
                px: 1.25,
                py: 0.6,
                borderRadius: 2,
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                '&:hover': { bgcolor: '#BBF7D0' }
              }}
            >
              <WhatsAppIcon sx={{ fontSize: 16 }} />
              WhatsApp Help
            </Link>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button
              component={RouterLink}
              to="/signup"
              fullWidth
              variant="contained"
              sx={{
                bgcolor: '#0F766E',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                py: 1.2,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 3px 8px rgba(15,118,110,0.3)',
                '&:hover': { bgcolor: '#0D9488' }
              }}
            >
              Start Free Trial
            </Button>

            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              sx={{
                minWidth: 90,
                color: '#1E293B',
                borderColor: '#CBD5E1',
                fontWeight: 700,
                fontSize: '0.9rem',
                py: 1.2,
                borderRadius: 2.5,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#94A3B8',
                  bgcolor: '#F8FAFC'
                }
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
