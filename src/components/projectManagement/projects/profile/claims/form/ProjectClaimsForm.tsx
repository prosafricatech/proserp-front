import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Box,
  Tabs,
  Tab,
  Divider,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectsServices from '@/components/projectManagement/projects/project-services';
import ProjectClaimsAdjustments from './tab/adjustments/ProjectClaimsAdjustments';
import ProjectClaimsAdjustmentsRow from './tab/adjustments/ProjectClaimsAdjustmentsRow';
import ClaimedDeliverablesItemForm from './tab/claimedDeliverables/ClaimedDeliverablesItemForm';
import ClaimedDeliverablesItemRow from './tab/claimedDeliverables/ClaimedDeliverablesItemRow';
import { useProjectProfile } from '../../ProjectProfileProvider';
import CurrencySelector from '@/components/masters/Currencies/CurrencySelector';

interface Adjustment {
  type?: string;
  type_name?: string;
  description?: string;
  amount?: number;
  complement_ledger_id?: number;
  complement_ledger?: { id: number };
}

interface ClaimedDeliverable {
  project_deliverable_id: number;
  remarks?: string;
  certified_quantity: number;
  revenue_ledger_id?: number;
}

interface Claim {
  id?: number;
  project_id?: number;
  remarks?: string;
  claim_date?: string;
  currency_id?: number;
  claim_items?: ClaimedDeliverable[];
  adjustments?: Adjustment[];
}

interface ProjectClaimsFormProps {
  setOpenDialog: (open: boolean) => void;
  claim?: Claim;
  subContract?: any;
}

// Extend form values to include manual error field
interface FormValues {
  id?: number;
  project_id: number;
  remarks: string;
  claim_date: string;
  currency_id: number;
  // Manual error field (not submitted)
  claimed_deliverables?: string;
}

const validationSchema = yup.object({
  remarks: yup.string().required('Remarks is required'),
  claim_date: yup.string().required('Claim date is required'),
  currency_id: yup
    .number()
    .required('Currency is required')
    .positive('Invalid currency'),
});

