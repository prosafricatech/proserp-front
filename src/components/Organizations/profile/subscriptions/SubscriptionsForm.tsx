'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Button, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Grid, 
  LinearProgress, 
  Tab, 
  Tabs, 
  TextField, 
  Tooltip, 
  Typography 
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import subscriptionServices from './subscriptionServices';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs, { Dayjs } from 'dayjs';
import { useSnackbar } from 'notistack';
import ModulesTab from './tabs/ModulesTab';
import AdditionalFeatures from './tabs/AdditionalFeatures';
import { KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import OrganizationsSelector from '../OrganizationsSelector';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { SubscriptionFormProvider } from './SubscriptionFormContext';
import { AdditionalFeature, Subscription, SubscriptionModule } from './SubscriptionTypes';
import { useDictionary } from '@/app/[lang]/contexts/DictionaryContext';
import { PROS_CONTROL_PERMISSIONS } from '@/utilities/constants/prosControlPermissions';

type AdditionalFeatureValue = {
  quantity: number;
  rate: number;
};

interface SubscriptionResponse {
  message: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      message: string;
    };
  };
}

interface SubscriptionsFormProps {
  setOpenDialog: (open: boolean) => void;
  isFromProsAfricanSubscriptions?: boolean;
  subscription?: Subscription;
}

