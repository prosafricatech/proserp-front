import { yupResolver } from '@hookform/resolvers/yup';
import { LoadingButton } from '@mui/lab';
import { Autocomplete, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Grid, LinearProgress, TextField} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useContext, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as yup from "yup";
import approvalChainsServices from '../approvalChainsServices';
import { approvalChainsListItemContext } from '../ApprovalChainsListItem';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '@/components/organizations/organizationServices';
import { Div } from '@jumbo/shared';
import { ApprovalChainLevel } from '../ApprovalChainType';

interface Role {
  id: number;
  name: string;
}

interface PositionIndexOption {
  label: string;
  position_index?: number | null;
  id: number | null;
}

interface FormValues {
  id?: number;
  approval_chain_id?: number;
  position_index?: number | null;
  can_finalize: number;
  can_override: number;
  label: string;
  remarks?: string;
  role_id?: number;
  role?: Role | null;
}

interface ApprovalChainLevelDialogProps {
  approvalChainLevel?: ApprovalChainLevel;
  toggleOpen: (open: boolean) => void;
  approvalChain?: {
    id: number;
  };
}

function ApprovalChainLevelDialog({ approvalChainLevel, toggleOpen, approvalChain }: ApprovalChainLevelDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authOrganization } = useJumboAuth();
  const [can_finalize, setCan_finalize] = useState(approvalChainLevel?.can_finalize === 1);
  const [can_override, setCan_override] = useState(approvalChainLevel?.can_override === 1);
  const { approvalChainLevels = [] } = useContext(approvalChainsListItemContext);

  const validationSchema = yup.object({
    label: yup.string().required('Label is required').typeError('Label is required'),
    role_id: yup.number().required('Role is required').typeError('Role is required'),
    approval_chain_id: yup.number().required(),
    position_index: yup.number().nullable(),
    can_finalize: yup.number(),
    can_override: yup.number(),
    remarks: yup.string().nullable(),
  });

  const addNewChainLevel = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.addNewChainLevel(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChainLevels'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const editApprovalChainLevel = useMutation({
    mutationFn: (data: FormValues) => approvalChainsServices.editApprovalChainLevel(data),
    onSuccess: (data: { message: string }) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['approvalChainLevels'] });
    },
    onError: (error: any) => {
      error?.response?.data?.message && enqueueSnackbar(error.response.data.message, { variant: 'error' });
    }
  });

  const { setValue, register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: approvalChainLevel?.id,
      approval_chain_id: approvalChain?.id,
      position_index: approvalChainLevel?.position_index ?? null,
      can_finalize: approvalChainLevel?.can_finalize ?? 0,
      can_override: approvalChainLevel?.can_override ?? 0,
      label: approvalChainLevel?.label ?? '',
      remarks: approvalChainLevel?.remarks ?? '',
      role_id: approvalChainLevel?.role_id,
      role: approvalChainLevel?.role ?? null,
    }
  });

  const { data: roles, isLoading: isLoadingRoles, isFetching: isFetchingRoles } = useQuery<Role[]>({
    queryKey: ['organizationRoles', authOrganization?.organization?.id],
    queryFn: () => organizationServices.getRoles(authOrganization?.organization?.id!),
    enabled: !!authOrganization?.organization?.id
  });

  const positionIndexOptions: PositionIndexOption[] = [
    { label: 'At the beginning', position_index: null, id: null },
    ...approvalChainLevels.map((level) => ({
      label: `After ${level.role?.name} ${level.label}`,
      position_index: level.position_index ?? null,
      id: level.id ?? null,
    })),
  ];

  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    if (approvalChain) {
      addNewChainLevel.mutate(formData);
    } else {
      editApprovalChainLevel.mutate(formData);
    }
  };

  return (
    <>
      <DialogTitle>
        <Grid container columnSpacing={1}>
          <Grid size={12} textAlign={"center"}>
            {approvalChain ? 'Add New Chain Level' : 'Edit Level'}
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
          <Grid container columnSpacing={1} mb={1}>
            <Grid size={{xs: 12, md: 4}}>
              {(isFetchingRoles || isLoadingRoles) ? (
                <LinearProgress/>
              ) : (
                <Div sx={{ mt: 1 }}>
                  <Autocomplete
                    id="checkboxes-role_id"
                    options={roles || []}
                    defaultValue={approvalChainLevel?.role ? 
                      { id: approvalChainLevel.role.id, name: approvalChainLevel.role.name } as Role : 
                      null
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option: Role) => option.name}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Role"
                        size="small"
                        fullWidth
                        error={!!errors.role_id}
                        helperText={errors.role_id?.message}
                      />
                    )}
                    onChange={(e, newValue: Role | null) => {
                      setValue('role_id', newValue?.id ?? undefined, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue('role', newValue ?? null);
                    }}
                  />
                </Div>
              )}
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
                <TextField
                  label="Label"
                  size="small"
                  fullWidth
                  error={!!errors?.label}
                  helperText={errors?.label?.message}
                  {...register('label')}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1}}>
                <Autocomplete
                  options={approvalChain ? 
                    positionIndexOptions.filter(index => index.position_index !== approvalChainLevel?.position_index) : 
                    positionIndexOptions}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.label}
                  renderInput={(params) => 
                    <TextField 
                      {...params} 
                      label="Position" 
                      size="small" 
                      fullWidth
                    />
                  }
                  onChange={(e, newValue) => {
                    setValue('position_index', newValue?.position_index !== null ? 
                      (newValue?.position_index ?? 0) + 1 : 
                      null, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 1 }}>
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
            <Grid size={{xs: 6, md: 4}}>
              <Div sx={{ mt: 1}}>
                <Checkbox
                  checked={can_finalize}
                  size='small'
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setCan_finalize(isChecked);
                    setValue('can_finalize', isChecked ? 1 : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                Can Finalize
              </Div>
            </Grid>
            <Grid size={{xs: 6, md: 4}}>
              <Div sx={{ mt: 1}}>
                <Checkbox
                  checked={can_override}
                  size='small'
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setCan_override(isChecked);
                    setValue('can_override', isChecked ? 1 : 0, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
                Can Override
              </Div>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => toggleOpen(false)}>
          Cancel
        </Button>
        <LoadingButton
          loading={editApprovalChainLevel.isPending || addNewChainLevel.isPending}
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

export default ApprovalChainLevelDialog;