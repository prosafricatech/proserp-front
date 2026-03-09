import React from 'react';
import {
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
      <Typography variant='h6' sx={{ mb: 0.5 }}>Overall Tabs Total</Typography>
      <Divider sx={{ mb: 2 }} />

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
  );
}

export default BudgetSummaryTab;
