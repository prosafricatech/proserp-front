'use client'
import { useMediaQuery } from '@mui/material';

export function useSmallScreen(): boolean {
  return useMediaQuery('(max-width:620px)');
}
