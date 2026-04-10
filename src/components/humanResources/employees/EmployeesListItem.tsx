'use client';

import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { Divider, Grid, Tooltip, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import EmployeeItemAction from './EmployeeItemAction';
import { Employee } from './EmployeesType';

const EmployeesListItem = ({ employee }: { employee: Employee }) => {
  const router = useRouter();
  const lang = useLanguage();

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
        <Grid size={{ xs: 12, md: 5 }}>
          <Tooltip title='View Employee Profile'>
            <Typography
              variant='h5'
              fontSize={14}
              lineHeight={1.25}
              mb={0}
              noWrap
              onClick={() => router.push(`/${lang}/hr/employees/${employee.id}`)}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              {employee.first_name} {employee.middle_name} {employee.last_name}
            </Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee EMail'>
            <Typography>{employee.email}</Typography>
          </Tooltip>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Tooltip title='Employee Phone Number'>
            <Typography>{employee.phone_number}</Typography>
          </Tooltip>
        </Grid>

        <Grid size={{ xs: 1, md: 0.5, lg: 1 }} textAlign={'end'}>
          <EmployeeItemAction employee={employee} />
        </Grid>
      </Grid>
    </>
  );
};

export default EmployeesListItem;
