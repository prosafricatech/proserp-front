import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
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
import LedgerItemsRow from './budgetItems/tabs/LedgerItemsRow';
import ProductItemsTab from './budgetItems/tabs/ProductItemsTab';
import ProductItemsRow from './budgetItems/tabs/ProductItemsRow';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';

const BudgetsForm = ({ setOpenDialog, budget=null, isProjectBudget=true }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const costCenters = authOrganization?.costCenters;
  const { project } = useProjectProfile();
  const [activeTab, setActiveTab] = useState(0);
  const [serverError, setServerError] = useState(null);
  const [ledgerItems, setLedgerItems] = useState(budget ? budget.ledger_items : []);
  const [productItems, setProductItems] = useState(budget ? budget.product_items : []);
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [submitItemForm, setSubmitItemForm] = useState(false);

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

  useEffect(() => {
    setLedgerItems(budget?.ledger_items || []);
    setProductItems(budget?.product_items || []);
  }, [budget]);

  const validationSchema = yup.object({
    name: yup.string().required('Budget name is required'),
    start_date: yup.string().required('Start Date is required'),
    end_date: yup.string().required('End Date is required'),
    cost_center_id: yup
      .number()
      .required('Cost Center is required')
      .positive('Cost Center is Required')
      .typeError('Cost Center is Required'),
  });

  const { register, setValue, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: budget?.id,
      name: budget?.name,
      start_date: budget?.start_date,
      end_date: budget?.end_date,
      cost_center_id: project?.cost_center?.id || budget?.cost_center_id ,
      remarks: budget?.remarks || '',
    },
  });

  const handleSubmitForm = (data) => {
    const payload = {
      ...data,
      ledger_items: ledgerItems,
      product_items: productItems,
    };
    saveMutation(payload);
  };

  const submitMainForm = () => {
    handleSubmit((data) => handleSubmitForm(data))();
  };

  const onSubmit = (data) => {
    if (activeTab === 0 && isDirty) {
      setShowWarning(true);
      return;
    }
    handleSubmitForm(data);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setShowWarning(false);
    setIsDirty(false);
    setSubmitItemForm(false);
    submitMainForm();
  };

  const handleAddAndSubmit = () => {
    setShowWarning(false);
    setSubmitItemForm(true);
  };

  return (
    <>
      <DialogTitle textAlign="center" sx={{ pb: 1 }}>
        {budget ? `Edit ${budget?.name} Budget` : isProjectBudget ? 'New Project Budget' : 'New Budget'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
            <Grid size={{xs: 12, md: 4}}>
              <TextField
                label="Budget Name"
                size="small"
                fullWidth
                error={!!errors?.name}
                helperText={errors?.name?.message}
                {...register('name')}
              />
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
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
            </Grid>

            <Grid size={{xs: 12, md: 4}}>
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
            </Grid>

            {serverError?.date_overlap && (
              <Grid size={12}>
                <Alert severity="error" variant="outlined">{serverError.date_overlap[0]}</Alert>
              </Grid>
            )}

            <Grid size={{ xs: 12, md: 4 }}>
              <CostCenterSelector
                label='Cost Center'
                frontError={errors.cost_center_id}
                defaultValue={
                  (budget && budget.cost_center) ||
                  (costCenters.length === 1 ? costCenters[0] : null)
                }
                multiple={false}
                onChange={(newValue) => {
                  setValue('cost_center_id', newValue?.id, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid> 

            <Grid size={{ xs: 12, md: 8 }}>
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
              {activeTab === 0 && (
                <>
                  <LedgerItemsTab
                    ledgerItems={ledgerItems}
                    setLedgerItems={setLedgerItems}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    setIsDirty={setIsDirty}
                  />
                  {ledgerItems?.map((ledgerItem, index) => (
                    <LedgerItemsRow
                      key={`${ledgerItem?.id ?? 'new'}-${index}`}
                      ledgerItem={ledgerItem}
                      index={index}
                      ledgerItems={ledgerItems}
                      setLedgerItems={setLedgerItems}
                      submitMainForm={submitMainForm}
                      setSubmitItemForm={setSubmitItemForm}
                      submitItemForm={submitItemForm}
                      setIsDirty={setIsDirty}
                    />
                  ))}
                </>
              )}
              {activeTab === 1 && (
                <>
                  <ProductItemsTab
                    productItems={productItems}
                    setProductItems={setProductItems}
                    submitMainForm={submitMainForm}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    setIsDirty={setIsDirty}
                  />
                  {productItems?.map((productItem, index) => (
                    <ProductItemsRow
                      key={`${productItem?.id ?? 'new'}-${index}`}
                      productItem={productItem}
                      index={index}
                      productItems={productItems}
                      setProductItems={setProductItems}
                    />
                  ))}
                </>
              )}
            </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={() => setOpenDialog(false)}>Cancel</Button>
        <LoadingButton
          type="submit"
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          size="small"
          sx={{ display: 'flex' }}
          loading={isPending}
        >
          Submit
        </LoadingButton>
      </DialogActions>
      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        <DialogTitle>Unsaved Expense Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes in Expense Items form. Do you want to add the item first, or submit without adding it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarning(false)} color='inherit'>
            Cancel
          </Button>
          <Button onClick={handleConfirmSubmitWithoutAdd} color='warning' variant='outlined'>
            Submit Without Add
          </Button>
          <LoadingButton onClick={handleAddAndSubmit} variant='contained'>
            Add & Submit
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BudgetsForm;
