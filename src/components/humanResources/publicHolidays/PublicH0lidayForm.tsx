import { getErrorMessage } from '@/utilities/helpers/errorHandler';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import humanResourcesServices from '../humanResourcesServices';
import { PublicHolidaysType } from './PublicHOlidaysType';

interface PublicH0lidayFormProps {
  publicHoliday?: PublicHolidaysType;
  setOpenDialog: (open: boolean) => void;
}

interface ApiResponse {
  message: string;
  validation_errors?: {
    title?: string;
  };
}

interface FormData extends Omit<PublicHolidaysType, 'id'> {
  id?: number;
  name: string;
  date: string;
  is_paid: boolean;
}

const PublicH0lidayForm = ({
  publicHoliday,
  setOpenDialog,
}: PublicH0lidayFormProps) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [publicHolidayDate, setPublicHolidayDate] = useState<string | null>(
    publicHoliday?.date ?? null
  );
  const [isPaid, setIsPaid] = useState(publicHoliday?.is_paid ?? true);

  const {
    mutate: addPublicHoliday,
    isPending,
    error,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.addPublicHoliday,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Adding Public Holiday', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['publicHolidays'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const {
    mutate: updatePublicHoliday,
    isPending: updateIsLoading,
    error: updateError,
  } = useMutation<ApiResponse, any, FormData>({
    mutationFn: humanResourcesServices.updatePublicHoliday,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar('Success Updating Public HOliday', {
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['publicHolidays'] });
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  const validationSchema = yup.object({
    id: yup.number().optional(),
    name: yup.string().required('Name is required').max(255),
    date: yup.string().required('Date is required'),
    is_paid: yup.bool(),
  });

  const {
    setValue,
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: publicHoliday?.id,
      name: publicHoliday?.name || '',
      date: publicHoliday?.date || '',
      is_paid: publicHoliday?.is_paid || true,
    },
  });

  useEffect(() => {
    reset({
      id: publicHoliday?.id,
      name: publicHoliday?.name || '',
      date: publicHoliday?.date || '',
      is_paid: publicHoliday?.is_paid || true,
    });
  }, [publicHoliday, reset]);

  useEffect(() => {
    if (isPaid) {
      setValue('is_paid', true);
    } else {
      setValue('is_paid', false);
    }
  }, [isPaid]);

  const saveMutation = useMemo(() => {
    return publicHoliday?.id ? updatePublicHoliday : addPublicHoliday;
  }, [publicHoliday, updatePublicHoliday, addPublicHoliday]);

  const onSubmit = (data: FormData) => {
    saveMutation(data);
  };
  return (
    <>
      <DialogTitle>
        <Grid size={12} textAlign={'center'}>
          {!publicHoliday?.id ? 'Add Public Holiday' : `Edit Public Holiday`}
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form
          autoComplete='off'
          onSubmit={handleSubmit(onSubmit, (error) => {
            console.log('validation error: ', error);
          })}
        >
          <Grid container rowSpacing={{ xs: 1, md: 2 }} spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <TextField
                  label='Public HOliday Name'
                  size='small'
                  fullWidth
                  error={
                    !!errors?.name ||
                    !!error?.response?.data?.validation_errors?.name ||
                    !!updateError?.response?.data?.validation_errors?.name
                  }
                  helperText={
                    errors.name?.message ||
                    error?.response?.data?.validation_errors?.name ||
                    updateError?.response?.data?.validation_errors?.name
                  }
                  {...register('name')}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <Controller
                  name='date'
                  control={control}
                  render={({ field, fieldState }) => (
                    <DatePicker
                      label='Date'
                      value={
                        publicHolidayDate ? dayjs(publicHolidayDate) : null
                      }
                      onChange={(val) => {
                        const formatted = val?.format('YYYY-MM-DD') || '';
                        setPublicHolidayDate(formatted);
                        field.onChange(formatted);
                      }}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!fieldState.error,
                          helperText:
                            !!fieldState.error && 'This field is required',
                        },
                      }}
                    />
                  )}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Div sx={{ mt: 1, mb: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPaid}
                      onChange={() => {
                        setIsPaid((prev) => !prev);
                      }}
                    />
                  }
                  label='Is Paid'
                />
              </Div>
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
              sx={{ display: 'flex' }}
              loading={isPending || updateIsLoading}
            >
              Submit
            </LoadingButton>
          </DialogActions>
        </form>
      </DialogContent>
    </>
  );
};

export default PublicH0lidayForm;
