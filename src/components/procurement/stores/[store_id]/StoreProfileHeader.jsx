import { Typography } from '@mui/material';
import React from 'react'
import { useStoreProfile } from './StoreProfileProvider'

function StoreProfileHeader() {
    const {mainStore} = useStoreProfile();
  return (
    <React.Fragment>
        <Typography variant='h2'>{mainStore.name}</Typography>
        <Typography variant='body1'>{mainStore.alias}</Typography>
    </React.Fragment>
  )
}

export default StoreProfileHeader