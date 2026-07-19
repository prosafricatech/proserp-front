'use client';

import JumboRqList from '@jumbo/components/JumboReactQuery/JumboRqList';
import { Autocomplete, Card, Grid, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import humanResourcesServices from '../../humanResourcesServices';
import { PayrollPeriodType } from '../../payrollPeriods/PayrollPeriodType';
import MyHrPayslipsListItem from './MyHrPayslipsListItem';
import { MyHrPayslipListItem } from './payslipsType';

const MyHrPayslips = () => {
  const listRef = useRef<any>(null);

  const [selectedPayrollPeriod, setSelectedPayrollPeriod] =
    useState<PayrollPeriodType | null>(null);

  const { data: payrollPeriodsResponse, isFetching: isPayrollPeriodsFetching } =
    useQuery({
      queryKey: ['payrollPeriodsForRunsSelector'],
      queryFn: () =>
        humanResourcesServices.getPayrollPeriodsList({ page: 1, limit: 200 }),
    });

  const payrollPeriods: PayrollPeriodType[] =
    payrollPeriodsResponse?.data || [];

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const periodWithMonthNames = payrollPeriods.map((period) => {
    const selectedMonth = monthNames[period.month - 1];
    return {
      ...period,
      monthName: selectedMonth,
    };
  });

  const [queryOptions, setQueryOptions] = useState({
    queryKey: 'myHrPayslips',
    queryParams: {
      keyword: '',
      payroll_period_id: '',
    },
    countKey: 'total',
    dataKey: 'data',
  });

  const renderItem = useCallback(
    (payslip: MyHrPayslipListItem) => (
      <MyHrPayslipsListItem payslip={payslip} />
    ),
    []
  );

  return (
    <>
      <Grid container spacing={2} mb={2} mt={2} justifyContent='center'>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            size='small'
            loading={isPayrollPeriodsFetching}
            options={periodWithMonthNames}
            value={selectedPayrollPeriod}
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            getOptionLabel={(option) =>
              `${option.year} - ${option.monthName || option.month}${
                option.status ? ` (${option.status})` : ''
              }`
            }
            onChange={(_, newValue) => {
              setSelectedPayrollPeriod(newValue);
              setQueryOptions((state) => ({
                ...state,
                queryParams: {
                  ...state.queryParams,
                  payroll_period_id: newValue?.id ? String(newValue.id) : '',
                },
              }));
            }}
            renderInput={(inputParams) => (
              <TextField {...inputParams} label='Payroll Period' fullWidth />
            )}
          />
        </Grid>
      </Grid>
      <JumboRqList
        ref={listRef}
        wrapperComponent={Card}
        service={humanResourcesServices.myHrPayslipsList}
        primaryKey='id'
        queryOptions={queryOptions}
        itemsPerPage={10}
        itemsPerPageOptions={[10, 20, 50]}
        renderItem={renderItem}
        componentElement='div'
        wrapperSx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      />
    </>
  );
};

export default MyHrPayslips;
