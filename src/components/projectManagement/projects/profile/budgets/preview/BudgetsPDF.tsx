import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Organization } from '@/types/auth-types';

// ==================== Types ====================

interface Expense {
  ledger_id: number;
  name: string;
  budgeted: number;
  spent: number;
  increasesWith?: string;
}

interface ProductItem {
  id: number;
  organization?: Organization;
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
  project_task?: { 
    id: number; 
    name?: string; 
    label?: string;
    measurement_unit?: { id: number; name: string; symbol: string };
  };
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

interface BudgetsPDFProps {
  allTasks: Task[];
  budgetDetails: BudgetDetails;
  baseCurrency?: { code: string };
  withDetails?: boolean;
  organization: Organization;
}

// ==================== Helper Functions ====================

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

// ==================== Table Components ====================

interface TableColumn {
  key: string;
  label: string;
  flex: number;
  align?: 'left' | 'right' | 'center';
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  renderCell: (item: any, column: TableColumn, index: number) => React.ReactNode;
  mainColor: string;
  lightColor: string;
  contrastText: string;
  title?: string;
}

const PDFTable: React.FC<TableProps> = ({ 
  columns, 
  data, 
  renderCell, 
  mainColor, 
  lightColor, 
  contrastText,
  title 
}) => {
  if (!data || data.length === 0) return null;

  return (
    <>
      {title && (
        <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 20, marginBottom: 4 }}>
          {title}
        </Text>
      )}
      <View style={{ ...pdfStyles.table, marginTop: 0 }}>
        <View style={pdfStyles.tableRow}>
          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>
            S/N
          </Text>
          {columns.map((col) => (
            <Text
              key={col.key}
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: col.flex,
                textAlign: col.align || 'left',
              }}
            >
              {col.label}
            </Text>
          ))}
        </View>
        {data.map((item, idx) => (
          <View key={idx} style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: idx % 2 === 0 ? '#FFF' : lightColor,
                flex: 0.3,
              }}
            >
              {idx + 1}
            </Text>
            {columns.map((col) => (
              <View
                key={col.key}
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: idx % 2 === 0 ? '#FFF' : lightColor,
                  flex: col.flex,
                  textAlign: col.align || 'left',
                }}
              >
                {renderCell(item, col, idx)}
              </View>
            ))}
          </View>
        ))}
      </View>
    </>
  );
};

// ==================== Section Renderers ====================

const renderExpensesTable = (
  expenses: Expense[],
  mainColor: string,
  lightColor: string,
  contrastText: string,
  baseCurrency?: { code: string }
) => {
  const columns: TableColumn[] = [
    { key: 'name', label: 'Expense Name', flex: 2 },
    { key: 'budgeted', label: 'Budgeted', flex: 1.5, align: 'right' },
    { key: 'spent', label: 'Spent', flex: 1.5, align: 'right' },
    { key: 'percent', label: 'Percent', flex: 1, align: 'right' },
  ];

  return (
    <PDFTable
      columns={columns}
      data={expenses}
      mainColor={mainColor}
      lightColor={lightColor}
      contrastText={contrastText}
      renderCell={(item: Expense, column) => {
        switch (column.key) {
          case 'name':
            return <Text>{item.name}</Text>;
          case 'budgeted':
            return <Text>{formatCurrency(item.budgeted, baseCurrency?.code)}</Text>;
          case 'spent':
            return <Text>{formatCurrency(item.spent, baseCurrency?.code)}</Text>;
          case 'percent':
            return <Text>{formatPercentage(item.budgeted, item.spent)}</Text>;
          default:
            return null;
        }
      }}
    />
  );
};

const renderProductsTable = (
  products: ProductItem[],
  allTasks: Task[],
  mainColor: string,
  lightColor: string,
  contrastText: string,
  baseCurrency?: { code: string }
) => {
  const columns: TableColumn[] = [
    { key: 'product', label: 'Product', flex: 3 },
    { key: 'quantity', label: 'Quantity', flex: 1, align: 'right' },
    { key: 'rate', label: 'Rate', flex: 1, align: 'right' },
    { key: 'amount', label: 'Amount', flex: 1, align: 'right' },
  ];

  const renderProductCell = (item: ProductItem, column: TableColumn) => {
    switch (column.key) {
      case 'product': {
        const productName = item.product_name || item.product?.name || String(item.id);
        const boundToTask = allTasks?.find(task => task.id === item?.budget_itemable_id);
        const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;
        
        return (
          <View>
            <Text>{productName}</Text>
            {taskLabel && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: 2 }}>Bound To:</Text>
                <Text>{taskLabel}</Text>
              </>
            )}
            {item.description && (
              <Text>{`(${item.description})`}</Text>
            )}
          </View>
        );
      }
      case 'quantity': {
        const quantity = Number(item.quantity || 0);
        const unitSymbol = item.unit_symbol || item.measurement_unit?.symbol || '';
        return <Text>{quantity} {unitSymbol}</Text>;
      }
      case 'rate': {
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        return <Text>{formatCurrency(rate, currencyCode)}</Text>;
      }
      case 'amount': {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        const amount = rate * quantity;
        return <Text>{formatCurrency(amount, currencyCode)}</Text>;
      }
      default:
        return null;
    }
  };

  return (
    <PDFTable
      columns={columns}
      data={products}
      title="Products"
      mainColor={mainColor}
      lightColor={lightColor}
      contrastText={contrastText}
      renderCell={renderProductCell}
    />
  );
};

