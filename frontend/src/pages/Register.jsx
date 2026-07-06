import React, { useState, useContext, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Link,
  CssBaseline,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const { register, token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: '',
    education: '',
    preferredLanguage: 'English',
    role: 'learner',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) {
      navigate('/dashboard');
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { name, email, password, age, education } = formData;
    if (!name || !email || !password || !age || !education) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const res = await register({
      ...formData,
      age: parseInt(formData.age, 10),
    });
    setLoading(false);

    if (res && res.success) {
      navigate('/dashboard');
    } else {
      setError(res?.message || 'Registration failed. Please check validation rules.');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 6,
          marginBottom: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 4,
          }}
        >
          <SchoolIcon color="primary" sx={{ fontSize: 45 }} />
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 900, letterSpacing: '-1px' }}
          >
            NeoLiteracy
          </Typography>
        </Box>

        <Card sx={{ width: '100%', p: 2 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 800 }}>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter your registration details to start learning today.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="name"
                    label="Full Name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    name="password"
                    label="Password (min 6 characters)"
                    type="password"
                    id="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="age"
                    label="Age"
                    type="number"
                    id="age"
                    value={formData.age}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    name="education"
                    label="Education Level"
                    id="education"
                    placeholder="e.g. Primary Schooling"
                    value={formData.education}
                    onChange={handleChange}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="language-label">Preferred Language</InputLabel>
                    <Select
                      labelId="language-label"
                      id="preferredLanguage"
                      name="preferredLanguage"
                      label="Preferred Language"
                      value={formData.preferredLanguage}
                      onChange={handleChange}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Hindi">Hindi (हिंदी)</MenuItem>
                      <MenuItem value="Tamil">Tamil (தமிழ்)</MenuItem>
                      <MenuItem value="Kannada">Kannada (ಕನ್ನಡ)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="role-label">Register As</InputLabel>
                    <Select
                      labelId="role-label"
                      id="role"
                      name="role"
                      label="Register As"
                      value={formData.role}
                      onChange={handleChange}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="learner">Learner</MenuItem>
                      <MenuItem value="admin">Instructor / Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                disabled={loading}
                sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1rem' }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link component={RouterLink} to="/login" variant="body2" sx={{ fontWeight: 700 }}>
                    Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
