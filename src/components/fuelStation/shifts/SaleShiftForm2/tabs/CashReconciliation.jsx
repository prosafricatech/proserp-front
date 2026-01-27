"use client";
import React, { useMemo, useCallback, useState } from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Autocomplete,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import { 
  AddOutlined, 
  DisabledByDefault, 
  DescriptionOutlined,
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  Save,
  Cancel
} from '@mui/icons-material';
import CommaSeparatedField from '@/shared/Inputs/CommaSeparatedField';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { useFormContext, useWatch } from 'react-hook-form';

// Breakdown row component for inline editing
function BreakdownRow({ 
  breakdown, 
  index, 
  onUpdate, 
  onDelete, 
  isEditing,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  remainingAmount,
  ledgerAmount,
  totalAllocated
}) {
  const [editDescription, setEditDescription] = useState(breakdown.description);
  const [editAmount, setEditAmount] = useState(breakdown.amount?.toString() || '');

  const handleSave = () => {
    const amount = sanitizedNumber(editAmount);
    if (!editDescription.trim() || !amount || amount <= 0) {
      return;
    }
    
    // Check if amount exceeds remaining (considering current allocation)
    const currentAllocationExcludingThis = totalAllocated - breakdown.amount;
    const newRemaining = ledgerAmount - (currentAllocationExcludingThis + amount);
    
    if (newRemaining < -0.01) { // Allow small rounding differences
      alert(`Amount exceeds remaining allocation by ${Math.abs(newRemaining).toLocaleString()}`);
      return;
    }
    
    onSaveEdit({
      description: editDescription.trim(),
      amount: amount,
    });
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <TextField
            fullWidth
            size="small"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
          />
        </TableCell>
        <TableCell align="right">
          <TextField
            size="small"
            value={editAmount}
            InputProps={{
              inputComponent: CommaSeparatedField,
            }}
            onChange={(e) => setEditAmount(e.target.value)}
            placeholder="Amount"
            sx={{ maxWidth: 120 }}
          />
        </TableCell>
        <TableCell width={100}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={handleSave} color="primary">
              <Save fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onCancelEdit} color="error">
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>{breakdown.description}</TableCell>
      <TableCell align="right">{breakdown.amount.toLocaleString()}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => onEdit(index)} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(index)} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// Breakdown section for each ledger
