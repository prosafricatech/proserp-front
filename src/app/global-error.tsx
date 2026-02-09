'use client';

import { ASSET_IMAGES } from '@/utilities/constants/paths';
import { keyframes } from '@emotion/react';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { Backdrop } from '@mui/material';
import Image from 'next/image';

/* =====================
   ANIMATION
===================== */
const spiralRotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/* =====================
   GLOBAL ERROR
===================== */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { theme } = useJumboTheme();

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('authData');
      sessionStorage.clear();
    } catch {
      // Storage might be unavailable (Safari / private mode)
    }

    window.location.replace('/auth/signin');
  }

  return (
    <Backdrop
      open
      role='alert'
      aria-live='assertive'
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        backgroundColor: 'rgba(0,0,0,0.75)',
        color: '#fff',
        gap: 3,
      }}
    >
      {/* Loader */}
      <Div
        sx={{
          position: 'relative',
          width: 150,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Spiral arcs */}
        <Div
          sx={{
            position: 'absolute',
            width: 140,
            height: 140,
            border: '5px solid transparent',
            borderTopColor: '#2113AD',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite`,
            boxShadow: `0 0 10px ${'#2113AD'}80`,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
          }}
        />
        <Div
          sx={{
            position: 'absolute',
            width: 120,
            height: 120,
            border: '5px solid transparent',
            borderBottomColor: '#bec5da',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite 0.3s`,
            boxShadow: `0 0 10px ${'#bec5da'}80`,
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
          }}
        />
        <Div
          sx={{
            position: 'absolute',
            width: 100,
            height: 100,
            border: '5px solid transparent',
            borderTopColor: '#FFFFFF',
            borderRadius: '50%',
            animation: `${spiralRotate} 2s linear infinite 0.6s`,
            boxShadow: `0 0 10px ${'#FFFFFF'}80`,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
          }}
        />
        {/* Static logo in the center */}
        <Div
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 10px ${'#2113AD'}30`,
            zIndex: 1,
          }}
        >
          <Image
            src={
              theme?.type === 'light'
                ? `${ASSET_IMAGES}/logos/proserp-blue.png`
                : `${ASSET_IMAGES}/logos/proserp-white.png`
            }
            alt='ProsERP'
            width={85}
            height={85}
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </Div>
      </Div>
    </Backdrop>
  );
}
