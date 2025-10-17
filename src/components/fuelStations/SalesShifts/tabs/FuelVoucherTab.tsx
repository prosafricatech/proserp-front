"use client";

import React from "react";
import {
  Grid,
  TextField,
  Button,
  IconButton,
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Divider
} from "@mui/material";
import { Add, Delete, Receipt } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StakeholderSelector from "@/components/masters/stakeholders/StakeholderSelector";
import ProductSelect from "@/components/productAndServices/products/ProductSelect";
import LedgerSelect from "@/components/accounts/ledgers/forms/LedgerSelect";
import { useSalesStation } from "../../Stations/StationProvider";

interface FuelVoucherTabProps {
  salesShift?: any;
}

interface FuelVoucher {
  id?: number;
  voucher_number: string;
  stakeholder_id: number | null;
  stakeholder_name?: string;
  product_id: number | null;
  quantity: number;
  price: number;
  total_amount: number;
  vehicle_number: string;
  purpose: string;
  reference: string;
  issued_by: string;
  issued_date: string;
  status: 'issued' | 'used' | 'cancelled';
  expense_ledger_id?: number | null;
}

const VOUCHER_PURPOSES = [
  'Company Vehicle',
  'Staff Fuel',
  'Customer Credit',
  'Promotional',
  'Maintenance',
  'Other'
];

const VOUCHER_STATUSES = [
  { value: 'issued', label: 'Issued' },
  { value: 'used', label: 'Used' },
  { value: 'cancelled', label: 'Cancelled' }
];

