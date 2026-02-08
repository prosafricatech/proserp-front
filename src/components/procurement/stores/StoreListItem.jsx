'use client';

import { Box, Grid, ListItemText, Tooltip, Typography } from '@mui/material'
import React from 'react'
import StoreItemAction from './StoreItemAction'
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const StoreListItem = ({store}) => {
  const lang = useLanguage();
  const router = useRouter();
  const dictionary = useDictionary();

  return( 
    <Grid container 
    columnSpacing={1}
    sx={{
      cursor: 'pointer',
      borderTop: 1,
      borderColor: 'divider',
      '&:hover': {
          bgcolor: 'action.hover',
      },
      paddingLeft: 2,
  }}
  alignItems={'center'}
  >
    <Grid size={5}>
      <ListItemText
        primary={
          <Tooltip title={dictionary.stores.form.labels.storeName}>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0}>
            {store.name}
            </Typography>
          </Tooltip>
        }
        onClick={() => router.push(`/${lang}/procurement/stores/${store.id}`)}
      />
    </Grid>
    <Grid size={4}>
      <ListItemText
        primary={
          <Tooltip title="symbol">
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
              {store.alias}
            </Typography>
          </Tooltip>
        }
      />
    </Grid>
    <Grid size={{xs: 3, lg: 2}}>
      <ListItemText
        primary={
          <Tooltip title={dictionary.stores.form.labels.description}>
            <Typography variant="h5" fontSize={14} lineHeight={1.25} mb={0} noWrap>
            {store.description}
            </Typography>
          </Tooltip>
        }
      />
    </Grid>
    <Grid size={{xs: 12, lg: 1}}>
        <Box display={'flex'} flexDirection={'row'} justifyContent={'flex-end'}> 
        <StoreItemAction store={store} />
        </Box>
    </Grid>
  </Grid>
  )
}

export default StoreListItem