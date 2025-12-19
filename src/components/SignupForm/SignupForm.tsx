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
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';

const SignupForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { stopAuthLoading, signUp } = useJumboAuth();
  const router = useRouter();
  const lang = useLanguage();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);

  const onSubmit = async (data: any) => {
    await signUp(
      data,
      () => router.push(`/${lang}/auth/verifyEmail`),
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f7fb',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: 960,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
       <CardContent
        sx={{
          flex: 0.60,
          color: '#fff',
          background: 'linear-gradient(160deg, #0267a0, #00a8ff)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          p: 5,

          /* 👇 ZIG ZAG BORDER */
          clipPath: {
            xs: 'none',
            md: 'polygon(0 0, 92% 0, 88% 8%, 92% 16%, 88% 24%, 92% 32%, 88% 40%, 92% 48%, 88% 56%, 92% 64%, 88% 72%, 92% 80%, 88% 88%, 92% 100%, 0 100%)',
          },
        }}
      >

          <img
            src={`${ASSET_IMAGES}/logos/proserp-white.png`}
            alt="Proserp"
            width={140}
          />

          <Typography variant="h4" fontWeight={700} mt={4}>
            Welcome to Proserp
          </Typography>

          <Typography variant="body2" mt={2} sx={{ opacity: 0.9 }}>
            Create your account and unlock powerful tools to manage,
            monitor and grow your business with ease.
          </Typography>
        </CardContent>

        {/* RIGHT PANEL */}
        <CardContent sx={{ flex: 0.55, p: { xs: 3, md: 5 } }}>
          <Typography variant="h4" fontWeight={700} mb={1} align='center'>
            Create your account
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={4} align='center'>
            Fill in the details below to get started
          </Typography>

          <JumboForm validationSchema={validationSchema} onSubmit={onSubmit}>
            <Stack spacing={2.2}>
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
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
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
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                    >
                      {showPasswordConfirm ? (
                        <VisibilityOff />
                      ) : (
                        <Visibility />
                      )}
                    </IconButton>
                  </InputAdornment>
                }
              />

              <LoadingButton
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                sx={{
                  mt: 1,
                  height: 48,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  background:
                    'linear-gradient(135deg, #0267a0 0%, #00a8ff 100%)',
                }}
              >
                Sign Up
              </LoadingButton>
            </Stack>
          </JumboForm>

          <Typography textAlign="center" mt={3} variant="body2">
            Already have an account?{' '}
            <Link href="/login" underline="hover">
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export { SignupForm };
