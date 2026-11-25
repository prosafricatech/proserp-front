'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import { toGrams, withUnit } from '../../weightUnit';
import { DialogProps } from '../batchTypes';
import ActionDialog, { FormDate, useBatchAction } from './ActionDialog';
import { nowStamp } from '../../dateTime';
import { FormNumber } from '../../NumberField';
import WeightCheckHint from './WeightCheckHint';

const WeightDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.weight;

  const schema = yup.object({
    sample_date: yup.string().required(text.validation.dateRequired),
    sample_size: yup.number().typeError(text.validation.quantityRequired).integer(text.validation.quantityRequired)
      .min(1, text.validation.quantityRequired).max(batch.current_quantity, text.validation.tooMany).required(text.validation.quantityRequired),
    average_weight_g: yup.number().typeError(text.validation.numberInvalid).moreThan(0, text.validation.numberInvalid).required(text.validation.numberInvalid),
    remarks: yup.string().nullable(),
  });
  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: { sample_date: nowStamp(), sample_size: undefined as number | undefined, average_weight_g: undefined as number | undefined, remarks: '' },
  });

  const [typedWeight, typedDate, typedSize] = watch(['average_weight_g', 'sample_date', 'sample_size']);
  const typed = Number(typedWeight);

  const { mutate, isPending } = useBatchAction(batch.id, batchServices.recordWeightSampling, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={dialog.title} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({ id: batch.id, ...data, average_weight_g: toGrams(Number(data.average_weight_g), batch.species_template?.weight_unit) }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormDate control={control} name='sample_date' label={text.labels.date} minDate={batch.start_date} />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <FormNumber control={control} name='sample_size' integer label={animalText(dialog.sampleSize, batch.species_template?.count_label)} error={!!errors.sample_size} helperText={errors.sample_size?.message} />
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
          <Stack direction='row' alignItems='flex-start' spacing={0.5}>
            <TextField type='number' size='small' fullWidth label={withUnit(dialog.averageWeight, batch.species_template?.weight_unit)} error={!!errors.average_weight_g}
              slotProps={{ htmlInput: { step: 'any' } }} helperText={errors.average_weight_g?.message} {...register('average_weight_g')} />
            <WeightCheckHint batchId={batch.id} animalsLabel={batch.species_template?.count_label} weightUnit={batch.species_template?.weight_unit} weight={typed > 0 ? toGrams(typed, batch.species_template?.weight_unit) : null} date={typedDate as string} sampleSize={typedSize ? Number(typedSize) : null} />
          </Stack>
        </Grid>
        <Grid size={12}>
          <TextField size='small' fullWidth label={text.labels.remarks} {...register('remarks')} />
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default WeightDialog;
