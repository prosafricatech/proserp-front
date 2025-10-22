"use client";

import React, { useState } from "react";
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
  Select
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from "@/utilities/constants/permissions";
import { useSalesStation } from "../../Stations/StationProvider";

interface AdjustmentsTabProps {
  salesShift?: any;
}

interface AdjustmentItem {
  id?: number;
  adjustment_type: 'addition' | 'deduction';
  amount: number;
  reason: string;
  reference?: string;
  approved_by?: string;
}

const ADJUSTMENT_TYPES = [
  { value: 'addition', label: 'Addition' },
  { value: 'deduction', label: 'Deduction' }
];

const AdjustmentsTab: React.FC<AdjustmentsTabProps> = ({ salesShift }) => {
  const { control, formState: { errors } } = useFormContext();
  const { activeStation } = useSalesStation();
  const { authUser } = useJumboAuth();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: "adjustments"
  });

  const canCreateOrEdit = true; // You can add permission checks here

  // Calculate totals
  const calculateTotals = () => {
    const adjustments = fields as unknown as AdjustmentItem[];
    const additions = adjustments
      .filter(adj => adj.adjustment_type === 'addition')
      .reduce((sum, adj) => sum + (adj.amount || 0), 0);
    
    const deductions = adjustments
      .filter(adj => adj.adjustment_type === 'deduction')
      .reduce((sum, adj) => sum + (adj.amount || 0), 0);
    
    const netAdjustment = additions - deductions;
    
    return { additions, deductions, netAdjustment };
  };

  const { additions, deductions, netAdjustment } = calculateTotals();

  const getFieldError = (index: number, fieldName: string) => {
    return (errors as any)?.adjustments?.[index]?.[fieldName];
  };

  const handleAddAdjustment = () => {
    append({
      adjustment_type: 'addition',
      amount: 0,
      reason: '',
      reference: '',
      approved_by: authUser?.name || ''
    });
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ backgroundColor: 'success.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Additions
              </Typography>
              <Typography variant="h4">
                {additions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ backgroundColor: 'error.light', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Deductions
              </Typography>
              <Typography variant="h4">
                {deductions.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ 
            backgroundColor: netAdjustment >= 0 ? 'info.light' : 'warning.light', 
            color: 'white' 
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Net Adjustment
              </Typography>
              <Typography variant="h4">
                {netAdjustment.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Adjustments List */}
      <Box sx={{ mb: 3 }}>
        {fields.map((field, index) => (
          <Card key={field.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Grid container spacing={2} alignItems="flex-start">
                {/* Adjustment Type */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Controller
                    name={`adjustments.${index}.adjustment_type`}
                    control={control}
                    defaultValue="addition"
                    render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          {...field}
                          label="Type"
                          error={!!getFieldError(index, "adjustment_type")}
                        >
                          {ADJUSTMENT_TYPES.map(type => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Amount */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Controller
                    name={`adjustments.${index}.amount`}
                    control={control}
                    defaultValue={0}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Amount"
                        type="number"
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        error={!!getFieldError(index, "amount")}
                        helperText={getFieldError(index, "amount")?.message}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </Grid>

                {/* Reason */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name={`adjustments.${index}.reason`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Reason"
                        size="small"
                        placeholder="Enter adjustment reason"
                        error={!!getFieldError(index, "reason")}
                        helperText={getFieldError(index, "reason")?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Reference */}
                <Grid size={{ xs: 12, md: 2 }}>
                  <Controller
                    name={`adjustments.${index}.reference`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Reference"
                        size="small"
                        placeholder="Ref No."
                        error={!!getFieldError(index, "reference")}
                        helperText={getFieldError(index, "reference")?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Delete Button */}
                <Grid size={{ xs: 12, md: 2 }} sx={{ display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                  <IconButton
                    onClick={() => remove(index)}
                    color="error"
                    sx={{ mt: 0.5 }}
                  >
                    <Delete />
                  </IconButton>
                </Grid>

                {/* Approved By */}
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name={`adjustments.${index}.approved_by`}
                    control={control}
                    defaultValue={authUser?.name || ''}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Approved By"
                        size="small"
                        placeholder="Approver name"
                        error={!!getFieldError(index, "approved_by")}
                        helperText={getFieldError(index, "approved_by")?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        {fields.length === 0 && (
          <Card sx={{ textAlign: 'center', py: 4, backgroundColor: 'grey.50' }}>
            <CardContent>
              <Typography variant="body1" color="textSecondary">
                No adjustments added yet
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Click "Add Adjustment" to record any additions or deductions
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Box>
          <Typography variant="body2" color="textSecondary">
            Total Records: {fields.length}
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          size="medium"
          startIcon={<Add />}
          onClick={handleAddAdjustment}
          disabled={!canCreateOrEdit}
        >
          Add Adjustment
        </Button>
      </Box>

      {/* Quick Help */}
      <Card sx={{ mt: 3, backgroundColor: 'info.50' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Adjustments
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>Additions:</strong> Use for extra income not captured through normal sales (e.g., service charges, late fees)
          </Typography>
          <Typography variant="body2">
            <strong>Deductions:</strong> Use for legitimate expenses or corrections (e.g., discounts, refunds, expenses)
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdjustmentsTab;