import requisitionsServices from '@/components/processApproval/requisitionsServices.js';
import budgetsServices from '@/components/accounts/budgets/budgets-services.js';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices.js';
import userManagementServices from '@/components/prosControl/userManagement/user-management-services';
import ledgerServices from '@/components/accounts/ledgers/ledger-services.js';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import productServices from '@/components/productAndServices/products/productServices.js';
import currencyServices from '@/components/masters/Currencies/currency-services.js';
import measurementUnitServices from '@/components/masters/measurementUnits/measurement-unit-services.js';
import posServices from '@/components/pos/pos-services.js';
import { staticMenuItems } from '@/utilities/constants/static-menu-items';

// Helper: lowercased entity types already covered by deep search
const deepEntityTypes = [
  'ledger', 'project', 'product', 'budget', 'employee', 'department', 'user', 'requisition', 'currency', 'measurement unit', 'counter sale'
];

// Add generic configs for all static menu items not already covered
const reportConfigs = [
  {
    type: 'report',
    label: 'Trial Balance',
    search: async (query: string) => {
      if ('trial balance'.includes(query.toLowerCase()) || query.toLowerCase().includes('trial balance')) {
        return [{
          id: 'trial-balance',
          label: 'Trial Balance',
          type: 'Report',
          url: '/en-US/accounts/reports?report=trial-balance',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Income Statement',
    search: async (query: string) => {
      if ('income statement'.includes(query.toLowerCase()) || query.toLowerCase().includes('income statement')) {
        return [{
          id: 'income-statement',
          label: 'Income Statement',
          type: 'Report',
          url: '/en-US/accounts/reports?report=income-statement',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Cashier Report',
    search: async (query: string) => {
      if ('cashier report'.includes(query.toLowerCase()) || query.toLowerCase().includes('cashier report')) {
        return [{
          id: 'cashier-report',
          label: 'Cashier Report',
          type: 'Report',
          url: '/en-US/accounts/reports?report=cashier-report',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Balance Sheet',
    search: async (query: string) => {
      if ('balance sheet'.includes(query.toLowerCase()) || query.toLowerCase().includes('balance sheet')) {
        return [{
          id: 'balance-sheet',
          label: 'Balance Sheet',
          type: 'Report',
          url: '/en-US/accounts/reports?report=balance-sheet',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Debtors & Creditors',
    search: async (query: string) => {
      if ('debtors & creditors'.includes(query.toLowerCase()) || query.toLowerCase().includes('debtors') || query.toLowerCase().includes('creditors')) {
        return [{
          id: 'debtors-creditors',
          label: 'Debtors & Creditors',
          type: 'Report',
          url: '/en-US/accounts/reports?report=debtors-creditors',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Z Report',
    search: async (query: string) => {
      if ('z report'.includes(query.toLowerCase()) || query.toLowerCase().includes('z report')) {
        return [{
          id: 'z-report',
          label: 'Z Report',
          type: 'Report',
          url: '/en-US/accounts/reports?report=z-report',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
];

const genericMenuConfigs = [
  ...reportConfigs,
  ...staticMenuItems
    .filter(item => !deepEntityTypes.some(type => item.label.toLowerCase().includes(type)))
    .map(item => ({
      type: item.label,
      label: item.label,
      search: async (query: string) => {
        if (item.label.toLowerCase().includes(query.toLowerCase())) {
          return [{
            id: item.uri,
            label: item.label,
            type: item.label,
            url: `${item.uri}?search=${encodeURIComponent(query)}`,
          }];
        }
        return [];
      },
    })),
];

export const entityConfigs = [
    {
      type: 'requisition',
      label: 'Requisition',
      search: async (query: string) => {
        try {
          const data = await requisitionsServices.getList({ keyword: query, limit: 5 });
          const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('requisitions'))?.uri;
          return Array.isArray(data?.data)
            ? data.data.map((item: any) => ({
                id: item.id,
                label: item.requisitionNo || item.name || item.title || item.reference || item.id,
                type: 'Requisition',
                url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
                description: 'Requisition',
              }))
            : [];
        } catch {
          return [];
        }
      },
    },
  {
    type: 'ledger',
    label: 'Ledger',
    search: async (query: string) => {
      try {
        const data = await ledgerServices.getLedgers({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('ledgers'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Ledger',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Ledger',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'project',
    label: 'Project',
    search: async (query: string) => {
      try {
        const data = await projectsServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('projects'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Project',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Project',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'product',
    label: 'Product',
    search: async (query: string) => {
      try {
        const data = await productServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('products'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Product',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Product',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'budget',
    label: 'Budget',
    search: async (query: string) => {
      try {
        const data = await budgetsServices.getBudgets({ keyword: query, limit: 5 });
        // Append the user's search query to the URL as a query parameter
        const menuItem = '/en-US/accounts/budgets';
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Budget',
              url: `${menuItem}?search=${encodeURIComponent(query)}`,
              description: 'Budget',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'employee',
    label: 'Employee',
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getEmployeesList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('employees'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.fullName || item.email,
              type: 'Employee',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Employee',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'department',
    label: 'Department',
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getDepartmentsList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('departments'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Department',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Department',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'user',
    label: 'User',
    search: async (query: string) => {
      try {
        const data = await userManagementServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('users management'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.fullName || item.email,
              type: 'User',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'User',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'currency',
    label: 'Currency',
    search: async (query: string) => {
      try {
        const data = await currencyServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('currencies'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Currency',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Currency',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'measurementUnit',
    label: 'Measurement Unit',
    search: async (query: string) => {
      try {
        const data = await measurementUnitServices.getList({ keyword: query, limit: 5 });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('measurement units'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name,
              type: 'Measurement Unit',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Measurement Unit',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'counterSale',
    label: 'Counter Sale',
    search: async (query: string) => {
      try {
        const data = await posServices.getCounterSales({
          counterId: 'all',
          keyword: query,
          limit: 5,
          page: 1,
          from: undefined,
          to: undefined,
          status: undefined,
        });
        const menuItem = staticMenuItems.find(item => item.label.toLowerCase().includes('sales counter'))?.uri;
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.saleNo || item.invoice_no || item.customer_name || item.id,
              type: 'Counter Sale',
              url: menuItem ? `${menuItem}?search=${encodeURIComponent(query)}` : undefined,
              description: 'Counter Sale',
            }))
          : [];
      } catch {
        return [];
      }
    },
  },
  ...genericMenuConfigs
];
