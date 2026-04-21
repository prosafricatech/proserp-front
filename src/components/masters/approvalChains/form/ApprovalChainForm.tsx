import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import approvalChainsServices from '../approvalChainsServices';
import ApprovalChainsItemForm from './ApprovalChainsItemForm';
import ApprovalChainsItemRow from './ApprovalChainsItemRow';
import CostCenterSelector from '../../costCenters/CostCenterSelector';
import { HighlightOff } from '@mui/icons-material';
import { PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';

interface ApprovalChainFormValues {
  process_type: string;
  cost_center_id?: number | null;
  remarks?: string;
  levels?: any[]; 
}

interface ApprovalChainFormProps {
  toggleOpen: (open: boolean) => void;
}

function ApprovalChainForm({ toggleOpen }: ApprovalChainFormProps) {
  const [items, setItems] = useState<any[]>([]);
  const [serverError, setServerError] = useState<{ process_type?: string[] } | null>(null);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);

  const validationSchema = yup.object({
    process_type: yup.string().required('Process Type is required').typeError('Process Type is required'),
  });

  const { 
    handleSubmit, 
    setError, 
    setValue, 
    register, 
    formState: { errors }
  } = useForm<ApprovalChainFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      process_type: '',
      cost_center_id: null,
      remarks: '',
      levels: []
    }
  });

  const addApprovalChains = useMutation({
    mutationFn: approvalChainsServices.addApprovalChains,
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChains'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 400) {
        setServerError(error.response?.data?.validation_errors);
      } else {
        enqueueSnackbar(error.response?.data?.message, { variant: 'error' });
      }
    }
  });

  useEffect(() => {
    setValue('levels', items);
  }, [items, setValue]);

  const onSubmit: SubmitHandler<ApprovalChainFormValues> = (data) => {
    if (items.length === 0) {
      setError('levels', {
        type: "manual",
        message: "You must add at least one item",
      });
      return;
    } else if (isDirty) {
      setShowWarning(true);
    } else {
      addApprovalChains.mutate(data);
    }
  };  

  const handleConfirmSubmitWithoutAdd = () => {
    handleSubmit((data) => addApprovalChains.mutate(data))();
    setIsDirty(false);
    setShowWarning(false);
    setClearFormKey(prev => prev + 1);
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={12} textAlign={"center"} mb={2}>
            {'New Approval Chain'}
          </Grid>
          <Grid size={12}>
            <form autoComplete='off'>
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id="checkboxes-process_type"
                      options={PROCESS_TYPES}
                      isOptionEqualToValue={(option, value) => option === value}
                      getOptionLabel={(option) => option}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Process Type"
                          size="small"
                          fullWidth
                          error={!!errors.process_type}
                          helperText={errors.process_type?.message}
                        />
                      )}
                      onChange={(e, newValue: string | null) => {
                        setServerError(null);
                        setValue('process_type', newValue || '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <CostCenterSelector
                      multiple={false}
                      withNotSpecified={true}
                      label="Cost Center"
                      onChange={(newValue) => {
                        setServerError(null);
                        if (!Array.isArray(newValue)) {
                          setValue('cost_center_id', newValue?.id ?? null);
                        } else {
                          // just in case, handle the array scenario safely
                          setValue('cost_center_id', null);
                        }
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <TextField
                      label="Remarks"
                      size="small"
                      multiline={true}
                      minRows={2}
                      fullWidth
                      {...register('remarks')}
                    />
                  </Div>
                </Grid>
                <Grid size={12}>
                  {serverError?.process_type && (
                    <Typography variant="body2" color="error" textAlign={{ md: 'center' }}>
                      {serverError.process_type[0]}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Grid size={12}>
            <Divider />
            <ApprovalChainsItemForm 
              setClearFormKey={setClearFormKey} 
              submitMainForm={handleSubmit(onSubmit)} 
              submitItemForm={submitItemForm} 
              setSubmitItemForm={setSubmitItemForm} 
              key={clearFormKey} 
              setIsDirty={setIsDirty} 
              setItems={setItems} 
              items={items}
            />
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        {errors?.levels?.message && items.length < 1 && (
          <Alert severity='error'>{errors.levels.message}</Alert>
        )}
        {items.map((item, index) => (
          <ApprovalChainsItemRow 
            setClearFormKey={setClearFormKey} 
            submitMainForm={handleSubmit(onSubmit)} 
            submitItemForm={submitItemForm} 
            setSubmitItemForm={setSubmitItemForm} 
            setIsDirty={setIsDirty} 
            key={index} 
            index={index} 
            setItems={setItems} 
            items={items} 
            item={item} 
          />
        ))}

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>            
            <Grid container alignItems="center" justifyContent="space-between">
              <Grid size={11}>
                Unsaved Changes
              </Grid>
              <Grid size={1} textAlign="right">
                <Tooltip title="Close">
                  <IconButton size="small" onClick={() => setShowWarning(false)}>
                    <HighlightOff color="primary" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>
            Last item was not added to the list
          </DialogContent>
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
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={addApprovalChains.isPending}
          variant='contained' 
          onClick={handleSubmit(onSubmit)}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  );
}

export default ApprovalChainForm;