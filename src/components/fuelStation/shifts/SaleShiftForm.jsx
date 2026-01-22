"use client";

import React, { useContext, useEffect, useState } from 'react';
import { Button, DialogActions, DialogContent, DialogTitle, Tabs, Tab, Grid, TextField, Autocomplete, Chip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { StationFormContext } from './SalesShifts';
import { KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import fuelStationServices from '../fuelStationServices';
import FuelVouchersItemRow from './tabs/fuelVouchers/FuelVouchersItemRow';
import AdjustmentsRow from './tabs/adjustments/AdjustmentsRow';
import FuelVouchers from './tabs/fuelVouchers/FuelVouchers';
import Dipping from './tabs/Dipping';
import Adjustments from './tabs/adjustments/Adjustments';

const PumpReadings = React.lazy(() => import('./tabs/PumpReadings'));
const CashReconciliation = React.lazy(() => import('./tabs/CashReconciliation'));

function SaleShiftForm({ SalesShift, setOpenDialog }) {
  const [fuelVouchers, setFuelVouchers] = useState(SalesShift ? SalesShift.fuel_vouchers : []);
  const [adjustments, setAdjustments] = useState(SalesShift?.adjustments  ? SalesShift.adjustments : []);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, tanks, products, shift_teams} = activeStation;
  const {authOrganization : {organization}} = useJumboAuth();
  const [shiftLedgers, setShiftLedgers] = useState([])
  const [checkShiftBalanced, setCheckShiftBalanced] = useState(true);
  const {checkOrganizationPermission} = useJumboAuth();
  const [pumpReadingsKey, setPumpReadingsKey] = useState(0);
  const { productOptions } = useProductsSelect();

 const { mutate: addSalesShifts, isPending, } = useMutation({
  mutationFn: fuelStationServices.addSalesShifts,
  onSuccess: (data) => {
    setOpenDialog(false);
    enqueueSnackbar(data.message, { variant: 'success' });
    queryClient.invalidateQueries({ queryKey: ['salesShift'] });
    setOpenDialog(false);
  },
  onError: (error) => {
          let message = 'Something went wrong';

          if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof (error).response?.data?.message === 'string'
          ) {
            message = (error).response.data.message;
          } else if (error instanceof Error) {
            message = error.message;
          }

          enqueueSnackbar(message, { variant: 'error' });
        },
      });

  const { mutate: updateSalesShifts, isPending: updateLoading } = useMutation({
    mutationFn: fuelStationServices.updateSalesShifts,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['Shift'] });
      setOpenDialog(false);
    },
    onError: (error) => {
            let message = 'Something went wrong';

            if (
              typeof error === 'object' &&
              error !== null &&
              'response' in error &&
              typeof (error).response?.data?.message === 'string'
            ) {
              message = (error).response.data.message;
            } else if (error instanceof Error) {
              message = error.message;
            }
              enqueueSnackbar(message, { variant: 'error' });
            },
          });

  const saveMutation = React.useMemo(() => {
    return SalesShift?.id ? updateSalesShifts : addSalesShifts;
  }, [SalesShift, addSalesShifts, updateSalesShifts]);

  const validationSchema = yup.object({
    shift_team_id: yup.number().required('Shift Team is required').typeError('Shift Team is required'),
    shift_start: yup.string().required('Start Date is required').typeError('Start Date is required'),
    shift_end: yup.string()
      .required('End Date is required')
      .typeError('End Date is required')
      .test(
        'is-greater',
        'Shift End Date must be greater than Start Date by at least 1 minute',
        function (value) {
          const { shift_start } = this.parent;
          return dayjs(value).isAfter(dayjs(shift_start).add(1, 'minute'));
        }
      ),
    pump_readings: yup.array().of(
      yup.object().shape({
        opening: yup.number()
          .required("Opening Reading is required")
          .typeError('Opening Reading is required')
          .max(yup.ref('closing'), "Opening Reading should not exceed the Closing Reading"),
        closing: yup.number()
          .required("Closing Reading is required")
          .typeError('Closing Reading is required')
          .min(yup.ref('opening'), "Closing Reading should exceed the Opening Reading"),
      })
    ),
    product_prices: yup.array().of(
      yup.object().shape({
        product_id: yup.number().required("Fuel name is required").typeError('Fuel name is required'),
        price: yup.string().required("Price is required").typeError('Price is required'),
      })
    ),
    other_ledgers: yup.array().of(
      yup.object().shape({
        id: yup.number().positive('Ledger name must be Positive').required("Ledger name is required").typeError('Ledger name is required'),
        amount: yup.string().required("Amount is required").typeError('Amount is required'),
      })
    ),
    submit_type: yup.string().oneOf(['suspend', 'close']).required(),
    main_ledger_id: yup.number().when('submit_type', {
      is: 'close',
      then: (schema) => schema.required('Main Ledger is required').typeError('Main Ledger is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    main_ledger_amount: yup.number().when('submit_type', {
      is: 'close',
      then: (schema) => schema.positive('Amount Must be Positive').required('Amount Must be Positive').typeError('Amount Must be Positive'),
      otherwise: (schema) => schema.nullable(),
    }),
    dipping_before: yup.array().when('isOpenSwitchON', {
      is: true,
      then: (schema) => schema.of(
        yup.object().shape({
          reading: yup.string().required('Opening Reading is required').typeError('Opening Reading is required')
        })
      ),
      otherwise: (schema) => schema.nullable()
    }),
    dipping_after: yup.array().when('isCloseSwitchON', {
      is: true,
      then: (schema) => schema.of(
        yup.object().shape({
          reading: yup.string().required('Closing Reading is required').typeError('Closing Reading is required')
        })
      ),
      otherwise: (schema) => schema.nullable()
    }),
  });

  const { register, getValues, control, handleSubmit, setError, clearErrors, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      id: SalesShift?.id,
      submit_type: SalesShift?.status,
      isOpenSwitchON: SalesShift?.opening_dipping?.readings.length > 0 ? true : false,
      isCloseSwitchON: SalesShift?.closing_dipping?.readings.length > 0 ? true : false,
      shift_team_id: SalesShift?.shift_team_id,
      shift_start: SalesShift && dayjs(SalesShift.shift_start).toISOString(),
      shift_end: SalesShift && dayjs(SalesShift?.shift_end).toISOString(),
      fuel_vouchers: SalesShift?.fuel_vouchers.map(fuelVoucher => ({
        id: fuelVoucher.id,
        stakeholder_id: fuelVoucher.stakeholder?.id,
        quantity : fuelVoucher.quantity,
        reference: fuelVoucher.reference,
        narration: fuelVoucher.narration,
        product_id: fuelVoucher.product_id,
        expense_ledger_id: fuelVoucher.expense_ledger?.id,
      })),
      dipping_before: SalesShift?.opening_dipping?.readings.map(od => ({
        id: od.id,
        reading : od.reading,
        product_id: od.product_id,
        tank_id: od.tank_id,
      })),
      dipping_after: SalesShift?.closing_dipping?.readings.map(cd => ({
        id: cd.id,
        reading : cd.reading,
        product_id: cd.product_id,
        tank_id: cd.tank_id,
      })),
      main_ledger: { id: SalesShift?.main_ledger?.id, amount: SalesShift?.main_ledger?.amount },
      main_ledger_id: SalesShift?.main_ledger?.id,
      other_ledgers: SalesShift && SalesShift.other_ledgers,
      pump_readings: (() => {
        const pumpReadings = [];
        SalesShift?.pump_readings.forEach(reading => {
          pumpReadings[reading.fuel_pump_id] = reading;
        });
        return pumpReadings;
      })(),
      product_prices: (() => {
        const productPrices = [];
        SalesShift?.fuel_prices.forEach(price => {
          productPrices[price.product_id] = price;
        });
        return productPrices;
      })(),   
    },
  });

  const { fields: cashReconciliationFields, append: cashReconciliationAppend, remove: cashReconciliationRemove} = useFieldArray({
    control,
    name: 'other_ledgers',
  });

  useEffect(() => {
    if (SalesShift) {
      setShiftLedgers(shift_teams?.find(team => team.id === SalesShift?.shift_team_id).ledgers)
    }
  }, [SalesShift,shift_teams])

  useEffect(() => {
    setValue('fuel_vouchers', fuelVouchers?.map(fuelVoucher => ({
      stakeholder_id: !!fuelVoucher.stakeholder?.id ? fuelVoucher.stakeholder?.id : null,
      quantity : fuelVoucher.quantity,
      reference: fuelVoucher.reference,
      narration: fuelVoucher.narration,
      product_id: fuelVoucher.product_id,
      expense_ledger_id: fuelVoucher.expense_ledger?.id,
    })));
  }, [fuelVouchers, setValue]);  

  useEffect(() => {
    setValue('adjustments', adjustments?.map(adjustment => ({
      tank_id: adjustment && adjustment.tank_id,
      quantity : adjustment.quantity,
      operator: adjustment.operator,
      description: adjustment.description,
      product_id: adjustment.product_id,
    })));
  }, [adjustments, setValue]);  

  const [lastPumpReadings, setLastPumpReadings] = useState(null);
  const retrieveLastShiftReadings = async () => {
    const lastReadings =  await fuelStationServices.retrieveLastReadings({
      stationId: activeStation.id,
      shift_start: watch(`shift_start`),
    });

    lastReadings?.pump_readings && setLastPumpReadings(lastReadings.pump_readings)
  }

  useEffect(() => {
    if(!!lastPumpReadings){

      lastPumpReadings.forEach((lastReading) => {
        setValue(`pump_readings.${lastReading.fuel_pump_id}.opening`, lastReading.closing);
        setValue(`pump_readings.${lastReading.fuel_pump_id}.fuel_pump_id`, lastReading.fuel_pump_id);
      })

      setPumpReadingsKey(prevKey => prevKey + 1);
    }
  }, [lastPumpReadings]);

  const getUniqueEntries = (entries = [], key) => {
    const filteredEntries = entries.filter(entry => entry[key] != null);
    const reversedEntries = filteredEntries.reverse();
    const uniqueEntries = reversedEntries.reduce((acc, entry) => {
      if (!acc.some(item => item[key] === entry[key])) {
        acc.push(entry);
      }
      return acc;
    }, []);
    return uniqueEntries.reverse();
  };

  const handleSubmitForm = async (data) => {
    const updatedData = { 
      ...data, 
      fuel_vouchers: watch('fuel_vouchers'), 
      adjustments: watch('adjustments') 
    };

    const cleanedData = {
      ...updatedData,
      pump_readings: getUniqueEntries(updatedData.pump_readings, 'fuel_pump_id'),
      product_prices: getUniqueEntries(updatedData.product_prices, 'product_id')
    };

    const pumpReadings = cleanedData.pump_readings;
    const fuelVouchers = cleanedData.fuel_vouchers;

    if (!checkShiftBalanced && data.submit_type === 'close') {
      enqueueSnackbar('Shift is not balanced. Please review and balance the shift.', {
        variant: 'error',
      });
      return; 
    }

    if (data.submit_type === 'close') {
      // Calculate total sold and vouchers for each product
      const totalSold = pumpReadings.reduce((acc, reading) => {
        const soldQuantity = reading.closing - reading.opening;
        const productId = reading.product_id;

        acc[productId] = (acc[productId] || 0) + soldQuantity;
        return acc;
      }, {});

      const totalVouchers = fuelVouchers.reduce((acc, voucher) => {
        const productId = voucher.product_id;
        const quantity = voucher.quantity;

        acc[productId] = (acc[productId] || 0) + quantity;
        return acc;
      }, {});

      let hasError = false;

      for (const productId in totalSold) {
        const soldQuantity = totalSold[productId] || 0;
        const voucherQuantity = totalVouchers[productId] || 0;

        if (soldQuantity < voucherQuantity) {
          const checkedProduct = productOptions.find(prd => prd.id === parseInt(productId));

          enqueueSnackbar(
            `Fuel Voucher ${checkedProduct.name} quantity (${voucherQuantity}) exceeds total ${checkedProduct.name} Sold (${soldQuantity})`, 
            { variant: 'error' }
          );

          hasError = true;
        }
      }

      if (hasError) {
        return; 
      }
    }

    await saveMutation(cleanedData);
  };      

  return (
    <FormProvider {...{setCheckShiftBalanced, shiftLedgers, fuel_pumps, tanks, adjustments, setAdjustments, fuelVouchers, setFuelVouchers, products, register, handleSubmit, setError, clearErrors, setValue, watch, errors, cashReconciliationFields, cashReconciliationAppend, cashReconciliationRemove}}>
      <DialogTitle>
        <form autoComplete='off'>    
          <Grid container spacing={1} marginTop={1}>
            <Grid size={12} textAlign={'center'} marginBottom={1}>
              {SalesShift ? `Edit ${SalesShift.shiftNo}` : `Fuel Sales Shift`}
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 0.3}}>
                <Autocomplete
                  size="small"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={shift_teams}
                  defaultValue={shift_teams?.find(team => team.id === SalesShift?.shift_team_id)}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params} 
                      label="Shift team"
                      error={errors && !!errors?.shift_team_id}
                      helperText={errors && errors.shift_team_id?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setShiftLedgers(newValue ? newValue.ledgers : []);
                    setValue(`shift_team_id`, newValue ? newValue.id : '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  renderTags={(tagValue, getTagProps)=> {
                    return tagValue.map((option, index)=>{
                      const {key, ...restProps} = getTagProps({index});
                      return <Chip {...restProps} key={option.id+"-"+key} label={option.name} />
                    })
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4, lg: 4}}>
              <Div sx={{mt: 0.3}}>
                <DateTimePicker
                  label='Shift Start'
                  fullWidth
                  value={watch('shift_start') ? dayjs(watch('shift_start')) : null}
                  minDate={dayjs(organization.recording_start_date)}
                  slotProps={{
                    textField : {
                      size: 'small',
                      fullWidth: true,
                      readOnly: true,
                      error: !!errors?.shift_start,
                      helperText: errors?.shift_start?.message
                    }
                  }}
                  onChange={(newValue) => {
                    setValue('shift_start', newValue ? newValue.toISOString() : null,{
                      shouldValidate: true,
                      shouldDirty: true
                    });
                    retrieveLastShiftReadings();
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{xs: 12, md: 4 , lg: 4}}>
              <Div sx={{mt: 0.3}}>
                <DateTimePicker
                  label='Shift End'
                  fullWidth
                  value={watch('shift_end') ? dayjs(watch('shift_end')) : null}
                  minDate={dayjs(organization.recording_start_date)}
                  slotProps={{
                    textField : {
                      size: 'small',
                      fullWidth: true,
                      readOnly: true,
                      error: !!errors?.shift_end,
                      helperText: errors?.shift_end?.message
                    }
                  }}
                  onChange={(newValue) => {
                    setValue('shift_end', newValue ? newValue.toISOString() : null,{
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
          </Grid>
        </form>

        <Tabs
          value={activeTab}
          onChange={(e,newValue) =>setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons='auto'
          allowScrollButtonsMobile
        >
          <Tab label="Pump Readings"/>
          <Tab label="Fuel Vouchers"/>
          <Tab label="Dipping"/>
          <Tab label="Adjustments"/>
          <Tab label="Cash Reconciliation"/>
        </Tabs>
      </DialogTitle>
      <DialogContent>

        {/* activeTab for Pump Readings */}
        {activeTab === 0 && <PumpReadings key={pumpReadingsKey} />}

        {/* activeTab for Fuel Vouchers */}
        {activeTab === 1 && <FuelVouchers productPrices={watch(`product_prices`)}/>}

        {/* activeTab for Dipping */}
        {activeTab === 2 && <Dipping/>}

        {/* activeTab for Adjustments */}
        {activeTab === 3 && <Adjustments/>}

        {/* activeTab for Cash Reconciliation */}
        {activeTab === 4 && <CashReconciliation/>}

        {activeTab === 1 &&
          fuelVouchers.map((fuelVoucher,index) => {
            return <FuelVouchersItemRow key={index} fuelVoucher={fuelVoucher} index={index} productPrices={watch(`product_prices`)}/>
          })
        }

        {activeTab === 3 &&
          adjustments?.map((adjustment,index) => {
            return <AdjustmentsRow key={index} adjustment={adjustment} index={index}/>
          })
        }
      </DialogContent>
      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
          {
            activeTab > 0 &&
            <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => (activeTab-1))}>
              <KeyboardArrowLeftOutlined/>
              Previous
            </Button>
          }
          {
            activeTab < 4 &&
            <Button size='small' variant='outlined' onClick={() => setActiveTab(activeTab => activeTab+1)}>
              Next
              <KeyboardArrowRightOutlined/>
            </Button>
          }
        {activeTab === 4 && 
          <>
            <LoadingButton
              loading={isPending || updateLoading}
              size='small'
              variant='contained'
              onClick={(e) => {
                setValue('submit_type', 'suspend');
                handleSubmit(() => handleSubmitForm(getValues()))(e);
              }}
            >
              Suspend
            </LoadingButton>
            {watch(`pump_readings`).length > 0 && watch(`product_prices`).length > 0 && !!checkShiftBalanced &&
              checkOrganizationPermission([PERMISSIONS.FUEL_SALES_SHIFT_CLOSE]) &&
              <LoadingButton
                loading={isPending || updateLoading}
                size='small'
                type='submit'
                variant='contained'
                color='success'
                onClick={(e) => {
                  setValue('submit_type', 'close');
                  handleSubmit(() => handleSubmitForm(getValues()))(e);
                }}
              >
                close
              </LoadingButton>
            }
          </>
        }
      </DialogActions>
    </FormProvider>
  )
}

export default SaleShiftForm;
