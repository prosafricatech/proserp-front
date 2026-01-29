"use client";

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Tabs, 
  Tab, 
  Grid, 
  TextField, 
  Autocomplete, 
  Chip,
  Typography,
  Checkbox
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useSnackbar } from 'notistack';
import * as yup from 'yup';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import { KeyboardArrowLeftOutlined, KeyboardArrowRightOutlined } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Div } from '@jumbo/shared';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import CashierAccordion from './CashierAccordion';
import Dipping from './tabs/Dipping';
import { StationFormContext } from '../SalesShifts';
import fuelStationServices from '../../fuelStationServices';
import FuelPrices from './FuelPrices';
import ShiftSummary from './ShiftSummary';

function SaleShiftForm2({ SalesShift, setOpenDialog }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, cashiers, shifts} = activeStation;
  const {authOrganization : {organization}} = useJumboAuth();
  const [shiftLedgers, setShiftLedgers] = useState([]);
  const [checkShiftBalanced, setCheckShiftBalanced] = useState(true);
  const {checkOrganizationPermission} = useJumboAuth();

  const [cashierFuelVouchers, setCashierFuelVouchers] = useState({});
  const [cashierLedgers, setCashierLedgers] = useState({});
  
  // Store last closing readings for all pumps (for new shifts only)
  const [lastClosingReadings, setLastClosingReadings] = useState({}); // {pumpId: closingReading}

  const { mutate: addSalesShifts, isPending } = useMutation({
    mutationFn: fuelStationServices.addSalesShifts,
    onSuccess: (data) => {
      setOpenDialog(false);
      enqueueSnackbar(data.message, { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
    },
    onError: (error) => {
      let message = 'Something went wrong';
      if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response?.data?.message === 'string') {
        message = error.response.data.message;
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
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
    },
    onError: (error) => {
      let message = 'Something went wrong';
      if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response?.data?.message === 'string') {
        message = error.response.data.message;
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
    sales_outlet_shift_id: yup.number().required('Sales Outlet Shift is required').typeError('Sales Outlet Shift is required'),
    shift_start: yup.string().required('Start Date is required').typeError('Start Date is required'),
    shift_end: yup.string()
      .required('End Date is required')
      .typeError('End Date is required')
      .test(
        'is-greater',
        'Shift End Date must be greater than Start Date by at least 1 minute',
        function (value) {
          const { shift_start } = this.parent;
          if (!value || !shift_start) return true;
          const endDate = dayjs(value);
          const startDate = dayjs(shift_start);
          if (!endDate.isValid() || !startDate.isValid()) return true;
          return endDate.isAfter(startDate.add(1, 'minute'));
        }
      ),
    cashiers: yup.array().of(
      yup.object().shape({
        id: yup.number().required('Cashier ID is required'),
        name: yup.string(),
        selected_pumps: yup.array().of(yup.number()),
        pump_readings: yup.array().of(
          yup.object().shape({
            fuel_pump_id: yup.number().required('Fuel Pump is required'),
            opening: yup.number()
              .required("Opening Reading is required")
              .typeError('Opening Reading is required')
              .min(0, 'Opening reading cannot be negative')
              .test('opening-less-than-closing', 'Opening Reading should not exceed the Closing Reading', 
                function(value) {
                  const { closing } = this.parent;
                  if (value == null || closing == null) return true;
                  return Number(value) <= Number(closing);
                }
              ),
            closing: yup.number()
              .required("Closing Reading is required")
              .typeError('Closing Reading is required')
              .min(0, 'Closing reading cannot be negative')
              .test('closing-greater-than-or-equal-to-opening', 'Closing Reading should be greater than or equal to the Opening Reading', 
                function(value) {
                  const { opening } = this.parent;
                  if (value == null || opening == null) return true;
                  return Number(value) >= Number(opening);
                }
              ),
            product_id: yup.number().required('Product is required'),
          })
        ),
        fuel_vouchers: yup.array().of(
          yup.object().shape({
            stakeholder_id: yup.number().nullable(),
            quantity: yup.number().required('Quantity is required').positive('Quantity must be positive'),
            product_id: yup.number().required('Product is required'),
            expense_ledger_id: yup.number().nullable(),
            reference: yup.string().nullable(),
            narration: yup.string().nullable(),
          })
        ),
        tank_adjustments: yup.array().of(
          yup.object().shape({
            tank_id: yup.number().nullable(),
            quantity: yup.number().required('Quantity is required'),
            operator: yup.string().required('Operator is required'),
            description: yup.string().nullable(),
            product_id: yup.number().required('Product is required'),
          })
        ),
        cash_transactions: yup.array().of(
          yup.object().shape({
            ledger_id: yup.number().required('Ledger ID is required'),
            amount: yup.number().required('Amount is required').positive('Amount must be positive'),
          })
        ),
        main_ledger: yup.object().shape({
          id: yup.number().required('Main Ledger ID is required'),
          amount: yup.number()
            .required('Main Ledger Amount is required')
            .positive('Amount must be positive')
        }).nullable(),
      })
    ).required('At least one cashier is required').min(1, 'At least one cashier is required'),
    dipping_before: yup.array().of(
      yup.object().shape({
        reading: yup.number().required('Reading is required').min(0, 'Reading cannot be negative'),
        product_id: yup.number().required('Product is required'),
        tank_id: yup.number().required('Tank is required'),
      })
    ),
    dipping_after: yup.array().of(
      yup.object().shape({
        reading: yup.number().required('Reading is required').min(0, 'Reading cannot be negative'),
        product_id: yup.number().required('Product is required'),
        tank_id: yup.number().required('Tank is required'),
      })
    ),
    submit_type: yup.string().oneOf(['suspend', 'close']).required(),
    product_prices: yup.array().of(
      yup.object().shape({
        product_id: yup.number().required('Product is required'),
        price: yup.number().required('Price is required').positive('Price must be positive'),
      })
    ).required('Product prices are required').min(1, 'At least one product price is required'),
  });

  const getDefaultValues = useCallback(() => {
    if (SalesShift) {
      const initialProductPrices = SalesShift.fuel_prices?.map(fp => ({
        product_id: fp.product_id,
        price: fp.price,
      })) || [];
      
      // Map cashiers from SalesShift response
      const cashiersData = SalesShift.cashiers?.map(cashier => {
        const selectedPumps = cashier.pump_readings?.map(pr => pr.fuel_pump_id) || [];
        
        const pumpReadings = cashier.pump_readings?.map(pr => ({
          fuel_pump_id: pr.fuel_pump_id,
          product_id: pr.product_id,
          tank_id: pr.tank_id,
          opening: pr.opening,
          closing: pr.closing,
        })) || [];
        
        return {
          id: cashier.id,
          name: cashier.name,
          selected_pumps: selectedPumps,
          pump_readings: pumpReadings,
          fuel_vouchers: cashier.fuel_vouchers?.map(fv => ({
            stakeholder_id: fv.stakeholder_id,
            quantity: fv.quantity,
            product_id: fv.product_id,
            expense_ledger_id: fv.expense_ledger_id,
            reference: fv.reference,
            narration: fv.narration,
          })) || [],
          tank_adjustments: cashier.tank_adjustments?.map(adj => ({
            tank_id: adj.tank_id,
            quantity: adj.quantity,
            operator: adj.operator,
            description: adj.description,
            product_id: adj.product_id,
          })) || [],
          cash_transactions: cashier.cash_transactions?.map(ct => ({
            ledger_id: ct.debit_ledger?.id || ct.id,
            amount: ct.amount,
            narration: ct.narration,
          })) || [],
          main_ledger: cashier.main_ledger ? {
            id: cashier.main_ledger.id,
            name: cashier.main_ledger.name,
            amount: cashier.main_ledger.amount,
          } : null,
        };
      }) || [];
      
      return {
        id: SalesShift.id,
        submit_type: SalesShift.status === 'closed' ? 'close' : 'suspend',
        sales_outlet_shift_id: SalesShift.sales_outlet_shift_id,
        shift_start: dayjs(SalesShift.shift_start).toISOString(),
        shift_end: dayjs(SalesShift.shift_end).toISOString(),
        product_prices: initialProductPrices,
        cashiers: cashiersData,
        
        dipping_before: SalesShift.opening_dipping?.readings.map(od => ({
          id: od.id,
          reading: od.reading,
          product_id: od.product_id,
          tank_id: od.tank_id,
        })) || [],
        dipping_after: SalesShift.closing_dipping?.readings.map(cd => ({
          id: cd.id,
          reading: cd.reading,
          product_id: cd.product_id,
          tank_id: cd.tank_id,
        })) || [],
      };
    }
    
    return {
      submit_type: 'suspend',
      sales_outlet_shift_id: null,
      cashiers: [],
      dipping_before: [],
      dipping_after: [],
      product_prices: [],
    };
  }, [SalesShift]);

  const { register, control, handleSubmit, setError, clearErrors, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedCashiers = watch('cashiers') || [];

  // Function to retrieve last shift readings for NEW shifts only
  const retrieveLastShiftReadings = useCallback(async () => {
    try {
      const shiftStart = watch('shift_start');
      if (!shiftStart || SalesShift?.id) return;
      
      const lastReadings = await fuelStationServices.retrieveLastReadings({
        stationId: activeStation.id,
        shift_start: shiftStart,
      });

      const readingsMap = {};
        lastReadings.cashiers.flatMap(cashier => 
          cashier.pump_readings || []
        ).forEach(reading => {
          readingsMap[reading.fuel_pump_id] = reading.closing;
        });

      setLastClosingReadings(readingsMap);
    } catch (error) {
    }
  }, [activeStation.id, watch, enqueueSnackbar, SalesShift]);

  // Function to get appropriate opening value based on context
  const getPumpOpeningValue = useCallback((pumpId, cashierIndex) => {
    // For existing shifts: get from saved cashier data
    if (SalesShift?.id) {
      const cashier = selectedCashiers[cashierIndex];
      if (cashier?.pump_readings) {
        const savedReading = cashier.pump_readings.find(pr => pr.fuel_pump_id === pumpId);
        return savedReading?.opening || 0;
      }
    }
    
    // For new shifts: get from last closing readings
    return lastClosingReadings[pumpId] || 0;
  }, [SalesShift, selectedCashiers, lastClosingReadings]);

  // Function to handle pump selection with appropriate initialization
  const handlePumpSelection = useCallback((cashierIndex, selectedPumpIds) => {
    const currentCashier = selectedCashiers[cashierIndex];
    if (!currentCashier) return;
    
    // Update selected pumps
    setValue(`cashiers.${cashierIndex}.selected_pumps`, selectedPumpIds, {
      shouldValidate: true,
      shouldDirty: true
    });
    
    // Get current readings
    const currentReadings = currentCashier.pump_readings || [];
    
    // Filter out readings for deselected pumps
    let updatedReadings = currentReadings.filter(reading => 
      selectedPumpIds.includes(reading.fuel_pump_id)
    );
    
    // For new pumps that don't have readings yet
    selectedPumpIds.forEach(pumpId => {
      if (!updatedReadings.some(r => r.fuel_pump_id === pumpId)) {
        const pump = fuel_pumps?.find(p => p.id === pumpId);
        if (pump) {
          const openingValue = getPumpOpeningValue(pumpId, cashierIndex);
          updatedReadings.push({
            fuel_pump_id: pumpId,
            product_id: pump.product_id,
            tank_id: pump.tank_id,
            opening: openingValue,
            closing: openingValue, // Initialize with same value
          });
        }
      }
    });
    
    // Update the readings
    setValue(`cashiers.${cashierIndex}.pump_readings`, updatedReadings, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [selectedCashiers, setValue, fuel_pumps, getPumpOpeningValue]);

  // Initialize cashier data from API response
  useEffect(() => {
    if (SalesShift?.cashiers) {
      // Initialize cashier fuel vouchers
      SalesShift.cashiers.forEach((cashier, index) => {
        if (cashier.fuel_vouchers && cashier.fuel_vouchers.length > 0) {
          setCashierFuelVouchers(prev => ({
            ...prev,
            [index]: cashier.fuel_vouchers
          }));
        }
        
        // Initialize cashier ledgers from cashiers prop
        const cashierData = cashiers?.find(c => c.id === cashier.id);
        if (cashierData && cashierData.ledgers) {
          setCashierLedgers(prev => ({
            ...prev,
            [index]: cashierData.ledgers
          }));
        }
      });
    }
  }, [SalesShift, cashiers]);

  // Update cashier ledgers when cashiers are selected
  useEffect(() => {
    selectedCashiers.forEach((cashier, index) => {
      const cashierData = cashiers?.find(c => c.id === cashier.id);
      if (cashierData && cashierData.ledgers && !cashierLedgers[index]) {
        setCashierLedgers(prev => ({
          ...prev,
          [index]: cashierData.ledgers
        }));
      }
    });
  }, [selectedCashiers, cashiers, cashierLedgers]);

  // Auto-fetch last readings when shift start date changes (for NEW shifts only)
  useEffect(() => {
    const shiftStart = watch('shift_start');
    if (shiftStart && !SalesShift?.id) {
      retrieveLastShiftReadings();
    }
  }, [watch('shift_start'), SalesShift?.id, retrieveLastShiftReadings]);

  const addCashiers = (selectedCashierIds) => {
    const newCashiers = selectedCashierIds
      .map(cashierId => {
        const cashier = cashiers.find(c => c.id === cashierId);
        if (!cashier) return null;
        
        if (selectedCashiers.some(sc => sc.id === cashierId)) {
          return null;
        }
        
        return {
          id: cashierId,
          name: cashier.name,
          selected_pumps: [],
          pump_readings: [],
          fuel_vouchers: [],
          tank_adjustments: [],
          cash_transactions: [],
          main_ledger: null,
        };
      })
      .filter(c => c !== null);
    
    const updatedCashiers = [...selectedCashiers, ...newCashiers];
    setValue('cashiers', updatedCashiers, { shouldValidate: true, shouldDirty: true });
    
    newCashiers.forEach((cashier, offsetIndex) => {
      const cashierIndex = selectedCashiers.length + offsetIndex;
      setCashierFuelVouchers(prev => ({
        ...prev,
        [cashierIndex]: []
      }));
      
      const cashierData = cashiers.find(c => c.id === cashier.id);
      if (cashierData && cashierData.ledgers) {
        setCashierLedgers(prev => ({
          ...prev,
          [cashierIndex]: cashierData.ledgers
        }));
      }
    });
  };

  const removeCashier = (cashierId) => {
    const cashierIndex = selectedCashiers.findIndex(c => c.id === cashierId);
    if (cashierIndex !== -1) {
      const updatedCashiers = selectedCashiers.filter(c => c.id !== cashierId);
      setValue('cashiers', updatedCashiers, { shouldValidate: true, shouldDirty: true });
      
      setCashierFuelVouchers(prev => {
        const newState = { ...prev };
        delete newState[cashierIndex];
        const reindexedState = {};
        Object.keys(newState).forEach((key, index) => {
          reindexedState[index] = newState[key];
        });
        return reindexedState;
      });
      
      setCashierLedgers(prev => {
        const newState = { ...prev };
        delete newState[cashierIndex];
        const reindexedState = {};
        Object.keys(newState).forEach((key, index) => {
          reindexedState[index] = newState[key];
        });
        return reindexedState;
      });
    }
  };

  const getAvailablePumpsForCashier = (cashierIndex) => {
    const allPumps = fuel_pumps || [];
    const currentCashierPumps = selectedCashiers[cashierIndex]?.selected_pumps || [];
    
    const otherCashiersPumps = selectedCashiers
      .filter((_, idx) => idx !== cashierIndex)
      .flatMap(c => c.selected_pumps || []);
    
    return allPumps.filter(pump => 
      currentCashierPumps.includes(pump.id) || !otherCashiersPumps.includes(pump.id)
    );
  };

  const getCashierLedgers = (cashierIndex) => {
    return cashierLedgers[cashierIndex] || [];
  };

  const handleSubmitForm = async (data) => {
    if (data.cashiers.length === 0) {
      enqueueSnackbar('Please add at least one cashier', { variant: 'error' });
      return;
    }

    if (!checkShiftBalanced && data.submit_type === 'close') {
      enqueueSnackbar('Shift is not balanced. Please review and balance the shift.', {
        variant: 'error',
      });
      return;
    }

    const cashiersWithoutPumps = data.cashiers.filter(c => 
      !c.selected_pumps || c.selected_pumps.length === 0
    );
    
    if (cashiersWithoutPumps.length > 0) {
      enqueueSnackbar(
        `Cashier(s) ${cashiersWithoutPumps.map(c => c.name).join(', ')} must have at least one pump selected`,
        { variant: 'error' }
      );
      return;
    }

    Object.keys(cashierFuelVouchers).forEach(index => {
      if (data.cashiers[parseInt(index)]) {
        data.cashiers[parseInt(index)].fuel_vouchers = cashierFuelVouchers[parseInt(index)] || [];
      }
    });

    await saveMutation(data);
  };

  return (
    <FormProvider {...{
      register, 
      handleSubmit, 
      setError, 
      clearErrors, 
      setValue, 
      watch, 
      errors,
      control,
    }}>
      <DialogTitle>
        <form autoComplete='off'>    
          <Grid container spacing={1} marginTop={1}>
            <Grid size={12} textAlign={'center'} marginBottom={1}>
              {SalesShift ? `Edit ${SalesShift.shiftNo}` : `New Fuel Sales Shift`}
            </Grid>
            
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 0.3}}>
                <Autocomplete
                  size="small"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={shifts || []}
                  defaultValue={shifts?.find(team => team.id === SalesShift?.sales_outlet_shift_id)}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params} 
                      label="Sales Outlet Shift"
                      error={!!errors?.sales_outlet_shift_id}
                      helperText={errors?.sales_outlet_shift_id?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setShiftLedgers(newValue ? newValue.ledgers : []);
                    setValue('sales_outlet_shift_id', newValue ? newValue.id : '', {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  renderTags={(tagValue, getTagProps) => {
                    return tagValue.map((option, index) => (
                      <Chip {...getTagProps({index})} key={option.id} label={option.name} />
                    ))
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
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!errors?.shift_start,
                      helperText: errors?.shift_start?.message
                    }
                  }}
                  onChange={(newValue) => {
                    setValue('shift_start', newValue ? newValue.toISOString() : null, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>
            
            <Grid size={{xs: 12, md: 4, lg: 4}}>
              <Div sx={{mt: 0.3}}>
                <DateTimePicker
                  label='Shift End'
                  fullWidth
                  value={watch('shift_end') ? dayjs(watch('shift_end')) : null}
                  minDate={dayjs(organization.recording_start_date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      error: !!errors?.shift_end,
                      helperText: errors?.shift_end?.message
                    }
                  }}
                  onChange={(newValue) => {
                    setValue('shift_end', newValue ? newValue.toISOString() : null, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FuelPrices />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ mt: 2, mb: 1 }}>
                Select Cashiers
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={cashiers || []}
                disableCloseOnSelect
                getOptionLabel={(option) => option.name}
                renderOption={(props, option, { selected }) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps}>
                      <Checkbox
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.name}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Cashiers"
                    placeholder="Choose Cashiers..."
                  />
                )}
                onChange={(e, selectedValues) => {
                  const selectedIds = selectedValues.map(v => v.id);
                  const currentCashierIds = selectedCashiers.map(c => c.id);
                  const toRemove = currentCashierIds.filter(id => !selectedIds.includes(id));
                  const toAdd = selectedIds.filter(id => !currentCashierIds.includes(id));
                  toRemove.forEach(cashierId => removeCashier(cashierId));
                  
                  if (toAdd.length > 0) {
                    addCashiers(toAdd);
                  }
                }}
                value={cashiers.filter(c => 
                  selectedCashiers.some(sc => sc.id === c.id)
                )}
              />
            </Grid>
            
            {Object.keys(lastClosingReadings).length > 0 && !SalesShift?.id && (
              <Grid size={12}>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  ✓ Last shift readings loaded for {Object.keys(lastClosingReadings).length} pump(s)
                </Typography>
              </Grid>
            )}
          </Grid>
        </form>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mt: 2 }}
        >
          <Tab label="Cashiers Records" />
          <Tab label="Dipping" />
          <Tab label="Shift Summary" />
        </Tabs>
      </DialogTitle>
      
      <DialogContent>
        {activeTab === 0 && (
          <div>
            {selectedCashiers.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>
                Please select cashiers using the selector above
              </Typography>
            ) : (
              selectedCashiers.map((cashier, index) => (
                <CashierAccordion
                  key={cashier.id}
                  cashier={cashier}
                  index={index}
                  control={control}
                  watch={watch}    
                  lastClosingReadings={lastClosingReadings}
                  handlePumpSelection={handlePumpSelection}
                  getCashierLedgers={getCashierLedgers}
                  getAvailablePumpsForCashier={getAvailablePumpsForCashier}
                  setCheckShiftBalanced={setCheckShiftBalanced}
                  setValue={setValue}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 1 && <Dipping SalesShift={SalesShift} />}

        {activeTab === 2 && (
          <ShiftSummary />
        )}
      </DialogContent>

      <DialogActions>
        <Button size='small' onClick={() => setOpenDialog(false)}>
          Cancel
        </Button>
        
        {activeTab > 0 && (
          <Button 
            size='small' 
            variant='outlined' 
            onClick={() => setActiveTab(activeTab - 1)}
            startIcon={<KeyboardArrowLeftOutlined />}
          >
            Previous
          </Button>
        )}
        
        {activeTab < 2 && (
          <Button 
            size='small' 
            variant='outlined' 
            onClick={() => setActiveTab(activeTab + 1)}
            endIcon={<KeyboardArrowRightOutlined />}
          >
            Next
          </Button>
        )}
        
        {activeTab === 2 && (
          <>
            <LoadingButton
              loading={isPending || updateLoading}
              size='small'
              variant='contained'
              onClick={(e) => {
                setValue('submit_type', 'suspend');
                handleSubmit(handleSubmitForm)(e);
              }}
            >
              Suspend Shift
            </LoadingButton>
            
            {selectedCashiers.length > 0 && checkShiftBalanced && 
             checkOrganizationPermission([PERMISSIONS.FUEL_SALES_SHIFT_CLOSE]) && (
              <LoadingButton
                loading={isPending || updateLoading}
                size='small'
                variant='contained'
                color='success'
                onClick={(e) => {
                  setValue('submit_type', 'close');
                  handleSubmit(handleSubmitForm)(e);
                }}
              >
                Close Shift
              </LoadingButton>
            )}
          </>
        )}
      </DialogActions>
    </FormProvider>
  );
}

export default SaleShiftForm2;