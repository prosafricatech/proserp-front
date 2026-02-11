import { Typography, Button, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { useStoreProfile } from './StoreProfileProvider'

function StoreProfileHeader() {
  const { mainStore } = useStoreProfile();
  const router = useRouter();
  return (
    <Stack direction="row" alignItems="center" spacing={2} mb={2}>
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => router.push('/procurement/stores')}
        sx={{ minWidth: 0 }}
        size='small'
      >
        Stores
      </Button>
      <div>
        <Typography variant='h2'>{mainStore.name}</Typography>
        <Typography variant='body1'>{mainStore.alias}</Typography>
      </div>
    </Stack>
  );
}

export default StoreProfileHeader