const ProjectClaimsForm: React.FC<ProjectClaimsFormProps> = ({
  setOpenDialog,
  claim,
  subContract,
}) => {
  const queryClient = useQueryClient();
  const { project } = useProjectProfile() as any;
  const { enqueueSnackbar } = useSnackbar();

  const [deliverableItems, setDeliverablesItems] = useState<ClaimedDeliverable[]>(
    claim?.claim_items || []
  );
  const [adjustments, setAdjustments] = useState<Adjustment[]>(
    claim?.adjustments || []
  );
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const addClaim = useMutation({
    mutationFn: projectsServices.addClaim,
    onSuccess: (data: any) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Error saving claim', {
        variant: 'error',
      });
    },
  });

  const updateClaim = useMutation({
    mutationFn: projectsServices.updateClaim,
    onSuccess: (data: any) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['projectProjectClaims'] });
      setOpenDialog(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data?.message || 'Error updating claim', {
        variant: 'error',
      });
    },
  });

  const {
    handleSubmit,
    setError,
    setValue,
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      remarks: claim?.remarks || '',
      project_id: claim?.project_id || project.id,
      currency_id: claim?.currency_id || 1,
      claim_date: claim?.claim_date
        ? dayjs(claim.claim_date).toISOString()
        : dayjs().toISOString(),
      id: claim?.id,
    },
  });

  const selectedCurrencyId = watch('currency_id');
  const ClaimDate = watch('claim_date');

  const saveClaim = useMemo(
    () => (claim ? updateClaim : addClaim),
    [claim, updateClaim, addClaim]
  );

  const onSubmit = (data: FormValues) => {
    if (deliverableItems.length === 0) {
      setError('claimed_deliverables', {
        type: 'manual',
        message: 'You must add at least one Certified Task',
      });
      return;
    }

    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmitForm(data);
    }
  };

  const handleSubmitForm = async (data: FormValues) => {
    const payload = {
      ...data,
      claimed_deliverables: deliverableItems,
      adjustments: adjustments.map((item) => ({
        description: item.description,
        complement_ledger_id:
          item.complement_ledger_id || item.complement_ledger?.id,
        type: item.type === '-' ? 'deduction' : 'addition',
        amount: item.amount,
      })),
    };

    saveClaim.mutate(payload as any);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey((k) => k + 1);
    handleSubmit(handleSubmitForm)();
  };

  return (
    <>
      <DialogTitle textAlign="center">
        {claim ? 'Edit Claim' : 'New Claim Form'}
      </DialogTitle>

      <DialogContent>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1} mb={3} pt={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DateTimePicker
                label="Claim Date"
                value={dayjs(ClaimDate)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputProps: { readOnly: true },
                    error: !!errors.claim_date,
                    helperText: errors.claim_date?.message,
                  },
                }}
                onChange={(newValue) =>
                  setValue('claim_date', newValue?.toISOString() || '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <CurrencySelector
                frontError={errors.currency_id as any}
                defaultValue={selectedCurrencyId}
                onChange={(newValue: any) =>
                  setValue('currency_id', newValue?.id ?? null, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </Grid>

            <Grid size={12}>
              <TextField
                size="small"
                label="Remarks"
                fullWidth
                multiline
                rows={2}
                {...register('remarks')}
                error={!!errors.remarks}
                helperText={errors.remarks?.message}
              />
            </Grid>
          </Grid>

          {/* Fixed Tabs – removed fullWidth, added variant */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Claimed Deliverables" />
            <Tab label="Adjustments" />
          </Tabs>

          <Divider />

          <Box mt={2}>
            {activeTab === 0 && (
              <>
                <ClaimedDeliverablesItemForm
                  key={clearFormKey}
                  setClearFormKey={setClearFormKey}
                  submitMainForm={handleSubmit(() =>
                    saveClaim.mutate(watch() as any)
                  )}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  selectedCurrencyId={selectedCurrencyId}
                  setIsDirty={setIsDirty}
                  deliverableItems={deliverableItems}
                  subContract={subContract}
                  ClaimDate={ClaimDate}
                  setDeliverablesItems={setDeliverablesItems}
                />

                {deliverableItems.map((item, index) => (
                  <ClaimedDeliverablesItemRow
                    key={index}
                    index={index}
                    deliverableItem={item}
                    deliverableItems={deliverableItems}
                    setDeliverablesItems={setDeliverablesItems}
                    ClaimDate={ClaimDate}
                    setIsDirty={setIsDirty}
                    selectedCurrencyId={selectedCurrencyId}
                    subContract={subContract}
                    claim={claim}
                    setClearFormKey={setClearFormKey}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    submitMainForm={handleSubmit(() =>
                      saveClaim.mutate(watch() as any)
                    )}
                  />
                ))}
              </>
            )}

            {activeTab === 1 && (
              <>
                <ProjectClaimsAdjustments
                  key={clearFormKey}
                  setClearFormKey={setClearFormKey}
                  submitMainForm={handleSubmit(() =>
                    saveClaim.mutate(watch() as any)
                  )}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  setIsDirty={setIsDirty}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                />

                {adjustments.map((adjustment, index) => (
                  <ProjectClaimsAdjustmentsRow
                    key={index}
                    index={index}
                    adjustment={adjustment}
                    adjustments={adjustments}
                    setAdjustments={setAdjustments}
                    setIsDirty={setIsDirty}
                    setClearFormKey={setClearFormKey}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    submitMainForm={handleSubmit(() =>
                      saveClaim.mutate(watch() as any)
                    )}
                  />
                ))}
              </>
            )}

            {/* Fixed error display */}
            {'claimed_deliverables' in errors && deliverableItems.length === 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(errors as any).claimed_deliverables?.message}
              </Alert>
            )}
          </Box>
        </form>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogContent>Last item was not added to the list</DialogContent>
          <DialogActions>
            <Button
              size="small"
              onClick={() => {
                setSubmitItemForm(true);
                setShowWarning(false);
              }}
            >
              Add and Submit
            </Button>
            <Button size="small" color="secondary" onClick={handleConfirmSubmitWithoutAdd}>
              Submit without add
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>

      <DialogActions>
        <Button size="small" onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>

        <Box display="flex" gap={1}>
          {activeTab === 0 && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setActiveTab(1)}
            >
              Next
            </Button>
          )}

          {activeTab === 1 && (
            <LoadingButton
              loading={addClaim.isPending || updateClaim.isPending}
              size="small"
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmit)}
            >
              {claim ? 'Update' : 'Submit'}
            </LoadingButton>
          )}
        </Box>
      </DialogActions>
    </>
  );
};

export default ProjectClaimsForm;