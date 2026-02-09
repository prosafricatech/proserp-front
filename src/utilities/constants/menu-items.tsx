import { getDictionary } from '@/app/[lang]/dictionaries';
import { IconName } from './icons';

export async function getMenus(locale: string) {
  const dictionary = await getDictionary(locale);
  const { sidebar } = dictionary;

  const icon = (name: IconName): IconName => name;

  return [
    {
      label: sidebar.menu.home,
      type: 'section',
      children: [
        {
          uri: `/${locale}/dashboard`,
          label: sidebar.menuItem.dashboard,
          type: 'nav-item',
          icon: icon('dashboard'),
        },
      ],
    },
    {
      label: sidebar.menu.processApproval,
      type: 'section',
      children: [
        {
          uri: `/${locale}/requisitions`,
          label: sidebar.menuItem.requisitions,
          type: 'nav-item',
          icon: icon('requisitions'),
        },
        {
          uri: `/${locale}/requisition-approvals`,
          label: sidebar.menuItem.approvals,
          type: 'nav-item',
          icon: icon('approvals'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('editAttributes'),
          children: [
            {
              uri: `/${locale}/approval-chains`,
              label: sidebar.menuItem.approvalChains,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.pos,
      type: 'section',
      children: [
        {
          label: sidebar.menuItem.sales,
          type: 'collapsible',
          icon: icon('counter'),
          children: [
            {
              uri: `/${locale}/pos/sales-counters`,
              label: sidebar.menuItem.salesCounter,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/pos/proformas`,
              label: sidebar.menuItem.proformas,
              type: 'nav-item',
            },
          ],
        },
        {
          uri: `/${locale}/pos/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: icon('barcharts'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('settings'),
          children: [
            {
              uri: `/${locale}/pos/outlets`,
              label: sidebar.menuItem.outlets,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/pos/price_lists`,
              label: sidebar.menuItem.priceLists,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/pos/pos-settings`,
              label: sidebar.menuItem.settings,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.fuelStations,
      type: 'section',
      children: [
        {
          uri: `/${locale}/fuelStations/salesShifts`,
          label: sidebar.menuItem.salesShifts,
          type: 'nav-item',
          icon: icon('salesShifts'),
        },
        {
          uri: `/${locale}/fuelStations/dippings`,
          label: sidebar.menuItem.dippings,
          type: 'nav-item',
          icon: icon('dippings'),
        },
        {
          uri: `/${locale}/fuelStations/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: icon('reports'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('fuelMasters'),
          children: [
            {
              uri: `/${locale}/fuelStations/stations`,
              label: sidebar.menuItem.stations,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/fuelStations/price_lists`,
              label: sidebar.menuItem.priceLists,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.manufacturing,
      type: 'section',
      children: [
        {
          uri: `/${locale}/manufacturing/batches`,
          label: sidebar.menuItem.batches,
          type: 'nav-item',
          icon: icon('requisitions'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('manufacturingMasters'),
          children: [
            {
              uri: `/${locale}/manufacturing/boms`,
              label: sidebar.menuItem.boms,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.projectManagement,
      type: 'section',
      children: [
        {
          uri: `/${locale}/projectManagement/projects`,
          label: sidebar.menuItem.projects,
          type: 'nav-item',
          icon: icon('projects'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('accountTree'),
          children: [
            {
              uri: `/${locale}/projectManagement/projectCategories`,
              label: sidebar.menuItem.projectCategories,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    // {
    //   label: sidebar.menu.humanResources,
    //   type: 'section',
    //   children: [
    //     {
    //       uri: `/${locale}/humanResources/employees`,
    //       label: sidebar.menuItem.employees,
    //       type: 'nav-item',
    //       icon: icon('employees'),
    //     },
    //     {
    //       label: sidebar.menuItem.masters,
    //       type: 'collapsible',
    //       icon: icon('businessCenter'),
    //       children: [
    //         {
    //           uri: `/${locale}/humanResources/departments`,
    //           label: sidebar.menuItem.departments,
    //           type: 'nav-item',
    //         },
    //         {
    //           uri: `/${locale}/humanResources/leave_types`,
    //           label: sidebar.menuItem.leave_types,
    //           type: 'nav-item',
    //         },
    //         {
    //           uri: `/${locale}/humanResources/designations`,
    //           label: sidebar.menuItem.designations,
    //           type: 'nav-item',
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      label: sidebar.menu.accounts_and_finance,
      type: 'section',
      children: [
        {
          uri: `/${locale}/accounts/approvedPayments`,
          label: sidebar.menuItem.approvedPayments,
          type: 'nav-item',
          icon: icon('approvedPayments'),
        },
        {
          uri: `/${locale}/accounts/transactions`,
          label: sidebar.menuItem.transactions,
          type: 'nav-item',
          icon: icon('transactions'),
        },
        {
          uri: `/${locale}/accounts/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: icon('reports'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('currencies'),
          children: [
            {
              uri: `/${locale}/accounts/ledger_groups`,
              label: sidebar.menuItem.ledgerGroups,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/accounts/ledgers`,
              label: sidebar.menuItem.ledgers,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/cost_centers`,
              label: sidebar.menuItem.costCenters,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.procurementAndSupply,
      type: 'section',
      children: [
        {
          uri: `/${locale}/procurement/approvedPurchases`,
          label: sidebar.menuItem.approvedPurchases,
          type: 'nav-item',
          icon: icon('approvedPurchases'),
        },
        {
          uri: `/${locale}/procurement/purchases`,
          label: sidebar.menuItem.purchases,
          type: 'nav-item',
          icon: icon('purchases'),
        },
        {
          uri: `/${locale}/procurement/consumptions`,
          label: sidebar.menuItem.consumptions,
          type: 'nav-item',
          icon: icon('consumptions'),
        },
        {
          uri: `/${locale}/procurement/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: icon('barcharts'),
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: icon('products'),
          children: [
            {
              uri: `/${locale}/procurement/product_categories`,
              label: sidebar.menuItem.product_categories,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/procurement/products`,
              label: sidebar.menuItem.products,
              type: 'nav-item',
            },
            {
              uri: `/${locale}/procurement/stores`,
              label: sidebar.menuItem.stores,
              type: 'nav-item',
            },
          ],
        },
      ],
    },
    {
      label: sidebar.menu.tools,
      type: 'section',
      children: [
        {
          uri: `/${locale}/filesShelf`,
          label: sidebar.menuItem.filesShelf,
          type: 'nav-item',
          icon: icon('filesShelf'),
        },
      ],
    },
    {
      label: sidebar.menuItem.masters,
      type: 'section',
      children: [
        {
          uri: `/${locale}/masters/stakeholders`,
          label: sidebar.menuItem.stakeholders,
          type: 'nav-item',
          icon: icon('stakeholders'),
        },
        {
          uri: `/${locale}/masters/currencies`,
          label: sidebar.menuItem.currencies,
          type: 'nav-item',
          icon: icon('currencies'),
        },
        {
          uri: `/${locale}/masters/measurement_units`,
          label: sidebar.menuItem.measurement_units,
          type: 'nav-item',
          icon: icon('measurement_units'),
        },
      ],
    },
    {
      label: sidebar.menu.prosControl,
      type: 'section',
      children: [
        {
          uri: `/${locale}/prosControl/prosAfricans`,
          label: sidebar.menuItem.prosAfricans,
          type: 'nav-item',
          icon: icon('prosAfricans'),
        },
        {
          uri: `/${locale}/prosControl/subscriptions`,
          label: sidebar.menuItem.subscriptions,
          type: 'nav-item',
          icon: icon('subscriptions'),
        },
        {
          uri: `/${locale}/prosControl/troubleshooting`,
          label: sidebar.menuItem.troubleshooting,
          type: 'nav-item',
          icon: icon('troubleshooting'),
        },
        {
          uri: `/${locale}/prosControl/usersManagement`,
          label: sidebar.menuItem.usersManagement,
          type: 'nav-item',
          icon: icon('usersManagement'),
        },
        {
          uri: `/${locale}/prosControl/nextSMS`,
          label: sidebar.menuItem.nextSMS,
          type: 'nav-item',
          icon: icon('nextSMS'),
        },
      ],
    },
    {
      label: sidebar.menu.organizations,
      type: 'section',
      children: [
        {
          uri: `/${locale}/organizations`,
          label: sidebar.menuItem.organizations,
          type: 'nav-item',
          icon: icon('organizations'),
        },
        {
          uri: `/${locale}/invitations`,
          label: sidebar.menuItem.invitations,
          type: 'nav-item',
          icon: icon('invitations'),
        },
      ],
    },
  ];
}
