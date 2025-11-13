"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  TextField,
  Button,
  Alert,
  Autocomplete,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import dayjs, { Dayjs } from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useSalesStation } from '../Stations/StationProvider';
import { SalesShift } from './SalesShiftType';
import salesShiftServices from './salesShift-services';
import SalesShiftTabs from './tabs/SalesShiftTabs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface SalesShiftFormProps {
  toggleOpen: (open: boolean) => void;
  salesShift?: SalesShift;
  isClosing?: boolean;
  open: boolean;
}

// Add these interfaces for adjustments and fuel vouchers
interface AdjustmentData {
  id?: number;
  product_id?: number;
  product?: any;
  tank_id?: number;
  quantity?: number;
  description?: string;
  operator?: string;
  operator_name?: string;
  [key: string]: any;
}

interface FuelVoucherData {
  id?: number;
  product_id?: number;
  quantity?: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder?: any | null;
  stakeholder_id?: number | null;
  expense_ledger?: any | null;
  expense_ledger_id?: number | null;
  product?: any | null;
}

interface SalesShiftFormData {
  shift_team_id: string;
  shift_start: string;
  shift_end: string | null;
  pump_readings: Array<{
    pump_id: number;
    product_id: number | null;
    tank_id: number | null;
    opening: number;
    closing: number;
  }>;
  fuel_vouchers: Array<any>;
  dipping_readings: Array<any>;
  adjustments: Array<any>;
  cash_reconciliation: any;
  submit_type: 'open' | 'close';
  product_prices: Array<{
    product_id: number;
    price: number;
  }>;
}

