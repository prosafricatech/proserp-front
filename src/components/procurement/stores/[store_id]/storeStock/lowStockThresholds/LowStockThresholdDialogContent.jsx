import { Button, DialogActions, DialogContent,DialogTitle,Grid, LinearProgress, TextField,} from '@mui/material'
import React from 'react'
import * as yup from 'yup'
import { LoadingButton } from '@mui/lab';
import {useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useStoreProfile } from '../../StoreProfileProvider';
import { useSnackbar } from 'notistack';
import LowStockThreholdsList from './LowStockThresholdsList';
import lowStockThresholdServices from './lowStockThreshold-services';
import { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import { Div } from '@jumbo/shared';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';

function LowStockThresholdDialogContent({setOpenDialog, lowStockAlert}) {
  const {activeStore} = useStoreProfile();
  const [openEdit, setOpenEdit] = React.useState(false);
  const {productOptions} = useProductsSelect();

  //Hooks definitions
  const {enqueueSnackbar} =  useSnackbar();
  const queryClient = useQueryClient()

  const validationSchema = yup.object({
    product_ids: yup.array().required("Product is required").typeError('Product is required'),
    threshold: yup.number().positive('Quantity is required').required('Quantity is required').typeError('Quantity is required'),
    cost_center_ids: yup.array(),
  });


  const { handleSubmit, setValue, reset, register,formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      store_id: activeStore.id,
      product_ids: openEdit ? lowStockAlert.product_id : '',
      threshold: openEdit ? lowStockAlert.threshold : '',
      cost_center_ids: openEdit ? lowStockAlert.cost_centers.map(costCenter => costCenter.name) : [],
    }
  });

  //Mutation methods
  const addLowStockAlerts = useMutation({
    mutationFn: lowStockThresholdServices.add,
    onSuccess: (data) => {
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      reset();
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return addLowStockAlerts.mutate
  },[addLowStockAlerts]);
  
  return (
    <React.Fragment>
      <DialogTitle>
        <form autoComplete='off'
          onSubmit={handleSubmit(saveMutation)} 
        >
          {
            addLowStockAlerts.isPending ? <LinearProgress/> :
            <Grid container columnSpacing={1}>
              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <ProductSelect
                    multiple={true}
                    label='Product'
                    defaultValue={lowStockAlert && lowStockAlert.product_id}
                    frontError={errors.product_ids}
                    excludeIds={productOptions.filter(product => product.type !== 'Inventory').map(product => product.id)}
                    onChange={(newValue) => {
                      setValue(`product_ids`, newValue ? newValue.map((product) => product.id) : '', {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, md: 3}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <TextField
                    size='small'
                    defaultValue={lowStockAlert && lowStockAlert.threshold}
                    error={!!errors?.threshold}
                    helperText={errors?.threshold?.message || ''}
                    label='Threshold'
                    fullWidth
                    onChange={(newValue) => {
                      setValue(`threshold`, newValue, {
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }}
                  {...register(`threshold`)}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <CostCenterSelector
                    fullWidth 
                    defaultValue={lowStockAlert && lowStockAlert.cost_center_ids}
                    allowSameType={true}
                    multiple={true}
                    onChange={(newValue) => {
                      setValue(`cost_center_ids`, newValue ? newValue.map((costCenter) => costCenter.id) : null,{
                        shouldDirty: true,
                        shouldValidate: true
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, lg: 1}} textAlign={'end'}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <LoadingButton
                      loading={addLowStockAlerts.isPending} 
                      size='small' 
                      variant='contained'
                      type='submit'
                    >
                      Submit
                    </LoadingButton>
                  </Div>
              </Grid>
            </Grid>
          }
        </form>
      </DialogTitle>
      <DialogContent>
        <LowStockThreholdsList setOpenEdit={setOpenEdit} openEdit={openEdit}/>
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => setOpenDialog(false)}>
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  )
}

export default LowStockThresholdDialogContent