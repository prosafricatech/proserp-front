'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { JumboConfigProvider, JumboDialog, JumboDialogProvider, JumboTheme } from '@jumbo/components';
import { CssBaseline } from '@mui/material';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import { AppSnackbar } from '@/components/appSnackbar';
import { AuthInitializer } from '@/components/authInitializer/AuthInitializer';
import { Suspense } from 'react';
import { CONFIG } from '@/config';
import { JumboAuthProvider } from './providers/JumboAuthProvider';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';
import { SpinnerProvider, useSpinner } from '@/shared/ProgressIndicators/SpinnerContext';
import { VFDProvider } from '@/components/vfd/VFDProvider';

function SpinnerOverlay() {
  const { show } = useSpinner();
  if (!show) return null;
  return <BackdropSpinner isRouterTransfer />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false
      },
    },
  }));

  return (
    <SpinnerProvider>
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
                              <SpinnerOverlay />
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
    </SpinnerProvider>
  );
}