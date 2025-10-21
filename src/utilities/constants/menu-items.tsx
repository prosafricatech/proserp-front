import {
  DashboardOutlined,
  PointOfSaleOutlined,
  FormatListNumberedRtlOutlined,
  ChecklistOutlined,
  AssessmentOutlined,
  StoreOutlined,
  Inventory2Outlined,
  AccountBalanceOutlined,
  ReceiptOutlined,
  ShoppingCartCheckoutOutlined,
  ShoppingCartOutlined,
  StraightenOutlined,
  HandshakeOutlined,
  CorporateFareOutlined,
  ShareOutlined,
  VerifiedOutlined,
  AccountTreeOutlined,
  EditAttributes,
  TuneOutlined,
  ManageAccountsOutlined,
  TroubleshootOutlined,
  CardMembershipOutlined,
  SmsOutlined,
  LocalGasStation,
  RoomPreferences,
} from '@mui/icons-material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolderOpen,
  faUsersGear,
  faBarsProgress,
  faFillDrip,
  faRulerVertical,
} from '@fortawesome/free-solid-svg-icons';

import { Box } from '@mui/material';
import React from 'react';
import { getDictionary } from '@/app/[lang]/dictionaries';

const iconSize = 20;

const muiIcon = (IconComponent: React.ElementType) => (
  <IconComponent sx={{ fontSize: iconSize }} />
);

const faIcon = (icon: any) => (
  <Box sx={{ display: 'flex', alignItems: 'center', width: iconSize, height: iconSize }}>
    <FontAwesomeIcon
      icon={icon}
      style={{
        width: iconSize - 2,
        height: iconSize - 2,
        position: 'relative',
        top: 1,
      }}
    />
  </Box>
);

export const iconMap: Record<string, React.ReactNode> = {
  quickLaunch: muiIcon(DashboardOutlined),
  dashboard: muiIcon(DashboardOutlined),
  requisitions: muiIcon(FormatListNumberedRtlOutlined),
  approvals: muiIcon(ChecklistOutlined),
  barcharts: muiIcon(AssessmentOutlined),
  counter: muiIcon(PointOfSaleOutlined),
  proforma: muiIcon(PointOfSaleOutlined),
  approvedPayments: muiIcon(VerifiedOutlined),
  transactions: muiIcon(ReceiptOutlined),
  reports: muiIcon(AssessmentOutlined),
  product_categories: muiIcon(Inventory2Outlined),
  products: muiIcon(Inventory2Outlined),
  manufacturingMasters: muiIcon(TuneOutlined),
  outlets: muiIcon(StoreOutlined),
  settings: muiIcon(StoreOutlined),
  stakeholders: muiIcon(HandshakeOutlined),
  currencies: muiIcon(AccountBalanceOutlined),
  measurement_units: muiIcon(StraightenOutlined),
  organizations: muiIcon(CorporateFareOutlined),
  invitations: muiIcon(ShareOutlined),
  filesShelf: faIcon(faFolderOpen),
  usersManagement: muiIcon(ManageAccountsOutlined),
  nextSMS: muiIcon(SmsOutlined),
  prosAfricans: faIcon(faUsersGear),
  troubleshooting: muiIcon(TroubleshootOutlined),
  subscriptions: muiIcon(CardMembershipOutlined),
  salesShifts: muiIcon(LocalGasStation),
  dippings: faIcon(faRulerVertical),
  fuelMasters: muiIcon(RoomPreferences),
  projects: faIcon(faBarsProgress),
  consumptions: faIcon(faFillDrip),
  approvedPurchases: muiIcon(ShoppingCartCheckoutOutlined),
  purchases: muiIcon(ShoppingCartOutlined),
  editAttributes: muiIcon(EditAttributes),
  accountTree: muiIcon(AccountTreeOutlined),
};

type MenuEntry = {
  label: string;
  type: 'section' | 'nav-item' | 'collapsible';
  uri?: string;
  icon?: React.ReactNode;
  children?: MenuEntry[];
};

