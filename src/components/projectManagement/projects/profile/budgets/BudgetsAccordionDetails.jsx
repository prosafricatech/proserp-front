import React, { useState } from 'react';
import { Alert, Box, Chip, Grid, LinearProgress, Tooltip, Typography } from '@mui/material';
import BudgetItemsActionTail from './BudgetItemsActionTail';
import projectsServices from '../../project-services';
import { useQuery } from '@tanstack/react-query';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';

function BudgetsAccordionDetails({ budget, expanded }) {
  const { currencies } = useCurrencySelect();
  const baseCurrency = currencies.find(c => c.is_base === 1);
  const [searchQueryNames, setSearchQueryNames] = useState([]);

  // React Query v5 syntax
  const { data: budgetItemsDetails, isLoading } = useQuery({
    queryKey: ['budgetItemsDetails', { id: budget.id }],
    queryFn: () => projectsServices.getbudgetItemsDetails(budget.id),
    enabled: !!expanded,
  });

  const getPercentageColor = (percentage) => {
    if (percentage <= 50) return 'success';
    if (percentage > 50 && percentage < 75) return 'warning';
    return 'error';
  };

  const filteredExpenses = budgetItemsDetails?.expenses_budgeted?.filter(expense =>
    searchQueryNames.length === 0 || searchQueryNames.includes(expense.name)
  );

  const totalBudgetedAmount = filteredExpenses?.reduce((total, item) => total + item?.budgeted, 0) || 0;
  const totalSpentAmount = filteredExpenses?.reduce((total, item) => total + item?.spent, 0) || 0;

  return (
    <>
      {isLoading ? (
        <Grid container width={'100%'}>
          <Grid size={12}>
            <LinearProgress />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={1} width={'100%'}>
          {/* Filter & Actions */}
          <Grid container size={12} spacing={2} width={'100%'} justifyContent="flex-end">
            <Grid size={{xs: 12, md: 6}} textAlign="end">
              <LedgerSelect
                multiple
                label="Filter by Expense"
                allowedGroups={['Expenses']}
                onChange={(newValue) => setSearchQueryNames(newValue.map(l => l.name))}
              />
            </Grid>
            <Grid size={{xs: 12, md: 0.5}} textAlign="end">
              <BudgetItemsActionTail budget={budgetItemsDetails} />
            </Grid>
          </Grid>

          {/* Summary */}
          <Grid container size={12} spacing={2} width={'100%'} paddingBottom={1}>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Total Budgeted</Typography>
              <Typography variant="h5">
                {totalBudgetedAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Total Spent</Typography>
              <Typography variant="h5">
                {totalSpentAmount?.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
              </Typography>
            </Grid>
            <Grid size={{xs: 12, md: 4}}>
              <Typography variant="subtitle1" color="textSecondary">Percentage Spent</Typography>
              <Typography variant="h5">
                {(totalBudgetedAmount ? (totalSpentAmount / totalBudgetedAmount * 100).toFixed(2) : 0)}%
              </Typography>
            </Grid>
          </Grid>

          {/* Expenses */}
          <Grid size={12} paddingTop={1} width={'100%'}>
            {filteredExpenses?.length > 0 ? filteredExpenses.map((item, index) => {
              const percentageSpent = (item?.spent / item?.budgeted) * 100;

              return (
                <Grid
                  key={index}
                  container
                  size={12}
                  width={'100%'}
                  columnSpacing={2}
                  alignItems="center"
                  sx={{
                    cursor: 'pointer',
                    borderTop: 1,
                    borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' },
                    padding: 1,
                  }}
                >
                  <Grid size={{xs: 7, md: 5.7}}>
                    <Tooltip title="Name">
                      <Typography variant="h6">{item?.name}</Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 5, md: 2.3}}>
                    <Tooltip title="Budgeted">
                      <Typography variant="h6">
                        {item?.budgeted.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 8, md: 2}}>
                    <Tooltip title="Spent">
                      <Typography variant="h6">
                        {item?.spent.toLocaleString('en-US', { style: 'currency', currency: baseCurrency?.code })}
                      </Typography>
                    </Tooltip>
                  </Grid>
                  <Grid size={{xs: 4, md: 2}}>
                    <Tooltip title="Percentage Spent">
                      <Chip
                        label={`${percentageSpent.toFixed(2)}%`}
                        color={getPercentageColor(percentageSpent)}
                        size="small"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid size={12} paddingTop={1}>
                    <Tooltip title="Percentage Spent">
                      <Box sx={{ width: '100%', textAlign: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={percentageSpent}
                          color={getPercentageColor(percentageSpent)}
                          sx={{ height: 15, borderRadius: 5 }}
                        />
                      </Box>
                    </Tooltip>
                  </Grid>
                </Grid>
              );
            }) : (
              <Alert variant="outlined" severity="info">No expenses budgeted found</Alert>
            )}
          </Grid>
        </Grid>
      )}
    </>
  );
}

export default BudgetsAccordionDetails;
