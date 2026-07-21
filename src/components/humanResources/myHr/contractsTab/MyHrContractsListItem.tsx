'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import { formatMoney } from '../../payrollRuns/payrollUtils';
import { MyHrContract } from './contractsType';

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const statusColor = (status?: string): 'success' | 'default' | 'warning' => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'success';
    case 'terminated':
      return 'default';
    default:
      return 'warning';
  }
};

const MyHrContractsListItem = ({ contract }: { contract: MyHrContract }) => {
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
        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='Designation'>
            <div>
              <Typography
                variant='h5'
                fontSize={14}
                lineHeight={1.25}
                mb={0}
                noWrap
              >
                {contract.designation?.title || '—'}
              </Typography>
              <Typography variant='body2' color='text.secondary' noWrap>
                {formatLabel(contract.contract_type)}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 3.5 }}>
          <Tooltip title='Contract Period'>
            <div>
              <Typography noWrap>
                {contract.start_date
                  ? readableDate(contract.start_date, false)
                  : '—'}
                {' – '}
                {contract.end_date
                  ? readableDate(contract.end_date, false)
                  : 'Present'}
              </Typography>
              {contract.probation_end_date && (
                <Typography variant='body2' color='text.secondary' noWrap>
                  Probation ends{' '}
                  {readableDate(contract.probation_end_date, false)}
                </Typography>
              )}
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Basic Salary'>
            <div>
              <Typography noWrap>
                {formatMoney(contract.basic_salary)}
              </Typography>
            </div>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }} textAlign={{ md: 'end' }}>
          <Chip
            size='small'
            label={formatLabel(contract.status)}
            color={statusColor(contract.status)}
            sx={{ textTransform: 'capitalize' }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default MyHrContractsListItem;
