'use client';

import {
  JumboCheckbox,
  JumboForm,
  JumboInput,
  JumboOutlinedInput,
} from '@jumbo/vendors/react-hook-form';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Button, CircularProgress, IconButton, InputAdornment, Stack, Typography, Box } from '@mui/material';
import { getSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import React from 'react';
import * as yup from 'yup';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import organizationServices from '../organizations/organizationServices';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';

const LoginForm = () => {
  const lang = useLanguage();
  const dictionary = useDictionary();

  const [loading, setLoading] = React.useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { update } = useSession();
  const { setAuthValues, configAuth } = useJumboAuth();
  const router = useRouter();
  const [values, setValues] = React.useState({
    password: '',
    showPassword: false,
  });

  const validationSchema = yup.object().shape({
    email: yup.string()
      .email(dictionary.signin.form.errors.email.invalid)
      .required(dictionary.signin.form.errors.email.required),
    password: yup.string().required(dictionary.signin.form.errors.password.required),
  });

  const [isPending, startTransition] = useTransition();

  const handleLogin = async (data) => {
    setLoading(true); 
    try {
      const signInResponse = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: `/${lang}/dashboard`,
      });

      if (signInResponse?.error) {
        throw new Error(signInResponse.error);
      }

      await update();

      const session = await getSession();
      if (!session || !session.user) {
        throw new Error('Failed to retrieve session');
      }

      let targetUrl = `/${lang}/dashboard`;

      if (!session.organization_id) {
        targetUrl = `/${lang}/organizations`;
        setAuthValues(
          {
            authUser: { user: session.user, permissions: session.permissions || [] },
            authOrganization: { permissions: [] },
            isAuthenticated: true,
            isLoading: false,
          },
          { persist: true }
        );
      } else {
        const orgResponse = await organizationServices.loadOrganization({
          organization_id: session.organization_id,
        });

        if (!orgResponse?.data?.authUser || !orgResponse?.data?.authOrganization) {
          throw new Error('Failed to load organization');
        }

        configAuth({
          currentUser: orgResponse.data.authUser,
          currentOrganization: orgResponse.data.authOrganization,
        });

        setAuthValues(
          {
            authUser: orgResponse.data.authUser,
            authOrganization: orgResponse.data.authOrganization,
            isAuthenticated: true,
            isLoading: false,
          },
          { persist: true }
        );
      }

      startTransition(() => {
        router.push(targetUrl);
      });

    } catch (error) {
      setLoading(false);
      enqueueSnackbar(
        dictionary.signin.form.messages.loginError || 'Login failed. Please try again.',
        { variant: 'error' }
      );
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setValues({
      ...values,
      showPassword: !values.showPassword,
    });
  };

  return (
    <Box>
      <Typography 
        variant="h4" 
        mb={3} 
        align='center'
        sx={{
          background: 'linear-gradient(45deg, #0267a0, #00a8ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 700,
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        {dictionary.signin.form.title}
      </Typography>
      
      <JumboForm
        validationSchema={validationSchema}
        onSubmit={handleLogin}
        onChange={() => {}}
      >
        <Stack spacing={2.5} mb={3}>
          <JumboInput
            fullWidth
            fieldName={'email'}
            label={dictionary.signin.form.fields.email.label}
            placeholder={dictionary.signin.form.fields.email.placeholder}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: '#0267a0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0267a0',
                  borderWidth: '2px',
                },
              }
            }}
          />
          
          <JumboOutlinedInput
            fieldName={'password'}
            label={dictionary.signin.form.fields.password.label}
            placeholder={dictionary.signin.form.fields.password.placeholder}
            type={values.showPassword ? 'text' : 'password'}
            margin='none'
            endAdornment={
              <InputAdornment position='end'>
                <IconButton
                  aria-label={values.showPassword ? 'Hide password' : 'Show password'}
                  onClick={handleClickShowPassword}
                  edge='end'
                  sx={{
                    color: '#0267a0',
                    '&:hover': {
                      backgroundColor: 'rgba(2, 103, 160, 0.1)',
                    }
                  }}
                >
                  {values.showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            }
            sx={{ 
              bgcolor: (theme) => theme.palette.background.paper,
              borderRadius: '12px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: '#0267a0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0267a0',
                  borderWidth: '2px',
                },
              }
            }}
          />
          
          <Stack
            direction={'row'}
            justifyContent={'space-between'}
            alignItems={'center'}
            sx={{ px: 1 }}
          >
            <JumboCheckbox
              fieldName='rememberMe'
              label={dictionary.signin.form.fields.rememberMe}
              defaultChecked
              sx={{
                color: '#2196f3',
                '&.Mui-checked': {
                  color: '#2196f3',
                },
              }}
            />
          </Stack>
          
          <Button
            fullWidth
            type='submit'
            variant='contained'
            size='large'
            disabled={loading || isPending}
            sx={{
              background: 'linear-gradient(45deg, #0267a0, #00a8ff)',
              borderRadius: '12px',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 15px 0 rgba(2, 103, 160, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #015a8a, #0095e0)',
                boxShadow: '0 6px 20px 0 rgba(2, 103, 160, 0.4)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading || isPending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : dictionary.signin.form.submit}
          </Button>
        </Stack>
      </JumboForm>
    </Box>
  );
};

export { LoginForm };