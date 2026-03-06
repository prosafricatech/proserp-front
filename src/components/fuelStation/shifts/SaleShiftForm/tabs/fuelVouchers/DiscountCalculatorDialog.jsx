import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Grid, Typography, Divider } from '@mui/material';
import { sanitizedNumber } from '@/app/helpers/input-sanitization-helpers';

const DiscountCalculatorDialog = ({ open, onClose, onSubmit, productPrice }) => {
  const [discountQuantity, setDiscountQuantity] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [netAmount, setNetAmount] = useState('');

  React.useEffect(() => {
    const quantityValue = Number(discountQuantity) || 0;
    const discountRateValue = Number(discountRate) || 0;
    const grossAmount = sanitizedNumber(quantityValue * (productPrice || 0));
    const calculatedDiscountAmount = sanitizedNumber(quantityValue * discountRateValue);
    const calculatedNetAmount = sanitizedNumber(Math.max(grossAmount - calculatedDiscountAmount, 0));

    if (quantityValue > 0) {
      setDiscountAmount(calculatedDiscountAmount);
      setNetAmount(calculatedNetAmount);
    } else {
      setDiscountAmount('');
      setNetAmount('');
    }
  }, [discountQuantity, discountRate, productPrice]);

  const handleSubmit = () => {
    if (netAmount && Number(discountQuantity) > 0) {
      onSubmit({
        discountQuantity: Number(discountQuantity),
        discountRate: Number(discountRate) || 0,
        discountAmount: Number(discountAmount) || 0,
        netAmount: Number(netAmount),
      });
      onClose();
      setDiscountQuantity('');
      setDiscountRate('');
      setDiscountAmount('');
      setNetAmount('');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>Discount Calculator</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Unit Price: {(Number(productPrice) || 0).toLocaleString()} TZS per L
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} paddingTop={1}>
          <Grid size={12}>
            <TextField
              label="Quantity"
              fullWidth
              size='small'
              value={discountQuantity}
              placeholder='Enter liters'
              onChange={e => setDiscountQuantity(sanitizedNumber(e.target.value))}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Discount Rate"
              fullWidth
              size='small'
              value={discountRate}
              placeholder='Discount per liter'
              onChange={e => setDiscountRate(sanitizedNumber(e.target.value))}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Discount Amount (TZS)"
              fullWidth
              size='small'
              value={discountAmount ? Number(discountAmount).toLocaleString() : ''}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'inherit' } }}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Amount Sold (TZS)"
              fullWidth
              size='small'
              value={netAmount ? Number(netAmount).toLocaleString() : ''}
              InputProps={{ readOnly: true }}
              sx={{ '& .MuiInputBase-root': { fontWeight: 600 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color='inherit'>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!netAmount || !discountQuantity}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountCalculatorDialog;
