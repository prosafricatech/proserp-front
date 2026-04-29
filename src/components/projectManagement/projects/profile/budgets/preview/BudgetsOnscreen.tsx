import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';

interface Expense {
  ledger_id: number;
  name: string;
  budgeted: number;
  spent: number;
  increasesWith?: string;
}
interface ProductItem {
  id: number;
  organization?: any;
  measurement_unit_id: number;
  quantity: number;
  rate: number;
  product_name?: string;
  product?: { id: number; name: string };
  budget_itemable_id?: number;
  description?: string;
  unit_symbol?: string;
  measurement_unit?: { id: number; name: string; symbol: string };
  currency?: { id: number; name: string; symbol: string; code: string };
}
interface LedgerItem {
  id: number;
  budget_id: number;
  ledger_id: number;
  currency_id: number;
  exchange_rate: number;
  measurement_unit_id: number;
  quantity: number;
  rate: number;
  description?: string;
  budget_itemable_id?: number;
  ledger?: { id: number; name: string };
  currency?: { id: number; name: string; symbol: string; code: string };
  measurement_unit?: { id: number; name: string; symbol: string };
}
interface SubcontractTaskItem {
  id: number;
  expense_ledger_id: number;
  project_task_id: number;
  currency_id: number;
  exchange_rate: number;
  quantity?: number;
  rate?: number;
  description?: string;
  project_task?: { id: number; name?: string; label?: string; measurement_unit?: { id: number; name: string; symbol: string } };
  expense_ledger?: { id: number; name: string };
  currency?: { id: number; name: string; symbol: string; code: string };
}
interface Task {
  id: number;
  label?: string;
  name?: string;
}
interface BudgetDetails {
  name?: string;
  expenses_budgeted?: Expense[];
  product_items?: ProductItem[];
  subcontract_task_items?: SubcontractTaskItem[];
  ledger_items?: LedgerItem[];
}
interface BudgetsOnscreenProps {
  allTasks: Task[];
  budgetDetails: BudgetDetails;
  baseCurrency?: { code: string };
  withDetails?: boolean;
  organization: any;
}

const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  if (isNaN(amount)) return '0.00';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
const formatPercentage = (budgeted: number, spent: number): string => {
  if (budgeted === 0) return 'unbudgeted';
  const percentage = (spent / budgeted) * 100;
  return `${percentage.toFixed(2)}%`;
};
const getTaskLabel = (task: Task | undefined): string => {
  if (!task) return '';
  return task.label || task.name || '';
};

