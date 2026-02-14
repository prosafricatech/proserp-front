import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Tab,Tabs, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import {  KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import purchaseServices from '../../purchase-services';
import StoreSelector from '../../../stores/StoreSelector';
import AdditionalCostsTabRow from './receiveFormTabs/AdditionalCosts/AdditionalCostsTabRow';
import SummaryTab from './receiveFormTabs/SummaryTab';
import AdditionalCostsTab from './receiveFormTabs/AdditionalCosts/AdditionalCostsTab';
import ItemsTab from './receiveFormTabs/ItemsTab';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { Div } from '@jumbo/shared';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import { DateTimePicker } from '@mui/x-date-pickers';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function PurchaseOrderReceiveForm({ toggleOpen, order, grn }) {
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [date_received] = useState(dayjs());
  const [activeTab, setActiveTab] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();  
  const order_currency_id = order?.currency.id;
  const {currencies} = useCurrencySelect();
  const {authOrganization,checkOrganizationPermission} = useJumboAuth();
  const [totalReceivedAmount, setTotalReceivedAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  let purchase_order_items = order?.purchase_order_items || grn?.items;

  const [nextTab, setNextTab] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);


  const handleTabChange = (event, newTab) => {
    if (isDirty) {
      setNextTab(newTab); 
      setShowWarning(true); 
    } else {
      setActiveTab(newTab); 
    }
  };

  const handleDiscardChanges = () => {
    setShowWarning(false);
    setIsDirty(false);
    setActiveTab(nextTab); 
  };

  const receiveOrder = useMutation({
    mutationFn: purchaseServices.receive,
    onSuccess: (data) => {
      toggleOpen(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderDetails'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrderGrns'] });
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message, { variant: 'error' });
    },
  });

  const saveMutation = React.useMemo(() => {
    return receiveOrder.mutate
  }, [receiveOrder]);

  const validationSchema = yup.object({
    date_received: yup.string().required('Receive Date is required'),
    store_id: yup
      .number()
      .typeError('Store is required')
      .positive('Store is required')
      .required('Store is required'),
    exchange_rate: yup
      .number()
      .typeError('Exchange rate is required')
      .positive('Exchange rate is required')
      .required('Exchange rate is required'),
    cost_center_change: yup.boolean(),
    destination_cost_center_id: yup.number().when('cost_center_change', {
      is: true,
      then: (schema) => schema.required('Destination Cost Center is required').typeError('Destination Cost Center is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    receivable_ledger_id: yup.number().when('cost_center_change', {
      is: true,
      then: (schema) => schema.required('Receivable Ledger is required').typeError('Receivable Ledger is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    items: yup.array().of(
      yup.object().shape({
        quantity: yup
          .number()
          .typeError('Quantity is required')
          .required('Quantity is Required')
          .test(
            'maxQuantity',
            'Quantity cannot exceed unreceived quantity',
            function (value) {
              const unreceivedQuantity = this.parent.unreceived_quantity;
              return value <= unreceivedQuantity;
            }
          ),
      })
    ),
    additional_costs: yup.array().of(
      yup.object().shape({
        credit_ledger_id: yup.number().nullable(),
        amount: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Amount is required')
              .positive('Amount must be positive')
              .typeError('Amount is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        currency_id: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Currency is required')
              .positive('Currency is required')
              .typeError('Currency is required'),
          otherwise: (schema) => schema.nullable(),
        }),
        exchange_rate: yup.number().when('credit_ledger_id', {
          is: (id) => !!id,
          then: (schema) =>
            schema
              .required('Exchange rate is required')
              .positive('Exchange rate is required')
              .typeError('Exchange rate is required'),
          otherwise: (schema) => schema.nullable(),
        }),
      })
    ),
  });
  
  const {register, getValues, watch, setValue, clearErrors, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: grn ? {
      id: grn.id,
      date_received: grn.date_received || date_received.toISOString(),
      cost_factor: grn.cost_factor || '',
      reference: grn.reference || order?.orderNo,
      exchange_rate: grn.exchange_rate || order?.exchange_rate || 1,
      store_id: grn.store_id || order?.store_id,
      cost_center_change: grn.cost_center_change || false,
      destination_cost_center_id: grn.destination_cost_center_id || null,
      receivable_ledger_id: grn.receivable_ledger_id || null,
      items: grn.items?.map(grnItem => {
        const orderItem = purchase_order_items?.find(item => item.product.id === grnItem.product.id);
        return {
          unreceived_quantity: orderItem?.unreceived_quantity || grnItem.quantity,
          quantity: grnItem.quantity,
          purchase_order_item_id: orderItem?.id || grnItem.id,
          rate: grnItem.rate,
        };
      }) || [],
      additional_costs: grn.additional_costs || [],
    } : {
      id: order?.id,
      date_received: date_received.toISOString(),
      cost_factor: '',
      reference: order?.orderNo,
      exchange_rate: order?.exchange_rate ? order.exchange_rate : 1,
      items: purchase_order_items?.filter(item => item.product.type === 'Inventory' && item.unreceived_quantity > 0).map(item => ({
        unreceived_quantity : item.unreceived_quantity,
        quantity : item.unreceived_quantity,
        purchase_order_item_id: item.id,
        rate: item.rate,
      })),
    },
  });

  // Update form state when additional Costs change
  useEffect(() => {
    setValue('additional_costs', additionalCosts?.map(additionalCost => ({
      credit_ledger_name: additionalCost.credit_ledger_name,
      credit_ledger_id : additionalCost.credit_ledger_id,
      currency_id: additionalCost.currency_id,
      exchange_rate: additionalCost.exchange_rate,
      reference: additionalCost.reference,
      amount: additionalCost.amount,
    })));
  }, [additionalCosts, setValue]); 

    // If editing, adjust unreceived_quantity for each item
  if (grn && Array.isArray(grn.items)) {
    purchase_order_items = purchase_order_items?.map(item => {
      const grnItem = grn.items.find(i => i.product.id === item.product.id);
      if (grnItem) {
        // Add back the quantity from this GRN to the unreceived_quantity
        return {
          ...item,
          unreceived_quantity: (item.unreceived_quantity || 0) + (grnItem.quantity || 0),
        };
      }
      return item;
    });
  }

  // Update the quantity field whenever unreceived_quantity changes
  useEffect(() => {
    purchase_order_items
      .filter(item => item.unreceived_quantity !== 0)
      .forEach((item, index) => {
        setValue(`items.${index}.quantity`, item.unreceived_quantity);
      });
  }, [purchase_order_items]);

  //total for items and its respectful rate
  useEffect(() => {
    let total = 0;
    for (let i = 0; i < purchase_order_items.length; i++) {
      const purchaseItem = purchase_order_items[i];
      const item = watch(`items`).find(item => item.purchase_order_item_id === purchaseItem.id);
      const rate = item?.rate;
      const quantity = item?.quantity;
      const exchangeRate = watch('exchange_rate');
  
      if (purchaseItem.unreceived_quantity > 0 && rate !== undefined && quantity !== undefined && exchangeRate !== undefined) {
        const itemValue = rate * quantity * exchangeRate;
        total += itemValue;
      }
    }
    setTotalReceivedAmount(total);
  }, [watch()]);  

  //total for Additional Costs
  useEffect(() => {
    let total = 0;

    for (const item of additionalCosts) {
      const { amount, currency_id, exchange_rate } = item;

      total += currency_id > 1 ? amount * exchange_rate : amount;
    }
    setTotalAmount(total);
  }, [watch()]);

  useEffect(() => {
    const CostFactor = 1 + (totalAmount / totalReceivedAmount);
    setValue('cost_factor', CostFactor);
  }, [totalAmount, totalReceivedAmount]);

  const getReceivedItemsSummary = () => {
    return purchase_order_items
      .filter(item => item.unreceived_quantity !== 0)
      .map((item, index) => ({
        product: item.product.name,
        unit: item.measurement_unit.symbol,
        rate: item.rate,
        costfactor: watch(`cost_factor`) || 1,
        exchangeRate: watch(`exchange_rate`),
        receivedQuantity: watch(`items.${index}.quantity`) || 0,
      }));
  };

  const getAdditionalCostsSummary = () => {
    return additionalCosts.filter(item => item.amount > 0).map((item, index) => {
      const itemCurrency = currencies.find((currency) => currency.id === item.currency_id);
      return {
        costName: item.credit_ledger_name,
        itemCurrency: itemCurrency ? itemCurrency.symbol : null,
        exchangeRate: item.exchange_rate,
        amount: item.amount,
      };
    });
  };

  const gettotalAmount = () => {
    return getReceivedItemsSummary().reduce((total, item) => {
      return total + item.receivedQuantity * item.rate;
    }, 0);
  };

  // Function to calculate the total amount for additional costs
  const getTotalAdditionalCostsAmount = () => {
    return getAdditionalCostsSummary().reduce((total, item) => {
      return total + (item.amount * item.exchangeRate);
    }, 0);
  };

  const getTotalCostAmount = () => {
    return getReceivedItemsSummary().reduce((total, item) => {
      return total + item.exchangeRate * item.rate * item.costfactor * item.receivedQuantity;
    }, 0);
  }; 
  
  //Removing items which quantity <=0
  const validateItems = (data) => {
    return data.items.filter((item) => item.quantity > 0);
  };

  const handleSubmitForm = async (data) => {
    const validItems = validateItems(data);
    const validAdditionalItems = data.additional_costs.every(item => item.credit_ledger_id === null) ? [] : data.additional_costs;// Check if additional costs is filled
    const updatedData = { ...data, items: validItems, additional_costs: validAdditionalItems }
    
    await saveMutation(updatedData);
  };

  return (
    <FormProvider {...{ errors, register, setValue, watch, clearErrors}}>
      <DialogTitle>
        <Grid container spacing={1}>
          <Grid size={12} textAlign={"center"} mb={1}>
            {`Receive ${grn ? grn.grnNo : order.orderNo}`}
          </Grid>
          <Grid size={12}>
            <form autoComplete='off'>
              <Grid container spacing={1}>
                <Grid size={{xs: 12, md: 6, lg: 4}}>
                  <Div sx={{ mt: 1}}>
                    <DateTimePicker
                      fullWidth
                      label="Receive Date"
                      // defaultValue={grn ? grn.date_received.toISOString() : date_received}
                      minDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_BACKDATE) ? dayjs(authOrganization.organization.recording_start_date) : dayjs().startOf('day')}
                      maxDate={checkOrganizationPermission(PERMISSIONS.PURCHASES_POSTDATE) ? dayjs().add(10,'year').endOf('year') : dayjs().endOf('day')}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          readOnly: true,
                        }
                      }}
                      onChange={(newValue) => {
                        setValue(`date_received`, newValue ? newValue.toISOString() : null, {
                          shouldValidate: true,
                          shouldDirty: true
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{xs: 12, md: 6, lg: 4}}>
                  <Div sx={{ mt: 1}}>
                    <StoreSelector
                      allowSubStores={true}
                      frontError={errors.store_id}
                      proposedOptions={authOrganization?.stores}
                      onChange={(newValue) => {
                        setValue(`store_id`, newValue ? newValue.id : null, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                  <Grid size={{xs: 12, md: 6, lg: 4}}>
                    <Div sx={{mt: 1}}>
                      <TextField
                        label="Order Reference"
                        fullWidth
                        size="small"
                        defaultValue={watch('reference')}
                        onChange={(e) => {
                          setValue(`reference`,e.target.value,{
                            shouldValidate: true,
                            shouldDirty: true
                          });
                        }}
                      />
                    </Div>
                  </Grid>
                  <Grid size={{xs: 12, md: 6, lg: 4}}>
                    <Div sx={{mt: 1}}>
                      <TextField
                        label="Cost Factor"
                        fullWidth
                        size='small'
                        disabled
                        InputProps={{
                          inputComponent: CommaSeparatedField,
                        }}
                        value={watch('cost_factor')}
                      />
                    </Div>
                  </Grid>
                  <Grid size={{xs: 12, md: 6, lg: 4}}>
                    <Div sx={{mt: 1, display: 'flex', alignItems: 'center'}}>
                      <Checkbox
                        checked={!!watch('cost_center_change')}
                        onChange={e => {
                          setValue('cost_center_change', e.target.checked, {
                            shouldValidate: true,
                            shouldDirty: true
                          });
                          if (!e.target.checked) {
                            setValue('destination_cost_center_id', null);
                            setValue('receivable_ledger_id', null);
                          }
                        }}
                        size="small"
                      />
                      <Typography>Change Cost Center</Typography>
                    </Div>
                  </Grid>
                  {watch('cost_center_change') && (
                    <>
                      <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <Div sx={{mt: 1}}>
                          <CostCenterSelector
                            label="Destination Cost Center"
                            multiple={false}
                            frontError={errors.destination_cost_center_id}
                            onChange={newValue => {
                              setValue('destination_cost_center_id', newValue ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                      <Grid size={{xs: 12, md: 6, lg: 4}}>
                        <Div sx={{mt: 1}}>
                          <LedgerSelect
                            label="Receivable Ledger"
                            allowedGroups={['Accounts Receivable']}
                            multiple={false}
                            frontError={errors.receivable_ledger_id}
                            onChange={newValue => {
                              setValue('receivable_ledger_id', newValue ? newValue.id : null, {
                                shouldValidate: true,
                                shouldDirty: true
                              });
                            }}
                          />
                        </Div>
                      </Grid>
                    </>
                  )}
                  <Grid size={{xs: 12, md: 6, lg: 4}} sx={{ mt: 2, mb: 2 }}>
                    <Stack direction="row" spacing={2}>
                      <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>Order Currency:</Typography>
                      <Typography>{order.currency?.name}</Typography>
                    </Stack>
                  </Grid>
                  {
                    order_currency_id > 1 &&
                    <Grid size={{xs: 12, md: 6, lg: 4}}>
                      <Div sx={{mt: 1}}>
                        <TextField
                          label="Order Exchange Rate"
                          fullWidth
                          size='small'
                          error={!!errors?.exchange_rate}
                          helperText={errors?.exchange_rate?.message}
                          InputProps={{
                            inputComponent: CommaSeparatedField,
                          }}
                          value={watch('exchange_rate')}
                          onChange={(e) => {
                            setValue(`exchange_rate`,e.target.value ? sanitizedNumber(e.target.value ): null,{
                              shouldValidate: true,
                              shouldDirty: true
                            });
                          }}
                        />
                      </Div>
                    </Grid>
                  }
              </Grid>
            </form>
          </Grid>
          <Grid size={12}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => handleTabChange(e, newValue)}
              variant="scrollable"
              scrollButtons='auto'
              allowScrollButtonsMobile
              sx={{ mt: 1 }}
            >
              <Tab label="Items"/>
              <Tab label="Additional Costs"/>
              <Tab label="Summary Preview"/>
            </Tabs>
          </Grid>
        </Grid>
      </DialogTitle>  
      <DialogContent>
        {activeTab === 0 && <ItemsTab purchase_order_items={purchase_order_items} />}

        {activeTab === 1 && <AdditionalCostsTab setIsDirty={setIsDirty} additionalCosts={additionalCosts} setAdditionalCosts={setAdditionalCosts} />}

        {activeTab === 2 && 
          <SummaryTab 
            authOrganization={authOrganization} order={order} getReceivedItemsSummary={getReceivedItemsSummary} gettotalAmount={gettotalAmount}
            getTotalCostAmount={getTotalCostAmount} getTotalAdditionalCostsAmount={getTotalAdditionalCostsAmount} getAdditionalCostsSummary={getAdditionalCostsSummary}
          />
        }

        {activeTab === 1 &&
          additionalCosts.map((additionalCost, index) => {
            return <AdditionalCostsTabRow additionalCosts={additionalCosts} setAdditionalCosts={setAdditionalCosts} key={index} setIsDirty={setIsDirty} additionalCost={additionalCost} index={index}/>
          })
        }

        <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
          <DialogTitle>Unsaved Additional Cost</DialogTitle>
          <DialogContent>
            You have unsaved Additional Cost. Are you sure you want to leave without saving?
          </DialogContent>
          <DialogActions>
            <Button size='small' onClick={()=> setShowWarning(false)}>Cancel</Button>
            <Button size='small' onClick={handleDiscardChanges} color="secondary">Discard</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Grid container spacing={1}>
          <Grid item xs={12} md={8}></Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={1} direction={'row'} justifyContent={'end'} sx={{ mt: 1, mb: 1 }}>
              <Button size='small' onClick={() => toggleOpen(false)}>
                  Cancel
              </Button>
              {
                activeTab > 0 &&
                <Button size='small' variant='outlined' onClick={() => handleTabChange(null, activeTab - 1)}>
                  <KeyboardArrowLeftOutlined/>
                  Previous
                </Button>
              }
              {
                activeTab < 2 &&
                <Button size='small' variant='outlined' onClick={() => handleTabChange(null, activeTab + 1)}>
                  Next
                  <KeyboardArrowRightOutlined/>
                </Button>
              }
              {
                activeTab === 2 &&
                <LoadingButton
                  loading={receiveOrder.isPending}
                  variant='contained'
                  size='small'
                  onClick={handleSubmit(() => handleSubmitForm(getValues()))}
                >
                  Submit
                </LoadingButton>
              }
            </Stack>
          </Grid>
        </Grid>
      </DialogActions>
    </FormProvider>
  )
}

export default PurchaseOrderReceiveForm;