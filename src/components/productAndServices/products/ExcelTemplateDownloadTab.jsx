import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Button,
  Checkbox,
  DialogActions,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useFieldArray, useForm } from 'react-hook-form';
import { useProductApp } from './ProductsProvider';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { AddOutlined, DisabledByDefault } from '@mui/icons-material';
import CostCenterSelector from '../../masters/costCenters/CostCenterSelector';
import { yupResolver } from '@hookform/resolvers/yup';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import productServices from './productServices';
import { Div } from '@jumbo/shared';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

function ExcelTemplateDownloadTab({ setOpenDialog }) {
  const { enqueueSnackbar } = useSnackbar();
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const { storeOptions } = useProductApp();
  const { authOrganization } = useJumboAuth();
  const dictionary = useDictionary();

  const validationSchema = yup.object({
    stores: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Store is required')
          .typeError('Store is required').nullable(),
        cost_centers: yup.array().min(1,'Cost Center is required').typeError('Cost Center is required')
      })
    ).nullable()
  });

  const { handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      withProducts: false,
      withStock: false,
      withAverageCost: false,
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    name: 'stores',
    control,
  });

  useEffect(() => {
    if (fields.length > 0 && (!!watch(`withAverageCost`) || !!watch(`withStock`))){
      setValue(`as_at`, dayjs().toISOString());
    }else{
      setValue(`as_at`, null);
    }
  }, [watch(`withAverageCost`),watch(`withStock`), fields])

  const downloadExcelTemplate = async (data) => {
    try {
      setIsDownloadingTemplate(true);
      const responseData = await productServices.downloadExcelTemplate(data);
      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'Products Registration Template.xlsx';
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  }; 
  
  return (
    <form autoComplete="off" onSubmit={handleSubmit(downloadExcelTemplate)}>
      <React.Fragment>
        {
         fields.length > 0 && (!!watch(`withAverageCost`) || !!watch(`withStock`)) &&
          <Grid size={{xs: 12, md: 6, lg: 5.4}}>
            <Div sx={{ mt: 1, mb: 1 }}>
              <DateTimePicker
                label="As At (MM/DD/YYYY)"
                fullWidth
                defaultValue={dayjs()}
                minDate={dayjs(authOrganization.organization.recording_start_date)}
                slotProps={{
                  textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!errors?.from,
                  helperText: errors?.from?.message
                  },
                }}
                onChange={(newValue) => {
                  setValue('as_at', newValue ? newValue.toISOString() : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Div>
          </Grid>
        }
        {fields.map((field, index) => (
          <Grid container py={1} spacing={1} key={field.id}>
            <Grid size={{xs: 12, md: 5.5}}>
              <Autocomplete
                size="small"
                options={storeOptions}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Store"
                    error={!!errors?.stores?.[index]?.name}
                    helperText={errors?.stores?.[index]?.name?.message}
                  />
                )}
                onChange={(event, newValue) => {
                  setValue(`stores.${index}.name`, newValue ? newValue.name : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={{xs: 12, md: 5.5}}>
              <CostCenterSelector
                multiple={true}
                allowSameType={true}
                withNotSpecified={true}
                frontError={errors?.stores?.[index]?.cost_centers}
                onChange={(newValue) => {
                  setValue(`stores.${index}.cost_centers`, newValue ? newValue.map(cc=>cc.name) : null, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              />
            </Grid>
            <Grid size={1} textAlign="right">
              <Div sx={{ mt: 1, mb: 1 }}>
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={() => remove(index)}>
                    <DisabledByDefault fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </Div>
            </Grid>
          </Grid>
        ))}
        <Grid
          size={12}
          sx={{
            display: 'flex',
            direction: 'row',
            justifyContent: 'flex-end',
          }}
        >
          <Div sx={{ mt: 1, mb: 1 }}>
            <Tooltip title="Add Store">
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  append({
                    name: null,
                    cost_centers: [],
                  })
                }
              >
                <AddOutlined fontSize="10" /> {dictionary.products.excelForm.buttons.addStore}
              </Button>
            </Tooltip>
          </Div>
        </Grid>
        <Grid size={12}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent={{ xs: 'start', md: 'space-evenly' }}>
              <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                <Checkbox onChange={(e,checked) => setValue('withProducts',checked)} /><Typography>{dictionary.products.excelForm.labels.withProduct}</Typography>
              </Stack>
              {
                watch('stores')?.length > 0 &&
                <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                  <Checkbox onChange={(e,checked) => setValue('withStock',checked)} /><Typography>With Stock</Typography>
                </Stack>
              }
              {
                watch('stores')?.length > 0 &&
                <Stack direction={'row'} spacing={0.5} alignItems={'center'}>
                  <Checkbox  onChange={(e,checked) => setValue('withAverageCost',checked)} /><Typography>With Average Cost</Typography>
                </Stack>
              }
            </Stack>
        </Grid>
        <DialogActions>
          <Button size="small" onClick={() => setOpenDialog(false)}>
            {dictionary.products.excelForm.buttons.cancel}
          </Button>
          <LoadingButton
            size="small"
            type='submit'
            loading={isDownloadingTemplate}
            variant="contained"
            color="success"
          >
           {dictionary.products.excelForm.buttons.download}
          </LoadingButton>
        </DialogActions>
      </React.Fragment>
    </form>
  );
}

export default ExcelTemplateDownloadTab;