const BudgetsOnscreen: React.FC<BudgetsOnscreenProps> = ({
  allTasks,
  budgetDetails,
  baseCurrency,
  withDetails,
  organization,
}) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';
  const mainColor = organization.settings?.main_color || (isDark ? theme.palette.primary.main : '#2113AD');
  const lightColor = organization.settings?.light_color || (isDark ? theme.palette.action.selected : '#bec5da');
  const contrastText = organization.settings?.contrast_text || (isDark ? theme.palette.getContrastText(mainColor) : '#FFFFFF');

  const totalBudgetedAmount = budgetDetails?.expenses_budgeted?.reduce(
    (total, item) => total + (item?.budgeted || 0),
    0
  ) || 0;
  const totalSpentAmount = budgetDetails?.expenses_budgeted?.reduce(
    (total, item) => total + (item?.spent || 0),
    0
  ) || 0;
  const percentageSpent = totalBudgetedAmount
    ? (totalSpentAmount / totalBudgetedAmount) * 100
    : 0;

  // Table renderers
  const renderExpensesTable = (expenses: Expense[]) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Expenses</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Expense Name</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Budgeted</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Spent</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Percent</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((item, idx) => (
            <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell align="right">{formatCurrency(item.budgeted, baseCurrency?.code)}</TableCell>
              <TableCell align="right">{formatCurrency(item.spent, baseCurrency?.code)}</TableCell>
              <TableCell align="right">{formatPercentage(item.budgeted, item.spent)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderProductsTable = (products: ProductItem[]) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Products</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Product</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Rate</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((item, idx) => {
            const productName = item.product_name || item.product?.name || String(item.id);
            const boundToTask = allTasks?.find(task => task.id === item?.budget_itemable_id);
            const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;
            const quantity = Number(item.quantity || 0);
            const unitSymbol = item.unit_symbol || item.measurement_unit?.symbol || '';
            const rate = Number(item.rate || 0);
            const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
            const amount = rate * quantity;
            return (
              <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{productName}</Typography>
                    {taskLabel && (
                      <Typography variant="caption" fontWeight="bold">Bound To: {taskLabel}</Typography>
                    )}
                    {item.description && (
                      <Typography variant="caption">({item.description})</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{quantity} {unitSymbol}</TableCell>
                <TableCell align="right">{formatCurrency(rate, currencyCode)}</TableCell>
                <TableCell align="right">{formatCurrency(amount, currencyCode)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderLedgerItemsTable = (ledgerItems: LedgerItem[]) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Ledger Items</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Expense</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Rate</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ledgerItems.map((item, idx) => {
            const ledgerName = item.ledger?.name || String(item.ledger_id);
            const boundToTask = allTasks?.find(task => task.id === item?.budget_itemable_id);
            const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;
            const quantity = Number(item.quantity || 0);
            const unitSymbol = item.measurement_unit?.symbol || '';
            const rate = Number(item.rate || 0);
            const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
            const amount = rate * quantity;
            return (
              <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{ledgerName}</Typography>
                    {taskLabel && (
                      <Typography variant="caption" fontWeight="bold">Bound To: {taskLabel}</Typography>
                    )}
                    {item.description && (
                      <Typography variant="caption">({item.description})</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{quantity} {unitSymbol}</TableCell>
                <TableCell align="right">{formatCurrency(rate, currencyCode)}</TableCell>
                <TableCell align="right">{formatCurrency(amount, currencyCode)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSubcontractTasksTable = (tasks: SubcontractTaskItem[]) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Subcontract Tasks</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>S/N</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Task</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Expense</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Quantity</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Rate</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((item, idx) => {
            const name = item.project_task?.name || item.project_task?.label || '';
            const description = item.description || '';
            const quantity = Number(item.quantity || 0);
            const unitSymbol = item.project_task?.measurement_unit?.symbol || '';
            const rate = Number(item.rate || 0);
            const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
            const amount = rate * quantity;
            return (
              <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{name}</Typography>
                    {description && (
                      <Typography variant="caption">({description})</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{item.expense_ledger?.name || ''}</TableCell>
                <TableCell align="right">{quantity} {unitSymbol}</TableCell>
                <TableCell align="right">{formatCurrency(rate, currencyCode)}</TableCell>
                <TableCell align="right">{formatCurrency(amount, currencyCode)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header Section */}
      <Grid container spacing={2} alignItems="center" mb={2} mt={1}>
        <Grid size={6}>
          <Typography variant="h5" color={mainColor} fontWeight={700}>
            Budget Details
          </Typography>
          <Typography variant="subtitle2">{budgetDetails.name || 'Unnamed Budget'}</Typography>
        </Grid>
      </Grid>

      {/* Summary Section */}
      <Grid container spacing={2} mb={2}>
        <Grid size={12}>
          <Typography variant="subtitle2" color={mainColor}>Total Budgeted</Typography>
          <Typography>{formatCurrency(totalBudgetedAmount, baseCurrency?.code)}</Typography>
        </Grid>
        <Grid size={12}>
          <Typography variant="subtitle2" color={mainColor}>Total Spent</Typography>
          <Typography>{formatCurrency(totalSpentAmount, baseCurrency?.code)}</Typography>
        </Grid>
        <Grid size={12}>
          <Typography variant="subtitle2" color={mainColor}>Percentage Spent</Typography>
          <Typography>{percentageSpent.toFixed(2)}%</Typography>
        </Grid>
      </Grid>

      {/* Details Section */}
      {!withDetails && budgetDetails.expenses_budgeted && renderExpensesTable(budgetDetails.expenses_budgeted)}
      {withDetails && (
        <>
          {budgetDetails.ledger_items && renderLedgerItemsTable(budgetDetails.ledger_items)}
          {budgetDetails.product_items && renderProductsTable(budgetDetails.product_items)}
          {budgetDetails.subcontract_task_items && renderSubcontractTasksTable(budgetDetails.subcontract_task_items)}
        </>
      )}
    </Box>
  );
};

export default BudgetsOnscreen