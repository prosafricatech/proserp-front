import { LoadingButton } from '@mui/lab';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, TextField, Tooltip, Typography, Box, Tabs, Tab, Paper,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useSnackbar } from 'notistack';
import { HighlightOff } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectsServices from '@/components/projectManagement/projects/project-services';
import CertifiedTasksItemForm from './tab/certifiedTasks/CertifiedTasksItemForm';
import CertifiedTasksItemRow from './tab/certifiedTasks/CertifiedTasksItemRow';
import CertifiedAdjustments from './tab/adjustments/CertifiedAdjustments';
import CertifiedAdjustmentsRow from './tab/adjustments/CertifiedAdjustmentsRow';

const CertificateForm = ({ setOpenDialog, certificate, subContract }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tasksItems, setTasksItems] = useState(certificate?.items || []);
  const [adjustments, setAdjustments] = useState(certificate?.adjustments  ? certificate.adjustments : []);
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const addCertificate = useMutation({
    mutationFn: projectsServices.addCertificates,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      setOpenDialog(false);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Error saving certificate', { variant: 'error' });
    }
  });

  const updateCertificate = useMutation({
    mutationFn: projectsServices.updateCertificates,
    onSuccess: (data) => {
      data?.message && enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Certificates'] });
      setOpenDialog(false);
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Error updating certificate', { variant: 'error' });
    }
  });

  const validationSchema = yup.object({
    remarks: yup.string().required('Remarks is required'),
    certificate_date: yup.string().required('Certificate date is required')
  });

  const {
    handleSubmit, setError, setValue, register, formState: { errors }, watch
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      remarks: certificate?.remarks || '',
      project_subcontract_id: certificate ? certificate.project_subcontract_id : subContract?.id,
      certificate_date: certificate?.certificate_date
        ? dayjs(certificate.certificate_date).toISOString()
        : dayjs().toISOString(),
      id: certificate?.id
    }
  });

  useEffect(() => {
    setValue('adjustments', adjustments?.map(adjustment => ({
      quantity : adjustment.quantity,
      operator: adjustment.operator,
      description: adjustment.description,
    })));
  }, [adjustments, setValue]);  

  const certificateDate = watch('certificate_date');

  const saveCertificate = React.useMemo(() => {
    return certificate ? updateCertificate : addCertificate;
  }, [certificate, updateCertificate, addCertificate]);

  const onSubmit = (data) => {
    if (tasksItems.length === 0) {
      setError("certified_tasks", { type: "manual", message: "You must add at least one Certified Task" });
      return;
    }
    if (isDirty) {
      setShowWarning(true);
    } else {
      handleSubmitForm(data);
    }
  };

  const handleSubmitForm = async (data) => {
    const updatedData = {
      ...data,
      certified_tasks: tasksItems.map((item) => ({
        project_subcontract_task_id: item.project_subcontract_task_id,
        remarks: item.remarks,
        certified_quantity: item.certified_quantity,
      })),
      adjustments: adjustments.map((item) => ({
        description: item.description,
        type: item.type === '-' ? 'deduction' : 'addition',
        amount: item.amount,
      })),
    };
    await saveCertificate.mutate(updatedData);
  };

  const handleConfirmSubmitWithoutAdd = () => {
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1);
    handleSubmit(handleSubmitForm)();
  };

  return (
    <>
      <DialogTitle textAlign="center">
        {certificate ? `Edit Certificate` : 'New Certificate Form'}
      </DialogTitle>

      <DialogContent>
        <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={1} mb={3} paddingTop={1}>
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label="Certificate Date"
                value={dayjs(watch("certificate_date"))}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputProps: { readOnly: true },
                    error: !!errors.certificate_date,
                    helperText: errors.certificate_date?.message
                  }
                }}
                onChange={(newValue) => {
                  setValue('certificate_date', newValue?.toISOString() || '', {
                    shouldValidate: true,
                    shouldDirty: true
                  });
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
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

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              borderColor: 'divider'
            }}
          >
            <Tab label="Certified Tasks" />
            <Tab label="Adjustments" />
          </Tabs>

          <Divider/>

          <Box>
            {activeTab === 0 && (
              <>
                <CertifiedTasksItemForm
                  setClearFormKey={setClearFormKey}
                  submitMainForm={handleSubmit(() => saveCertificate.mutate(watch()))}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  key={clearFormKey}
                  setIsDirty={setIsDirty}
                  tasksItems={tasksItems}
                  subContract={subContract}
                  certificate={certificate}
                  CertificateDate={certificateDate}
                  setTasksItems={setTasksItems}
                />

                {tasksItems.map((taskItem, index) => (
                  <CertifiedTasksItemRow
                    key={index}
                    index={index}
                    taskItem={taskItem}
                    tasksItems={tasksItems}
                    setTasksItems={setTasksItems}
                    CertificateDate={certificateDate}
                    setIsDirty={setIsDirty}
                    subContract={subContract}
                    certificate={certificate}
                    setClearFormKey={setClearFormKey}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    submitMainForm={handleSubmit(() => saveCertificate.mutate(watch()))}
                  />
                ))}
              </>
            )}

            {activeTab === 1 && (
              <>
                <CertifiedAdjustments
                  setClearFormKey={setClearFormKey}
                  submitMainForm={handleSubmit(() => saveCertificate.mutate(watch()))}
                  submitItemForm={submitItemForm}
                  setSubmitItemForm={setSubmitItemForm}
                  key={clearFormKey}
                  setIsDirty={setIsDirty}
                  adjustments={adjustments}
                  setAdjustments={setAdjustments}
                />
                
                {adjustments.map((adjustment, index) => (
                  <CertifiedAdjustmentsRow
                    key={index}
                    index={index}
                    adjustment={adjustment}
                    adjustments={adjustments}
                    setAdjustments={setAdjustments}
                    setIsDirty={setIsDirty}
                    setClearFormKey={setClearFormKey}
                    submitItemForm={submitItemForm}
                    setSubmitItemForm={setSubmitItemForm}
                    submitMainForm={handleSubmit(() => saveCertificate.mutate(watch()))}
                  />
                ))}
              </>
            )}

            {errors?.certified_tasks?.message && tasksItems.length < 1 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.certified_tasks.message}
              </Alert>
            )}
          </Box>
        </form>

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={11}>Unsaved Changes</Grid>
              <Grid size={1} textAlign="right">
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => setShowWarning(false)}>
                    <HighlightOff color="primary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>Last item was not added to the list</DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => { setSubmitItemForm(true); setShowWarning(false); }}>
              Add and Submit
            </Button>
            <Button size="small" onClick={handleConfirmSubmitWithoutAdd} color="secondary">
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
          {activeTab === 1 &&
            <Button
              size="small"
              variant='outlined'
              onClick={() => setActiveTab((t) => t - 1)}
            >
              Prev
            </Button>
          }

          {activeTab < 1 ? (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setActiveTab((t) => t + 1)}
            >
              Next
            </Button>
          ) : (
            <LoadingButton
              loading={addCertificate.isPending || updateCertificate.isPending}
              size="small"
              variant="contained"
              color="primary"
              onClick={handleSubmit(onSubmit)}
            >
              {certificate ? "Update" : "Submit"}
            </LoadingButton>
          )}
        </Box>
      </DialogActions>
    </>
  );
};

export default CertificateForm;