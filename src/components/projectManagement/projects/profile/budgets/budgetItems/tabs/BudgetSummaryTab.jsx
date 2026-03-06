import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
} from '@mui/material';

function BudgetSummaryTab({
  ledgerItems = [],
  productItems = [],
  subContractItems = [],
  hasSubcontractTab = false,
}) {
  const itemAmount = (item) =>
    (Number(item?.quantity) || 0) *
    (Number(item?.rate) || 0) *
    (Number(item?.exchange_rate) || 1);

  const buildGroupedSummary = (items, labelResolver) => {
    const map = new Map();

    items.forEach((item) => {
      const label = labelResolver(item);
      const amount = itemAmount(item);

      if (!map.has(label)) {
        map.set(label, { name: label, count: 0, total: 0 });
      }

      const existing = map.get(label);
      map.set(label, {
        ...existing,
        count: existing.count + 1,
        total: existing.total + amount,
      });
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  };

  const expenseGroups = buildGroupedSummary(
    ledgerItems,
    (item) => item?.ledger?.name || item?.expense_ledger?.name || 'Unspecified Expense'
  );

  const productGroups = buildGroupedSummary(
    productItems,
    (item) => item?.product_name || item?.product?.name || 'Unspecified Product'
  );

  const subcontractGroups = buildGroupedSummary(
    subContractItems,
    (item) => item?.project_task?.name || item?.project_task?.label || 'Unspecified Task'
  );

  const expenseTotal = expenseGroups.reduce((sum, row) => sum + row.total, 0);
  const productTotal = productGroups.reduce((sum, row) => sum + row.total, 0);
  const subcontractTotal = subcontractGroups.reduce((sum, row) => sum + row.total, 0);

  const tabSummaries = [
    {
      key: 'expense',
      title: 'Expense Items Summary',
      itemLabel: 'Expense',
      groups: expenseGroups,
      total: expenseTotal,
      count: ledgerItems.length,
    },
    {
      key: 'product',
      title: 'Product Items Summary',
      itemLabel: 'Product',
      groups: productGroups,
      total: productTotal,
      count: productItems.length,
    },
    ...(hasSubcontractTab
      ? [
          {
            key: 'subcontract',
            title: 'Subcontract Tasks Summary',
            itemLabel: 'Task',
            groups: subcontractGroups,
            total: subcontractTotal,
            count: subContractItems.length,
          },
        ]
      : []),
  ];

  const grandTotalAmount = tabSummaries.reduce((sum, row) => sum + row.total, 0);
  const totalItems = tabSummaries.reduce((sum, row) => sum + row.count, 0);

  const formatAmount = (value) => Number(value || 0).toLocaleString();

  return (
    <Paper variant='outlined' sx={{ p: 2, mt: 1 }}>
      <Typography variant='h6' sx={{ mb: 0.5 }}>Budget Summary</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Per-tab breakdown and overall totals
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant='outlined' sx={{ p: 1.5, height: '100%' }}>
            <Typography variant='caption' color='text.secondary'>Tabs Included</Typography>
            <Typography variant='h6' fontWeight={700}>{tabSummaries.length}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant='outlined' sx={{ p: 1.5, height: '100%' }}>
            <Typography variant='caption' color='text.secondary'>Total Items</Typography>
            <Typography variant='h6' fontWeight={700}>{totalItems.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant='outlined' sx={{ p: 1.5, height: '100%', bgcolor: 'primary.50' }}>
            <Typography variant='caption' color='text.secondary'>Grand Total</Typography>
            <Typography variant='h6' fontWeight={700}>{formatAmount(grandTotalAmount)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {tabSummaries.map((tab) => (
          <Grid size={{ xs: 12 }} key={tab.key}>
            <Paper variant='outlined' sx={{ p: 1.5 }}>
              <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant='subtitle1' fontWeight={700}>{tab.title}</Typography>
                <Chip size='small' label={`${tab.count.toLocaleString()} item(s)`} />
              </Box>

              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>{tab.itemLabel}</TableCell>
                      <TableCell align='center'>Count</TableCell>
                      <TableCell align='right'>Contribution</TableCell>
                      <TableCell align='right'>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tab.groups.length > 0 ? (
                      tab.groups.map((row) => {
                        const contribution = tab.total > 0 ? (row.total / tab.total) * 100 : 0;
                        return (
                          <TableRow key={row.name} hover>
                            <TableCell>
                              <Typography variant='body2'>{row.name}</Typography>
                            </TableCell>
                            <TableCell align='center'>
                              <Chip label={row.count.toLocaleString()} size='small' />
                            </TableCell>
                            <TableCell align='right'>
                              <Typography color='text.secondary'>{contribution.toFixed(1)}%</Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography fontWeight={600}>{formatAmount(row.total)}</Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align='center'>
                          <Typography variant='body2' color='text.secondary'>No items found</Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider' } }}>
                      <TableCell>
                        <Typography fontWeight={700}>Total {tab.itemLabel}</Typography>
                      </TableCell>
                      <TableCell align='center'>
                        <Chip label={tab.count.toLocaleString()} size='small' color='primary' />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={700}>100%</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography fontWeight={700}>{formatAmount(tab.total)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        ))}

        <Grid size={{ xs: 12 }}>
          <Paper variant='outlined' sx={{ p: 1.5 }}>
            <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1 }}>Overall Tabs Total</Typography>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Tab</TableCell>
                    <TableCell align='center'>Items</TableCell>
                    <TableCell align='right'>Share of Grand Total</TableCell>
                    <TableCell align='right'>Total Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tabSummaries.map((tab) => {
                    const share = grandTotalAmount > 0 ? (tab.total / grandTotalAmount) * 100 : 0;
                    return (
                      <TableRow key={`${tab.key}-overall`} hover>
                        <TableCell>{tab.title.replace(' Summary', '')}</TableCell>
                        <TableCell align='center'>
                          <Chip label={tab.count.toLocaleString()} size='small' />
                        </TableCell>
                        <TableCell align='right'>
                          <Typography color='text.secondary'>{share.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align='right'>
                          <Typography fontWeight={600}>{formatAmount(tab.total)}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider' } }}>
                    <TableCell>
                      <Typography fontWeight={700}>Grand Total</Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Chip label={totalItems.toLocaleString()} size='small' color='primary' />
                    </TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight={700}>100%</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight={700}>{formatAmount(grandTotalAmount)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default BudgetSummaryTab;
