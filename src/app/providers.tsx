'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { JumboConfigProvider, JumboDialog, JumboDialogProvider, JumboTheme } from '@jumbo/components';
import { CssBaseline } from '@mui/material';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import { AppSnackbar } from '@/components/AppSnackbar';
import { AuthInitializer } from '@/components/AuthInitializer/AuthInitializer';
import { Suspense } from 'react';
import { CONFIG } from '@/config';
import { JumboAuthProvider } from './providers/JumboAuthProvider';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { VFDProvider } from '@/components/vfd/VFDProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false
      },
    },
  }));

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