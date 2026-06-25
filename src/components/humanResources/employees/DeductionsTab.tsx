'use client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { Add } from '@mui/icons-material';
import {
  Autocomplete,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  LinearProgress,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Dispatch, SetStateAction, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { DeductionType } from '../deductionTypes/DeductionType';
import humanResourcesServices from '../humanResourcesServices';

interface FormData {
  id: number | null;
  deduction_name: string;
  scope: string;
}

interface DeductionsTabProps {
  setDeductionSettings: Dispatch<SetStateAction<Array<any>>>;
}

const DeductionsTab = ({ setDeductionSettings }: DeductionsTabProps) => {
  const { theme } = useJumboTheme();
  const [scopeValue, setScopeValue] = useState<string | null>(null);

  const { data: deductionTypesResponse, isFetching: fetchingDeductionTypes } =
    useQuery({
      queryKey: ['fetchDeductionTypesForEmployeeDeductionForm'],
      queryFn: async () => {
        return humanResourcesServices.getDeductionTypesList({
          page: 1,
          limit: 200,
        });
      },
    });

  const handleRadioChange = (value: string) => {
    setScopeValue(value);
  };

  const deductionTypes = (deductionTypesResponse?.data ||
    []) as DeductionType[];
  const validationSchema = yup.object({
    id: yup
      .number()
      .required('Deduction Type is required')
      .typeError('Deduction type ID shoud be a number'),
    deduction_name: yup.string(),
    scope: yup.string().required('Scope is required'),
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      id: null,
      deduction_name: '',
      scope: '',
    },
  });

  const submitDedction = (v: any) => {
    setDeductionSettings((prev: Array<any>) => [...prev, v]);
    setScopeValue(null);
    reset();
  };

  return (
    <form autoComplete='off' onSubmit={handleSubmit(submitDedction)}>
      <Grid
        container
        rowSpacing={{ xs: 1, md: 2 }}
        columnSpacing={4}
        spacing={1}
        alignItems={'center'}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            {fetchingDeductionTypes ? (
              <LinearProgress />
            ) : (
              <Controller
                name='id'
                control={control}
                rules={{ required: 'Deduction type is required' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    size='small'
                    options={deductionTypes}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name || ''}
                    value={
                      deductionTypes.find((type) => type.id === field.value) ||
                      null
                    }
                    onChange={(event, newValue) => {
                      field.onChange(newValue?.id || null);

                      if (newValue) {
                        setValue('id', Number(newValue.id ?? ''), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        const deduction = deductionTypes.find(
                          (itm) => itm.id === newValue.id
                        );
                        if (deduction)
                          setValue('deduction_name', deduction?.name);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Deduction Type'
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
            )}
          </Div>
        </Grid>

        <Grid
          size={{ xs: 12, md: 4 }}
          textAlign={'left'}
          justifyContent={'end'}
        >
          <Div sx={{ mt: 1, mb: 1 }}>
            <FormControl>
              <FormLabel id={`deduction-scope`} sx={{ fontSize: 12 }}>
                Scope
              </FormLabel>
              <RadioGroup
                row
                aria-labelledby={`deduction-scope`}
                name='scope'
                value={scopeValue}
                onChange={(_, v) => {
                  handleRadioChange(v);
                  setValue('scope', v);
                }}
              >
                <FormControlLabel value='all' control={<Radio />} label='All' />
                <FormControlLabel
                  value='active_contracts'
                  control={<Radio />}
                  label='Active Contracts'
                />
              </RadioGroup>
              {errors.scope && (
                <FormHelperText sx={{ color: theme.palette.error.main }}>
                  {errors.scope?.message}
                </FormHelperText>
              )}
            </FormControl>
          </Div>
        </Grid>

        <Grid
          size={{ xs: 12, md: 2 }}
          textAlign={'left'}
          justifyContent={'end'}
        >
          <Button variant='contained' size='small' type='submit'>
            <Add />
            add
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default DeductionsTab;
