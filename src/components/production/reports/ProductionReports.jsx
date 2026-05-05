'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import { DateTimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import productionBatchesServices from '../batches/productionBatchesServices';
import ProductsSelectProvider, { useProductsSelect } from '@/components/productAndServices/products/ProductsSelectProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import productionReportsServices from './productionReportsServices';
import OutputReport from './OutputReport';
import CostReport from './CostReport';
import UnsubscribedAccess from '@/shared/Information/UnsubscribedAccess';
import { MODULES } from '@/utilities/constants/modules';
import UnauthorizedAccess from '@/shared/Information/UnauthorizedAccess';
import { PERMISSIONS } from '@/utilities/constants/permissions';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function ProductionReportsContent() {
  const theme = useTheme();
  const isDark = theme.type === 'dark';
  const { authUser, authOrganization, checkOrganizationPermission, organizationHasSubscribed } = useJumboAuth();
  const { productOptions } = useProductsSelect();
  const organization = authOrganization?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;

  const [selectedTab, setSelectedTab] = useState(0);
  const [from, setFrom] = useState(dayjs().startOf('month'));
  const [to, setTo] = useState(dayjs().endOf('day'));
  const [selectedWorkCenter, setSelectedWorkCenter] = useState(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterError, setFilterError] = useState('');
  const [outputReport, setOutputReport] = useState(null);
  const [costReport, setCostReport] = useState(null);
  const [outputLoading, setOutputLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [outputError, setOutputError] = useState('');
  const [costError, setCostError] = useState('');
  const [mounted, setMounted] = useState(false);

  const { data: workcenters = [], isPending: isFetchingWorkCenters } = useQuery({
    queryKey: ['userWorkCenters', { userId: authUser?.user?.id, type: 'work center' }],
    queryFn: productionBatchesServices.getUserWorkCenters,
    enabled: !!authUser?.user?.id,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (workcenters.length === 1) {
      setSelectedWorkCenter(workcenters[0]);
    }
  }, [workcenters]);

  const reconciliation = useMemo(() => {
    if (!outputReport?.summary || !costReport?.summary) {
      return null;
    }

    const outputValue = Number(outputReport.summary.total_output_value || 0);
    const netCost = Number(costReport.summary.net_production_cost || 0);
    const difference = outputValue - netCost;

    return {
      outputValue,
      netCost,
      difference,
      matches: Math.abs(difference) < 0.01,
    };
  }, [outputReport, costReport]);

  const handleGenerateReport = async () => {
    if (!from || !to) {
      setFilterError('From and To dates are required.');
      return;
    }

    setFilterError('');
    setOutputError('');
    setCostError('');
    setOutputLoading(true);
    setCostLoading(true);

    const sharedParams = {
      from: dayjs(from).toISOString(),
      to: dayjs(to).toISOString(),
      ...(selectedWorkCenter?.id ? { work_center_id: selectedWorkCenter.id } : {}),
      ...(selectedCostCenter?.id ? { cost_center_id: selectedCostCenter.id } : {}),
    };

    const outputPromise = productionReportsServices
      .getOutputReport({
        ...sharedParams,
        ...(selectedProduct?.id ? { product_id: selectedProduct.id } : {}),
      })
      .then((data) => {
        setOutputReport(data);
      })
      .catch((err) => {
        setOutputError(err?.response?.data?.message || 'Failed to load output report.');
      })
      .finally(() => {
        setOutputLoading(false);
      });

    const costPromise = productionReportsServices
      .getCostReport(sharedParams)
      .then((data) => {
        setCostReport(data);
      })
      .catch((err) => {
        setCostError(err?.response?.data?.message || 'Failed to load cost report.');
      })
      .finally(() => {
        setCostLoading(false);
      });

    await Promise.allSettled([outputPromise, costPromise]);
  };

  const handleCostCenterChange = (value) => {
    setSelectedCostCenter(Array.isArray(value) ? value[0] || null : value);
  };

  if (!mounted) {
    return null;
  }

  // if (!organizationHasSubscribed(MODULES.MANUFACTURING_AND_PROCESSING)) {
  //   return <UnsubscribedAccess modules={'Manufacturing & Processing'} />;
  // }

  // if (!checkOrganizationPermission([PERMISSIONS.PRODUCTION_BATCHES_READ])) {
  //   return <UnauthorizedAccess />;
  // }

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ color: headerColor, fontWeight: 700 }}>
        Production Reports
      </Typography>
      <JumboCardQuick sx={{ overflow: 'visible' }}>
        <Stack spacing={2}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 5, bgcolor: 'background.paper', py: 1 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <DateTimePicker
                  label="From"
                  value={from}
                  onChange={setFrom}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <DateTimePicker
                  label="To"
                  value={to}
                  onChange={setTo}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2 }}>
                <Autocomplete
                  size="small"
                  loading={isFetchingWorkCenters}
                  options={workcenters}
                  value={selectedWorkCenter}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option?.name || ''}
                  onChange={(_event, newValue) => setSelectedWorkCenter(newValue)}
                  renderInput={(params) => <TextField {...params} label="Work Center" fullWidth />}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2 }}>
                <CostCenterSelector
                  label="Cost Center"
                  multiple={false}
                  defaultValue={selectedCostCenter}
                  onChange={handleCostCenterChange}
                />
              </Grid>
              {selectedTab === 0 && (
                <Grid size={{ xs: 12, md: 8, lg: 2 }}>
                  <Autocomplete
                    size="small"
                    options={productOptions}
                    value={selectedProduct}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(option) => option?.name || option?.item_name || ''}
                    onChange={(_event, newValue) => setSelectedProduct(newValue)}
                    renderInput={(params) => <TextField {...params} label="Finished Product" fullWidth />}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, md: 4, lg: selectedTab === 0 ? 12 : 2 }}>
                <Button fullWidth variant="contained" onClick={handleGenerateReport} sx={{ minHeight: 40 }}>
                  Generate Report
                </Button>
              </Grid>
            </Grid>
            {filterError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {filterError}
              </Alert>
            )}
            {reconciliation && (
              <Alert severity={reconciliation.matches ? 'success' : 'warning'} sx={{ mt: 2 }}>
                Output value {reconciliation.matches ? 'matches' : 'does not match'} net production cost.
                {!reconciliation.matches
                  ? ` Difference: ${Number(reconciliation.difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
                  : ''}
              </Alert>
            )}
          </Box>

          {(outputLoading || costLoading) && <LinearProgress />}

          <Tabs value={selectedTab} onChange={(_event, newValue) => setSelectedTab(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab label="Output Report" />
            <Tab label="Cost Report" />
          </Tabs>

          <TabPanel value={selectedTab} index={0}>
            <OutputReport
              report={outputReport}
              isLoading={outputLoading}
              error={outputError}
              headerColor={headerColor}
              contrastText={contrastText}
              lightColor={lightColor}
              isDark={isDark}
            />
          </TabPanel>

          <TabPanel value={selectedTab} index={1}>
            <CostReport
              report={costReport}
              isLoading={costLoading}
              error={costError}
              headerColor={headerColor}
              comparisonOutputValue={outputReport?.summary?.total_output_value}
            />
          </TabPanel>
        </Stack>
      </JumboCardQuick>
    </Stack>
  );
}

function ProductionReports() {
  return (
    <ProductsSelectProvider>
      <ProductionReportsContent />
    </ProductsSelectProvider>
  );
}

export default ProductionReports;
