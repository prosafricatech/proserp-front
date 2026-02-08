'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  useForm,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { validationSchema } from './validation';

type SignupFormValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

const ConfirmPasswordError = () => {
  const {
    formState: { errors, touchedFields },
  } = useFormContext<SignupFormValues>();

  if (!touchedFields.password_confirmation) return null;
  if (!errors.password_confirmation) return null;

  return (
    <Typography
      variant="body2"
      color="error"
      sx={{ mb: 0.5, fontWeight: 500 }}
    >
      {errors.password_confirmation.message}
    </Typography>
  );
};

const SignupForm = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { signUp, stopAuthLoading } = useJumboAuth();
  const router = useRouter();
  const lang = useLanguage();

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const methods = useForm<SignupFormValues>({
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting, touchedFields },
  } = methods;

  const password = watch('password');

  useEffect(() => {
    if (touchedFields.password_confirmation) {
      trigger('password_confirmation');
    }
  }, [password, touchedFields.password_confirmation, trigger]);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signUp(
        data as any,
        () => {
          router.push(`/${lang}/auth/verifyEmail`);
        },
        (error: any) => {
          stopAuthLoading();
          enqueueSnackbar(
            error?.response?.data?.message ||
              'Signup failed. Please try again.',
            { variant: 'error' }
          );
        }
      );
    } catch (e: any) {
      stopAuthLoading();
      enqueueSnackbar(
        e?.message || 'Signup failed. Please try again.',
        { variant: 'error' }
      );
    }
  };

  return (
    <FormProvider {...methods}>
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
          {/* LEFT PANEL */}
          <CardContent
            sx={{
              flex: 0.6,
              color: '#fff',
              background: 'linear-gradient(160deg, #0267a0, #00a8ff)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              p: 5,
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
              Create your account and unlock powerful tools to manage and grow
              your business with ease.
            </Typography>
          </CardContent>

          {/* RIGHT PANEL */}
          <CardContent sx={{ flex: 0.55, p: { xs: 3, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} align="center">
              Create your account
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              mb={4}
              align="center"
            >
              Fill in the details below to get started
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2.2}>
                <TextField
                  label="Full Name"
                  fullWidth
                  {...register('name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />

                <TextField
                  label="Email"
                  fullWidth
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />

                <TextField
                  label="Phone Number"
                  fullWidth
                  {...register('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((s) => !s)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <ConfirmPasswordError />

                <TextField
                  label="Confirm Password"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  fullWidth
                  {...register('password_confirmation')}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPasswordConfirm((s) => !s)
                          }
                          edge="end"
                        >
                          {showPasswordConfirm ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <LoadingButton
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  loading={isSubmitting}
                  disabled={isSubmitting}
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
            </Box>

            <Typography textAlign="center" mt={3} variant="body2">
              Already have an account?{' '}
              <Link href={`/${lang}/login`} underline="hover">
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </FormProvider>
  );
};

export default SignupForm;
