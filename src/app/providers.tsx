'use client';

import { AppSnackbar } from '@/components/appSnackbar';
import { AuthInitializer } from '@/components/authInitializer/AuthInitializer';
import { VFDProvider } from '@/components/vfd/VFDProvider';
import { CONFIG } from '@/config';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import {
  JumboConfigProvider,
  JumboDialog,
  JumboDialogProvider,
  JumboTheme,
} from '@jumbo/components';
import { CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { JumboAuthProvider } from './providers/JumboAuthProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <AppSnackbar>
        <VFDProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <QueryClientProvider client={queryClient}>
              <JumboAuthProvider>
                <AppRouterCacheProvider>
                  <JumboConfigProvider LinkComponent={Link}>
                    <JumboTheme init={CONFIG.THEME}>
                      <CssBaseline />
                      <JumboDialogProvider>
                        <AuthInitializer>
                          <JumboDialog />
                          <Suspense fallback={<BackdropSpinner />}>
                            {children}
                          </Suspense>
                        </AuthInitializer>
                      </JumboDialogProvider>
                    </JumboTheme>
                  </JumboConfigProvider>
                </AppRouterCacheProvider>
              </JumboAuthProvider>
            </QueryClientProvider>
          </LocalizationProvider>
        </VFDProvider>
      </AppSnackbar>
    </SessionProvider>
  );
}
