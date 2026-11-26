import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, Button, InputAdornment,
  Alert, IconButton,
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BrandMark from '../components/BrandMark';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { api } from '../api';
import { useAuth } from '../auth';
import { BRAND_NAME } from '../config/branding';

/**
 * Self-service store registration — anyone can register a NEW pharmacy and
 * get their own fully isolated store space (own medicines, bills, khata,
 * users) with a 30-day free trial on the Pro plan. Store owners
 * then create staff logins from Settings → Users inside the app.
 */
export default function SignUp() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/signup', {
        method: 'POST',
        body: { store_name: storeName, name: ownerName, username, password, phone },
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #0F766E 0%, #115E59 60%, #1E293B 100%)',
      }}
    >
      <Card sx={{ width: 440, maxWidth: '100%', p: 1, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
            <BrandMark size={68} radius="24%" sx={{ mb: 1.5, boxShadow: '0 6px 18px rgba(0, 77, 64, 0.28)' }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{BRAND_NAME}</Typography>
            <Typography variant="body2" color="text.secondary">
              Register your store — First Month Free (30-Day Trial)
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={submit}>
            <TextField
              label="Medical Store Name" fullWidth required
              value={storeName} onChange={(e) => setStoreName(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><StorefrontIcon /></InputAdornment>) }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Owner Name" fullWidth required
              value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon /></InputAdornment>) }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Mobile Number" fullWidth
              value={phone} onChange={(e) => setPhone(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><PhoneIcon /></InputAdornment>) }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Username (login id)" fullWidth required
              value={username} onChange={(e) => setUsername(e.target.value)}
              helperText="Pick a unique username for yourself"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password" type={showPassword ? 'text' : 'password'} fullWidth required
              value={password} onChange={(e) => setPassword(e.target.value)}
              helperText="At least 6 characters"
              InputProps={{
                startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth startIcon={<LoginIcon />} disabled={busy} sx={{ py: 1.4, fontWeight: 700 }}>
              {busy ? 'Creating Your Store…' : 'Create Store & Start Free 30-Day Trial'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
            </Typography>
            <Button component="a" href="/login" variant="text" size="small" sx={{ fontWeight: 700 }}>
              Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
