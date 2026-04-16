import React from 'react';
import {
  Alert,
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
  exchange_rate?: number;
  product_name?: string;
  product?: { id: number; name: string };
  budget_itemable_id?: number;
  bound_to?: string;
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
  bound_to?: string;
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
  groupingMode?: 'default' | 'task';
  hideSummary?: boolean;
  organization: any;
}

interface TaskItemGroup<T> {
  key: string;
  title: string;
  items: T[];
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

const getGroupHeading = (group: TaskItemGroup<unknown>): React.ReactNode => {
  if (group.key === 'unbound') {
    return (
      <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
        Unassigned Items (Not Bound To Any Task Yet)
      </Typography>
    );
  }

  return (
    <Typography variant='body2'>
      <Box component='span'>Bound To: </Box>
      <Box component='span'>{group.title}</Box>
    </Typography>
  );
};

const buildGroupsByTask = <T,>(
  items: T[],
  allTasks: Task[],
  getTaskId: (item: T) => number | null | undefined,
  getTaskLabelFromItem?: (item: T) => string | undefined,
  isBound?: (item: T) => boolean
): TaskItemGroup<T>[] => {
  const groups = new Map<string, TaskItemGroup<T>>();
  const taskOrder = allTasks.map((task) => Number(task.id));

  const ensureGroup = (key: string, title: string) => {
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        title,
        items: [],
      });
    }

    return groups.get(key);
  };

  items.forEach((item) => {
    const rawTaskId = getTaskId(item);
    const taskIdNum = Number(rawTaskId);
    const hasValidId = rawTaskId !== undefined && rawTaskId !== null && !Number.isNaN(taskIdNum) && taskIdNum !== 0;
    const boundCheck = isBound ? isBound(item) : true;
    const hasTask = hasValidId && boundCheck;

    if (!hasTask) {
      ensureGroup('unbound', 'Not Bound To Any Task')?.items.push(item);
      return;
    }

    const taskId = Number(rawTaskId);
    const task = allTasks.find((entry) => Number(entry.id) === taskId);
    const fallbackLabel = getTaskLabelFromItem?.(item);
    const groupTitle = getTaskLabel(task) || fallbackLabel || `Task ${taskId}`;

    ensureGroup(`task-${taskId}`, groupTitle)?.items.push(item);
  });

  const orderedTaskGroups = taskOrder
    .map((taskId) => groups.get(`task-${taskId}`))
    .filter(Boolean) as TaskItemGroup<T>[];

  const extraTaskGroups = Array.from(groups.values()).filter(
    (group) => group.key !== 'unbound' && !taskOrder.includes(Number(group.key.replace('task-', '')))
  );

  const unboundGroup = groups.get('unbound');

  const orderedGroups = [
    ...orderedTaskGroups,
    ...extraTaskGroups,
    ...(unboundGroup ? [unboundGroup] : []),
  ];

  return orderedGroups.filter((group) => group.items.length > 0);
};

