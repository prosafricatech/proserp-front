import { Divider, Grid, Typography } from '@mui/material';
import React from 'react';

interface RequisitionSummaryProps {
  vatableAmount: number;
  totalAmount: number;
  isPurchase: boolean;
}

function RequisitionSummary({ vatableAmount, totalAmount, isPurchase }: RequisitionSummaryProps) {
  return (
    <Grid container columnSpacing={1}>
      <Grid size={{xs: 12}}>
        <Typography align='center' variant='h3'>Summary</Typography>
        <Divider/>
      </Grid>
      <Grid size={{xs: 5}}>
        <Typography align='left' variant='body2'>Total:</Typography>
      </Grid>
      <Grid size={{xs: 7}}>
        <Typography align='right' variant='h5'>
          {totalAmount?.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
        </Typography>
      </Grid>
      {isPurchase &&
        <>
          <Grid size={{xs: 5}}>
            <Typography align='left' variant='body2'>
              VAT:
            </Typography>
          </Grid>
          <Grid size={{xs: 7}} display={'flex'} alignItems={'center'} justifyContent={'end'}>
            <Typography align='right' variant='h5'>
              {vatableAmount?.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
            </Typography>
          </Grid>
        </>
      }
      <Grid size={{xs: 5}}>
        <Typography align='left' variant='body2' noWrap>Grand Total:</Typography>
      </Grid>
      <Grid size={{xs: 7}} display={'flex'} alignItems={'end'} justifyContent={'end'}>
        <Typography align='right' variant='h5'>
          {(totalAmount + vatableAmount).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
        </Typography>
      </Grid>
    </Grid>
  );
}

export default RequisitionSummary;