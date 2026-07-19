'use client';

import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { AccountBalanceWalletOutlined } from '@mui/icons-material';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import humanResourcesServices from '../../humanResourcesServices';
import MyHrImprestAccountsListItem from './MyHrImprestAccountsListItem';
import { MyHrImprestLedgerLink } from './imprestAccountsType';

const MyHrImprestAccounts = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['showMyHrImprestAccounts'],
    queryFn: () => humanResourcesServices.myHrImprestAccounts(),
  });

  if (isLoading) {
    return (
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={i}
            variant='rectangular'
            width='100%'
            height={56}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Box
        width='100%'
        py={6}
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
      >
        <AccountBalanceWalletOutlined sx={{ width: 50, height: 50 }} />
        <Typography textAlign='center' fontSize={15} mt={1}>
          {getErrorMessage(error)}
        </Typography>
      </Box>
    );
  }

  const ledgers: MyHrImprestLedgerLink[] = data || [];

  if (!ledgers.length) {
    return (
      <Box
        width='100%'
        py={6}
        display='flex'
        flexDirection='column'
        justifyContent='center'
        alignItems='center'
      >
        <AccountBalanceWalletOutlined sx={{ width: 50, height: 50 }} />
        <Typography textAlign='center' fontSize={15} mt={1}>
          No imprest accounts linked to your account.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack sx={{ mt: 1 }}>
      {ledgers.map((link) => (
        <MyHrImprestAccountsListItem key={link.id} link={link} />
      ))}
    </Stack>
  );
};

export default MyHrImprestAccounts;
