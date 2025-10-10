import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useSalesStation } from '../Stations/StationProvider';
import ProductsSelectProvider from '@/components/productAndServices/products/ProductsSelectProvider';
import ProductSelect from '@/components/productAndServices/products/ProductSelect';
import StakeholderSelectProvider from '@/components/masters/stakeholders/StakeholderSelectProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import LedgerSelectProvider from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { SalesShift } from './SalesShiftType';
import salesShiftServices from './salesShift-services';

interface SalesShiftFormProps {
  toggleOpen: (open: boolean) => void;
  salesShift?: SalesShift;
  isClosing?: boolean;
}

interface ProductPrice {
  product_id: number;
  price: number;
  product?: any;
}

interface PumpReading {
  pump_id: number;
  product_id: number | null;
  tank_id: number | null;
  opening: number;
  closing: number;
}

interface FuelVoucher {
  stakeholder_id: number | null;
  reference?: string;
  narration?: string;
  product_id: number;
  quantity: number;
  expense_ledger_id?: number | null;
}

interface LedgerAmount {
  id: number;
  amount: number;
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
  const [activeStep, setActiveStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    shift_team_id: salesShift?.shift_team_id || '',
    shift_start: salesShift?.shift_start || dayjs().toISOString(),
    shift_end: salesShift?.shift_end || null,
    product_prices: salesShift?.product_prices || [] as ProductPrice[],
    pump_readings: salesShift?.pump_readings || [] as PumpReading[],
    fuel_vouchers: salesShift?.fuel_vouchers || [] as FuelVoucher[],
    main_ledger: salesShift?.main_ledger || { id: '', amount: 0 },
    other_ledgers: salesShift?.other_ledgers || [] as LedgerAmount[],
    submit_type: isClosing ? 'close' : 'open'
  });

  const steps = [
    'Basic Information',
    'Product Prices',
    'Pump Readings',
    'Fuel Vouchers',
    'Financial Summary'
  ];

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

  const isPending = isCreating || isUpdating;

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      station_id: activeStation?.id,
      shift_start: dayjs(formData.shift_start).toISOString(),
      shift_end: formData.shift_end ? dayjs(formData.shift_end).toISOString() : null,
    };

    if (salesShift) {
      updateSalesShift(submitData);
    } else {
      createSalesShift(submitData);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Add product price
  const addProductPrice = () => {
    setFormData(prev => ({
      ...prev,
      product_prices: [...prev.product_prices, { product_id: 0, price: 0 }]
    }));
  };

  // Update product price
  const updateProductPrice = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      product_prices: prev.product_prices.map((price, i) =>
        i === index ? { ...price, [field]: value } : price
      )
    }));
  };

  // Add pump reading
  const addPumpReading = () => {
    setFormData(prev => ({
      ...prev,
      pump_readings: [...prev.pump_readings, {
        pump_id: 0,
        product_id: null,
        tank_id: null,
        opening: 0,
        closing: 0
      }]
    }));
  };

  // Update pump reading
  const updatePumpReading = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      pump_readings: prev.pump_readings.map((reading, i) =>
        i === index ? { ...reading, [field]: value } : reading
      )
    }));
  };

  // Add fuel voucher
  const addFuelVoucher = () => {
    setFormData(prev => ({
      ...prev,
      fuel_vouchers: [...prev.fuel_vouchers, {
        stakeholder_id: null,
        product_id: 0,
        quantity: 0,
        reference: '',
        narration: ''
      }]
    }));
  };

  // Update fuel voucher
  const updateFuelVoucher = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fuel_vouchers: prev.fuel_vouchers.map((voucher, i) =>
        i === index ? { ...voucher, [field]: value } : voucher
      )
    }));
  };

  // Add other ledger
  const addOtherLedger = () => {
    setFormData(prev => ({
      ...prev,
      other_ledgers: [...prev.other_ledgers, { id: 0, amount: 0 }]
    }));
  };

  // Update other ledger
  const updateOtherLedger = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      other_ledgers: prev.other_ledgers.map((ledger, i) =>
        i === index ? { ...ledger, [field]: value } : ledger
      )
    }));
  };

  if (isPending) {
    return <LinearProgress />;
  }

  return (
    <ProductsSelectProvider>
      <StakeholderSelectProvider type="customers">
        <LedgerSelectProvider>
          <Box p={3}>
            <Typography variant="h4" gutterBottom>
              {isClosing ? 'Close Sales Shift' : salesShift ? 'Edit Sales Shift' : 'New Sales Shift'}
            </Typography>

            {activeStation && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Station: {activeStation.name}
              </Alert>
            )}

            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Step 1: Basic Information */}
              <Step>
                <StepLabel>Basic Information</StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Shift Team ID"
                        value={formData.shift_team_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, shift_team_id: e.target.value }))}
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DateTimePicker
                        label="Shift Start"
                        value={dayjs(formData.shift_start)}
                        onChange={(value: Dayjs | null) => 
                          setFormData(prev => ({ ...prev, shift_start: value?.toISOString() || '' }))
                        }
                        slotProps={{
                          textField: {
                            size: 'small',
                            fullWidth: true,
                          }
                        }}
                      />
                    </Grid>
                    {isClosing && (
                      <Grid size={{ xs: 12, md: 6 }}>
                        <DateTimePicker
                          label="Shift End"
                          value={formData.shift_end ? dayjs(formData.shift_end) : null}
                          onChange={(value: Dayjs | null) => 
                            setFormData(prev => ({ ...prev, shift_end: value?.toISOString() || null }))
                          }
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Product Prices */}
              <Step>
                <StepLabel>Product Prices</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Set current prices for products
                  </Typography>
                  
                  {formData.product_prices.map((price, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <ProductSelect
                              value={price.product_id}
                              onChange={(newValue) => updateProductPrice(index, 'product_id', newValue?.id || 0)}
                              label="Product"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Price"
                              type="number"
                              value={price.price}
                              onChange={(e) => updateProductPrice(index, 'price', parseFloat(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outlined" onClick={addProductPrice} sx={{ mb: 2 }}>
                    Add Product Price
                  </Button>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Pump Readings */}
              <Step>
                <StepLabel>Pump Readings</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Record pump opening and closing readings
                  </Typography>
                  
                  {formData.pump_readings.map((reading, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Pump ID"
                              type="number"
                              value={reading.pump_id}
                              onChange={(e) => updatePumpReading(index, 'pump_id', parseInt(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Opening Reading"
                              type="number"
                              value={reading.opening}
                              onChange={(e) => updatePumpReading(index, 'opening', parseInt(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Closing Reading"
                              type="number"
                              value={reading.closing}
                              onChange={(e) => updatePumpReading(index, 'closing', parseInt(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outlined" onClick={addPumpReading} sx={{ mb: 2 }}>
                    Add Pump Reading
                  </Button>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 4: Fuel Vouchers */}
              <Step>
                <StepLabel>Fuel Vouchers</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Record fuel vouchers and expenses
                  </Typography>
                  
                  {formData.fuel_vouchers.map((voucher, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <StakeholderSelector
                              value={voucher.stakeholder_id}
                              onChange={(newValue) => updateFuelVoucher(index, 'stakeholder_id', newValue?.id || null)}
                              label="Customer"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <ProductSelect
                              value={voucher.product_id}
                              onChange={(newValue) => updateFuelVoucher(index, 'product_id', newValue?.id || 0)}
                              label="Product"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Quantity"
                              type="number"
                              value={voucher.quantity}
                              onChange={(e) => updateFuelVoucher(index, 'quantity', parseFloat(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Reference"
                              value={voucher.reference || ''}
                              onChange={(e) => updateFuelVoucher(index, 'reference', e.target.value)}
                              size="small"
                            />
                          </Grid>
                          {!voucher.stakeholder_id && (
                            <Grid size={{ xs: 12 }}>
                              <LedgerSelectProvider
                                value={voucher.expense_ledger_id}
                                onChange={(newValue) => updateFuelVoucher(index, 'expense_ledger_id', newValue?.id || null)}
                                label="Expense Ledger"
                              />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outlined" onClick={addFuelVoucher} sx={{ mb: 2 }}>
                    Add Fuel Voucher
                  </Button>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 5: Financial Summary */}
              <Step>
                <StepLabel>Financial Summary</StepLabel>
                <StepContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <LedgerSelector
                        value={formData.main_ledger.id}
                        onChange={(newValue) => setFormData(prev => ({
                          ...prev,
                          main_ledger: { ...prev.main_ledger, id: newValue?.id || 0 }
                        }))}
                        label="Main Ledger"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Main Ledger Amount"
                        type="number"
                        value={formData.main_ledger.amount}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          main_ledger: { ...prev.main_ledger, amount: parseFloat(e.target.value) || 0 }
                        }))}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    Other Ledgers
                  </Typography>
                  
                  {formData.other_ledgers.map((ledger, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <LedgerSelector
                              value={ledger.id}
                              onChange={(newValue) => updateOtherLedger(index, 'id', newValue?.id || 0)}
                              label="Ledger"
                            />
                          </Grid>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                              fullWidth
                              label="Amount"
                              type="number"
                              value={ledger.amount}
                              onChange={(e) => updateOtherLedger(index, 'amount', parseFloat(e.target.value) || 0)}
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button variant="outlined" onClick={addOtherLedger} sx={{ mb: 2 }}>
                    Add Other Ledger
                  </Button>
                  
                  <Box sx={{ mb: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Back
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                      {salesShift ? 'Update' : 'Create'} Sales Shift
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>

            {activeStep === steps.length && (
              <Paper square elevation={0} sx={{ p: 3 }}>
                <Typography>All steps completed - you&apos;re finished</Typography>
                <Button onClick={handleSubmit} sx={{ mt: 1, mr: 1 }}>
                  {salesShift ? 'Update' : 'Create'} Sales Shift
                </Button>
              </Paper>
            )}
          </Box>
        </LedgerSelectProvider>
      </StakeholderSelectProvider>
    </ProductsSelectProvider>
  );
};

export default SalesShiftForm;