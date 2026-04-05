'use client';

import { Chip, Divider, Grid, Tooltip, Typography } from '@mui/material';
import EmployeeBankItemAction from './EmployeeBankItemAction';
import { useEmployees } from '../../EmployeesProvider';
import { EmployeeBankAccountType } from './EmployeeBankAccountType';

const EmployeeBankAccountsListItem = ({
  account,
}: {
  account: EmployeeBankAccountType;
}) => {
  const { employees } = useEmployees();
  const employee = employees?.find((item) => item.id === account.employee_id);
  const employeeName = employee
    ? `${employee.first_name || ''} ${employee.middle_name || ''} ${employee.last_name || ''}`.trim()
    : `${account.employee?.first_name || ''} ${account.employee?.last_name || ''}`.trim() ||
      `Employee #${account.employee_id}`;

  return (
    <>
      <Divider />
      <Grid
        mt={1}
        mb={1}
        sx={{
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
        paddingLeft={2}
        paddingRight={2}
        columnSpacing={1}
        alignItems={'center'}
        container
      >
        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Employee'>
            <Typography variant='h6' fontSize={14} lineHeight={1.25} mb={0}>
              {employeeName}
            </Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Bank Name'>
            <Typography>{account.bank_name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2.5 }}>
          <Tooltip title='Account Name'>
            <Typography noWrap>{account.account_name}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Account Number'>
            <Typography>{account.account_number}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 10, md: 1.5 }}>
          {account.is_primary ? (
            <Chip label='Primary' size='small' color='success' variant='outlined' />
          ) : (
            <Chip label='Secondary' size='small' variant='outlined' />
          )}
        </Grid>

        <Grid size={{ xs: 2, md: 1 }} textAlign={'end'}>
          <EmployeeBankItemAction account={account} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeeBankAccountsListItem;