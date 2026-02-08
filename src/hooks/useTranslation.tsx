import { LangContext } from '@/components/LangProvider';
import { useContext } from 'react';

export function useTranslation() {
  return useContext(LangContext);
}
