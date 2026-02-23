import React from 'react';
import { Dialog, Typography, Box, Grid, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import requisitionsServices from '@/components/processApproval/requisitionsServices';

interface LedgerBudgetCheckDetailsProps {
  ledgerId: number;
  costCenterId: number;
  open: boolean;
  onClose: () => void;
}

const fetchLedgerBudgetCheck = async (ledgerId: number, costCenterId: number) => {
  return requisitionsServices.expenseBudgetCheck({ ledger_id: ledgerId, cost_center_id: costCenterId });
};

const LedgerBudgetCheckDetails: React.FC<LedgerBudgetCheckDetailsProps> = ({ ledgerId, costCenterId, open, onClose }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['ledgerBudgetCheck', { ledgerId, costCenterId }],
    queryFn: () => fetchLedgerBudgetCheck(ledgerId, costCenterId),
    enabled: open && !!ledgerId && !!costCenterId,
  });

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={onClose}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Ledger Budget Check</Typography>
        {isFetching ? (
          <Skeleton variant="rectangular" width="100%" height={60} />
        ) : data ? (
          <Grid container spacing={2}>
            <Grid size={4}>
              <Typography variant="body2" color="text.secondary">Budgeted</Typography>
              <Typography variant="h6">{data.budgeted.toLocaleString()}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="body2" color="text.secondary">Spent</Typography>
              <Typography variant="h6">{data.spent.toLocaleString()}</Typography>
            </Grid>
            <Grid size={4}>
              <Typography variant="body2" color="text.secondary">Remaining</Typography>
              <Typography variant="h6">{data.remaining.toLocaleString()}</Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary">No budget data available.</Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default LedgerBudgetCheckDetails;
