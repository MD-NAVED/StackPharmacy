import { useState } from 'react';
import { Alert, Button, Stack, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useAuth } from '../auth';
import { SUPPORT_WHATSAPP_LINK } from '../config/branding';

/**
 * Honest trial banner:
 * - Days 1 to 24: No banner (clean UI for chemist exploring the app)
 * - Days 25 to 30: ONE dismissible banner: "Your free month ends on {date}. After that it is ₹599 per month."
 * - Day 31+: Dismissible banner only ("Your free trial has ended. Continue using your store or subscribe to Pro for ₹599 per month.")
 * - NEVER locks data — store keeps functioning completely.
 */
export default function TrialBanner({ showUpgradeButton = true, sx = {} }) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('trial_banner_dismissed') === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;
  if (!user || user.tenantStatus !== 'trial' || !user.trialEndsAt) return null;

  const now = Date.now();
  const trialEndMs = new Date(user.trialEndsAt).getTime();
  const msRemaining = trialEndMs - now;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpired = msRemaining <= 0;

  // Day 1-24: no banner clutter
  if (!isExpired && daysRemaining > 5) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('trial_banner_dismissed', '1');
    } catch {}
  };

  const endDateStr = new Date(user.trialEndsAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const message = isExpired
    ? 'Your free trial has ended. Continue using your store or subscribe to Pro for ₹599 per month.'
    : `Your free month ends on ${endDateStr}. After that it is ₹599 per month.`;

  return (
    <Alert
      severity={isExpired ? 'warning' : 'info'}
      icon={<CardGiftcardIcon />}
      onClose={handleDismiss}
      action={
        showUpgradeButton ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
            <Button
              color="inherit"
              size="small"
              component={Link}
              to="/subscription"
              sx={{ fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              Pay now
            </Button>
            <Button
              color="inherit"
              size="small"
              component="a"
              href={SUPPORT_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
              sx={{ fontWeight: 700, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              WhatsApp us
            </Button>
          </Stack>
        ) : null
      }
      sx={{
        mb: 2.5,
        fontWeight: 600,
        alignItems: 'center',
        '& .MuiAlert-message': { flex: 1 },
        ...sx,
      }}
    >
      <Box component="span" sx={{ display: 'inline-block', mr: 1 }}>
        {message}
      </Box>
    </Alert>
  );
}
