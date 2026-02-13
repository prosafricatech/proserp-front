import { Typography, IconButton, Stack, Tooltip } from '@mui/material';
import { ArrowBackOutlined } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useStoreProfile } from './StoreProfileProvider'

function StoreProfileHeader() {
  const { mainStore } = useStoreProfile();
  const router = useRouter();
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Tooltip title="Back to Stores">
        <IconButton
          size="small"
          onClick={() => router.push('/procurement/stores')}
        >
          <ArrowBackOutlined />
        </IconButton>
      </Tooltip>
      <Stack>
        <Typography variant='h4'>{mainStore.name}</Typography>
        <Typography variant='body1'>{mainStore.alias}</Typography>
      </Stack>
    </Stack>
  );
}

export default StoreProfileHeader