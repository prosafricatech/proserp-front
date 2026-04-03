'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Divider, Tooltip, Typography } from '@mui/material';
import { Grid } from '@mui/system';
import { ContractType } from './ContractType';
import EmployeesContractsItemAction from './EmployeesContractsItemAction';

const EmployeesContractsListItem = ({
  contract,
}: {
  contract: ContractType;
}) => {
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
        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Employee name'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
            >
              {contract?.employee?.first_name || '-'}{' '}
              {contract?.employee?.last_name || '-'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Contract Type'>
            <Typography>{contract?.contract_type}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Start Date'>
            <Typography>
              {contract?.start_date ? readableDate(contract.start_date) : '-'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <Tooltip title='Basic Salary'>
            <Typography>
              {contract.basic_salary
                ? contract.basic_salary.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })
                : '-'}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid
          size={{ xs: 12, md: 2 }}
          display={`flex`}
          flexDirection={`row`}
          justifyContent={'start'}
        >
          <Tooltip title='Contract Status'>
            <Typography>{contract.status}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <EmployeesContractsItemAction contract={contract} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeesContractsListItem;
