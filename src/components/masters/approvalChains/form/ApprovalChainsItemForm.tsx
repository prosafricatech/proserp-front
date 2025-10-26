import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import organizationServices from '@/components/Organizations/organizationServices';
import { yupResolver } from '@hookform/resolvers/yup';
import { Div } from '@jumbo/shared';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { Autocomplete, Button, Checkbox, Grid, IconButton, LinearProgress, TextField, Tooltip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import * as yup from "yup";
import { ApprovalChainItem } from '../ApprovalChainType';

interface Role {
  id: number;
  name: string;
  [key: string]: any;
}

interface FormValues {
  can_finalize: number;
  can_override: number;
  label: string;
  remarks?: string;
  role_id?: number | null;
  role?: Role | null;
}

interface ApprovalChainsItemFormProps {
  setClearFormKey: React.Dispatch<React.SetStateAction<number>>;
  submitMainForm: SubmitHandler<any>;
  submitItemForm: boolean;
  setSubmitItemForm: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  item?: ApprovalChainItem | null;
  index?: number;
  setItems: React.Dispatch<React.SetStateAction<ApprovalChainItem[]>>;
  items?: ApprovalChainItem[];
  setShowForm?: React.Dispatch<React.SetStateAction<boolean>>;
}

function ApprovalChainsItemForm({
  setClearFormKey,
  submitMainForm,
  submitItemForm,
  setSubmitItemForm,
  setIsDirty,
  item = null,
  index = -1,
  setItems,
  items = [],
  setShowForm
}: ApprovalChainsItemFormProps) {
  const { authOrganization } = useJumboAuth();
  const [can_finalize, setCan_finalize] = useState(item?.can_finalize === 1);
  const [can_override, setCan_override] = useState(item?.can_override === 1);

  const validationSchema = yup.object({
    label: yup.string().required('Label is required').typeError('Label is required'),
    role_id: yup.number().required('Role is required').typeError('Role is required'),
  });

  const { 
    setValue, 
    register, 
    watch, 
    handleSubmit, 
    reset, 
    formState: { errors, dirtyFields } 
  } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      can_finalize: item?.can_finalize ?? 0,
      can_override: item?.can_override ?? 0,
      label: item?.label ?? '',
      remarks: item?.remarks ?? '',
      role_id: item?.role_id ?? null,
      role: item?.role ?? null,
    }
  });

  useEffect(() => {
      const subscription = watch(() => {
          const hasDirtyFields = Object.keys(dirtyFields).length > 0;
          setIsDirty(hasDirtyFields);
      });
      return () => subscription.unsubscribe();
  }, [watch, dirtyFields, setIsDirty]);

  const [isAdding, setIsAdding] = useState(false); 

  const updateItems: SubmitHandler<FormValues> = async (formData) => {
    setIsAdding(true);
    const newItem = {
      ...formData,
      can_finalize: formData.can_finalize,
      can_override: formData.can_override,
    };

    if (index > -1) {
      const updatedItems = [...items];
      updatedItems[index] = newItem;
      setItems(updatedItems);
      setClearFormKey(prevKey => prevKey + 1);
    } else {
      setItems(prevItems => [...prevItems, newItem]);
      if (submitItemForm) {
        submitMainForm(newItem);
      }
      setSubmitItemForm(false);
      setClearFormKey(prevKey => prevKey + 1);
    }

    reset();
    setIsAdding(false);
    setShowForm?.(false);
  };

  useEffect(() => {
    if (submitItemForm) {
      handleSubmit(updateItems, () => {
        setSubmitItemForm(false);
      })();
    }
  }, [submitItemForm]);

  const { 
    data: roles, 
    isLoading: isLoadingRoles, 
    isFetching: isFetchingRoles 
  } = useQuery<Role[]>({
    queryKey: ['organizationRoles', authOrganization?.organization?.id],
    queryFn: () => organizationServices.getRoles(authOrganization?.organization?.id),
    enabled: !item && !!authOrganization?.organization?.id,
  });

  if (isAdding) {
    return <LinearProgress/>;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container columnSpacing={1} mb={1} mt={1}>
        <Grid size={12} textAlign={"center"}>
          {'Add Levels'}
        </Grid>
        <Grid size={{xs: 12, md: 4}}>
          {(isFetchingRoles || isLoadingRoles) ? (
            <LinearProgress/> 
          ) : (
            <Div sx={{ mt: 1 }}>
              <Autocomplete
                id="checkboxes-role_id"
                options={roles || []}
                defaultValue={item?.role}
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
                  setValue('role_id', newValue?.id ?? null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  setValue('role', newValue);
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
        <Grid size={{xs: 6, md: 2}}>
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
        <Grid size={{xs: 6, md: 2}}>
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
        <Grid size={{xs: 12, md: 8}} mt={0.3} textAlign={'end'}>
          <Div sx={{ mt: 1 }}>
            <Button
              variant='contained'
              size='small'
              type='submit'
            >
              {item ? (
                <><CheckOutlined fontSize='small' /> Done</>
              ) : (
                <><AddOutlined fontSize='small' /> Add</>
              )}
            </Button>
            {item && (
              <Tooltip title='Close Edit'>
                <IconButton 
                  size='small'
                  onClick={() => {
                    setShowForm?.(false);
                  }}
                >
                  <DisabledByDefault fontSize='small' color='success' />
                </IconButton>
              </Tooltip>
            )}
          </Div>
        </Grid>
      </Grid>
    </form>
  );
}

export default ApprovalChainsItemForm;