const FuelVoucherTab: React.FC<FuelVoucherTabProps> = ({ salesShift }) => {
  const { control, watch, setValue, formState: { errors } } = useFormContext();
  const { activeStation } = useSalesStation();
  const { authUser } = useJumboAuth();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fuel_vouchers"
  });

  const fuelVouchers = watch("fuel_vouchers") || [];

  // Calculate totals
  const calculateTotals = () => {
    const totals = fuelVouchers.reduce((acc: any, voucher: FuelVoucher) => {
      if (voucher.status !== 'cancelled') {
        return {
          totalQuantity: acc.totalQuantity + (voucher.quantity || 0),
          totalAmount: acc.totalAmount + (voucher.total_amount || 0),
          totalVouchers: acc.totalVouchers + 1
        };
      }
      return acc;
    }, { totalQuantity: 0, totalAmount: 0, totalVouchers: 0 });

    return totals;
  };

  const { totalQuantity, totalAmount, totalVouchers } = calculateTotals();

  // Generate voucher number
  const generateVoucherNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `VOU-${timestamp}-${random}`;
  };

  const getFieldError = (index: number, fieldName: string) => {
    return (errors as any)?.fuel_vouchers?.[index]?.[fieldName];
  };

  const handleAddVoucher = () => {
    const newVoucher: Partial<FuelVoucher> = {
      voucher_number: generateVoucherNumber(),
      stakeholder_id: null,
      product_id: null,
      quantity: 0,
      price: 0,
      total_amount: 0,
      vehicle_number: '',
      purpose: 'Company Vehicle',
      reference: '',
      issued_by: authUser?.name || '',
      issued_date: new Date().toISOString().split('T')[0],
      status: 'issued'
    };
    
    append(newVoucher);
  };

  // Calculate total amount when quantity or price changes
  const updateTotalAmount = (index: number) => {
    const voucher = fuelVouchers[index];
    if (voucher) {
      const total = (voucher.quantity || 0) * (voucher.price || 0);
      setValue(`fuel_vouchers.${index}.total_amount`, total);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ backgroundColor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary.main" gutterBottom>
                Total Vouchers
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalVouchers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'success.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" gutterBottom>
                Total Quantity
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalQuantity.toLocaleString()}L
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'warning.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ backgroundColor: 'info.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" gutterBottom>
                Active Vouchers
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {fuelVouchers.filter((v: FuelVoucher) => v.status === 'issued').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vouchers List */}
      <Box sx={{ mb: 3 }}>
        {fields.map((field, index) => (
          <Card 
            key={field.id} 
            sx={{ 
              mb: 3, 
              border: '2px solid', 
              borderColor: getVoucherStatusColor(fuelVouchers[index]?.status),
              '&:hover': {
                boxShadow: 3,
              }
            }}
          >
            <CardContent>
              {/* Voucher Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    {fuelVouchers[index]?.voucher_number || 'VOU-XXXX'}
                  </Typography>
                  <Box 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1, 
                      backgroundColor: getVoucherStatusColor(fuelVouchers[index]?.status),
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {fuelVouchers[index]?.status?.toUpperCase() || 'ISSUED'}
                  </Box>
                </Box>
                
                <IconButton
                  onClick={() => remove(index)}
                  color="error"
                  size="small"
                >
                  <Delete />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                {/* Stakeholder */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.stakeholder_id`}
                    control={control}
                    render={({ field }) => (
                      <StakeholderSelector
                        label="Customer/Stakeholder"
                        value={field.value}
                        onChange={(newValue) => {
                          field.onChange(newValue?.id || null);
                          if (newValue) {
                            setValue(`fuel_vouchers.${index}.stakeholder_name`, newValue.name);
                          }
                        }}
                        frontError={getFieldError(index, "stakeholder_id")}
                      />
                    )}
                  />
                </Grid>

                {/* Product */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.product_id`}
                    control={control}
                    render={({ field }) => (
                      <ProductSelect
                        label="Fuel Product"
                        value={field.value}
                        onChange={(newValue) => {
                          field.onChange(newValue?.id || null);
                          // You can set default price here if needed
                        }}
                        frontError={getFieldError(index, "product_id")}
                      />
                    )}
                  />
                </Grid>

                {/* Quantity and Price */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.quantity`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Quantity (L)"
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.1 }}
                        error={!!getFieldError(index, "quantity")}
                        helperText={getFieldError(index, "quantity")?.message}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          updateTotalAmount(index);
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.price`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Price per Liter"
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        error={!!getFieldError(index, "price")}
                        helperText={getFieldError(index, "price")?.message}
                        onChange={(e) => {
                          field.onChange(parseFloat(e.target.value) || 0);
                          updateTotalAmount(index);
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.total_amount`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Total Amount"
                        type="number"
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            backgroundColor: 'grey.50',
                            fontWeight: 'bold'
                          } 
                        }}
                        value={field.value || 0}
                      />
                    )}
                  />
                </Grid>

                {/* Vehicle and Purpose */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.vehicle_number`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Vehicle Number"
                        size="small"
                        placeholder="e.g., ABC-123"
                        error={!!getFieldError(index, "vehicle_number")}
                        helperText={getFieldError(index, "vehicle_number")?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.purpose`}
                    control={control}
                    defaultValue="Company Vehicle"
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Purpose</InputLabel>
                        <Select
                          {...field}
                          label="Purpose"
                          error={!!getFieldError(index, "purpose")}
                        >
                          {VOUCHER_PURPOSES.map(purpose => (
                            <MenuItem key={purpose} value={purpose}>
                              {purpose}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Reference and Status */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.reference`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Reference"
                        size="small"
                        placeholder="Optional reference"
                        error={!!getFieldError(index, "reference")}
                        helperText={getFieldError(index, "reference")?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.status`}
                    control={control}
                    defaultValue="issued"
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          {...field}
                          label="Status"
                          error={!!getFieldError(index, "status")}
                        >
                          {VOUCHER_STATUSES.map(status => (
                            <MenuItem key={status.value} value={status.value}>
                              {status.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Expense Ledger (if no stakeholder) */}
                {!fuelVouchers[index]?.stakeholder_id && (
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name={`fuel_vouchers.${index}.expense_ledger_id`}
                      control={control}
                      render={({ field }) => (
                        <LedgerSelect
                          label="Expense Ledger"
                          value={field.value}
                          onChange={(newValue) => {
                            field.onChange(newValue?.id || null);
                          }}
                          frontError={getFieldError(index, "expense_ledger_id")}
                        />
                      )}
                    />
                  </Grid>
                )}

                {/* Issued Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.issued_by`}
                    control={control}
                    defaultValue={authUser?.name || ''}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Issued By"
                        size="small"
                        InputProps={{ readOnly: true }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name={`fuel_vouchers.${index}.issued_date`}
                    control={control}
                    defaultValue={new Date().toISOString().split('T')[0]}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Issued Date"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        {fields.length === 0 && (
          <Card sx={{ textAlign: 'center', py: 6, backgroundColor: 'grey.50' }}>
            <CardContent>
              <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Fuel Vouchers
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Click "Add Fuel Voucher" to issue new fuel vouchers to customers or for internal use.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Box>
          <Typography variant="body2" color="textSecondary">
            Total Vouchers: {fields.length} | Active: {fuelVouchers.filter((v: FuelVoucher) => v.status === 'issued').length}
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          size="medium"
          startIcon={<Add />}
          onClick={handleAddVoucher}
        >
          Add Fuel Voucher
        </Button>
      </Box>

      {/* Quick Help */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Fuel Vouchers</strong> are used to track fuel issued to customers, company vehicles, or for specific purposes. 
          Each voucher automatically calculates the total amount based on quantity and price.
        </Typography>
      </Alert>
    </Box>
  );
};

// Helper function to get voucher status color
const getVoucherStatusColor = (status: string) => {
  switch (status) {
    case 'issued': return 'primary.main';
    case 'used': return 'success.main';
    case 'cancelled': return 'error.main';
    default: return 'grey.500';
  }
};

export default FuelVoucherTab;