function LedgerBreakdownSection({ 
  ledgerIndex, 
  ledgerObj, 
  breakdowns = [], 
  onUpdateBreakdowns,
  ledgerAmount
}) {
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const totalAllocated = breakdowns.reduce((sum, b) => sum + (b.amount || 0), 0);
  const remainingAmount = ledgerAmount - totalAllocated;
  const isFullyAllocated = Math.abs(remainingAmount) < 0.01;

  const handleAddBreakdown = () => {
    if (!newDescription.trim()) {
      alert('Description is required');
      return;
    }

    const amount = sanitizedNumber(newAmount);
    if (!amount || amount <= 0) {
      alert('Amount must be positive');
      return;
    }

    if (amount > remainingAmount) {
      alert(`Amount exceeds remaining ${remainingAmount.toLocaleString()}`);
      return;
    }

    const updatedBreakdowns = [
      ...breakdowns,
      {
        description: newDescription.trim(),
        amount: amount,
      }
    ];

    onUpdateBreakdowns(ledgerIndex, updatedBreakdowns);
    setNewDescription('');
    setNewAmount('');
  };

  const handleDeleteBreakdown = (index) => {
    const updatedBreakdowns = breakdowns.filter((_, i) => i !== index);
    onUpdateBreakdowns(ledgerIndex, updatedBreakdowns);
    
    // If editing the deleted item, cancel edit
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditData(null);
    }
  };

  const handleEditBreakdown = (index) => {
    setEditingIndex(index);
    setEditData({ ...breakdowns[index] });
  };

  const handleSaveEdit = (index, updatedBreakdown) => {
    const updatedBreakdowns = [...breakdowns];
    updatedBreakdowns[index] = updatedBreakdown;
    onUpdateBreakdowns(ledgerIndex, updatedBreakdowns);
    setEditingIndex(null);
    setEditData(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  return (
    <Box sx={{ 
      mt: 2, 
      mb: 2, 
      p: 2, 
      border: '1px solid', 
      borderColor: isFullyAllocated ? 'success.light' : 'warning.light',
      borderRadius: 1,
      backgroundColor: 'background.paper'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          Breakdown for {ledgerObj?.name || 'Ledger'} 
          <Typography component="span" variant="caption" sx={{ ml: 1 }}>
            ({totalAllocated.toLocaleString()} / {ledgerAmount.toLocaleString()})
            {!isFullyAllocated && (
              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                (Remaining: {remainingAmount.toLocaleString()})
              </Typography>
            )}
          </Typography>
        </Typography>
        
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {expanded && (
        <>
          {/* Add new breakdown form */}
          <Box sx={{ mb: 3, p: 2, border: '1px dashed #ddd', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              Add Breakdown Item
            </Typography>
            <Grid container spacing={1} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount"
                  value={newAmount}
                  InputProps={{
                    inputComponent: CommaSeparatedField,
                  }}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 1 }} sx={{ textAlign: { md: 'right' } }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddBreakdown}
                  disabled={!newDescription.trim() || !newAmount}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Existing breakdowns table */}
          {breakdowns.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
                Breakdown Items:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell width={100}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdowns.map((breakdown, index) => {
                      if (editingIndex === index) {
                        return (
                          <BreakdownRow
                            key={index}
                            breakdown={editData}
                            index={index}
                            onSaveEdit={(updated) => handleSaveEdit(index, updated)}
                            onCancelEdit={handleCancelEdit}
                            isEditing={true}
                            remainingAmount={remainingAmount}
                            ledgerAmount={ledgerAmount}
                            totalAllocated={totalAllocated}
                          />
                        );
                      }
                      
                      return (
                        <BreakdownRow
                          key={index}
                          breakdown={breakdown}
                          index={index}
                          onDelete={handleDeleteBreakdown}
                          onEdit={handleEditBreakdown}
                          isEditing={false}
                          remainingAmount={remainingAmount}
                          ledgerAmount={ledgerAmount}
                          totalAllocated={totalAllocated}
                        />
                      );
                    })}
                    
                    {/* Summary row */}
                    <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider' } }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Allocated</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {totalAllocated.toLocaleString()}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Validation message */}
          {!isFullyAllocated && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Breakdown not fully allocated. Please allocate remaining {remainingAmount.toLocaleString()}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

function CashReconciliation({
  cashierIndex,
  localFuelVouchers = [],
  localAdjustments = [],
  localPumpReadings = [],
}) {
  const {
    setValue,
    setCheckShiftBalanced,
    products,
    fuel_pumps,
    shiftLedgers,
    errors,
  } = useFormContext();

  const { ungroupedLedgerOptions } = useLedgerSelect();

  const productPrices = useWatch({
    name: 'product_prices',
  }) || [];

  const otherLedgers = useWatch({
    name: `cashiers.${cashierIndex}.other_ledgers`,
  }) || [];

  const mainLedgerId = useWatch({
    name: `cashiers.${cashierIndex}.main_ledger_id`,
  });

  // ──────────────────────────────────────────────────────────────
  // Fuel Voucher Totals per product
  // ──────────────────────────────────────────────────────────────
  const fuelVoucherTotals = useMemo(() => {
    if (!localFuelVouchers?.length || !productPrices?.length) return {};

    const totals = {};
    localFuelVouchers.forEach((voucher) => {
      const productId = voucher?.product_id;
      if (!productId) return;
      const qty = voucher?.quantity || 0;
      const price = productPrices.find(p => p?.product_id === productId)?.price || 0;
      totals[productId] = (totals[productId] || 0) + qty * price;
    });
    return totals;
  }, [localFuelVouchers, productPrices]);

  // ──────────────────────────────────────────────────────────────
  // Product sales totals (pump readings + adjustments)
  // ──────────────────────────────────────────────────────────────
  const productTotals = useMemo(() => {
    const totals = {};

    // Pump sales
    fuel_pumps?.forEach((pump) => {
      const productId = pump?.product_id;
      if (!productId) return;
      const reading = localPumpReadings.find(r => r?.fuel_pump_id === pump.id);
      const sold = ((reading?.closing || 0) - (reading?.opening || 0)) || 0;
      totals[productId] = (totals[productId] || 0) + sold;
    });

    // Adjustments
    localAdjustments?.forEach((adj) => {
      const productId = adj?.product_id;
      if (!productId) return;
      const qty = adj?.quantity || 0;
      if (adj.operator === '-') {
        totals[productId] = (totals[productId] || 0) + qty;     // add to sold (reduce cash)
      } else if (adj.operator === '+') {
        totals[productId] = (totals[productId] || 0) - qty;     // subtract from sold (increase cash)
      }
    });

    return totals;
  }, [fuel_pumps, localPumpReadings, localAdjustments]);

  // ──────────────────────────────────────────────────────────────
  // Grand totals & derived values
  // ──────────────────────────────────────────────────────────────
  const { grandFuelVoucherTotal, grandProductsTotal, cashRemaining } = useMemo(() => {
    const voucherTotal = Object.values(fuelVoucherTotals).reduce((sum, v) => sum + (v || 0), 0);

    const productsTotal = products?.reduce((sum, product) => {
      const qty = productTotals[product.id] || 0;
      const price = productPrices.find(p => p?.product_id === product.id)?.price || 0;
      return sum + qty * price;
    }, 0) || 0;

    return {
      grandFuelVoucherTotal: voucherTotal,
      grandProductsTotal: productsTotal,
      cashRemaining: productsTotal - voucherTotal,
    };
  }, [fuelVoucherTotals, productTotals, products, productPrices]);

  const totalOtherLedgersAmount = useMemo(() => {
    return otherLedgers?.reduce((sum, ledger) => sum + sanitizedNumber(ledger?.amount || 0), 0) || 0;
  }, [otherLedgers]);

  // Calculate breakdown totals for each ledger
  const breakdownTotals = useMemo(() => {
    return otherLedgers.map(ledger => {
      const breakdowns = ledger.breakdowns || [];
      return breakdowns.reduce((sum, b) => sum + (b.amount || 0), 0);
    });
  }, [otherLedgers]);

  // Derived main ledger amount (what should be there)
  const calculatedMainLedgerAmount = cashRemaining - totalOtherLedgersAmount;

  // Balance check - now also validates breakdowns
  const isBreakdownValid = useMemo(() => {
    return otherLedgers.every((ledger, index) => {
      const ledgerAmount = sanitizedNumber(ledger?.amount || 0);
      if (ledgerAmount === 0) return true; // Empty ledger is valid
      
      const breakdownTotal = breakdownTotals[index] || 0;
      return Math.abs(breakdownTotal - ledgerAmount) < 0.01;
    });
  }, [otherLedgers, breakdownTotals]);

  const isBalanced = Math.abs(cashRemaining - (calculatedMainLedgerAmount + totalOtherLedgersAmount)) < 0.01 
    && isBreakdownValid;

  // Update balance status only when meaningful values change
  React.useEffect(() => {
    setCheckShiftBalanced(isBalanced && cashRemaining >= 0);
  }, [isBalanced, cashRemaining, setCheckShiftBalanced]);

  // ──────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────
  const getProductPrice = useCallback(
    (productId) => productPrices.find(p => p?.product_id === productId)?.price || 0,
    [productPrices]
  );

  const availableLedgers = useMemo(() => {
    return shiftLedgers?.filter(
      (ledger) => !otherLedgers.some((other) => other?.id === ledger.id)
    ) || [];
  }, [shiftLedgers, otherLedgers]);

  const cashReconciliationAppend = () => {
    const newLedgers = [...otherLedgers, { 
      id: '', 
      amount: '',
      breakdowns: [] 
    }];
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const cashReconciliationRemove = (idx) => {
    const newLedgers = otherLedgers.filter((_, i) => i !== idx);
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateOtherLedger = (idx, field, value) => {
    const newLedgers = [...otherLedgers];
    newLedgers[idx] = {
      ...newLedgers[idx],
      [field]: field === 'amount' ? sanitizedNumber(value) : value,
      // Clear breakdowns if amount changes to 0 or empty
      ...(field === 'amount' && (!value || sanitizedNumber(value) === 0) && { breakdowns: [] })
    };
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const updateBreakdowns = (ledgerIndex, newBreakdowns) => {
    const newLedgers = [...otherLedgers];
    newLedgers[ledgerIndex] = {
      ...newLedgers[ledgerIndex],
      breakdowns: newBreakdowns
    };
    setValue(`cashiers.${cashierIndex}.other_ledgers`, newLedgers, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <>
      <Grid container columnSpacing={2} rowSpacing={2}>
        {/* Total Products Amount */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Total Products Amount
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products?.map((product) => {
                      const qty = productTotals[product.id] || 0;
                      const price = getProductPrice(product.id);
                      const amount = qty * price;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{qty.toLocaleString()}</TableCell>
                          <TableCell align="right">{price.toLocaleString()}</TableCell>
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Grand Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {grandProductsTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Fuel Vouchers */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Fuel Vouchers
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products?.map((product) => {
                      const qty = localFuelVouchers.reduce(
                        (sum, v) => (v?.product_id === product.id ? sum + (v.quantity || 0) : sum),
                        0
                      );
                      const price = getProductPrice(product.id);
                      const amount = qty * price;
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{qty.toLocaleString()}</TableCell>
                          <TableCell align="right">{price.toLocaleString()}</TableCell>
                          <TableCell align="right">{amount.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        Grand Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {grandFuelVoucherTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Final Summary */}
        <Grid size={{ xs: 12, md: 12, lg: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Final Summary
              </Typography>
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Amount</TableCell>
                      <TableCell align="right">{grandProductsTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fuel Vouchers total</TableCell>
                      <TableCell align="right">{grandFuelVoucherTotal.toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Cash Remaining</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: cashRemaining < 0 ? 'error.main' : 'success.main' }}>
                        {cashRemaining.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cash Distribution */}
        <Grid size={{ xs: 12, md: 12, lg: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" align="center" fontWeight="bold" gutterBottom>
                Cash Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                {/* Main Ledger */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Autocomplete
                    size="small"
                    options={availableLedgers}
                    getOptionLabel={(opt) => opt.name}
                    value={mainLedgerId ? ungroupedLedgerOptions?.find(l => l.id === mainLedgerId) : null}
                    onChange={(_, newValue) => {
                      const id = newValue?.id ?? null;
                      setValue(`cashiers.${cashierIndex}.main_ledger_id`, id, { shouldValidate: true });
                      setValue(`cashiers.${cashierIndex}.main_ledger`, { id }, { shouldValidate: true });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Main Ledger"
                        error={!!errors?.cashiers?.[cashierIndex]?.main_ledger_id}
                        helperText={errors?.cashiers?.[cashierIndex]?.main_ledger_id?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Calculated Amount"
                    value={calculatedMainLedgerAmount.toLocaleString()}
                    InputProps={{
                      readOnly: true,
                      inputComponent: CommaSeparatedField,
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        fontWeight: 'bold',
                        color: calculatedMainLedgerAmount < 0 ? 'error.main' : 'success.main',
                      },
                    }}
                  />
                </Grid>

                {/* Other Ledgers */}
                {otherLedgers.map((ledger, idx) => {
                  const ledgerObj = ungroupedLedgerOptions?.find(l => l.id === ledger.id);
                  const ledgerAmount = sanitizedNumber(ledger.amount || 0);
                  
                  return (
                    <React.Fragment key={idx}>
                      <Grid size={12}>
                        <Divider/>
                      </Grid>
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Autocomplete
                          size="small"
                          options={availableLedgers.filter(l => l.id !== mainLedgerId)}
                          getOptionLabel={(opt) => opt.name}
                          value={ledgerObj}
                          onChange={(_, newValue) => {
                            updateOtherLedger(idx, 'id', newValue?.id ?? null);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Other Ledger"
                              error={!!errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.id}
                              helperText={errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.id?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 10, md: 4.5 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Amount"
                          value={ledger?.amount ?? ''}
                          error={!!errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.amount}
                          helperText={errors?.cashiers?.[cashierIndex]?.other_ledgers?.[idx]?.amount?.message}
                          InputProps={{ inputComponent: CommaSeparatedField }}
                          onChange={(e) => updateOtherLedger(idx, 'amount', e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 2, md: 0.5 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tooltip title="Delete this ledger">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => cashReconciliationRemove(idx)}
                          >
                            <DisabledByDefault fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>

                      {/* Breakdown Section - Always shown but collapsed by default */}
                      {ledgerAmount > 0 && (
                        <Grid size={{ xs: 12 }}>
                          <LedgerBreakdownSection
                            ledgerIndex={idx}
                            ledger={ledger}
                            ledgerObj={ledgerObj}
                            breakdowns={ledger.breakdowns || []}
                            onUpdateBreakdowns={updateBreakdowns}
                            ledgerAmount={ledgerAmount}
                          />
                        </Grid>
                      )}
                    </React.Fragment>
                  );
                })}

                <Grid size={12} sx={{ textAlign: 'right', mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddOutlined />}
                    onClick={cashReconciliationAppend}
                    disabled={availableLedgers.length === 0}
                  >
                    Add Other Ledger
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default CashReconciliation;