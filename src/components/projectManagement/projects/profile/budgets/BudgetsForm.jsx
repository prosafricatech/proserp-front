import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
  Alert,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useProjectProfile } from '../ProjectProfileProvider';
import { Div } from '@jumbo/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import projectsServices from '../../project-services';

const BudgetsForm = ({ setOpenDialog, budget }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization: { organization } } = useJumboAuth();
  const { project } = useProjectProfile();
  const [serverError, setServerError] = useState(null);

  // React Query v5 mutations
  const addBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.addBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
    },
    onError: (err) => {
      if (err.response?.status === 400) setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
    },
  });

  const editBudgetMutation = useMutation({
    mutationFn: (data) => projectsServices.EditBudget(data),
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectBudgets'] });
    },
    onError: (err) => {
      if (err.response?.status === 400) setServerError(err.response?.data?.validation_errors);
      else enqueueSnackbar(err.response?.data?.message, { variant: 'error' });
    },
  });

  const saveMutation = useMemo(() => (budget ? editBudgetMutation.mutate : addBudgetMutation.mutate), [budget, editBudgetMutation.mutate, addBudgetMutation.mutate]);
  const isPending = budget ? editBudgetMutation.isPending : addBudgetMutation.isPending;

  const validationSchema = yup.object({
    name: yup.string().required('Budget name is required'),
    start_date: yup.string().required('Start Date is required'),
    end_date: yup.string().required('End Date is required'),
  });

  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: budget?.id,
      name: budget?.name,
      start_date: budget?.start_date,
      end_date: budget?.end_date,
      cost_center_id: project.cost_center.id,
      remarks: budget?.remarks || '',
    },
  });

  return (
    <>
      <DialogTitle textAlign="center">
        {budget ? `Edit ${budget?.name} Budget` : 'New Project Budget'}
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off">
          <Grid container columnSpacing={1}>
            <Grid container spacing={1} alignItems="center" justifyContent="center">
              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label="Budget Name"
                    size="small"
                    fullWidth
                    error={!!errors?.name}
                    helperText={errors?.name?.message}
                    {...register('name')}
                  />
                </Div>
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    label="Start Date"
                    fullWidth
                    minDate={dayjs(organization.recording_start_date)}
                    defaultValue={budget ? dayjs(budget.start_date) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.start_date,
                        helperText: errors?.start_date?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setServerError(null);
                      setValue('start_date', newValue ? newValue.toISOString() : null, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                </Div>
              </Grid>

              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1 }}>
                  <DateTimePicker
                    label="End Date"
                    fullWidth
                    minDate={dayjs(watch('start_date'))}
                    defaultValue={budget ? dayjs(budget.end_date) : null}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                        readOnly: true,
                        error: !!errors?.end_date,
                        helperText: errors?.end_date?.message,
                      },
                    }}
                    onChange={(newValue) => {
                      setServerError(null);
                      setValue('end_date', newValue ? newValue.toISOString() : null, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                </Div>
              </Grid>

              {serverError?.date_overlap && (
                <Grid size={12}>
                  <Alert severity="error" variant="outlined">{serverError.date_overlap[0]}</Alert>
                </Grid>
              )}

              <Grid size={12}>
                <Div sx={{ mt: 1 }}>
                  <TextField
                    label="Remarks"
                    size="small"
                    fullWidth
                    multiline
                    rows={2}
                    {...register('remarks')}
                  />
                </Div>
              </Grid>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => setOpenDialog(false)}>Cancel</Button>
        <LoadingButton
          type="submit"
          onClick={handleSubmit(saveMutation)}
          variant="contained"
          size="small"
          sx={{ display: 'flex' }}
          loading={isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
};

export default BudgetsForm;
