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
  useMediaQuery,
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
  const smallScreen = useMediaQuery(theme.breakpoints.down('md'));
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
      (response) => {
        router.push(`/${lang}/auth/verify-email`);
      },
      (error) => {
        stopAuthLoading();
        if (
          error?.response?.data &&
          error?.response?.status === 400 &&
          error?.response?.data?.validation_errors
        ) {
          // backend field validation errors will already map to fields
        } else {
          if (error?.response?.data?.message) {
            enqueueSnackbar(error.response.data.message, { variant: 'error' });
          }
        }
      },
    );
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        width: 720,
        maxWidth: '100%',
        margin: 'auto',
        p: 4,
      }}
    >
      {/* Left side (branding) */}
      <CardContent
        sx={{
          flex: '0 1 300px',
          position: 'relative',
          backgroundSize: 'cover',
        }}
      >
        <Stack height="100%" justifyContent="space-between">
          <Stack alignItems="center" mt="auto">
            <Link href="#" underline="none" sx={{ display: 'inline-flex' }}>
              <img
                width={250}
                src={`${ASSET_IMAGES}/logos/proserp-logo.jpeg`}
                alt="Proserp"
              />
            </Link>
          </Stack>
          <Stack mt="auto">
            <Typography variant="body1" mb={2}>
              Create your ProsID Account
            </Typography>
            <Typography variant="body1">
              Already have an account?{' '}
              <Link href="/login" underline="always">
                Sign in
              </Link>
            </Typography>
          </Stack>
        </Stack>
      </CardContent>

      {/* Right side (form) */}
      <CardContent sx={{ flex: 1, p: 1 }}>
        <JumboForm validationSchema={validationSchema} onSubmit={onSubmit} onChange={() => {}}>
          <Stack spacing={1} mb={3}>
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
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    size="small"
                  >
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
                    aria-label="toggle password confirmation visibility"
                    onClick={handleClickShowPasswordConfirm}
                    edge="end"
                    size="small"
                  >
                    {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />

            <LoadingButton
              type="submit"
              fullWidth={smallScreen}
              variant="contained"
              size="large"
              // loading={isSubmitting}
            >
              Signup
            </LoadingButton>
          </Stack>
        </JumboForm>
      </CardContent>
    </Card>
  );
};

export { SignupForm };
