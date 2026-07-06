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
import { EmployerContributionType } from '../employerContributionTypes/EmployerContributionType';
import humanResourcesServices from '../humanResourcesServices';

interface FormData {
  id: number | null;
  contribution_name: string;
  scope: string;
  scope_lable: string;
}

interface ContributionsTabProps {
  setContributionSettings: Dispatch<SetStateAction<Array<any>>>;
}

const ContributionsTab = ({
  setContributionSettings,
}: ContributionsTabProps) => {
  const { theme } = useJumboTheme();
  const [scopeValue, setScopeValue] = useState<string | null>(null);

  const {
    data: contributionTypesResponse,
    isFetching: fetchingContributionTypes,
  } = useQuery({
    queryKey: ['fetchEmployerContributionTypesForEmployeeContributionForm'],
    queryFn: async () => {
      return humanResourcesServices.getEmployerContributionTypesList({
        page: 1,
        limit: 200,
      });
    },
  });

  const contributionTypes = (contributionTypesResponse?.data ||
    []) as EmployerContributionType[];

  const handleRadioChange = (value: string) => {
    setScopeValue(value);
  };

  const validationSchema = yup.object({
    id: yup
      .number()
      .required('Contribution Type is required')
      .typeError('Deduction Type is required'),
    contribution_name: yup.string(),
    scope: yup.string().required('Scope is required'),
    scope_lable: yup.string(),
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
      contribution_name: '',
      scope: '',
      scope_lable: '',
    },
  });

  const submitContribution = (v: any) => {
    setContributionSettings((prev: Array<any>) => [...prev, v]);
    setScopeValue(null);
    reset();
  };

  return (
    <form autoComplete='off' onSubmit={handleSubmit(submitContribution)}>
      <Grid
        container
        rowSpacing={{ xs: 1, md: 2 }}
        columnSpacing={4}
        spacing={1}
        alignItems={'center'}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Div sx={{ mt: 1, mb: 1 }}>
            {fetchingContributionTypes ? (
              <LinearProgress />
            ) : (
              <Controller
                name='id'
                control={control}
                rules={{ required: 'Contribution type is required' }}
                render={({ field, fieldState }) => (
                  <Autocomplete
                    size='small'
                    options={contributionTypes}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) => option.name || ''}
                    value={
                      contributionTypes.find(
                        (type) => type.id === field.value
                      ) || null
                    }
                    onChange={(event, newValue) => {
                      field.onChange(newValue?.id || null);

                      if (newValue) {
                        setValue('id', Number(newValue.id ?? ''), {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        const contribution = contributionTypes.find(
                          (itm) => itm.id === newValue.id
                        );
                        if (contribution)
                          setValue('contribution_name', contribution?.name);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Contribution Type'
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
              <FormLabel id={`contribution-scope`} sx={{ fontSize: 12 }}>
                Scope
              </FormLabel>
              <RadioGroup
                row
                aria-labelledby={`contribution-scope`}
                name='scope'
                value={scopeValue}
                onChange={(_, v) => {
                  handleRadioChange(v);
                  setValue('scope', v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                  if (v === 'all') {
                    setValue('scope_lable', 'All');
                  } else {
                    setValue('scope_lable', 'Active Contracts');
                  }
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

export default ContributionsTab;
