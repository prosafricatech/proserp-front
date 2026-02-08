'use client';
import { useEffect } from 'react';
import axios from '../../lib/services/config';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

export const AuthInitializer = ({ children }) => {
  const { authData, setAuthValues } = useJumboAuth();

  useEffect(() => {
    if (authData?.token) {
      axios.get('/api/auth/validate', {
        headers: { Authorization: `Bearer ${authData.token}` }
      })
    }
  }, [authData, setAuthValues]);

  return children;
};