import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Button, Chip, Alert, Snackbar,
  Divider, Stack, List, ListItem, ListItemIcon, ListItemText, Skeleton,
  ToggleButtonGroup, ToggleButton, Link as MuiLink,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { api, getCachedData } from '../api';
import { useAuth } from '../auth';
import TrialBanner from '../components/TrialBanner';
import { BRAND_NAME, SUPPORT_WHATSAPP_LINK } from '../config/branding';

const inr = (paise) => '₹' + (paise / 100).toLocaleString('en-IN');

const PRO_FEATURES = [
  'AI Invoice Scanner — extract bill items, batch & expiry automatically',
  'Billing & GST Invoices (A4 & thermal receipt print)',
  'Medicines, inventory & automated expiry alerts',
  'Purchases & real-time counter dashboard',
  'Khata (Customer credit / Udhaar book with balance tracking)',
  'WhatsApp bill & receipt sharing directly with customers',
  'WhatsApp daily business summary',
  'Excel & CSV data import wizard',
  'Full sales, purchases, GST & profit reports',
  'Unlimited staff & operator accounts',
];

export default function Subscription() {
  const locked = new URLSearchParams(window.location.search).get('locked') === '1';
  const { user } = useAuth();
  const cachedPlans = getCachedData('/api/billing/plans');
  const [plans, setPlans] = useState(() => cachedPlans?.plans || []);
  const [gateway, setGateway] = useState(() => cachedPlans?.gateway || 'not_configured');
  const [cycle, setCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loading, setLoading] = useState(() => !cachedPlans);
  const [paying, setPaying] = useState(false);
  const [snack, setSnack] = useState(null);
  const scriptLoaded = useRef(false);

  const loadPlans = () => {
    api('/api/billing/plans')
      .then((r) => {
        setPlans(r.plans || []);
        setGateway(r.gateway || 'not_configured');
        setLoading(false);
      })
      .catch((e) => {
        setSnack({ severity: 'error', message: e.message });
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPlans();
    if (window.Razorpay) {
      scriptLoaded.current = true;
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => {
      scriptLoaded.current = true;
    };
    document.body.appendChild(s);
  }, []);

  const selectedPlanId = cycle === 'yearly' ? 'pro-yearly' : 'pro-monthly';
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || {
    id: selectedPlanId,
    amount: cycle === 'yearly' ? 499900 : 59900,
    label: cycle === 'yearly' ? 'Pro — Yearly' : 'Pro — Monthly',
    months: cycle === 'yearly' ? 12 : 1,
    price_per_month: cycle === 'yearly' ? 416 : 599,
  };

  const payNow = async () => {
    setPaying(true);
    try {
      if (gateway !== 'razorpay' || !scriptLoaded.current) {
        setSnack({
          severity: 'warning',
          message: 'Online payment is not active yet. Please try again in a few minutes or contact support.',
        });
        return;
      }
      const order = await api('/api/billing/create-order', {
        method: 'POST',
        body: { plan: selectedPlan.id },
      });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: BRAND_NAME,
        description: `Pro Subscription — ${order.store_name}`,
        order_id: order.order_id,
        prefill: { name: order.store_name },
        theme: { color: '#0F766E' },
        handler: async (resp) => {
          try {
            await api('/api/billing/verify', { method: 'POST', body: resp });
            setSnack({
              severity: 'success',
              message: `Payment successful! Your Pro subscription is now active for ${order.months} month(s). 🎉`,
            });
            loadPlans();
          } catch (e) {
            setSnack({ severity: 'error', message: 'Payment verification failed: ' + e.message });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e) {
      setSnack({ severity: 'error', message: e.message });
    } finally {
      setPaying(false);
    }
  };

  if (loading && plans.length === 0) {
    return (
      <Box sx={{ maxWidth: 720, mx: 'auto', p: 2 }}>
        <Skeleton variant="rounded" height={80} sx={{ mb: 3, borderRadius: 2 }} animation="wave" />
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 2 }} animation="wave" />
      </Box>
    );
  }

  const isTrial = user?.tenantStatus === 'trial';
  const subEndsAt = user?.subscriptionEndsAt
    ? new Date(user.subscriptionEndsAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: { xs: 1.5, sm: 2 } }}>
      <TrialBanner showUpgradeButton={false} />

      {locked && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your subscription renewal is pending. Please subscribe below to continue receiving continuous updates. Your data is always safe and never deleted.
        </Alert>
      )}

      {/* Header Banner */}
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          textAlign: 'center',
          mb: 3,
          background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
          color: '#fff',
          borderRadius: 2.5,
          boxShadow: '0 4px 20px rgba(15, 118, 110, 0.15)',
        }}
      >
        <WorkspacePremiumIcon sx={{ fontSize: 44, mb: 1, color: '#A7F3D0' }} />
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          {BRAND_NAME} Subscription
        </Typography>
        <Typography sx={{ mt: 0.75, opacity: 0.95, fontSize: '0.95rem' }}>
          Secure payment by Razorpay — UPI, Debit/Credit Card and NetBanking accepted.
        </Typography>
        <Box sx={{ mt: 1.5, display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.15)', px: 2, py: 0.5, borderRadius: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            CURRENT PLAN: PRO {subEndsAt ? `· VALID TILL ${subEndsAt.toUpperCase()}` : isTrial ? '· FREE TRIAL' : ''}
          </Typography>
        </Box>
      </Paper>

      {gateway !== 'razorpay' && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Online payment gateway setup is being finalized. You can also contact our support team on WhatsApp for instant activation.
        </Alert>
      )}

      {/* Single Pro Plan Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 3,
          border: '2px solid #0F766E',
          bgcolor: '#fff',
          position: 'relative',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            size="small"
            color="success"
            icon={<BoltIcon sx={{ fontSize: 16 }} />}
            label="First Month Free"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            size="small"
            sx={{
              bgcolor: '#CCFBF1',
              color: '#0F766E',
              fontWeight: 700,
            }}
            label="All Features Included"
          />
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B' }}>
            Pro Plan
          </Typography>
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="h4" component="span" sx={{ fontWeight: 800, color: '#0F766E' }}>
              {cycle === 'yearly' ? '₹4,999' : '₹599'}
            </Typography>
            <Typography variant="body2" component="span" sx={{ color: '#64748B', ml: 0.5 }}>
              {cycle === 'yearly' ? '/ year' : '/ month'}
            </Typography>
            {cycle === 'yearly' && (
              <Typography variant="caption" sx={{ display: 'block', color: '#0F766E', fontWeight: 600 }}>
                ≈ ₹416/month · Save ₹2,189 / year
              </Typography>
            )}
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Complete pharmacy inventory, AI bill scanning, and billing suite for independent chemists.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1.5 }}>
          Everything included in Pro:
        </Typography>

        <List disablePadding sx={{ mb: 3 }}>
          {PRO_FEATURES.map((feat) => (
            <ListItem key={feat} disableGutters sx={{ py: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                <CheckCircleIcon sx={{ fontSize: 18, color: '#0F766E' }} />
              </ListItemIcon>
              <ListItemText
                primary={feat}
                primaryTypographyProps={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2.5 }} />

        {/* Primary Checkout CTA */}
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={payNow}
          disabled={paying || gateway !== 'razorpay'}
          sx={{
            py: 1.6,
            fontWeight: 800,
            fontSize: '1.05rem',
            bgcolor: '#0F766E',
            '&:hover': { bgcolor: '#0D6861' },
            borderRadius: 2,
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
          }}
        >
          {paying
            ? 'Opening secure checkout…'
            : `Pay ${cycle === 'yearly' ? '₹4,999 / year' : '₹599 / month'} — Activate Pro`}
        </Button>

        {/* Quiet secondary billing cycle option */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          {cycle === 'monthly' ? (
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Want to save 30%?{' '}
              <MuiLink
                component="button"
                type="button"
                onClick={() => setCycle('yearly')}
                sx={{
                  fontWeight: 700,
                  color: '#0F766E',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  p: 0,
                }}
              >
                Switch to Annual at ₹4,999 / year
              </MuiLink>
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Prefer monthly billing?{' '}
              <MuiLink
                component="button"
                type="button"
                onClick={() => setCycle('monthly')}
                sx={{
                  fontWeight: 700,
                  color: '#0F766E',
                  textDecoration: 'underline',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  p: 0,
                }}
              >
                Switch to Monthly at ₹599 / month
              </MuiLink>
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Support & Assistance */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          Questions about Pro or need help paying?
          <Button
            size="small"
            component="a"
            href={SUPPORT_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<WhatsAppIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', fontWeight: 700, color: '#0F766E' }}
          >
            Chat with Support on WhatsApp
          </Button>
        </Typography>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snack && (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: '100%' }}>
            {snack.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}
