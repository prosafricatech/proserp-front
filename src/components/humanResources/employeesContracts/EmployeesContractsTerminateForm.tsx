'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { ContractType } from './ContractType';

interface TerminateFormData {
  termination_date: string;
  remarks?: string;
}

interface EmployeesContractsTerminateFormProps {
  contract: ContractType;
  setOpenDialog: (open: boolean) => void;
}

const validationSchema = yup.object({
  termination_date: yup.string(),
  remarks: yup.string().max(1000, 'Remarks should not exceed 1000 characters'),
});

const EmployeesContractsTerminateForm = ({
  contract,
  setOpenDialog,
}: EmployeesContractsTerminateFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [terminationDate, setTerminationDate] = useState<string | undefined>(
    dayjs().format('MM/DD/YYYY')
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TerminateFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      termination_date: '',
      remarks: '',
    },
  });

  const { mutate: terminateEmployeeContract, isPending } = useMutation({
    mutationFn: async (data: TerminateFormData) => {
      return humanResourcesServices.terminateEmployeeContract({
        id: contract.id,
        termination_date: data.termination_date,
        remarks: data.remarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeesContracts'] });
      enqueueSnackbar('Employee Contract Terminated Successfully', {
        variant: 'success',
      });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar('Error Terminating Employee Contract', {
        variant: 'error',
      });
      console.log('error terminating employee contract: ', error);
    },
  });

  const onSubmit = (data: TerminateFormData) => {
    terminateEmployeeContract(data);
  };

  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          Terminate Contract
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='text.secondary' mb={2}>
          You are about to terminate the contract for{' '}
          <strong>
            {contract.employee?.first_name} {contract.employee?.last_name}
          </strong>
          . Please provide the termination details below.
        </Typography>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} mt={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='termination_date'
                control={control}
                render={({ field, fieldState }) => (
                  <DatePicker
                    label='Termination Date'
                    value={
                      terminationDate !== undefined
                        ? dayjs(terminationDate)
                        : null
                    }
                    onChange={(value: Dayjs | null) => {
                      if (value) {
                        const formatted = value.format('YYYY-MM-DD');
                        setTerminationDate(formatted);
                        field.onChange(formatted);
                      }
                    }}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        error: !!fieldState.error,
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Remarks'
                size='small'
                fullWidth
                multiline
                rows={2}
                error={!!errors.remarks}
                helperText={errors.remarks?.message}
                {...register('remarks')}
              />
            </Grid>
          </Grid>
          <DialogActions sx={{ mt: 2 }}>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              color='error'
              loading={isPending}
            >
              Terminate Contract
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default EmployeesContractsTerminateForm;

