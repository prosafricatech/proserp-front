'use client';

import React from 'react';
import {
  JumboForm,
  JumboInput,
  JumboOutlinedInput,
} from '@jumbo/vendors/react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import { useSnackbar } from 'notistack';
import { validationSchema } from './validation';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

const SignupForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { stopAuthLoading, signUp } = useJumboAuth();
  const { theme } = useJumboTheme();
  const router = useRouter();
  const lang = useLanguage();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((s) => !s);
  const handleClickShowPasswordConfirm = () =>
    setShowPasswordConfirm((s) => !s);

  const onSubmit = async (data: any) => {
    await signUp(
      data,
      () => router.push(`/${lang}/auth/verify-email`),
      (error) => {
        stopAuthLoading();
        if (error?.response?.data?.message) {
          enqueueSnackbar(error.response.data.message, { variant: 'error' });
        }
      },
    );
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f7fb',
        p: 2,
      }}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          width: 900,
          maxWidth: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        {/* LEFT SIDE – Logo + tagline */}
        <CardContent
          sx={{
            flex: 0.45,
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            borderRight: { md: '1px solid #eee' },
          }}
        >
          <img
            width={220}
            src={`${ASSET_IMAGES}/logos/proserp_logo4160.png`}
            alt="Proserp"
          />

          <Typography
            variant="h6"
            sx={{ mt: 4, textAlign: 'center', color: '#444' }}
          >
            simplified management<br />and control
          </Typography>
        </CardContent>

        {/* RIGHT SIDE – Heading + form */}
        <CardContent sx={{ flex: 0.55, p: { xs: 3, md: 5 } }}>
          <Typography
            variant="h5"
            fontWeight={700}
            textAlign="center"
            mb={1}
          >
            Create your Pros ID Account
          </Typography>

          <Typography
            variant="body2"
            textAlign="center"
            mb={4}
            color="text.secondary"
          >
            Join us today
          </Typography>

          <JumboForm validationSchema={validationSchema} onSubmit={onSubmit}>
            <Stack spacing={2} mb={3}>
              <JumboInput fieldName="name" label="Full Name" fullWidth />
              <JumboInput fieldName="email" label="Email" fullWidth />
              <JumboInput fieldName="phone" label="Phone Number" fullWidth />

              <JumboOutlinedInput
                fieldName="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />

              <JumboOutlinedInput
                fieldName="password_confirmation"
                label="Confirm Password"
                type={showPasswordConfirm ? 'text' : 'password'}
                fullWidth
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPasswordConfirm}
                      edge="end"
                    >
                      {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  height: 48,
                  borderRadius: 2,
                  textTransform: 'none',
                  color: '#fff',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, #0267a0 0%, #00a8ff 100%)`,
                }}
              >
                Sign Up
              </LoadingButton>
            </Stack>
          </JumboForm>

          <Typography textAlign="center" mt={2}>
            Already have an account?{' '}
            <Link href="/login" underline="always">
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export { SignupForm };
