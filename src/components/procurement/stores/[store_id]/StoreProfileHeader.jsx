import { Typography, Stack } from '@mui/material';
import { useStoreProfile } from './StoreProfileProvider'

function StoreProfileHeader() {
  const { mainStore } = useStoreProfile();
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Stack>
        <Typography variant='h4'>{mainStore.name}</Typography>
        <Typography variant='body1'>{mainStore.alias}</Typography>
      </Stack>
    </Stack>
  );
}

export default StoreProfileHeader