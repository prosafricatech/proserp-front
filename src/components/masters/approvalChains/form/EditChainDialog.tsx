import { Autocomplete, Button, DialogActions, DialogTitle, Grid, TextField } from '@mui/material'
import React from 'react'
import { LoadingButton } from '@mui/lab';
import * as yup from "yup";
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, SubmitHandler } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import approvalChainsServices from '../approvalChainsServices';
import CostCenterSelector from '../../costCenters/CostCenterSelector';
import { PROCESS_TYPES } from '@/utilities/constants/processTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { CostCenter } from '../../costCenters/CostCenterType';
import { ApprovalChain } from '../ApprovalChainType';

interface FormValues {
  id: number;
  process_type: string;
  remarks?: string;
  cost_center_id?: number | null;
}

interface EditChainDialogProps {
  toggleOpen: (open: boolean) => void;
  approvalChain: ApprovalChain
}

function EditChainDialog({ toggleOpen, approvalChain }: EditChainDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const validationSchema = yup.object({
    process_type: yup.string().required('Process Type is required').typeError('Process Type is required'),
    cost_center_id: yup.number().nullable(),
  });

  const { handleSubmit, setValue, register, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: approvalChain.id,
      process_type: approvalChain.process_type,
      remarks: approvalChain.remarks || undefined,
      cost_center_id: approvalChain.cost_center_id ?? null,
    }
  });

  const editApprovalChain = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.editApprovalChain(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChains'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    editApprovalChain.mutate(formData);
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={2}>
          <Grid size={12} textAlign={"center"} mb={2}>
            {'Edit Approval Chain'}
          </Grid>
          <Grid size={12}>
            <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
              <Grid container columnSpacing={1} rowSpacing={2}>
                <Grid size={{xs: 12, md: 4}}>
                  <Div sx={{ mt: 0.3 }}>
                    <Autocomplete
                      id="checkboxes-process_type"
                      options={PROCESS_TYPES}
                      defaultValue={approvalChain.process_type}
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
                        setValue('process_type', newValue ?? '', {
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
                      label="Cost Center"
                      withNotSpecified={true}
                      defaultValue={approvalChain?.cost_center as CostCenter || null}
                      onChange={(newValue) => {
                        if (newValue && !Array.isArray(newValue)) {
                          setValue('cost_center_id', newValue.id, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        } else {
                          setValue('cost_center_id', null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
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
              </Grid>
            </form>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={editApprovalChain.isPending}
          variant='contained'
          onClick={handleSubmit(onSubmit)}
          size='small'
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </>
  )
}

export default EditChainDialog;