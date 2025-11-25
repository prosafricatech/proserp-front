import { Grid, IconButton, LinearProgress, TextField, Tooltip} from '@mui/material';
import React, { useEffect, useState } from 'react'
import * as yup  from "yup";
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { AddOutlined, CheckOutlined, DisabledByDefault } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import OperationSelector from '@/components/sharedComponents/OperationSelector';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { Div } from '@jumbo/shared';

function CertifiedAdjustments({  setClearFormKey, submitMainForm, submitItemForm, setSubmitItemForm, setIsDirty, index = -1, setShowForm = null, adjustment, adjustments, setAdjustments}) {
  const [isAdding, setIsAdding] = useState(false);

  // Define validation Schema
  const validationSchema = yup.object({
    type: yup.string().required("Type is required").typeError('Type is required'),
    description: yup.string().required("Description is required").typeError('Description is required'),
    amount: yup.number().required("Amount is required").positive("Amount is required").typeError('Amount is required'),
  });

  const {setValue, handleSubmit, watch, reset, formState: { errors, dirtyFields }} = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      amount: adjustment && adjustment.amount, 
      description: adjustment && adjustment.description,
      type: adjustment && adjustment.type,
      type_name: adjustment && adjustment.type_name
    }
  });

  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length > 0);
  }, [dirtyFields, setIsDirty, watch]);
  
  const updateItems = async (item) => {
    setIsAdding(true);
      if (index > -1) {
        let updatedAdjustments = [...adjustments];
        updatedAdjustments[index] = item;
        await setAdjustments(updatedAdjustments);
        setClearFormKey(prevKey => prevKey + 1);

      } else {
        await setAdjustments((adjustments) => [...adjustments, item]);
        if (submitItemForm) submitMainForm();
        setSubmitItemForm(false);
        setClearFormKey(prevKey => prevKey + 1);
      }

      reset();
      setIsAdding(false);
      setShowForm && setShowForm(false);
  };

  if(isAdding){
    return <LinearProgress/>
  }

  return (
    <Grid container spacing={1} marginTop={0.5} width={'100%'}>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 1 }}>
          <OperationSelector
            label='Type'
            frontError={errors?.type}
            defaultValue={adjustment && adjustment.type }
            onChange={(newValue) => {
              setValue(`type_name`, newValue.label);
              setValue(`type`, newValue ? newValue.value : '', {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 1}}>
          <TextField
            size="small"
            fullWidth
            defaultValue={adjustment && adjustment.amount}
            error={errors && !!errors?.amount}
            helperText={errors && errors.amount?.message}
            label="Amount"
            InputProps={{
              inputComponent: CommaSeparatedField
            }}
            onChange={(e) => {
              setValue(`amount`,e.target.value ? sanitizedNumber(e.target.value) : 0,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={{xs: 12, md: 4, lg: 4}}>
        <Div sx={{ mt: 1}}>
          <TextField
            size="small"
            fullWidth
            multiline={true}
            rows={2}
            defaultValue={watch(`description`)}
            error={errors && !!errors?.description}
            helperText={errors && errors.description?.message}
            label="Description"
            onChange={(e) => {
              setValue(`description`, e.target.value,{
                shouldValidate: true,
                shouldDirty: true
              });
            }}
          />
        </Div>
      </Grid>
      <Grid size={12} textAlign={'end'}>
        <LoadingButton
          loading={false}
          variant='contained'
          type='submit'
          size='small'
          onClick={handleSubmit(updateItems)}
          sx={{marginBottom: 0.5}}
        >
          {
            adjustment ? (
              <><CheckOutlined fontSize='small' /> Done</>
            ) : (
              <><AddOutlined fontSize='small' /> Add</>
            )
          }
        </LoadingButton>
        {
          adjustment && 
          <Tooltip title='Close Edit'>
            <IconButton size='small' 
              onClick={() => {
                setShowForm(false);
              }}
            >
              <DisabledByDefault fontSize='small' color='success'/>
            </IconButton>
          </Tooltip>
        }
      </Grid>
    </Grid>

  )
}

export default CertifiedAdjustments