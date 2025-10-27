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
  Paper
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
}

// Update the SalesShiftFormData interface
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
  product_prices: Array<{  // Add this
    product_id: number;
    price: number;
  }>;
}

const SalesShiftForm: React.FC<SalesShiftFormProps> = ({
  toggleOpen,
  salesShift,
  isClosing = false
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { authUser } = useJumboAuth();
  const { activeStation } = useSalesStation();
  const [activeTab, setActiveTab] = useState(0);

  const shiftTeams = activeStation?.shift_teams || [];
  const fuelPumps = activeStation?.fuel_pumps || [];

  // In the useForm initialization, add product_prices to defaultValues
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
    submit_type: isClosing ? 'close' : 'open',
    product_prices: salesShift?.product_prices || []  // Add this
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

    const submitData = {
      ...data,
      station_id: activeStation?.id,
      shift_start: dayjs(data.shift_start).toISOString(),
      shift_end: data.shift_end ? dayjs(data.shift_end).toISOString() : null,
    };

    if (salesShift) {
      updateSalesShift(submitData);
    } else {
      createSalesShift(submitData as any);
    }
  };

  if (isPending) {
    return <LinearProgress />;
  }

  // Get tab names for display
  const tabNames = ['Pump Reading', 'Fuel Voucher', 'Dipping', 'Adjustments', 'Cash Reconciliation'];

  return (
    <FormProvider {...methods}>
      <Box 
        component="form" 
        onSubmit={handleSubmit(onSubmit)}
        sx={{ 
          maxHeight: '90vh',
          overflow: 'auto',
          p: 1.5
        }}
      >
        {/* Header Section - More Compact */}
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom align="center">
            Fuel Sales Shift
          </Typography>
          {/* Current Tab Indicator - Smaller */}
          <Box sx={{ mb: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="primary.main" fontWeight="bold">
              Step {activeTab + 1} of 5: {tabNames[activeTab]}
            </Typography>
          </Box>

          {/* Header Fields - More Compact */}
          <Grid container spacing={1.5}>
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
          
        </Paper>

        {/* Tabs Section - Reduced Height */}
        <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
          <SalesShiftTabs
            salesShift={salesShift}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isClosing={isClosing}
          />
        </Box>

        {/* Action Buttons - More Compact */}
        <Paper elevation={1} sx={{ p: 1.5, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Previous Button */}
            <Box>
              {activeTab > 0 && (
                <Button 
                  onClick={handlePrevious}
                  variant="outlined"
                  size="small"
                  startIcon={<ArrowBackIcon />}
                  disabled={isPending}
                >
                  Previous
                </Button>
              )}
            </Box>

            {/* Cancel Button */}
            <Button 
              onClick={() => toggleOpen(false)}
              variant="outlined"
              size="small"
              disabled={isPending}
            >
              Cancel
            </Button>

            {/* Next/Submit Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {activeTab < 4 ? (
                <Button 
                  onClick={handleNext}
                  variant="contained"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  disabled={isPending}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={isPending || !formValues.shift_team_id || !formValues.shift_start}
                >
                  {salesShift ? 'Update' : 'Create'} Shift
                </Button>
              )}
            </Box>
          </Box>

          {/* Progress Indicator - Smaller */}
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {tabNames.map((tabName, index) => (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: index === activeTab 
                        ? 'primary.main' 
                        : index < activeTab 
                          ? 'success.main' 
                          : 'grey.400',
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.6rem',
                      fontWeight: index === activeTab ? 'bold' : 'normal',
                      color: index === activeTab ? 'primary.main' : 'text.secondary',
                      textAlign: 'center',
                      lineHeight: 1
                    }}
                  >
                    {tabName.split(' ')[0]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    </FormProvider>
  );
};

export default SalesShiftForm;