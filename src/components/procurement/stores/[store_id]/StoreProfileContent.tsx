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
      if (checkOrganizationPermission([
        PERMISSIONS.STOCK_ADJUSTMENTS_READ, 
        PERMISSIONS.STOCK_ADJUSTMENTS_CREATE, 
        PERMISSIONS.STOCK_ADJUSTMENTS_EDIT, 
        PERMISSIONS.STOCK_ADJUSTMENTS_DELETE
      ])) {
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

  // Set document title
  useEffect(() => {
    if (documentTitle) {
      document.title = documentTitle;
    }
  }, [documentTitle]);

  // Calculate available tabs based on permissions
  const availableTabs = [
    { label: "Stock", value: TAB_INDICES.STOCK },
    { label: "GRNs", value: TAB_INDICES.GRNS },
    { label: "Transfers", value: TAB_INDICES.TRANSFERS },
    { label: "Consumptions", value: TAB_INDICES.CONSUMPTIONS },
  ];

  if (checkOrganizationPermission([
    PERMISSIONS.STOCK_ADJUSTMENTS_READ, 
    PERMISSIONS.STOCK_ADJUSTMENTS_CREATE, 
    PERMISSIONS.STOCK_ADJUSTMENTS_EDIT, 
    PERMISSIONS.STOCK_ADJUSTMENTS_DELETE
  ])) {
    availableTabs.push({ label: "Adjustments", value: TAB_INDICES.ADJUSTMENTS });
  }

  availableTabs.push({ label: "Reports", value: TAB_INDICES.REPORTS });

  return (
    <Box p={1} sx={{
       bgcolor: 'background.paper',
       borderRadius: '15px',
      } }>
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
  )
}

export default StoreProfileContent