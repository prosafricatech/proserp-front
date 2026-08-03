'use client';
import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { FieldErrors, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../../humanResourcesServices';

interface LoanRequstFormProps {
  setOpenDialog: (open: boolean) => void;
  loan?: any;
}

interface FormData {
  id?: number;
  amount?: number | null;
  installments?: string;
  reason?: string | null;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    name?: string;
    symbol?: string;
  };
}

const LoanRequstForm = ({
  setOpenDialog,
  loan = null,
}: LoanRequstFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const isEditing = !!loan?.id;

  const {
    mutate: submitLoan,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: async (data) => {
      return isEditing
        ? humanResourcesServices.myHrUpdateLoanRequest({ id: loan.id, ...data })
        : humanResourcesServices.myHrAddLoanRequests(data);
    },
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(
        isEditing
          ? 'Loan request updated successfully'
          : 'Loan request added successfully',
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['myHrLoanRequests'] });
    },
    onError: (err: any) => {
      enqueueSnackbar(
        err?.response?.data?.message ||
          getErrorMessage(err) ||
          'Something went wrong',
        {
          variant: 'error',
        }
      );
    },
  });
  // Validation Schema
  const validationSchema = yup.object({
    amount: yup
      .number()
      .required('This field is required')
      .transform((_, val) =>
        val === '' || val === undefined || val === null ? null : Number(val)
      )
      .min(0, 'Basic salary must be >= 0')
      .typeError('Basic salary must be a number'),
    installments: yup.string().required('This field is required'),
    reason: yup.string().nullable(),
  });

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      amount: loan?.amount ?? null,
      installments: loan?.installments ? String(loan.installments) : '',
      reason: loan?.reason ?? '',
    },
  });

  const formatCurrency = (value: number | null | undefined) =>
    value ? value.toLocaleString() : '';

  const onSubmit = (data: FormData) => {
    submitLoan(data);
  };
  const onError = (error: any) => {
    console.log('error: ', error);
  };
  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign='center'>
          {loan?.id ? `Edit Loan` : 'Create Loan Request'}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form
          onSubmit={handleSubmit(onSubmit, (errors: FieldErrors) => {
            console.log('errors: ', errors);
          })}
        >
          <Grid container spacing={1} mt={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Amount'
                size='small'
                fullWidth
                value={formatCurrency(watch('amount'))}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, '');
                  setValue('amount', val ? Number(val) : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                error={!!errors.amount}
                helperText={errors.amount?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label='Installments'
                size='small'
                fullWidth
                value={watch('installments')}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue('installments', val ? val : undefined, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                error={!!errors.installments}
                helperText={errors.installments?.message}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Reason'
                size='small'
                fullWidth
                multiline
                rows={2}
                value={watch('reason')}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue('reason', val ? val : undefined);
                }}
                error={!!errors.reason}
                helperText={errors.reason?.message}
              />
            </Grid>
          </Grid>

          <DialogActions>
            <Button size='small' onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <LoadingButton
              type='submit'
              variant='contained'
              size='small'
              loading={isPending}
            >
              {loan?.id ? 'Update' : 'Create'}
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default LoanRequstForm;
