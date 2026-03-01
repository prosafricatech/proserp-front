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
  Tabs,
  Tab,
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
import LedgerItemsTab from './budgetItems/tabs/LedgerItemsTab';
import ProductItemsTab from './budgetItems/tabs/ProductItemsTab';

const BudgetsForm = ({ setOpenDialog, budget, isProjectBudget=true }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization: { organization } } = useJumboAuth();
  const { project } = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [serverError, setServerError] = useState(null);
  const [ledgerItems, setLedgerItems] = useState([]);
  const [productItems, setProductItems] = useState([]);

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
      cost_center_id: project?.cost_center?.id,
      remarks: budget?.remarks || '',
    },
  });

  return (
    <>
      <DialogTitle textAlign="center" sx={{ pb: 1 }}>
        {budget ? `Edit ${budget?.name} Budget` : isProjectBudget ? 'New Project Budget' : 'New Budget'}
      </DialogTitle>
      <DialogContent>
        <form autoComplete="off">
          <Grid container spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 0.25 }}>
              <Grid size={{xs: 12, md: 4}}>
                <Div>
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
                <Div>
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
                <Div>
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
                <Div>
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

              <Grid size={12}>
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                >
                  <Tab label="Expense Items"/>
                  <Tab label="Product Items"/>
                </Tabs>
              </Grid>

              <Grid size={12}>
                {activeTab === 0 && <LedgerItemsTab ledgerItems={ledgerItems} setLedgerItems={setLedgerItems}/>}
                {activeTab === 1 && <ProductItemsTab productItems={productItems} setProductItems={setProductItems}/>}
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
