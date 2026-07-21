'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import MyHrImprestAccountItemAction from './MyHrImprestAccountItemAction';
import { MyHrImprestLedgerLink } from './imprestAccountsType';

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const MyHrImprestAccountsListItem = ({
  link,
}: {
  link: MyHrImprestLedgerLink;
}) => {
  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        spacing={1}
        alignItems='center'
        container
      >
        <Grid size={{ xs: 12, md: 7 }}>
          <Tooltip title='Ledger'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {link.ledger?.name || '—'}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Chip
            size='small'
            label={formatLabel(link.type)}
            variant='outlined'
          />
        </Grid>

        <Grid size={{ xs: 12, md: 2 }} textAlign='end'>
          <MyHrImprestAccountItemAction link={link} />
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrImprestAccountsListItem;
