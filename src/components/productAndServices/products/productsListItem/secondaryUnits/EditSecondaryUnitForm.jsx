import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Grid,
  TextField,
  DialogActions,
  Button,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import productServices from '../../productServices';
import { Div } from '@jumbo/shared';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';

const EditSecondaryUnitForm = ({ product, setOpenDialog, unit }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const dictionary = useDictionary();

  const { mutate: updateUnit, isPending } = useMutation({
    mutationFn: productServices.updateUnit,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(dictionary.products.list.secondaryForm.messages.updateSuccess, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['secondaryUnits'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || 'Failed to update unit', {
        variant: 'error',
      });
    },
  });

  const saveMutation = React.useMemo(() => {
    return updateUnit;
  }, [updateUnit]);

  const validationSchema = yup.object({
    conversion_factor: yup.number().required('Conversion factor').typeError(`Conversion factor`),
  })

  const {setValue, handleSubmit, formState: { errors }} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
        id: product.id,
        measurement_unit_id: unit.id,
        conversion_factor: unit.conversion_factor,
    },
  });

  return (
    <form autoComplete="off" onSubmit={handleSubmit(saveMutation)}>
      <DialogTitle textAlign={'center'}>{dictionary.products.list.secondaryForm.pageTitle.replace('{unitName}',unit.name)}</DialogTitle>
        <DialogContent>
            <Grid container columnSpacing={1}>
                <Grid size={{xs: 12, md: 7, lg: 7}}>
                    <Div sx={{ mt: 1, mb: 1 }}>
                        <TextField
                            size="small"
                            fullWidth
                            defaultValue={unit.name}
                            label={dictionary.products.list.secondaryForm.labels.conversionFactor}
                            InputProps={{
                                readOnly: true,
                              }}
                            
                        />
                    </Div>
                </Grid>
                <Grid size={{xs: 12, md: 5, lg: 5}}>
                    <Div sx={{ mt: 1}}>
                        <TextField
                            size="small"
                            fullWidth
                            defaultValue={unit.conversion_factor}
                            error={errors && !!errors?.conversion_factor}
                            helperText={errors && errors.conversion_factor?.message}
                            label={dictionary.products.list.secondaryForm.labels.conversionFactor}
                            onChange={(e) => {
                                setValue(`conversion_factor`,e.target.value ? sanitizedNumber(e.target.value ): '',{
                                    shouldValidate: true,
                                    shouldDirty: true
                                });
                            }}
                        />
                    </Div>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button size="small" onClick={() => setOpenDialog(false)}>
               {dictionary.products.list.secondaryForm.buttons.cancel}
            </Button>
            <LoadingButton
                type="submit"
                variant="contained"
                size="small"
                sx={{ display: 'flex' }}
                loading={isPending}
            >
                {dictionary.products.list.secondaryForm.buttons.submit}
            </LoadingButton>
        </DialogActions>
    </form>
  );
};

export default EditSecondaryUnitForm;
