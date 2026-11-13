'use client'

import React from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Grid, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { animalText } from '../../animalText';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { batchServices } from '../../bio-production-services';
import InfoHint from '../../InfoHint';
import { fromGrams, toGrams, withUnit } from '../../weightUnit';
import { DialogProps } from '../batchTypes';
import ActionDialog, { useBatchAction } from './ActionDialog';

/** Corrects the number stocked (and the starting weight) of a batch that is still in its first stage. */
const OpeningStockDialog = ({ batch, open, onClose }: DialogProps) => {
  const text = useDictionary().bioProduction.batches;
  const dialog = text.dialogs.openingStock;
  const unit = batch.species_template?.weight_unit;
  const opening = batch.stages?.[0]?.opening_avg_weight_g;
  const died = batch.initial_quantity - batch.current_quantity;

  const schema = yup.object({
    initial_quantity: yup.number().typeError(text.validation.numberInvalid).integer(text.validation.numberInvalid).min(1, text.validation.numberInvalid).required(text.validation.numberInvalid),
    average_weight_g: yup.number().transform((value, original) => (original === '' || original == null ? null : value)).nullable().moreThan(0, text.validation.numberInvalid).typeError(text.validation.numberInvalid),
  });
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: yupResolver(schema) as any,
    values: { initial_quantity: batch.initial_quantity, average_weight_g: opening != null ? fromGrams(Number(opening), unit) : '' },
  });
  const { mutate, isPending } = useBatchAction(batch.id, batchServices.correctOpening, () => { reset(); onClose(); });

  return (
    <ActionDialog open={open} title={dialog.title} loading={isPending} onClose={onClose}
      onSubmit={handleSubmit((data: any) => mutate({
        id: batch.id, initial_quantity: data.initial_quantity,
        average_weight_g: data.average_weight_g == null || data.average_weight_g === '' ? undefined : toGrams(Number(data.average_weight_g), unit),
      }))}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction='row' alignItems='flex-start' spacing={0.5}>
            <TextField type='number' size='small' fullWidth label={dialog.quantity} error={!!errors.initial_quantity} helperText={(errors.initial_quantity?.message as string) ?? dialog.quantityHint.replace('{died}', died.toLocaleString())} slotProps={{ htmlInput: { step: 1, min: 1 } }} {...register('initial_quantity')} />
            <InfoHint text={animalText(dialog.quantityHelp, batch.species_template?.count_label)} />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction='row' alignItems='flex-start' spacing={0.5}>
            <TextField type='number' size='small' fullWidth label={withUnit(dialog.weight, unit)} error={!!errors.average_weight_g} helperText={errors.average_weight_g?.message as string} slotProps={{ htmlInput: { step: 'any', min: 0 } }} {...register('average_weight_g')} />
            <InfoHint text={dialog.weightHelp} />
          </Stack>
        </Grid>
      </Grid>
    </ActionDialog>
  );
};

export default OpeningStockDialog;
