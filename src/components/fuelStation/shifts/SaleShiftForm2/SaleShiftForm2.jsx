"use client";

import React, { useContext, useState, useEffect } from 'react';
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

function SaleShiftForm({ SalesShift, setOpenDialog }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, tanks, products, shift_teams} = activeStation;
  const {authOrganization : {organization}} = useJumboAuth();
  const [shiftLedgers, setShiftLedgers] = useState([]);
  const [checkShiftBalanced, setCheckShiftBalanced] = useState(true);
  const {checkOrganizationPermission} = useJumboAuth();

  // Available cashiers - you can replace this with actual data
  const AVAILABLE_CASHIERS = [
    { id: 1, name: 'Cashier A' },
    { id: 2, name: 'Cashier B' },
    { id: 3, name: 'Cashier C' },
    { id: 4, name: 'Cashier D' },
    { id: 5, name: 'Cashier E' },
  ];

  // State to manage fuel vouchers for each cashier
  const [cashierFuelVouchers, setCashierFuelVouchers] = useState({});

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

  // Validation Schema
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
    cashiers: yup.array().of(
      yup.object().shape({
        cashier_id: yup.number().required('Cashier selection is required'),
        cashier_name: yup.string(),
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
              .test('closing-greater-than-opening', 'Closing Reading should exceed the Opening Reading', 
                function(value) {
                  const { opening } = this.parent;
                  if (value == null || opening == null) return true;
                  return Number(value) > Number(opening);
                }
              ),
            product_id: yup.number().required('Product is required'),
          })
        ),
        fuel_vouchers: yup.array().of(
          yup.object().shape({
            stakeholder_id: yup.number(),
            quantity: yup.number().required('Quantity is required').positive('Quantity must be positive'),
            product_id: yup.number().required('Product is required'),
            expense_ledger_id: yup.number(),
            reference: yup.string(),
            narration: yup.string(),
          })
        ),
        adjustments: yup.array().of(
          yup.object().shape({
            tank_id: yup.number(),
            quantity: yup.number().required('Quantity is required'),
            operator: yup.string().required('Operator is required'),
            description: yup.string(),
            product_id: yup.number().required('Product is required'),
          })
        ),
        other_ledgers: yup.array().of(
          yup.object().shape({
            id: yup.number().required('Ledger is required'),
            amount: yup.number().required('Amount is required').positive('Amount must be positive'),
          })
        ),
        product_prices: yup.array().of(
          yup.object().shape({
            product_id: yup.number().required('Product is required'),
            price: yup.number().required('Price is required').positive('Price must be positive'),
          })
        ),
      })
    ),
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
    main_ledger_id: yup.number().when('submit_type', {
      is: 'close',
      then: (schema) => schema.required('Main Ledger is required'),
      otherwise: (schema) => schema.nullable(),
    }),
    main_ledger_amount: yup.number().when('submit_type', {
      is: 'close',
      then: (schema) => schema.positive('Amount must be positive').required('Amount is required'),
      otherwise: (schema) => schema.nullable(),
    }),
  });

  // Prepare default values
  const getDefaultValues = () => {
    if (SalesShift) {
      // Initialize cashierFuelVouchers from SalesShift data
      const initialFuelVouchers = {};
      SalesShift.cashiers?.forEach((cashier, index) => {
        initialFuelVouchers[index] = cashier.fuel_vouchers || [];
      });
      setCashierFuelVouchers(initialFuelVouchers);

      return {
        id: SalesShift.id,
        submit_type: SalesShift.status,
        shift_team_id: SalesShift.shift_team_id,
        shift_start: dayjs(SalesShift.shift_start).toISOString(),
        shift_end: dayjs(SalesShift.shift_end).toISOString(),
        cashiers: SalesShift.cashiers?.map(cashier => ({
          cashier_id: cashier.cashier_id,
          cashier_name: cashier.name,
          selected_pumps: cashier.selected_pumps || [],
          pump_readings: cashier.pump_readings || [],
          fuel_vouchers: cashier.fuel_vouchers || [],
          adjustments: cashier.adjustments || [],
          other_ledgers: cashier.other_ledgers || [],
          product_prices: cashier.product_prices || [],
        })) || [],
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
        main_ledger_id: SalesShift.main_ledger?.id,
        main_ledger_amount: SalesShift.main_ledger?.amount,
      };
    }
    
    // New shift defaults
    return {
      submit_type: 'suspend',
      cashiers: [],
      dipping_before: [],
      dipping_after: [],
    };
  };

  const { register, getValues, control, handleSubmit, setError, clearErrors, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: getDefaultValues(),
  });

  // Watch cashiers for dynamic rendering
  const selectedCashiers = watch('cashiers') || [];

  // Sync form fuel_vouchers with local state when form values change
  useEffect(() => {
    selectedCashiers.forEach((cashier, index) => {
      if (cashier.fuel_vouchers && cashier.fuel_vouchers.length > 0) {
        setCashierFuelVouchers(prev => ({
          ...prev,
          [index]: cashier.fuel_vouchers
        }));
      }
    });
  }, [selectedCashiers]);

  // Add multiple cashiers
  const addCashiers = (selectedCashierIds) => {
    const newCashiers = selectedCashierIds
      .map(cashierId => {
        const cashier = AVAILABLE_CASHIERS.find(c => c.id === cashierId);
        if (!cashier) return null;
        
        // Check if already exists
        if (selectedCashiers.some(sc => sc.cashier_id === cashierId)) {
          return null;
        }
        
        return {
          cashier_id: cashierId,
          cashier_name: cashier.name,
          selected_pumps: [],
          pump_readings: [],
          fuel_vouchers: [],
          adjustments: [],
          other_ledgers: [],
          product_prices: [],
        };
      })
      .filter(c => c !== null);
    
    const updatedCashiers = [...selectedCashiers, ...newCashiers];
    setValue('cashiers', updatedCashiers, { shouldValidate: true, shouldDirty: true });
    
    // Initialize fuel vouchers state for new cashiers
    newCashiers.forEach((cashier, offsetIndex) => {
      const cashierIndex = selectedCashiers.length + offsetIndex;
      setCashierFuelVouchers(prev => ({
        ...prev,
        [cashierIndex]: []
      }));
    });
  };

  // Remove a cashier
  const removeCashier = (cashierId) => {
    const cashierIndex = selectedCashiers.findIndex(c => c.cashier_id === cashierId);
    if (cashierIndex !== -1) {
      // Remove from form state
      const updatedCashiers = selectedCashiers.filter(c => c.cashier_id !== cashierId);
      setValue('cashiers', updatedCashiers, { shouldValidate: true, shouldDirty: true });
      
      // Remove from local fuel vouchers state
      setCashierFuelVouchers(prev => {
        const newState = { ...prev };
        delete newState[cashierIndex];
        // Reindex remaining cashiers
        const reindexedState = {};
        Object.keys(newState).forEach((key, index) => {
          reindexedState[index] = newState[key];
        });
        return reindexedState;
      });
    }
  };

  // Update fuel vouchers for a specific cashier
  const updateCashierFuelVouchers = (cashierIndex, newVouchers) => {
    setCashierFuelVouchers(prev => ({
      ...prev,
      [cashierIndex]: newVouchers
    }));
    
    // Also update the form value
    setValue(`cashiers.${cashierIndex}.fuel_vouchers`, newVouchers, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  // Get available pumps for cashier selection
  const getAvailablePumpsForCashier = (cashierIndex) => {
    const allPumps = fuel_pumps || [];
    const currentCashierPumps = selectedCashiers[cashierIndex]?.selected_pumps || [];
    
    // Get pumps already selected by other cashiers
    const otherCashiersPumps = selectedCashiers
      .filter((_, idx) => idx !== cashierIndex)
      .flatMap(c => c.selected_pumps || []);
    
    return allPumps.filter(pump => 
      currentCashierPumps.includes(pump.id) || !otherCashiersPumps.includes(pump.id)
    );
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

    // Validate each cashier has at least one pump selected
    const cashiersWithoutPumps = data.cashiers.filter(c => 
      !c.selected_pumps || c.selected_pumps.length === 0
    );
    
    if (cashiersWithoutPumps.length > 0) {
      enqueueSnackbar(
        `Cashier(s) ${cashiersWithoutPumps.map(c => c.cashier_name).join(', ')} must have at least one pump selected`,
        { variant: 'error' }
      );
      return;
    }

    // Ensure all local fuel vouchers are synced to form data
    Object.keys(cashierFuelVouchers).forEach(index => {
      if (data.cashiers[parseInt(index)]) {
        data.cashiers[parseInt(index)].fuel_vouchers = cashierFuelVouchers[parseInt(index)] || [];
      }
    });

    await saveMutation(data);
  };

  return (
    <FormProvider {...{
      setCheckShiftBalanced, 
      shiftLedgers, 
      fuel_pumps, 
      tanks, 
      products, 
      register, 
      handleSubmit, 
      setError, 
      clearErrors, 
      setValue, 
      watch, 
      errors,
      control,
      getAvailablePumpsForCashier,
      cashierFuelVouchers,
      updateCashierFuelVouchers,
    }}>
      <DialogTitle>
        <form autoComplete='off'>    
          <Grid container spacing={1} marginTop={1}>
            <Grid size={12} textAlign={'center'} marginBottom={1}>
              {SalesShift ? `Edit ${SalesShift.shiftNo}` : `New Fuel Sales Shift`}
            </Grid>
            
            {/* Shift Details */}
            <Grid size={{xs: 12, md: 4}}>
              <Div sx={{ mt: 0.3}}>
                <Autocomplete
                  size="small"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={shift_teams || []}
                  defaultValue={shift_teams?.find(team => team.id === SalesShift?.shift_team_id)}
                  getOptionLabel={(option) => option.name}
                  renderInput={(params) => (
                    <TextField
                      {...params} 
                      label="Shift Team *"
                      error={!!errors?.shift_team_id}
                      helperText={errors?.shift_team_id?.message}
                    />
                  )}
                  onChange={(e, newValue) => {
                    setShiftLedgers(newValue ? newValue.ledgers : []);
                    setValue('shift_team_id', newValue ? newValue.id : '', {
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
                  label='Shift Start *'
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
                  label='Shift End *'
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

            {/* Cashiers Selection - Multiple with Checkbox */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography sx={{ mt: 2, mb: 1 }}>
                Select Cashiers
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={AVAILABLE_CASHIERS}
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
                    placeholder="Choose cashiers..."
                  />
                )}
                onChange={(e, selectedValues) => {
                  const selectedIds = selectedValues.map(v => v.id);
                  const currentCashierIds = selectedCashiers.map(c => c.cashier_id);
                  
                  // Find cashiers to remove (in current but not in new selection)
                  const toRemove = currentCashierIds.filter(id => !selectedIds.includes(id));
                  const toAdd = selectedIds.filter(id => !currentCashierIds.includes(id));
                  
                  // Remove cashiers
                  toRemove.forEach(cashierId => removeCashier(cashierId));
                  
                  // Add new cashiers
                  if (toAdd.length > 0) {
                    addCashiers(toAdd);
                  }
                }}
                value={AVAILABLE_CASHIERS.filter(c => 
                  selectedCashiers.some(sc => sc.cashier_id === c.id)
                )}
              />
            </Grid>
          </Grid>
        </form>

        {/* Main Tabs */}
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
        {/* Tab 1: Cashiers Records */}
        {activeTab === 0 && (
          <div>
            {selectedCashiers.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>
                Please select cashiers using the selector above
              </Typography>
            ) : (
              selectedCashiers.map((cashier, index) => (
                <CashierAccordion
                  key={cashier.cashier_id}
                  cashier={cashier}
                  index={index}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Dipping (Global) */}
        {activeTab === 1 && <Dipping />}

        {/* Tab 3: Shift Summary */}
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

export default SaleShiftForm;