'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from '@/lib/services/config';
import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { getAssetPath } from '@/utilities/helpers';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  alpha,
  Box,
} from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { useSnackbar } from 'notistack';

export default function ResetPassword() {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return axios
        .get('/sanctum/csrf-cookie')
        .then(() => {
          return axios.post('/api/auth/reset-password', { email });
        })
        .then((response) => {
          if (response.status === 200) {
            return response.data; 
          }
          throw new Error('Unexpected response status');
        })
        .catch((err) => {
          throw err;
        });
    },
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || 'Recovery link sent successfully!', {
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || 'Failed to send recovery link.';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleSubmit = async () => {
    if (!email.trim()) {
      enqueueSnackbar('Please enter your email address.', { variant: 'warning' });
      return;
    }
    mutation.mutate(email);
  };

  return (
    <Div
      sx={{
        flex: 1,
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: theme => theme.spacing(4),
      }}
    >
      <Div sx={{mb: 3, display: 'inline-flex'}}>
          <img width={200} src={`${ASSET_IMAGES}/logos/proserp-blue.png`} alt="ProsERP"/>
      </Div>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" align="center" mb={2}>
            Provide your email
          </Typography>

          <TextField
            fullWidth
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
          />

          <LoadingButton
            onClick={handleSubmit}
            loading={mutation.isPending}
            fullWidth
            variant="contained"
            size="large"
            sx={{ mb: 3 }}
          >
            Send Password Recovery Token
          </LoadingButton>

          <Typography align="center" variant="body2" mb={1}>
            Have the password?{' '}
            <Link href="/auth/signin" style={{ color: '#0267a0', fontWeight: 600 }}>
              Proceed to Sign In
            </Link>
          </Typography>

          <Typography align="center" variant="body2">
            Don’t remember your email?{' '}
            <Link href="/support" style={{ color: '#00a8ff' }}>
              Contact Support
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Div>
  );
}
