import { Box, LinearProgress, Tab, Tabs } from '@mui/material'
import React, { lazy, useEffect, useState } from 'react'
import { useStoreProfile } from './StoreProfileProvider'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
const StoreReports = lazy(() => import('./reports/StoreReports'));
const StockAdjustments = lazy(() => import('./stockAdjustments/StockAdjustments'));
const Transfer = lazy(() => import('./inventoryTransfer/InventoryTransfer'));
const InventoryConsumptions = lazy(() => import('../../inventoryConsumptions/InventoryConsumptionsTab'));
const Grns = lazy(() => import('../../grns/Grns'));
const StoreStock = lazy(() => import('./storeStock/StoreStock'));

const TAB_INDICES = {
  STOCK: 0,
  GRNS: 1,
  TRANSFERS: 2,
  CONSUMPTIONS: 3,
  ADJUSTMENTS: 4,
  REPORTS: 5
};

function StoreProfileContent() {
  const {checkOrganizationPermission} = useJumboAuth();
  const {setContent, content, isFetchingStore, activeStore}: any = useStoreProfile();
  
  // Initialize content from sessionStorage
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized) {
      const savedContent = sessionStorage.getItem('storeProfileActiveTab');
      if (savedContent !== null) {
        const tabIndex = parseInt(savedContent, 10);
        // Validate tab index
        const maxTab = checkOrganizationPermission([
          PERMISSIONS.STOCK_ADJUSTMENTS_READ, 
          PERMISSIONS.STOCK_ADJUSTMENTS_CREATE, 
          PERMISSIONS.STOCK_ADJUSTMENTS_EDIT, 
          PERMISSIONS.STOCK_ADJUSTMENTS_DELETE
        ]) ? TAB_INDICES.REPORTS : TAB_INDICES.REPORTS - 1;
        
        if (tabIndex >= 0 && tabIndex <= maxTab) {
          setContent(tabIndex);
        }
      }
      setInitialized(true);
    }
  }, [checkOrganizationPermission, initialized, setContent]);

  // Save content to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && initialized) {
      sessionStorage.setItem('storeProfileActiveTab', content.toString());
    }
  }, [content, initialized]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setContent(newValue);
  };

  if(isFetchingStore){
    return <LinearProgress/>
  }

  let contentComponent;
  let documentTitle = '';

  // Set document title
  useEffect(() => {
    if (documentTitle) {
      document.title = documentTitle;
    }
  }, [documentTitle]);


  // Permission constants for easier checks
  const hasStoresRead = checkOrganizationPermission([
    PERMISSIONS.STORES_READ
  ]);
  const hasStoresReports = checkOrganizationPermission([
    PERMISSIONS.STORES_REPORTS
  ]);
  const hasTransferPermission = checkOrganizationPermission([
    PERMISSIONS.INVENTORY_TRANSFERS_READ,
    PERMISSIONS.INVENTORY_TRANSFERS_CREATE,
    PERMISSIONS.INVENTORY_TRANSFERS_EDIT,
    PERMISSIONS.INVENTORY_TRANSFERS_DELETE
  ]);
  const hasAdjustmentsPermission = checkOrganizationPermission([
    PERMISSIONS.STOCK_ADJUSTMENTS_READ, 
    PERMISSIONS.STOCK_ADJUSTMENTS_CREATE, 
    PERMISSIONS.STOCK_ADJUSTMENTS_EDIT, 
    PERMISSIONS.STOCK_ADJUSTMENTS_DELETE
  ]);

  let availableTabs: { label: string; value: number }[] = [];

  // If only transfer permission, always show Transfers tab and content
  if (!hasStoresRead && hasTransferPermission) {
    documentTitle = `Inventory Transfers | ${activeStore?.name}`;
    contentComponent = <Transfer/>;
  } else {
    switch(content) {
      case TAB_INDICES.STOCK:
        documentTitle = `Store Stock | ${activeStore?.name}`;
        contentComponent = <StoreStock/>;
        break;
      case TAB_INDICES.GRNS:
        documentTitle = `GRNs | ${activeStore?.name}`;
        contentComponent = <Grns />;
        break;
      case TAB_INDICES.TRANSFERS:
        documentTitle = `Inventory Transfers | ${activeStore?.name}`;
        contentComponent = <Transfer/>;
        break;
      case TAB_INDICES.CONSUMPTIONS:
        documentTitle = `Inventory Consumptions | ${activeStore?.name}`;
        contentComponent = <InventoryConsumptions/>;
        break;
      case TAB_INDICES.ADJUSTMENTS:
        if (hasAdjustmentsPermission) {
          documentTitle = `Stock Adjustments | ${activeStore?.name}`;
          contentComponent = <StockAdjustments />;
        }
        break;
      case TAB_INDICES.REPORTS:
        documentTitle = `Store Reports | ${activeStore?.name}`;
        contentComponent = <StoreReports/>;
        break;
      default:
        // Fallback to stock if invalid tab
        documentTitle = `Store Stock | ${activeStore?.name}`;
        contentComponent = <StoreStock/>;
    }
  }

  // If user has only transfer permission, show only Transfers tab
  if (!hasStoresRead && hasTransferPermission) {
    availableTabs = [
      { label: "Transfers", value: TAB_INDICES.TRANSFERS }
    ];
  } else if (hasStoresRead) {
    availableTabs = [
      { label: "Stock", value: TAB_INDICES.STOCK },
      { label: "GRNs", value: TAB_INDICES.GRNS },
      { label: "Consumptions", value: TAB_INDICES.CONSUMPTIONS }
    ];
    if (hasTransferPermission) {
      availableTabs.splice(2, 0, { label: "Transfers", value: TAB_INDICES.TRANSFERS });
    }
    if (hasAdjustmentsPermission) {
      availableTabs.push({ label: "Adjustments", value: TAB_INDICES.ADJUSTMENTS });
    }
    if (hasStoresReports) {
      availableTabs.push({ label: "Reports", value: TAB_INDICES.REPORTS });
    }
  }

  // If only transfer permission, force tab selection to Transfers
  if (!hasStoresRead && hasTransferPermission) {
    return (
      <Box p={1} sx={{
        bgcolor: 'background.paper',
        borderRadius: '15px',
      }}>
        <Tabs
          value={TAB_INDICES.TRANSFERS}
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
        >
          <Tab key={TAB_INDICES.TRANSFERS} label="Transfers" value={TAB_INDICES.TRANSFERS} />
        </Tabs>
        {contentComponent}
      </Box>
    );
  }
  // Otherwise, render as normal
  return (
    <Box p={1} sx={{
      bgcolor: 'background.paper',
      borderRadius: '15px',
    }}>
      <Tabs
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        value={content}
        onChange={handleTabChange}
      >
        {availableTabs.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            value={tab.value}
          />
        ))}
      </Tabs>
      {contentComponent}
    </Box>
  );
}

export default StoreProfileContent