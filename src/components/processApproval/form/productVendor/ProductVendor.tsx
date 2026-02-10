import React, { useEffect, useState } from 'react';
import { Grid, IconButton, LinearProgress, TextField, Tooltip, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useStakeholderSelect } from '@/components/masters/stakeholders/StakeholderSelectProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import StakeholderQuickAdd from '@/components/masters/stakeholders/StakeholderQuickAdd';
import { Div } from '@jumbo/shared';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Vendor } from '../../RequisitionType';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

interface FormValues {
  stakeholder_id: number;
  remarks?: string;
}

interface ProductVendorProps {
  isFromApproval?: boolean;
  vendorIndex?: number;
  index?: number;
  setShowForm?: (show: boolean) => void;
  vendor?: Vendor | null;
  setRequisition_product_items: (items: any) => void;
  vendors?: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
}

function ProductVendor({
  isFromApproval = false,
  vendorIndex,
  index = -1,
  setShowForm,
  vendor,
  setRequisition_product_items,
  vendors = [],
  setVendors,
}: ProductVendorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { stakeholders } = useStakeholderSelect();
  const [stakeholderQuickAddDisplay, setStakeholderQuickAddDisplay] = useState(false);
  const [addedStakeholder, setAddedStakeholder] = useState<Stakeholder | null>(null);
  const {checkOrganizationPermission} = useJumboAuth();

  const validationSchema = yup.object({
    stakeholder_id: yup
      .number()
      .required("Stakeholder is required")
      .typeError('Stakeholder is required')
      .test(
        'unique-stakeholder',
        'Vendor already exists',
        (value) => {
          // Exclude the current vendor being edited
          const isEditing = index > -1 && vendors[index]?.stakeholder?.id === value;
          const isDuplicate = vendors.some((vendor) => vendor.stakeholder?.id === value);
          return isEditing || !isDuplicate;
        }
      ),
  });  

  const { setValue, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      stakeholder_id: vendor ? vendor.stakeholder_id : undefined,
      remarks: vendor?.remarks,
    }
  });

  const updateItems = async (data: FormValues) => {
    setIsAdding(true);
    const newVendor = {
      ...data,
      stakeholder: stakeholders.find(stakeholder => stakeholder.id === data.stakeholder_id)
    };

    if (index > -1) {
      // Replace the existing item with the edited item
      const updatedProductVendor = [...vendors];
      updatedProductVendor[index] = newVendor as Vendor;
      await setVendors(updatedProductVendor);
    } else {
      // Add the new item to the productVendor array
      await setVendors([...vendors, newVendor as Vendor]);
    }

    reset();
    setIsAdding(false);
    setAddedStakeholder(null);
    setShowForm && setShowForm(false);
  };

  useEffect(() => {
    if (!vendor) {
      setRequisition_product_items((prevItems: any[]) => {
        return prevItems.map((product_item, idx) => {
          if (idx === vendorIndex) {
            return { ...product_item, vendors: [...vendors] };
          }
          return product_item;
        });
      });   
    }
  }, [vendors, vendorIndex, setRequisition_product_items, vendor]);

  // set values from coming addedStakeholder
  useEffect(() => {
    if (addedStakeholder?.id) {
      setValue('stakeholder_id', addedStakeholder.id);
      setStakeholderQuickAddDisplay(false);
    }
  }, [addedStakeholder, setValue]);

  if (isAdding) {
    return <LinearProgress />;
  }

  return (
    <form autoComplete='off' onSubmit={handleSubmit(updateItems)}>
      <Grid container spacing={0.5} paddingBottom={0.5} paddingTop={0.5}>
        {!stakeholderQuickAddDisplay && (
          <>
            {!isFromApproval && (
              <Grid size={12}>
                <Typography variant='h5' textAlign={'center'}>Add Vendor</Typography>
              </Grid>
            )}
            <Grid size={{xs: 12, md: 5}}>
              <Div sx={{ mt: 0.3 }}>
                <StakeholderSelector
                  label='Vendor'
                  defaultValue={vendor?.stakeholder_id}
                  frontError={errors.stakeholder_id ? { message: errors.stakeholder_id.message || '' } : undefined}
                  addedStakeholder={addedStakeholder}
                  onChange={(newValue: Stakeholder | Stakeholder[] | null) => {
                    if (newValue && !Array.isArray(newValue)) {
                      setValue('stakeholder_id', newValue.id, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }
                  }}
                  startAdornment= {
                    checkOrganizationPermission(PERMISSIONS.STAKEHOLDERS_CREATE) && (
                      <Tooltip title="Add Client">
                        <AddOutlined
                          onClick={() => setStakeholderQuickAddDisplay(true)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    )
                  }
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Div sx={{ mt: 0.3 }}>
                <TextField
                  size="small"
                  fullWidth
                  defaultValue={vendor?.remarks}
                  label="Remarks"
                  multiline={true}
                  rows={2}
                  onChange={(e) => {
                    setValue('remarks', e.target.value ? e.target.value : '', {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 1}} textAlign={'end'}>
              <LoadingButton
                loading={false}
                variant='contained'
                type='submit'
                size='small'
                sx={{ marginBottom: 0.5 }}
              >
                {vendor ? (
                  <>
                    <CheckOutlined fontSize='small' /> Done
                  </>
                ) : (
                  <>
                    <AddOutlined fontSize='small' /> Add
                  </>
                )}
              </LoadingButton>
              {vendor && (
                <Tooltip title='Close Edit'>
                  <IconButton
                    size='small'
                    onClick={() => {
                      setShowForm && setShowForm(false);
                    }}
                  >
                    <DisabledByDefault fontSize='small' color='success' />
                  </IconButton>
                </Tooltip>
              )}
            </Grid>
          </>
        )}

        {stakeholderQuickAddDisplay && (
          <StakeholderQuickAdd
            setStakeholderQuickAddDisplay={setStakeholderQuickAddDisplay}
            create_payable={true}
            setAddedStakeholder={setAddedStakeholder}
          />
        )}
      </Grid>
    </form>
  );
}

export default ProductVendor;