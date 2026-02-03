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
  Checkbox,
  Alert
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
import PaymentsReceived from './tabs/PaymentsReceived';
import { StationFormContext } from '../SalesShifts';
import fuelStationServices from '../../fuelStationServices';
import FuelPrices from './FuelPrices';
import ShiftSummary from './ShiftSummary';
import PaymentsReceivedItemRow from './tabs/PaymentsReceivedItemRow';

function SaleShiftForm({ SalesShift, setOpenDialog }) {
  const [showWarning, setShowWarning] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [clearFormKey, setClearFormKey] = useState(0);
  const [submitItemForm, setSubmitItemForm] = useState(false);
  const [paymentItems, setPaymentItems] = useState(() => SalesShift?.payments_received ? [...SalesShift.payments_received] : []);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState(0);
  const {activeStation} = useContext(StationFormContext);
  const {fuel_pumps, cashiers, shifts} = activeStation;
  const {authOrganization : {organization}} = useJumboAuth();
  const {checkOrganizationPermission} = useJumboAuth();

  const [cashierLedgers, setCashierLedgers] = useState({});
  const [lastClosingReadings, setLastClosingReadings] = useState({});

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
    sales_outlet_shift_id: yup.number().required('Sales Outlet Shift is required').typeError('Sales Outlet Shift must be a number'),
    shift_start: yup.string().required('Start Date is required').typeError('Start Date must be a valid string'),
    shift_end: yup.string()
      .required('End Date is required')
      .typeError('End Date must be a valid string')
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
        id: yup.number().required('Cashier is required').typeError('Cashier is required'),
        name: yup.string(),
        selected_pumps: yup.array().of(yup.number()),
        pump_readings: yup.array().of(
          yup.object().shape({
            fuel_pump_id: yup.number().required('Fuel Pump is required').typeError('Fuel Pump is required'),
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
            product_id: yup.number().required('Product is required').typeError('Product is required'),
          })
        ),
        fuel_vouchers: yup.array().of(
          yup.object().shape({
            stakeholder_id: yup.number().nullable().typeError('Stakeholder is Required'),
            quantity: yup.number().required('Quantity is required').typeError('Quantity is Required').positive('Quantity must be positive'),
            product_id: yup.number().required('Product is required').typeError('Product is Required'),
            expense_ledger_id: yup.number().nullable().typeError('Expense Ledger is Required'),
            reference: yup.string().nullable(),
            narration: yup.string().nullable(),
          })
        ),
        tank_adjustments: yup.array().of(
          yup.object().shape({
            tank_id: yup.number().nullable().typeError('Tank is Required'),
            quantity: yup.number().required('Quantity is required').typeError('Quantity is Required'),
            operator: yup.string().required('Operator is required'),
            description: yup.string().nullable(),
            product_id: yup.number().required('Product is required').typeError('Product is Required'),
          })
        ),
        other_transactions: yup.array().of(
          yup.object().shape({
            ledger_id: yup.number().required('Ledger is required').typeError('Ledger is Required'),
            amount: yup.number().required('Amount is required').typeError('Amount is Required').positive('Amount must be positive'),
          })
        ),
        main_ledger: yup.object().shape({
          id: yup.number().required('Main Ledger is required').typeError('Main Ledger is Required'),
          amount: yup.number()
            .required('Main Ledger Amount is required')
            .typeError('Main Ledger Amount is Required')
            .positive('Amount must be positive')
        }).nullable(),
        collected_amount: yup
          .number()
          .typeError('Collected Amount is required')
          .when(['$submit_type'], {
            is: (submit_type) => submit_type === 'close',
            then: (schema) => schema.required('Collected Amount is required on close').typeError('Collected Amount is required on close'),
            otherwise: (schema) => schema,
          }),
        collection_ledger_id: yup
          .number()
          .typeError('Collection Ledger is required')
          .when(['$submit_type'], {
            is: (submit_type) => submit_type === 'close',
            then: (schema) => schema.required('Collection Ledger is required on close').typeError('Collection Ledger is required on close'),
            otherwise: (schema) => schema,
          }),
      })
    ).required('At least one cashier is required').min(1, 'At least one cashier is required'),
    dipping_before: yup.array().of(
      yup.object().shape({
        reading: yup.number().required('Reading is required').typeError('Reading must be a number').min(0, 'Reading cannot be negative'),
        product_id: yup.number().required('Product is required').typeError('Product must be a number'),
        tank_id: yup.number().required('Tank is required').typeError('Tank must be a number'),
      })
    ),
    dipping_after: yup.array().of(
      yup.object().shape({
        reading: yup.number().required('Reading is required').typeError('Reading must be a number').min(0, 'Reading cannot be negative'),
        product_id: yup.number().required('Product is required').typeError('Product must be a number'),
        tank_id: yup.number().required('Tank is required').typeError('Tank must be a number'),
      })
    ),
    submit_type: yup.string().oneOf(['suspend', 'close']).required(),
    product_prices: yup.array().of(
      yup.object().shape({
        product_id: yup.number().required('Product is required').typeError('Product is required'),
        price: yup.number().required('Price is required').typeError('Price is required').positive('Price must be positive'),
      })
    ).required('Product prices are required').min(1, 'At least one product price is required'),
  });

  const getDefaultValues = useCallback(() => {
    if (SalesShift) {
      const initialProductPrices = SalesShift.fuel_prices?.map(fp => ({
        product_id: fp.product_id,
        price: fp.price,
      })) || [];
      
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
            stakeholder_id: fv.stakeholder_id || fv.stakeholder?.id,
            stakeholder: fv.stakeholder || null,
            quantity: fv.quantity,
            product_id: fv.product_id,
            expense_ledger: fv.expense_ledger || null,
            expense_ledger_id: fv.expense_ledger_id || fv.expense_ledger?.id,
            reference: fv.reference,
            narration: fv.narration,
          })) || [],
          collected_amount: cashier.collected_amount || 0,
          collection_ledger_id: cashier.collection_ledger_id || null,
          tank_adjustments: cashier.tank_adjustments?.map(adj => ({
            tank_id: adj.tank_id,
            quantity: adj.quantity,
            operator: adj.operator,
            description: adj.description,
            product_id: adj.product_id,
          })) || [],
          other_transactions: cashier.other_transactions?.map(ct => ({
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

  const { register, control, handleSubmit, setError, trigger, clearErrors, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedCashiers = watch('cashiers') || [];

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

  const getPumpOpeningValue = useCallback((pumpId, cashierIndex) => {
    if (SalesShift?.id) {
      const cashier = selectedCashiers[cashierIndex];
      if (cashier?.pump_readings) {
        const savedReading = cashier.pump_readings.find(pr => pr.fuel_pump_id === pumpId);
        return savedReading?.opening || 0;
      }
    }
    
    return lastClosingReadings[pumpId] || 0;
  }, [SalesShift, selectedCashiers, lastClosingReadings]);

  const handlePumpSelection = useCallback((cashierIndex, selectedPumpIds) => {
    const currentCashier = selectedCashiers[cashierIndex];
    if (!currentCashier) return;
    
    setValue(`cashiers.${cashierIndex}.selected_pumps`, selectedPumpIds, {
      shouldValidate: true,
      shouldDirty: true
    });
    
    const currentReadings = currentCashier.pump_readings || [];
    
    let updatedReadings = currentReadings.filter(reading => 
      selectedPumpIds.includes(reading.fuel_pump_id)
    );
    
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
            closing: openingValue,
          });
        }
      }
    });
    
    setValue(`cashiers.${cashierIndex}.pump_readings`, updatedReadings, {
      shouldValidate: true,
      shouldDirty: true
    });
  }, [selectedCashiers, setValue, fuel_pumps, getPumpOpeningValue]);

  const combineDateTime = useCallback((date, timeString) => {
    if (!date || !timeString) return date;
    
    const time = dayjs(timeString, 'HH:mm:ss');
    return dayjs(date)
      .hour(time.hour())
      .minute(time.minute())
      .second(time.second())
      .toISOString();
  }, []);

  const handleShiftChange = useCallback((newValue) => {
    const currentShiftStart = watch('shift_start');
    setValue('sales_outlet_shift_id', newValue ? newValue.id : '', {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (newValue) {
      // Set shift_start if not set or if shift times change
      let selectedDate = currentShiftStart ? dayjs(currentShiftStart) : dayjs().startOf('day');
      let newStartDateTime = newValue.start_time ? combineDateTime(selectedDate, newValue.start_time) : selectedDate.toISOString();
      setValue('shift_start', newStartDateTime, {
        shouldValidate: true,
        shouldDirty: true
      });
      // Always set shift_end automatically
      if (newValue.end_time) {
        const startTime = dayjs(newValue.start_time, 'HH:mm:ss');
        const endTime = dayjs(newValue.end_time, 'HH:mm:ss');
        let endDateTime;
        if (endTime.isBefore(startTime)) {
          endDateTime = dayjs(selectedDate)
            .add(1, 'day')
            .hour(endTime.hour())
            .minute(endTime.minute())
            .second(endTime.second())
            .toISOString();
        } else {
          endDateTime = combineDateTime(selectedDate, newValue.end_time);
        }
        setValue('shift_end', endDateTime, {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }
  }, [setValue, watch, combineDateTime]);

  useEffect(() => {
    if (SalesShift?.cashiers) {
      SalesShift.cashiers.forEach((cashier, index) => {
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

  useEffect(() => {
    const shiftStart = watch('shift_start');
    const currentShiftId = watch('sales_outlet_shift_id');
    const selectedShift = shifts?.find(s => s.id === currentShiftId);
    if (shiftStart && selectedShift && selectedShift.end_time) {
      const startTime = dayjs(selectedShift.start_time, 'HH:mm:ss');
      const endTime = dayjs(selectedShift.end_time, 'HH:mm:ss');
      let endDateTime;
      if (endTime.isBefore(startTime)) {
        endDateTime = dayjs(shiftStart)
          .add(1, 'day')
          .hour(endTime.hour())
          .minute(endTime.minute())
          .second(endTime.second())
          .toISOString();
      } else {
        endDateTime = combineDateTime(shiftStart, selectedShift.end_time);
      }
      setValue('shift_end', endDateTime, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
    if (shiftStart && !SalesShift?.id) {
      retrieveLastShiftReadings();
    }
  }, [watch('shift_start'), watch('sales_outlet_shift_id'), shifts, SalesShift?.id, retrieveLastShiftReadings, setValue, combineDateTime]);

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
          other_transactions: [],
          main_ledger: null,
        };
      })
      .filter(c => c !== null);
    const updatedCashiers = [...selectedCashiers, ...newCashiers];
    setValue('cashiers', updatedCashiers, { shouldValidate: true, shouldDirty: true });
    newCashiers.forEach((cashier, offsetIndex) => {
      const cashierIndex = selectedCashiers.length + offsetIndex;
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

    // Retrieve product prices for the station at a specific date/time
  const retrieveProductPrices = useCallback(async (as_at) => {
    try {
      const product_ids = Array.from(new Set((fuel_pumps || []).map(p => p.product_id)));
      if (!product_ids.length) return;
      const sales_outlet_id = activeStation.id;
      const response = await fuelStationServices.getProductsSellingPrices({ product_ids, sales_outlet_id, as_at });
      let prices = [];
      // Handle array or object keyed by product_id
      if (Array.isArray(response)) {
        prices = response;
      } else if (response && typeof response === 'object' && !Array.isArray(response)) {
        prices = Object.values(response);
      } else if (response && Array.isArray(response.data)) {
        prices = response.data;
      }
      if (prices.length > 0) {
        setValue('product_prices', prices.map(p => ({ product_id: p.product_id, price: p.price })), { shouldValidate: true, shouldDirty: true });
      } else {
        setValue('product_prices', [], { shouldValidate: true, shouldDirty: true });
      }
    } catch (error) {
      setValue('product_prices', [], { shouldValidate: true, shouldDirty: true });
    }
  }, [fuel_pumps, activeStation.id, setValue]);

  const getCashierLedgers = (cashierIndex) => {
    return cashierLedgers[cashierIndex] || [];
  };

  const handleSubmitForm = async (data) => {
      // Prevent if any product is missing a price
      const allProductIds = (activeStation.products || []).map(p => p.id);
      const pricedProductIds = (data.product_prices || []).map(p => p.product_id);
      const missingPriceProducts = allProductIds.filter(pid => !pricedProductIds.includes(pid));
      if (missingPriceProducts.length > 0) {
        const missingNames = (activeStation.products || [])
          .filter(p => missingPriceProducts.includes(p.id))
          .map(p => p.name)
          .join(', ');
        enqueueSnackbar(
          `Cannot proceed: The following products are missing prices: ${missingNames}`,
          { variant: 'error' }
        );
        return;
      }
    if (data.cashiers.length === 0) {
      enqueueSnackbar('Please add at least one cashier', { variant: 'error' });
      return;
    }

    // Prevent submit if any cashier is missing Collected Amount, Collection Ledger, or Main Ledger info
    const cashiersMissingFields = data.cashiers
      .map((cashier, idx) => {
        const missingCollected = cashier.collected_amount === undefined || cashier.collected_amount === null || cashier.collected_amount === '' || isNaN(Number(cashier.collected_amount));
        const missingLedger = cashier.collection_ledger_id === undefined || cashier.collection_ledger_id === null || cashier.collection_ledger_id === '' || isNaN(Number(cashier.collection_ledger_id));
        const missingMainLedger = !cashier.main_ledger || cashier.main_ledger.id === undefined || cashier.main_ledger.id === null || cashier.main_ledger.id === '' || isNaN(Number(cashier.main_ledger.id)) || cashier.main_ledger.amount === undefined || cashier.main_ledger.amount === null || cashier.main_ledger.amount === '' || isNaN(Number(cashier.main_ledger.amount));
        return {
          name: cashier.name,
          missingCollected,
          missingLedger,
          missingMainLedger
        };
      })
      .filter(c => c.missingCollected || c.missingLedger || c.missingMainLedger);
    if (cashiersMissingFields.length > 0) {
      const missingCollected = cashiersMissingFields.filter(c => c.missingCollected).map(c => c.name);
      const missingLedger = cashiersMissingFields.filter(c => c.missingLedger).map(c => c.name);
      const missingMainLedger = cashiersMissingFields.filter(c => c.missingMainLedger).map(c => c.name);
      const messageRows = [];
      if (missingCollected.length > 0) {
        messageRows.push(`Please fill Collected Amount for: ${missingCollected.join(', ')}`);
      }
      if (missingLedger.length > 0) {
        messageRows.push(`Please select Collection Ledger for: ${missingLedger.join(', ')}`);
      }
      if (missingMainLedger.length > 0) {
        messageRows.push(`Please fill Main Ledger information for: ${missingMainLedger.join(', ')}`);
      }
      enqueueSnackbar(
        <div>
          {messageRows.map((msg, idx) => (
            <div key={idx}>{msg}</div>
          ))}
        </div>,
        { variant: 'error' }
      );
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

    data.cashiers = data.cashiers.map(cashier => ({
      ...cashier,
      fuel_vouchers: Array.isArray(cashier.fuel_vouchers)
        ? cashier.fuel_vouchers.map(fuelVoucher => ({
            stakeholder_id: fuelVoucher.stakeholder_id ?? (fuelVoucher.stakeholder?.id ?? null),
            expense_ledger_id: fuelVoucher.expense_ledger_id ?? (fuelVoucher.expense_ledger?.id ?? null),
            product_id: fuelVoucher.product_id,
            quantity: fuelVoucher.quantity,
            amount: fuelVoucher.amount,
            reference: fuelVoucher.reference,
            narration: fuelVoucher.narration,
          })
        )
        : [],
    }));
    data.payments_received = paymentItems;
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
      trigger
    }}>
      <DialogTitle>
        <form autoComplete='off'>    
          <Grid container spacing={1} marginTop={1}>
            <Grid size={12} textAlign={'center'} marginBottom={1}>
              {SalesShift ? `Edit ${SalesShift.shiftNo}` : `New Fuel Sales Shift`}
            </Grid>
            <Grid size={{xs: 12, md: 4, lg: 4}}>
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
                    handleShiftChange(newValue);
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
                  onChange={async (newValue) => {
                    const currentShiftId = watch('sales_outlet_shift_id');
                    const selectedShift = shifts?.find(s => s.id === currentShiftId);
                    let newStartDateTime = newValue ? (selectedShift && selectedShift.start_time ? combineDateTime(newValue, selectedShift.start_time) : newValue.toISOString()) : null;
                    setValue('shift_start', newStartDateTime, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                    // Always recalculate shift_end if possible
                    if (selectedShift && selectedShift.end_time && newValue) {
                      const startTime = dayjs(selectedShift.start_time, 'HH:mm:ss');
                      const endTime = dayjs(selectedShift.end_time, 'HH:mm:ss');
                      let endDateTime;
                      if (endTime.isBefore(startTime)) {
                        endDateTime = dayjs(newValue)
                          .add(1, 'day')
                          .hour(endTime.hour())
                          .minute(endTime.minute())
                          .second(endTime.second())
                          .toISOString();
                      } else {
                        endDateTime = combineDateTime(newValue, selectedShift.end_time);
                      }
                      setValue('shift_end', endDateTime, {
                        shouldValidate: true,
                        shouldDirty: true
                      });
                    }
                    if (newStartDateTime) {
                      await retrieveProductPrices(newStartDateTime);
                    }
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
                      helperText: errors?.shift_end?.message,
                      readOnly: true,
                    }
                  }}
                  readOnly
                  onChange={() => {}}
                />
              </Div>
            </Grid>

            <Grid size={{ xs: 12, md: 4, lg: 4 }}>
              <Typography sx={{ mt: 1, mb: 1 }}>
                Select Cashiers
              </Typography>
              {(() => {
                const cashierOptions = React.useMemo(() => cashiers || [], [cashiers]);
                const cashierValue = React.useMemo(() =>
                  cashierOptions.filter(c => selectedCashiers.some(sc => sc.id === c.id)),
                  [cashierOptions, selectedCashiers]
                );
                const handleCashierChange = React.useCallback((e, selectedValues) => {
                  const selectedIds = selectedValues.map(v => v.id);
                  const currentCashierIds = selectedCashiers.map(c => c.id);
                  const toRemove = currentCashierIds.filter(id => !selectedIds.includes(id));
                  const toAdd = selectedIds.filter(id => !currentCashierIds.includes(id));
                  toRemove.forEach(cashierId => removeCashier(cashierId));
                  if (toAdd.length > 0) {
                    addCashiers(toAdd);
                  }
                }, [selectedCashiers, addCashiers, removeCashier]);
                return (
                  <Autocomplete
                    multiple
                    size="small"
                    options={cashierOptions}
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
                    onChange={handleCashierChange}
                    value={cashierValue}
                  />
                );
              })()}

              {Object.keys(lastClosingReadings).length > 0 && !SalesShift?.id && (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  ✓ Last shift readings loaded for {Object.keys(lastClosingReadings).length} pump(s)
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 12, lg: 8 }}>
              <FuelPrices />
            </Grid>
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
          <Tab label="Payments Received" />
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
                  setValue={setValue}
                  onFuelVouchersChange={(vouchers) => setValue(`cashiers.${index}.fuel_vouchers`, vouchers, { shouldValidate: true, shouldDirty: true })}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 1 && (
          <>
            <PaymentsReceived
              paymentItems={paymentItems}
              setPaymentItems={setPaymentItems}
              showWarning={showWarning}
              setShowWarning={setShowWarning}
              isDirty={isDirty}
              setIsDirty={setIsDirty}
              clearFormKey={clearFormKey}
              setClearFormKey={setClearFormKey}
              submitItemForm={submitItemForm}
              setSubmitItemForm={setSubmitItemForm}
            />
            {paymentItems.length === 0 ? (
              <Typography color="textSecondary" textAlign="center" py={4}>
                No payments received yet.
              </Typography>
            ) : (
              paymentItems.map((paymentItem, idx) => (
                <PaymentsReceivedItemRow
                  key={idx}
                  item={paymentItem}
                  index={idx}
                  paymentItems={paymentItems}
                  setPaymentItems={setPaymentItems}
                  setClearFormKey={setClearFormKey}
                  submitMainForm={() => {}}
                  setSubmitItemForm={setSubmitItemForm}
                  submitItemForm={submitItemForm}
                  setIsDirty={setIsDirty}
                  showWarning={showWarning}
                  setShowWarning={setShowWarning}
                  clearFormKey={clearFormKey}
                />
              ))
            )}
          </>
        )}

        {activeTab === 2 && <Dipping SalesShift={SalesShift} />}

        {activeTab === 3 && (
          <ShiftSummary paymentItems={paymentItems} />
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
        
        {activeTab < 3 && (
          <Button 
            size='small' 
            variant='outlined' 
            onClick={() => setActiveTab(activeTab + 1)}
            endIcon={<KeyboardArrowRightOutlined />}
          >
            Next
          </Button>
        )}
        
        {activeTab === 3 && (
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
              Suspend
            </LoadingButton>
            
            {
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
                Close
              </LoadingButton>
            )}
          </>
        )}
      </DialogActions>
    </FormProvider>
  );
}

export default SaleShiftForm;