function SubscriptionsForm({ setOpenDialog, isFromProsAfricanSubscriptions = false, subscription }: SubscriptionsFormProps) {
  const dictionary= useDictionary();
  const subDictForm= dictionary.organizations.profile.subscriptionsTab.form;
  
  const { authOrganization, checkPermission } = useJumboAuth();
  const organization = authOrganization?.organization;
  const queryClient = useQueryClient();
  const [moduleValues, setModuleValues] = useState<SubscriptionModule[]>([]);
  const [additionalFeatureValues, setAdditionalFeatureValues] = useState<Record<string | number, AdditionalFeatureValue>>({});
  const [start_date] = useState<Dayjs>(subscription ? dayjs(subscription.start_date) : dayjs());
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const [totalModulesMonthly, setTotalModulesMonthly] = useState(0);
  const [totalAdditionalFeaturesAmount, setTotalAdditionalFeaturesAmount] = useState(0);
  const [totalAdditionalFeaturesMonthlyCost, setTotalAdditionalFeaturesMonthlyCost] = useState(0);

  const addSubscription = useMutation<SubscriptionResponse, ErrorResponse, any>({
    mutationFn: subscriptionServices.addSubscription,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(
        subDictForm.messages.createSuccess, 
        { variant: 'success' }
      );

      isFromProsAfricanSubscriptions ? 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }) : 
      window.location.reload();
    },
    onError: (error: ErrorResponse) => {
      enqueueSnackbar(
        subDictForm.errors.api.createFailed,
        { variant: 'error' }
      );
    }
  });

  const updateSubscription = useMutation<SubscriptionResponse, ErrorResponse, any>({
    mutationFn: subscriptionServices.updateSubscription,
    onSuccess: () => {
      setOpenDialog(false);
      enqueueSnackbar(
        subDictForm.messages.createSuccess, 
        { variant: 'success' }
      );
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
    onError: (error: ErrorResponse) => {
      enqueueSnackbar(
        subDictForm.errors.api.createFailed,
        { variant: 'error' }
      );
    }
  });

  const saveMutation = useMemo(() => {
    return subscription ? updateSubscription.mutate : addSubscription.mutate;
  }, [addSubscription, updateSubscription, subscription]);

  const userIsProsAfrican = checkPermission([PROS_CONTROL_PERMISSIONS.SUBSCRIPTIONS_MANAGE]);

  const validationSchema = yup.object({
    id: yup.number().optional(),
    start_date: yup.string()
      .required(subDictForm.errors.validation.startDate.required)
      .test('valid-date', subDictForm.errors.validation.startDate.invalid, value => {
        return dayjs(value).isValid();
      }),
    remarks: yup.string().optional(),
    months: yup
      .number()
      .nullable()
      .transform((value: number | null, originalValue: string) => 
        (originalValue === "" ? null : value))
      .positive(subDictForm.errors.validation.months.positive)
      .required(subDictForm.errors.validation.months.required)
      .typeError(subDictForm.errors.validation.months.required)
      .when([], {
        is: () => isFromProsAfricanSubscriptions,
        then: (schema) => schema.min(
          1, 
          subDictForm.errors.validation.months.minimum.prosAfrican.replace('{min}', '1')
        ),
        otherwise: (schema) => schema.min(
          3, 
          subDictForm.errors.validation.months.minimum.default.replace('{min}', '3')
        ),
      }),
    grace_period: yup
      .number()
      .min(0, subDictForm.errors.validation.gracePeriod.positive)
      .typeError(subDictForm.errors.validation.gracePeriod.positive),
    organization_id: yup
      .number()
      .nullable()
      .when([], {
        is: () => isFromProsAfricanSubscriptions,
        then: (schema) => schema
          .required(subDictForm.errors.validation.organization.required)
          .typeError(subDictForm.errors.validation.organization.invalid),
      }),
  });

  const formMethods= useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: subscription?.id,
      organization_id: subscription 
      ? Number(subscription.organization?.id) 
      : isFromProsAfricanSubscriptions 
        ? null 
        : organization?.id ? Number(organization.id) : null,
      start_date: start_date.toISOString(),
      months: subscription ? subscription.months : 3,
      remarks: subscription?.remarks,
      grace_period: subscription ? subscription.grace_period : 0,
    }
  });

  const { 
    setValue, 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = formMethods

  const [modulesSelected, setModulesSelected] = useState<SubscriptionModule[]>([]);
  
  const { data: Modules, isFetching } = useQuery<SubscriptionModule[]>({
    queryKey: ['modules'],
    queryFn: subscriptionServices.getSubscriptionModules,
  });
  
  useEffect(() => {
    if (Modules && !subscription) {
      setModuleValues(Modules);
    }
  }, [Modules, subscription]);
  
  useEffect(() => {
    if (subscription && Modules) {
      const subscriptionModulesMap = new Map(
        subscription.modules.map((module: { id: number; rate: number }) => [module.id, module])
      );
  
      const updatedModuleValues = Modules.map((mod: SubscriptionModule) => {
        const subscriptionModule = subscriptionModulesMap.get(mod.id);
        return {
          ...mod,
          monthly_rate: subscriptionModule ? subscriptionModule.rate : mod.monthly_rate,
        };
      });
  
      setModuleValues(updatedModuleValues);
  
      const updatedModulesSelected = subscription.modules.map((module: { 
        id: number; 
        name: string; 
        rate: number; 
        description?: string 
      }) => {
        const correspondingModule = Modules.find((mod: SubscriptionModule) => mod.id === module.id);
        return {
          id: module.id,
          name: module.name,
          monthly_rate: module.rate,
          description: module.description || '',
          additional_features: correspondingModule?.additional_features || [],
        } as SubscriptionModule;
      });
  
      setModulesSelected(updatedModulesSelected);
    }
  }, [subscription, Modules]);
  
  const [additionalFeaturesSelected, setAdditionalFeaturesSelected] = useState<AdditionalFeature[]>(subscription ? 
    subscription.additional_features.map(additional => {
      return {
        id: additional.id,
        feature: {
          id: additional.feature.id,
          name: additional.feature.name,
          unit: additional.feature.unit || { symbol: '' }
        },
        rate: additional.rate,
        quantity: additional.quantity,
        description: additional.description || ''
      };
    }) : []);

  useEffect(() => {
    const totalMonthlyCost = modulesSelected.reduce((total, module) => total + (module.monthly_rate || 0), 0);
    setTotalModulesMonthly(totalMonthlyCost);
  }, [modulesSelected, subscription]);

  useEffect(() => {
    const totalAdditionalFeaturesMonthlyCost = (subscription && subscription.additional_features.length > 0)
      ? additionalFeaturesSelected.reduce((total, feature) => {
        const rate = feature.rate || 0;
        const quantity = feature.quantity || 0;
        return total + (rate * quantity);
        }, 0)
      : additionalFeaturesSelected.reduce((total, feature) => {
          const featureInSelectedModules = modulesSelected.some(module =>
            module.additional_features?.some((moduleFeature: SubscriptionModule) => moduleFeature.id === feature.id)
          );
          return featureInSelectedModules ? total + (feature.quantity || 0) * (feature.rate || 0) : total;
        }, 0);
    
    setTotalAdditionalFeaturesMonthlyCost(totalAdditionalFeaturesMonthlyCost);
  
    const totalAmount = totalAdditionalFeaturesMonthlyCost * watch('months');
    setTotalAdditionalFeaturesAmount(totalAmount);
  }, [additionalFeaturesSelected, modulesSelected, subscription, watch('months')]);  

  if (isFetching) {
    return <LinearProgress />;
  }

  const onSubmit = (data: any) => {
    if (modulesSelected.length === 0) {
      enqueueSnackbar(subDictForm.errors.validation.modules.required, { 
        variant: 'error' 
      });
      return;
    }
    const newData = {
      ...data,
      modules: modulesSelected.map((module) => ({ id: module.id, rate: module.monthly_rate })),
      additional_features: additionalFeaturesSelected.map((feature) => ({ 
        additional_feature_id: feature.id, 
        rate: feature.rate, 
        quantity: feature.quantity 
      })),
    };
    saveMutation(newData);
  };

  const totalModulesAmountAllMonths = totalModulesMonthly * watch('months');

  const contextValue = {
    subscription,
    totalAdditionalFeaturesMonthlyCost,
    totalModulesMonthly,
    setTotalAdditionalFeaturesAmount,
    totalAdditionalFeaturesAmount,
    additionalFeaturesSelected,
    setAdditionalFeaturesSelected: setAdditionalFeaturesSelected as React.Dispatch<React.SetStateAction<AdditionalFeature[]>>,
    Modules,
    organization,
    start_date,
    userIsProsAfrican,
    modulesSelected,
    setModulesSelected,
    moduleValues,
    setModuleValues,
    additionalFeatureValues,
    setAdditionalFeatureValues,
  };

  return (
    <FormProvider {...formMethods}>
      <SubscriptionFormProvider value={contextValue}>
        <DialogTitle sx={{ textAlign: 'center' }}>
          {subscription 
            ? `${subDictForm.messages.edit} ${subscription.subscriptionNo}` 
            : subDictForm.messages.new
          }
          <Grid container spacing={1} mt={1}>
            <Grid size={{xs:12, md:userIsProsAfrican ? 4 : (!userIsProsAfrican && isFromProsAfricanSubscriptions) ? 4 : 6}}>
              <DateTimePicker
                label={subDictForm.labels.startDate}
                minDate={
                  !isFromProsAfricanSubscriptions && 
                  organization && 
                  organization.recording_start_date
                    ? dayjs(organization.recording_start_date)
                    : undefined
                }
                defaultValue={start_date}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputProps: {
                      readOnly: true,
                    },
                  }
                }}
                onChange={(newValue: Dayjs | null) => {
                  if (newValue) {
                    setValue('start_date', newValue.toISOString(), {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  } else {
                    setValue('start_date', '', {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                }}
              />
            </Grid>
            <Grid size={{xs:userIsProsAfrican ? 6 : 12, md:userIsProsAfrican ? 4 : (!userIsProsAfrican && isFromProsAfricanSubscriptions) ? 4 : 6}}>
              <TextField
                label={subDictForm.labels.months}
                size='small'
                fullWidth
                value={watch('months')}
                error={!!errors?.months}
                helperText={errors?.months?.message}
                {...register('months')}
                onChange={(e) => {
                  setValue('months', Number(e.target.value), {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </Grid>
            {userIsProsAfrican &&
              <Grid size={{xs: 6, md: 4}}>
                <TextField
                  label={subDictForm.labels.gracePeriod}
                  size='small'
                  fullWidth
                  error={!!errors?.grace_period}
                  helperText={errors?.grace_period?.message}
                  value={watch('grace_period')}
                  {...register('grace_period')}
                  onChange={(e) => {
                    setValue('grace_period', Number(e.target.value), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
              </Grid>
            }
            {isFromProsAfricanSubscriptions &&
              <Grid size={{xs: 12, md: 4}}>
                <OrganizationsSelector
                  label={subDictForm.labels.organization}
                  frontError={errors && errors?.organization_id}
                  defaultValue={subscription?.organization_id}
                  onChange={(newValue: any) => {
                    newValue ? setValue('organization_id', newValue.id, {
                      shouldDirty: true,
                      shouldValidate: true
                    }) : setValue('organization_id', null, {
                      shouldDirty: true,
                      shouldValidate: true
                    });
                  }}      
                />
              </Grid>
            }
            <Grid size={12}>
              <Tabs
                value={activeTab}
                onChange={(e: React.SyntheticEvent, newValue: number) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons='auto'
                allowScrollButtonsMobile
              >
                <Tab label={subDictForm.labels.modules} />
                <Tab label={subDictForm.labels.additionalFeatures} />
              </Tabs>
            </Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>
          {activeTab === 0 && <ModulesTab />}
          {activeTab === 1 && <AdditionalFeatures />}
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent="space-between" alignItems="center" spacing={1} width="100%">
            <Grid size={6}>
              <Typography variant='h5'>{subDictForm.labels.totalMonthlyRate}:</Typography>
            </Grid>
            <Grid size={6} textAlign={'end'}>
              <Tooltip title={subDictForm.helpTexts.monthlyTotal}>
                <Typography variant='h5' sx={{cursor: 'pointer'}}>{(totalModulesMonthly + totalAdditionalFeaturesMonthlyCost).toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={6}>
              <Typography variant='h5'>{subDictForm.labels.grandTotal}:</Typography>
            </Grid>
            <Grid size={6} textAlign={'end'}>
              <Tooltip title={subDictForm.helpTexts.grandTotal}>
                <Typography variant='h5' sx={{cursor: 'pointer'}}>{(totalModulesAmountAllMonths + totalAdditionalFeaturesAmount).toLocaleString()}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={12}>
              {userIsProsAfrican &&
                <TextField
                  label='Remarks'
                  fullWidth
                  multiline={true}
                  minRows={2}
                  {...register('remarks')}
                />
              }
            </Grid>
            <Grid size={12} textAlign={'end'}>
              <Button onClick={() => setOpenDialog(false)} size='small' variant='outlined' sx={{ ml: 2 }}>
                 {dictionary.commons.close}
              </Button>
              {
                activeTab > 0 &&
                <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => (activeTab-1))} sx={{ ml: 1 }}>
                  <KeyboardArrowLeftOutlined/>
                  {dictionary.commons.previous}
                </Button>
              }
              {
                activeTab < 1 &&
                <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => activeTab+1)} sx={{ ml: 1 }}>
                  {dictionary.commons.next}
                  <KeyboardArrowRightOutlined/>
                </Button>
              }
              <LoadingButton 
                loading={addSubscription.isPending || updateSubscription.isPending} 
                onClick={handleSubmit(onSubmit)} 
                variant='contained' 
                size='small' 
                sx={{ ml: 1 }}
              >
                {dictionary.forms.submit}
              </LoadingButton>
            </Grid>
          </Grid>
        </DialogActions>
      </SubscriptionFormProvider>
    </FormProvider>
  );
}

export default SubscriptionsForm;