const renderLedgerItemsTable = (
  ledgerItems: LedgerItem[],
  allTasks: Task[],
  mainColor: string,
  lightColor: string,
  contrastText: string,
  baseCurrency?: { code: string }
) => {
  const columns: TableColumn[] = [
    { key: 'expense', label: 'Expense', flex: 3 },
    { key: 'quantity', label: 'Quantity', flex: 1, align: 'right' },
    { key: 'rate', label: 'Rate', flex: 1, align: 'right' },
    { key: 'amount', label: 'Amount', flex: 1, align: 'right' },
  ];

  const renderLedgerCell = (item: LedgerItem, column: TableColumn) => {
    switch (column.key) {
      case 'expense': {
        const ledgerName = item.ledger?.name || String(item.ledger_id);
        const boundToTask = allTasks?.find(task => task.id === item?.budget_itemable_id);
        const taskLabel = boundToTask ? getTaskLabel(boundToTask) : null;
        
        return (
          <View>
            <Text>{ledgerName}</Text>
            {taskLabel && (
              <>
                <Text style={{ fontWeight: 'bold', marginTop: 2 }}>Bound To:</Text>
                <Text>{taskLabel}</Text>
              </>
            )}
            {item.description && (
              <Text>{`(${item.description})`}</Text>
            )}
          </View>
        );
      }
      case 'quantity': {
        const quantity = Number(item.quantity || 0);
        const unitSymbol = item.measurement_unit?.symbol || '';
        return <Text>{quantity} {unitSymbol}</Text>;
      }
      case 'rate': {
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        return <Text>{formatCurrency(rate, currencyCode)}</Text>;
      }
      case 'amount': {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        const amount = rate * quantity;
        return <Text>{formatCurrency(amount, currencyCode)}</Text>;
      }
      default:
        return null;
    }
  };

  return (
    <PDFTable
      columns={columns}
      data={ledgerItems}
      title="Ledger Items"
      mainColor={mainColor}
      lightColor={lightColor}
      contrastText={contrastText}
      renderCell={renderLedgerCell}
    />
  );
};

const renderSubcontractTasksTable = (
  tasks: SubcontractTaskItem[],
  mainColor: string,
  lightColor: string,
  contrastText: string,
  baseCurrency?: { code: string }
) => {
  const columns: TableColumn[] = [
    { key: 'taskName', label: 'Task', flex: 2 },
    { key: 'expenseName', label: 'Expense', flex: 1 },
    { key: 'quantity', label: 'Quantity', flex: 1, align: 'right' },
    { key: 'rate', label: 'Rate', flex: 1, align: 'right' },
    { key: 'amount', label: 'Amount', flex: 1, align: 'right' },
  ];

  const renderTaskCell = (item: SubcontractTaskItem, column: TableColumn) => {
    switch (column.key) {
      case 'taskName': {
        const name = item.project_task?.name || item.project_task?.label || '';
        const description = item.description || '';
        return (
          <View>
            <Text>{name}</Text>
            {description && (
              <Text>{`(${description})`}</Text>
            )}
          </View>
        );
      }
      case 'expenseName':
        return <Text>{item.expense_ledger?.name || ''}</Text>;
      case 'quantity': {
        const quantity = Number(item.quantity || 0);
        const unitSymbol = item.project_task?.measurement_unit?.symbol || '';
        return <Text>{quantity} {unitSymbol}</Text>;
      }
      case 'rate': {
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        return <Text>{formatCurrency(rate, currencyCode)}</Text>;
      }
      case 'amount': {
        const quantity = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const currencyCode = item.currency?.code || baseCurrency?.code || 'USD';
        const amount = rate * quantity;
        return <Text>{formatCurrency(amount, currencyCode)}</Text>;
      }
      default:
        return null;
    }
  };

  return (
    <PDFTable
      columns={columns}
      data={tasks}
      title="Subcontract Tasks"
      mainColor={mainColor}
      lightColor={lightColor}
      contrastText={contrastText}
      renderCell={renderTaskCell}
    />
  );
};

// ==================== Main Component ====================

const BudgetsPDF: React.FC<BudgetsPDFProps> = ({ 
  allTasks, 
  budgetDetails, 
  baseCurrency, 
  withDetails, 
  organization 
}) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

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

  return (
    <Document subject="Budget Details PDF" producer="ProsERP">
      <Page size="A4" style={pdfStyles.page}>
        {/* Header Section */}
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                Budget Details
              </Text>
              <Text style={pdfStyles.minInfo}>
                {budgetDetails.name || 'Unnamed Budget'}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Total Budgeted
            </Text>
            <Text style={pdfStyles.minInfo}>
              {formatCurrency(totalBudgetedAmount, baseCurrency?.code)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Total Spent
            </Text>
            <Text style={pdfStyles.minInfo}>
              {formatCurrency(totalSpentAmount, baseCurrency?.code)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Percentage Spent
            </Text>
            <Text style={pdfStyles.minInfo}>
              {percentageSpent.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Details Section */}
        {!withDetails && budgetDetails.expenses_budgeted && (
          renderExpensesTable(
            budgetDetails.expenses_budgeted,
            mainColor,
            lightColor,
            contrastText,
            baseCurrency
          )
        )}

        {withDetails && (
          <>
            {budgetDetails.ledger_items && renderLedgerItemsTable(
              budgetDetails.ledger_items,
              allTasks,
              mainColor,
              lightColor,
              contrastText,
              baseCurrency
            )}
            {budgetDetails.product_items && renderProductsTable(
              budgetDetails.product_items,
              allTasks,
              mainColor,
              lightColor,
              contrastText,
              baseCurrency
            )}
            {budgetDetails.subcontract_task_items && renderSubcontractTasksTable(
              budgetDetails.subcontract_task_items,
              mainColor,
              lightColor,
              contrastText,
              baseCurrency
            )}
          </>
        )}
      </Page>
    </Document>
  );
};

export default BudgetsPDF;