const BudgetsOnscreen: React.FC<BudgetsOnscreenProps> = ({
  allTasks,
  budgetDetails,
  baseCurrency,
  withDetails,
  groupingMode = 'default',
  hideSummary = false,
  organization,
}) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';
  const mainColor = organization.settings?.main_color || '#2113AD';
  const headerColor = isDark ? '#29f096' : mainColor;
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const totalBudgetedAmount = budgetDetails?.expenses_budgeted?.reduce(
    (total, item) => total + (item?.budgeted || 0),
    0
  ) || 0;
  const totalSpentAmount = budgetDetails?.expenses_budgeted?.reduce(
    (total, item) => total + (item?.spent || 0),
    0
  ) || 0;
  const expenses = budgetDetails?.expenses_budgeted ?? [];
  const ledgerItems = budgetDetails?.ledger_items ?? [];
  const productItems = budgetDetails?.product_items ?? [];
  const subcontractTaskItems = budgetDetails?.subcontract_task_items ?? [];
  const ledgerGroups = buildGroupsByTask(
    budgetDetails.ledger_items || [],
    allTasks || [],
    (item) => item.budget_itemable_id,
    undefined,
    (item) => item.bound_to === 'ProjectTask' && !!item.budget_itemable_id
  );
  const productGroups = buildGroupsByTask(
    budgetDetails.product_items || [],
    allTasks || [],
    (item) => item.budget_itemable_id,
    undefined,
    (item) => item.bound_to === 'ProjectTask' && !!item.budget_itemable_id
  );
  const subcontractGroups = buildGroupsByTask(
    budgetDetails.subcontract_task_items || [],
    allTasks || [],
    (item) => item.project_task_id || item.project_task?.id,
    (item) => item.project_task?.label || item.project_task?.name
  );
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
      <Typography variant="h6" sx={{ mt: 2 }}>Expenses</Typography>
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

  const renderProductsTable = (products: ProductItem[], title = 'Products', showBoundTo = true) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2 }}>{title}</Typography>
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
            const exchangeRate = Number(item.exchange_rate || 1);
            const currencyCode = item.currency?.code || baseCurrency?.code;
            const amount = rate * quantity * exchangeRate;
            return (
              <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{productName}</Typography>
                    {taskLabel && showBoundTo && (
                      <Typography variant="caption" fontWeight="bold">Bound To: {taskLabel}</Typography>
                    )}
                    {item.description && (
                      <Typography variant="caption">({item.description})</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{quantity} {unitSymbol}</TableCell>
                <TableCell align="right">{formatCurrency(rate, currencyCode)}</TableCell>
                <TableCell align="right">{formatCurrency(amount, baseCurrency?.code)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Total</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
              {formatCurrency(
                products.reduce((total, item) => {
                  const quantity = Number(item.quantity || 0);
                  const rate = Number(item.rate || 0);
                  const exchangeRate = Number(item.exchange_rate || 1);
                  return total + quantity * rate * exchangeRate;
                }, 0),
                baseCurrency?.code
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderLedgerItemsTable = (ledgerItems: LedgerItem[], title = 'Ledger Items', showBoundTo = true) => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 1,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 1 }}>{title}</Typography>
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
            const exchangeRate = Number(item.exchange_rate || 1);
            const currencyCode = item.currency?.code || baseCurrency?.code;
            const amount = rate * quantity * exchangeRate;
            return (
              <TableRow key={idx} sx={{ backgroundColor: idx % 2 === 0 ? theme.palette.background.paper  : theme.palette.action.hover }}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  <Box>
                    <Typography>{ledgerName}</Typography>
                    {taskLabel && showBoundTo && (
                      <Typography variant="caption" fontWeight="bold">Bound To: {taskLabel}</Typography>
                    )}
                    {item.description && (
                      <Typography variant="caption">({item.description})</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">{quantity} {unitSymbol}</TableCell>
                <TableCell align="right">{formatCurrency(rate, currencyCode)}</TableCell>
                <TableCell align="right">{formatCurrency(amount, baseCurrency?.code)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Total</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
              {formatCurrency(
                ledgerItems.reduce((total, item) => {
                  const quantity = Number(item.quantity || 0);
                  const rate = Number(item.rate || 0);
                  const exchangeRate = Number(item.exchange_rate || 1);
                  return total + quantity * rate * exchangeRate;
                }, 0),
                baseCurrency?.code
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSubcontractTasksTable = (tasks: SubcontractTaskItem[], title = 'Subcontract Tasks') => (
    <TableContainer component={Paper} 
      sx={{ 
        marginTop: 2,
        '& .MuiTableRow-root:hover': {
          backgroundColor: theme.palette.action.hover,
        }
      }}
    >
      <Typography variant="h6" sx={{ mt: 2 }}>{title}</Typography>
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
            const exchangeRate = Number(item.exchange_rate || 1);
            const currencyCode = item.currency?.code || baseCurrency?.code;
            const amount = rate * quantity * exchangeRate;
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
                <TableCell align="right">{formatCurrency(amount, baseCurrency?.code)}</TableCell>
              </TableRow>
            );
          })}
          <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }}>Total</TableCell>
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} />
            <TableCell sx={{ backgroundColor: mainColor, color: contrastText }} align="right">
              {formatCurrency(
                tasks.reduce((total, item) => {
                  const quantity = Number(item.quantity || 0);
                  const rate = Number(item.rate || 0);
                  const exchangeRate = Number(item.exchange_rate || 1);
                  return total + quantity * rate * exchangeRate;
                }, 0),
                baseCurrency?.code
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      {/* Header Section */}
      <Grid container spacing={2} alignItems="center" mb={2} mt={1}>
        <Grid size={12}>
          <Typography variant="h5" color={headerColor} fontWeight={700}>
            Budget Details
          </Typography>
          <Typography variant="subtitle2">{budgetDetails.name || 'Unnamed Budget'}</Typography>
        </Grid>
      </Grid>

      {/* Details Section */}
      {!withDetails && expenses.length > 0 && renderExpensesTable(expenses)}
      {withDetails && groupingMode !== 'task' && (
        <>
          {ledgerItems.length > 0 && renderLedgerItemsTable(ledgerItems)}
          {productItems.length > 0 && renderProductsTable(productItems)}
          {subcontractTaskItems.length > 0 &&
            renderSubcontractTasksTable(subcontractTaskItems)}
        </>
      )}

      {withDetails && groupingMode === 'task' && (
        <>
          {ledgerGroups.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' color={headerColor} fontWeight={700}>
                Ledger Items
              </Typography>
              {ledgerGroups.map((group) => (
                <Box key={`ledger-${group.key}`} sx={{ mt: 1.25 }}>
                  {getGroupHeading(group)}
                  {renderLedgerItemsTable(group.items, '', false)}
                </Box>
              ))}
            </Box>
          )}
          {productGroups.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' color={headerColor} fontWeight={700}>
                Products
              </Typography>
              {productGroups.map((group) => (
                <Box key={`product-${group.key}`} sx={{ mt: 1.25 }}>
                  {getGroupHeading(group)}
                  {renderProductsTable(group.items, '', false)}
                </Box>
              ))}
            </Box>
          )}
          {subcontractGroups.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' color={headerColor} fontWeight={700}>
                Subcontract Tasks
              </Typography>
              {subcontractGroups.map((group) => (
                <Box key={`subcontract-${group.key}`} sx={{ mt: 1.25 }}>
                  {getGroupHeading(group)}
                  {renderSubcontractTasksTable(group.items, '')}
                </Box>
              ))}
            </Box>
          )}
          {ledgerGroups.length === 0 && productGroups.length === 0 && subcontractGroups.length === 0 && (
            <Alert variant='outlined' severity='info' sx={{ mt: 2 }}>
              No task-grouped budget items found
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default BudgetsOnscreen