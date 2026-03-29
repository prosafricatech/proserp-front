'use client'

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
import purchaseServices from '../procurement/purchases/purchase-services';
import stakeholderServices from '../masters/stakeholders/stakeholder-services';
import { MODULES } from '@/utilities/constants/modules';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';

// Helper: lowercased entity types already covered by deep search
const deepEntityTypes = [
  'ledger', 'project', 'product', 'budget', 'employee', 'department', 
  'user', 'requisition', 'currency', 'measurement unit', 'counter sale'
];

// ==================== MASTER DATA CONFIGURATIONS ====================

const masterDataConfigs = [
  {
    type: 'stakeholder',
    label: 'Stakeholder',
    search: async (query: string) => {
      try {
        const data = await stakeholderServices.getList({ type: 'all', keyword: query, page: 1, limit: 5 });
        const menuItem = '/en-US/masters/stakeholders';
        return Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                (item.email && item.email.toLowerCase().includes(query.toLowerCase())) ||
                (item.code && item.code.toLowerCase().includes(query.toLowerCase()))
              )
              .map((item: any) => ({
                id: item.id,
                label: item.name || item.email || item.code || item.id,
                type: 'Stakeholder',
                url: `${menuItem}?search=${encodeURIComponent(item.name || item.email || item.code || query)}`,
                description: item.email || item.code || '',
              }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'costCenter',
    label: 'Cost Center',
    search: async (query: string) => {
      try {
        const service = (await import('@/components/masters/costCenters/cost-center-services')).default;
        const data = await service.getList({ keyword: query, limit: 1000 });
        const menuItem = '/en-US/cost_centers';
        return Array.isArray(data?.data)
          ? data.data.map((item: any) => ({
              id: item.id,
              label: item.name || item.code || item.id,
              type: 'Cost Center',
              url: `${menuItem}?search=${encodeURIComponent(item.name || query)}`,
              description: 'Cost Center',
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
        const data = await currencyServices.getList({ keyword: query, limit: 1000 });
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
        const data = await measurementUnitServices.getList({ keyword: query, limit: 1000 });
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
    type: 'department',
    label: 'Department',
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getDepartmentsList({ keyword: query, limit: 1000 });
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
];

// ==================== ACCOUNTING & FINANCE CONFIGURATIONS ====================

const accountingConfigs = [
  {
    type: 'ledger',
    label: 'Ledger',
    search: async (query: string) => {
      try {
        const data = await ledgerServices.getLedgers({ keyword: query, limit: 1000 });
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
    type: 'budget',
    label: 'Budget',
    search: async (query: string) => {
      try {
        const data = await budgetsServices.getBudgets({ keyword: query, limit: 1000 });
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
    type: 'transaction',
    label: 'Transaction',
    search: async (query: string) => {
      try {
        const types = ['payments', 'receipts', 'journal_vouchers', 'transfers', 'debit', 'credit'];
        let results: any[] = [];
        const menuItem = '/en-US/accounts/transactions';
        
        for (const type of types) {
          const service = (await import('@/components/accounts/transactions/transactions-services')).default;
          const data = await service.getList({ keyword: query, limit: 1000, type });
          if (Array.isArray(data?.data)) {
            results = results.concat(
              data.data.map((item: any) => ({
                id: item.id,
                label: item.voucherNo || item.transactionNo || item.reference || item.narration || item.id,
                type: `Transaction (${type.replace('_', ' ')})`,
                url: `${menuItem}?type=${type}&search=${encodeURIComponent(query)}`,
                description: `Transaction - ${type.replace('_', ' ')}`,
              }))
            );
          }
        }
        return results;
      } catch {
        return [];
      }
    },
  },
];

// ==================== FINANCIAL REPORTS CONFIGURATIONS ====================

const financialReportsConfigs = [
  {
    type: 'report',
    label: 'Trial Balance',
    search: async (query: string) => {
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('trial balance'.includes(query.toLowerCase()) || query.toLowerCase().includes('trial balance')) {
        return [{
          id: 'trial-balance',
          label: 'Trial Balance',
          type: 'Financial Report',
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
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('income statement'.includes(query.toLowerCase()) || query.toLowerCase().includes('income statement')) {
        return [{
          id: 'income-statement',
          label: 'Income Statement',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=income-statement',
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
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('balance sheet'.includes(query.toLowerCase()) || query.toLowerCase().includes('balance sheet')) {
        return [{
          id: 'balance-sheet',
          label: 'Balance Sheet',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=balance-sheet',
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
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('cashier report'.includes(query.toLowerCase()) || query.toLowerCase().includes('cashier report')) {
        return [{
          id: 'cashier-report',
          label: 'Cashier Report',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=cashier-report',
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
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('debtors & creditors'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('debtors') || 
          query.toLowerCase().includes('creditors')) {
        return [{
          id: 'debtors-creditors',
          label: 'Debtors & Creditors',
          type: 'Financial Report',
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
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.ACCOUNTS_REPORTS)) return [];
      if ('z report'.includes(query.toLowerCase()) || query.toLowerCase().includes('z report')) {
        return [{
          id: 'z-report',
          label: 'Z Report',
          type: 'Financial Report',
          url: '/en-US/accounts/reports?report=z-report',
          description: 'Financial Report',
        }];
      }
      return [];
    },
  },
];

// ==================== PROCUREMENT & SUPPLY CONFIGURATIONS ====================

const procurementConfigs = [
  {
    type: 'requisition',
    label: 'Requisition',
    search: async (query: string) => {
      try {
        const data = await requisitionsServices.getList({ keyword: query, limit: 1000 });
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
    type: 'purchaseOrder',
    label: 'Purchase Order',
    search: async (query: string) => {
      try {
        const data = await purchaseServices.getList({ keyword: query, limit: 5 });
        const menuItem = '/en-US/procurement/purchases';
        return Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.orderNo && item.orderNo.toLowerCase().includes(query.toLowerCase())) ||
                'purchases order'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('purchases order')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.orderNo || item.id,
                type: 'Purchase Order',
                url: `${menuItem}?search=${encodeURIComponent(item.orderNo || query)}`,
                description: 'Purchase Order',
              }))
          : [];
      } catch {
        return [];
      }
    },
  },
  {
    type: 'report',
    label: 'Procurement Reports',
    search: async (query: string) => {
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.PURCHASES_REPORTS)) return [];
      const q = query.toLowerCase();
      if (q.includes('procurement report') || 
          q.includes('procurement & supply report') || 
          q.includes('procurement and supply report')) {
        return [
          {
            id: 'procurement-product-insights',
            label: 'Product Insights',
            type: 'Procurement Report',
            url: '/en-US/procurement/reports?report=product-insights',
            description: 'Procurement & Supply Report',
          },
          {
            id: 'procurement-purchases-report',
            label: 'Purchases Report',
            type: 'Procurement Report',
            url: '/en-US/procurement/reports?report=purchases-report',
            description: 'Procurement & Supply Report',
          },
        ];
      }
      return [];
    },
  },
];

// ==================== PROJECT MANAGEMENT CONFIGURATIONS ====================

const projectConfigs = [
  {
    type: 'project',
    label: 'Project',
    search: async (query: string) => {
      try {
        const data = await projectsServices.getList({ keyword: query, limit: 1000 });
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
];

// ==================== HR & USER MANAGEMENT CONFIGURATIONS ====================

const hrUserConfigs = [
  {
    type: 'employee',
    label: 'Employee',
    search: async (query: string) => {
      try {
        const data = await humanResourcesServices.getEmployeesList({ keyword: query, limit: 1000 });
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
    type: 'user',
    label: 'User',
    search: async (query: string) => {
      try {
        const data = await userManagementServices.getList({ keyword: query, limit: 1000 });
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
];

// ==================== PRODUCT & SERVICES CONFIGURATIONS ====================

const productConfigs = [
  {
    type: 'product',
    label: 'Product',
    search: async (query: string) => {
      try {
        const data = await productServices.getList({ keyword: query, limit: 1000 });
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
];

// ==================== POINT OF SALE CONFIGURATIONS ====================

const posConfigs = [
  {
    type: 'outlet',
    label: 'Sales Outlet',
    search: async (query: string) => {
      try {
        const data = await (await import('@/components/pos/outlet/outlet-services')).default.getList({ keyword: query, limit: 5 });
        const results = Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.name && item.name.toLowerCase().includes(query.toLowerCase())) ||
                'sales outlet'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('sales outlet')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.name || item.id,
                type: 'Sales Outlet',
                url: `/en-US/pos/outlets?search=${encodeURIComponent(item.name || query)}`,
                description: 'Sales Outlet',
              }))
          : [];
        return results;
      } catch {
        return [];
      }
    },
  },
  {
    type: 'proforma',
    label: 'Proforma Invoice',
    search: async (query: string) => {
      try {
        const data = await (await import('@/components/pos/proformaInvoices/proforma-services')).default.getList({ 
          keyword: query, 
          limit: 5, 
          sales_outlet_id: 'all' 
        });
        const results = Array.isArray(data?.data)
          ? data.data
              .filter((item: any) =>
                (item.proformaNo && item.proformaNo.toLowerCase().includes(query.toLowerCase())) ||
                'proforma invoice'.includes(query.toLowerCase()) ||
                query.toLowerCase().includes('proforma invoice')
              )
              .map((item: any) => ({
                id: item.id,
                label: item.proformaNo || item.id,
                type: 'Proforma Invoice',
                url: `/en-US/pos/proformas?search=${encodeURIComponent(item.proformaNo || query)}`,
                description: 'Proforma Invoice',
              }))
          : [];
        return results;
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
          limit: 1000,
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
  {
    type: 'report',
    label: 'Cashier Report (POS)',
    search: async (query: string) => {
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('cashier report'.includes(query.toLowerCase()) || query.toLowerCase().includes('cashier report')) {
        return [{
          id: 'pos-cashier-report',
          label: 'Cashier Report',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=cashier-report',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales Manifest',
    search: async (query: string) => {
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales manifest'.includes(query.toLowerCase()) || query.toLowerCase().includes('sales manifest')) {
        return [{
          id: 'pos-sales-manifest',
          label: 'Sales Manifest',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-manifest',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales & Cash Summary',
    search: async (query: string) => {
      const { checkOrganizationPermission } = useJumboAuth();
      if (!checkOrganizationPermission || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales & cash summary'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('sales & cash summary') || 
          query.toLowerCase().includes('sales and cash summary')) {
        return [{
          id: 'pos-sales-cash-summary',
          label: 'Sales & Cash Summary',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-cash-summary',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
];

// ==================== FUEL STATION CONFIGURATIONS ====================

const fuelStationConfigs = [
  {
    type: 'report',
    label: 'Dipping Report',
    search: async (query: string) => {
      const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
      if (!organizationHasSubscribed(MODULES.FUEL_STATION) || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('dipping report'.includes(query.toLowerCase()) || query.toLowerCase().includes('dipping report')) {
        return [{
          id: 'fuel-dipping-report',
          label: 'Dipping Report',
          type: 'Fuel Station Report',
          url: '/en-US/fuelStations/reports?report=dipping-report',
          description: 'Fuel Station Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'FV Report',
    search: async (query: string) => {
      const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
      if (!organizationHasSubscribed(MODULES.FUEL_STATION) || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('fv report'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('fv report') || 
          query.toLowerCase().includes('fuel vouchers report')) {
        return [{
          id: 'fuel-fv-report',
          label: 'FV Report',
          type: 'Fuel Station Report',
          url: '/en-US/fuelStations/reports?report=fv-report',
          description: 'Fuel Station Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales Manifest',
    search: async (query: string) => {
      const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
      if (!organizationHasSubscribed(MODULES.POINT_OF_SALE) || !checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales manifest'.includes(query.toLowerCase()) || query.toLowerCase().includes('sales manifest')) {
        return [{
          id: 'pos-sales-manifest',
          label: 'Sales Manifest',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-manifest',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
  {
    type: 'report',
    label: 'Sales & Cash Summary',
    search: async (query: string) => {
      const { checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
      if (!organizationHasSubscribed(MODULES.FUEL_STATION) && !organizationHasSubscribed(MODULES.POINT_OF_SALE)) return [];
      if (!checkOrganizationPermission(PERMISSIONS.SALES_REPORTS)) return [];
      if ('sales & cash summary'.includes(query.toLowerCase()) || 
          query.toLowerCase().includes('sales & cash summary') || 
          query.toLowerCase().includes('sales and cash summary')) {
        return [{
          id: 'pos-sales-cash-summary',
          label: 'Sales & Cash Summary',
          type: 'POS Report',
          url: '/en-US/pos/reports?report=sales-cash-summary',
          description: 'POS Sales Report',
        }];
      }
      return [];
    },
  },
];

// ==================== GENERIC MENU CONFIGURATIONS ====================

const genericMenuConfigs = [
  ...masterDataConfigs,
  ...accountingConfigs,
  ...financialReportsConfigs,
  ...procurementConfigs,
  ...projectConfigs,
  ...hrUserConfigs,
  ...productConfigs,
  ...posConfigs,
  ...fuelStationConfigs,
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
  ...genericMenuConfigs
];