export async function getMenus(locale: string): Promise<MenuEntry[]> {
  const dictionary = await getDictionary(locale);
  const { sidebar } = dictionary;

  return [
    {
      label: sidebar.menu.home,
      type: 'section',
      children: [
        {
          uri: `/${locale}/dashboard`,
          label: sidebar.menuItem.dashboard,
          type: 'nav-item',
          icon: iconMap.dashboard,
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
          icon: iconMap.requisitions,
        },
        {
          uri: `/${locale}/requisition-approvals`,
          label: sidebar.menuItem.approvals,
          type: 'nav-item',
          icon: iconMap.approvals,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.editAttributes,
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
          icon: iconMap.counter,
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
          icon: iconMap.barcharts,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.settings,
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
          icon: iconMap.salesShifts,
        },
        {
          uri: `/${locale}/fuelStations/dippings`,
          label: sidebar.menuItem.dippings,
          type: 'nav-item',
          icon: iconMap.dippings,
        },
        {
          uri: `/${locale}/fuelStations/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: iconMap.reports,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.fuelMasters,
          children: [
            {
              uri: `/${locale}/fuelStations/stations`,
              label: sidebar.menuItem.stations,
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
          icon: iconMap.requisitions,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.manufacturingMasters,
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
          icon: iconMap.projects,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.accountTree,
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
    {
      label: sidebar.menu.accounts_and_finance,
      type: 'section',
      children: [
        {
          uri: `/${locale}/accounts/approvedPayments`,
          label: sidebar.menuItem.approvedPayments,
          type: 'nav-item',
          icon: iconMap.approvedPayments,
        },
        {
          uri: `/${locale}/accounts/transactions`,
          label: sidebar.menuItem.transactions,
          type: 'nav-item',
          icon: iconMap.transactions,
        },
        {
          uri: `/${locale}/accounts/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: iconMap.reports,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.currencies,
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
          icon: iconMap.approvedPurchases,
        },
        {
          uri: `/${locale}/procurement/purchases`,
          label: sidebar.menuItem.purchases,
          type: 'nav-item',
          icon: iconMap.purchases,
        },
        {
          uri: `/${locale}/procurement/consumptions`,
          label: sidebar.menuItem.consumptions,
          type: 'nav-item',
          icon: iconMap.consumptions,
        },
        {
          uri: `/${locale}/procurement/reports`,
          label: sidebar.menuItem.reports,
          type: 'nav-item',
          icon: iconMap.barcharts,
        },
        {
          label: sidebar.menuItem.masters,
          type: 'collapsible',
          icon: iconMap.products,
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
          icon: iconMap.filesShelf,
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
          icon: iconMap.stakeholders,
        },
        {
          uri: `/${locale}/masters/currencies`,
          label: sidebar.menuItem.currencies,
          type: 'nav-item',
          icon: iconMap.currencies,
        },
        {
          uri: `/${locale}/masters/measurement_units`,
          label: sidebar.menuItem.measurement_units,
          type: 'nav-item',
          icon: iconMap.measurement_units,
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
          icon: iconMap.prosAfricans,
        },
        {
          uri: `/${locale}/prosControl/subscriptions`,
          label: sidebar.menuItem.subscriptions,
          type: 'nav-item',
          icon: iconMap.subscriptions,
        },
        {
          uri: `/${locale}/prosControl/troubleshooting`,
          label: sidebar.menuItem.troubleshooting,
          type: 'nav-item',
          icon: iconMap.troubleshooting,
        },
        {
          uri: `/${locale}/prosControl/usersManagement`,
          label: sidebar.menuItem.usersManagement,
          type: 'nav-item',
          icon: iconMap.usersManagement,
        },
        {
          uri: `/${locale}/prosControl/nextSMS`,
          label: sidebar.menuItem.nextSMS,
          type: 'nav-item',
          icon: iconMap.nextSMS,
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
          icon: iconMap.organizations,
        },
        {
          uri: `/${locale}/invitations`,
          label: sidebar.menuItem.invitations,
          type: 'nav-item',
          icon: iconMap.invitations,
        },
      ],
    },
  ];
}