const SalesShiftForm: React.FC<SalesShiftFormProps> = ({
  toggleOpen,
  salesShift,
  isClosing = false,
  open
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authUser } = useJumboAuth();
  const { activeStation } = useSalesStation();
  const [activeTab, setActiveTab] = useState(0);

  // ✅ ADD RESPONSIVE HOOKS
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const shiftTeams = activeStation?.shift_teams || [];
  const fuelPumps = activeStation?.fuel_pumps || [];
  const products = activeStation?.product || [];
  const tanks = (activeStation as any)?.tanks || [];

  // ✅ ADD THE MISSING STATE HERE
  const [adjustments, setAdjustments] = useState<AdjustmentData[]>(salesShift?.adjustments || []);
  const [fuelVouchers, setFuelVouchers] = useState<FuelVoucherData[]>(salesShift?.fuel_vouchers || []);

  const methods = useForm<SalesShiftFormData>({
    defaultValues: {
      shift_team_id: String(salesShift?.shift_team_id ?? ''),
      shift_start: salesShift?.shift_start || dayjs().toISOString(),
      shift_end: salesShift?.shift_end || null,
      pump_readings: salesShift?.pump_readings || fuelPumps.map(pump => ({
        pump_id: pump.id,
        product_id: pump.product?.id || null,
        tank_id: pump.tank?.id || null,
        opening: 0,
        closing: 0
      })),
      fuel_vouchers: salesShift?.fuel_vouchers || [],
      adjustments: salesShift?.adjustments || [],
      submit_type: isClosing ? 'close' : 'open',
      product_prices: salesShift?.product_prices || []
    }
  });

  const { watch, setValue, handleSubmit, formState: { isSubmitting, errors } } = methods;

  // Watch form values
  const formValues = watch();

  const { mutate: createSalesShift, isPending: isCreating } = useMutation({
    mutationFn: salesShiftServices.createSalesShift,
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message || 'Failed to create sales shift', { variant: 'error' });
    },
  });

  const { mutate: updateSalesShift, isPending: isUpdating } = useMutation({
    mutationFn: (data: any) => salesShiftServices.updateSalesShift(salesShift!.id!, data),
    onSuccess: (data: { message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
      enqueueSnackbar(data.message, { variant: 'success' });
      toggleOpen(false);
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.response?.data.message || 'Failed to update sales shift', { variant: 'error' });
    },
  });

  const isPending = isCreating || isUpdating || isSubmitting;

  // Handle tab change
  const handleTabChange = (newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle next button click
  const handleNext = () => {
    if (activeTab < 4) {
      setActiveTab(activeTab + 1);
    }
  };

  // Handle previous button click
  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const onSubmit = (data: SalesShiftFormData) => {
    if (data.shift_end && dayjs(data.shift_end).isBefore(dayjs(data.shift_start))) {
      enqueueSnackbar('Shift end cannot be before shift start', { variant: 'error' });
      return;
    }

    if (!data.shift_team_id || !data.shift_start) {
      enqueueSnackbar('Shift team and shift start are required', { variant: 'error' });
      return;
    }

    // ✅ INCLUDE ADJUSTMENTS AND FUEL VOUCHERS IN SUBMISSION
    const submitData = {
      ...data,
      station_id: activeStation?.id,
      shift_start: dayjs(data.shift_start).toISOString(),
      shift_end: data.shift_end ? dayjs(data.shift_end).toISOString() : null,
      adjustments: adjustments, // Include adjustments from state
      fuel_vouchers: fuelVouchers, // Include fuel vouchers from state
    };

    if (salesShift) {
      updateSalesShift(submitData);
    } else {
      createSalesShift(submitData as any);
    }
  };

  // ✅ Reset form and tabs when dialog closes
  React.useEffect(() => {
    if (!open) {
      setActiveTab(0);
      methods.reset();
      // Also reset adjustments and fuel vouchers
      setAdjustments([]);
      setFuelVouchers([]);
    }
  }, [open, methods]);

  // ✅ CREATE THE ENHANCED FORM CONTEXT
  const formContextValue = {
    ...methods,
    // Provide the state and setters to all child components
    adjustments,
    setAdjustments,
    fuelVouchers, 
    setFuelVouchers,
    products,
    tanks,
    fuel_pumps: fuelPumps,
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => toggleOpen(false)} 
      maxWidth="lg" 
      fullWidth
      // ✅ MAKE IT FULLSCREEN ON SMALL DEVICES
      fullScreen={isSmallScreen}
      PaperProps={{
        sx: { 
          maxHeight: isSmallScreen ? '100vh' : '90vh',
          // ✅ IMPROVE MOBILE LAYOUT
          ...(isSmallScreen && {
            m: 0,
            borderRadius: 0
          })
        }
      }}
    >
      {/* ✅ USE THE ENHANCED FORM CONTEXT */}
      <FormProvider {...formContextValue}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          
          {/* DIALOG TITLE - Contains Shift Team info and Tabs */}
          <DialogTitle sx={{ p: isSmallScreen ? 1 : 1 }}>
            <Paper elevation={1} sx={{ p: isSmallScreen ? 1 : 1 }}>
              <Typography variant={isSmallScreen ? "h6" : "h5"} gutterBottom align="center">
                Fuel Sales Shift
              </Typography>

              {/* Header Fields and Tabs in Dialog Title */}
              <Grid container spacing={1.5} sx={{ mb: 0 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Autocomplete
                    options={shiftTeams}
                    getOptionLabel={(option) => option.name || `Team ${option.id}`}
                    value={shiftTeams.find(team => String(team.id) === formValues.shift_team_id) || null}
                    onChange={(event, newValue) => {
                      setValue('shift_team_id', String(newValue?.id ?? ''));
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Shift Team" 
                        size="small" 
                        fullWidth 
                        required
                        error={!!errors.shift_team_id}
                        helperText={errors.shift_team_id?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DateTimePicker
                    label="Shift Start"
                    value={dayjs(formValues.shift_start)}
                    onChange={(value: Dayjs | null) => 
                      setValue('shift_start', value?.toISOString() || '')
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        required: true,
                        error: !!errors.shift_start,
                        helperText: errors.shift_start?.message,
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DateTimePicker
                    label="Shift End"
                    value={formValues.shift_end ? dayjs(formValues.shift_end) : null}
                    minDateTime={dayjs(formValues.shift_start)}
                    onChange={(value: Dayjs | null) => 
                      setValue('shift_end', value?.toISOString() || null)
                    }
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        error: !!errors.shift_end,
                        helperText: errors.shift_end?.message,
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Tabs in Dialog Title */}
              <SalesShiftTabs
                salesShift={salesShift}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isClosing={isClosing}
                showTabsOnly={true}
              />
            </Paper>
          </DialogTitle>

          {/* DIALOG CONTENT - Contains Tab Contents */}
          <DialogContent sx={{ 
            p: 0, 
            maxHeight: isSmallScreen ? 'calc(100vh - 200px)' : '50vh', 
            overflow: 'auto',
            // ✅ IMPROVE MOBILE SCROLLING
            ...(isSmallScreen && {
              maxHeight: 'calc(100vh - 180px)',
              WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
            })
          }}>
            <Box sx={{ p: isSmallScreen ? 1 : 2 }}>
              <SalesShiftTabs
                salesShift={salesShift}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isClosing={isClosing}
                showContentOnly={true}
              />
            </Box>
          </DialogContent>

          {/* DIALOG ACTIONS - Contains Navigation and Submit Buttons */}
          <DialogActions sx={{ p: 0 }}>
            <Paper elevation={1} sx={{ 
              p: isSmallScreen ? 1 : 1.5, 
              width: '100%',
              // ✅ STICKY FOOTER ON MOBILE
              ...(isSmallScreen && {
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1
              })
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: isSmallScreen ? 'column' : 'row',
                gap: isSmallScreen ? 1 : 0
              }}>
                {/* Previous Button */}
                <Box sx={{
                  width: isSmallScreen ? '100%' : 'auto',
                  order: isSmallScreen ? 2 : 1
                }}>
                  {activeTab > 0 && (
                    <Button 
                      onClick={handlePrevious}
                      variant="outlined"
                      size="small"
                      startIcon={<ArrowBackIcon />}
                      disabled={isPending}
                      fullWidth={isSmallScreen}
                    >
                      Previous
                    </Button>
                  )}
                </Box>

                {/* Cancel and Next/Submit Buttons Grouped Together */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1,
                  width: isSmallScreen ? '100%' : 'auto',
                  order: isSmallScreen ? 1 : 2
                }}>
                  <Button 
                    onClick={() => toggleOpen(false)}
                    variant="outlined"
                    size="small"
                    disabled={isPending}
                    fullWidth={isSmallScreen}
                  >
                    Cancel
                  </Button>

                  {activeTab < 4 ? (
                    <Button 
                      onClick={handleNext}
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      disabled={isPending}
                      fullWidth={isSmallScreen}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={isPending || !formValues.shift_team_id || !formValues.shift_start}
                      fullWidth={isSmallScreen}
                    >
                      {salesShift ? 'Update' : 'Create'} Shift
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </DialogActions>
        </Box>
      </FormProvider>
    </Dialog>
  );
};

export default SalesShiftForm;