'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { Add } from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  Grid,
  LinearProgress,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Dispatch, SetStateAction } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { LeaveType } from '../leaveTypes/LeaveTypesType';

interface FormData {
  id: number | null;
  leave_name: string;
  allocation_amount: number;
}

interface LeaveAllocationsTabProps {
  setAllocationsSettings: Dispatch<SetStateAction<Array<any>>>;
}

const formatCommaSeparatedValue = (
  value: string | number | null | undefined
) => {
  if (value === null || value === undefined || value === '') return '';
  const numericValue = Number(String(value).replace(/,/g, ''));
  return Number.isNaN(numericValue) ? '' : numericValue.toLocaleString('en-US');
};

const LeaveAllocationsTab = ({
  setAllocationsSettings,
}: LeaveAllocationsTabProps) => {
  const { theme } = useJumboTheme();

  const { data: leaveTypesResponse, isFetching: fetchingLeaveTypes } = useQuery(
    {
      queryKey: ['leaveTypes'],
      queryFn: async () => {
        return humanResourcesServices.getLeaveTypesList({
          page: 1,
          limit: 200,
        });
      },
    }
  );

  const leaveTypes = (leaveTypesResponse?.data || []) as LeaveType[];

  const validationSchema = yup.object({
    id: yup
      .number()
      .required('Allowance Type is required')
      .typeError('Allowance Type is required'),
    leave_name: yup.string(),
    allocation_amount: yup
      .number()
      .required('Allocation Amount is required')
      .typeError('Allocation Amount is required'),
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: null,
      leave_name: '',
      allocation_amount: 0,
    },
  });

  const submitDedction = (v: any) => {
    setAllocationsSettings((prev: Array<any>) => [...prev, v]);
    reset();
  };

  return (
    <form autoComplete='off' onSubmit={handleSubmit(submitDedction)}>
      <Grid
        container
        rowSpacing={{ xs: 1, md: 2 }}
        columnSpacing={4}
        spacing={1}
        alignItems={'center'}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            {fetchingLeaveTypes ? (
              <LinearProgress />
            ) : (
              <Controller
                name='id'
                control={control}
                rules={{ required: 'leave type is required' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    size='small'
                    options={leaveTypes}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name || ''}
                    value={
                      leaveTypes.find((type) => type.id === field.value) || null
                    }
                    onChange={(event, newValue) => {
                      field.onChange(newValue?.id || null);

                      if (newValue) {
                        setValue('id', Number(newValue.id ?? ''), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        const leave = leaveTypes.find(
                          (itm) => itm.id === newValue.id
                        );
                        if (leave) setValue('leave_name', leave?.name);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Leave Type'
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            )}
          </Div>
        </Grid>

        <Grid
          size={{ xs: 12, md: 4 }}
          textAlign={'left'}
          justifyContent={'end'}
        >
          <Div sx={{ mt: 1, mb: 1 }}>
            <Controller
              name='allocation_amount'
              control={control}
              render={({ field }) => (
                <TextField
                  label='Allocation Amount'
                  size='small'
                  fullWidth
                  value={formatCommaSeparatedValue(field.value)}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/,/g, '');
                    field.onChange(raw === '' ? '' : Number(raw));
                  }}
                  error={!!errors?.allocation_amount}
                  helperText={errors.allocation_amount?.message}
                />
              )}
            />
          </Div>
        </Grid>

        <Grid
          size={{ xs: 12, md: 2 }}
          textAlign={'left'}
          justifyContent={'end'}
        >
          <Button variant='contained' size='small' type='submit'>
            <Add />
            add
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default LeaveAllocationsTab;
