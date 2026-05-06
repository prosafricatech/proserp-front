'use client';

import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import ProductsSelectProvider, {
  useProductsSelect,
} from '@/components/productAndServices/products/ProductsSelectProvider';
import JumboCardQuick from '@jumbo/components/JumboCardQuick';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  LinearProgress,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import productionBatchesServices from '../batches/productionBatchesServices';
import CostReport from './CostReport';
import OutputReport from './OutputReport';
import productionReportsServices from './productionReportsServices';
import { OutputReportResponse, CostReportResponse } from './productionReportsServices';

interface TabPanelProps {
  children: ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role='tabpanel' hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface WorkCenter {
  id: string;
  name: string;
}

function ProductionReportsContent() {
  const theme = useTheme();
  const isDark = (theme as any).type === 'dark';
  const {
    authUser,
    authOrganization
  } = useJumboAuth();
  const { productOptions } = useProductsSelect();
  const organization = (authOrganization as any)?.organization;
  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#bec5da';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;

  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [from, setFrom] = useState<Dayjs>(dayjs().startOf('month'));
  const [to, setTo] = useState<Dayjs>(dayjs().endOf('day'));
  const [selectedWorkCenter, setSelectedWorkCenter] = useState<WorkCenter | null>(null);
  const [selectedCostCenter, setSelectedCostCenter] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filterError, setFilterError] = useState<string>('');
  const [outputReport, setOutputReport] = useState<OutputReportResponse | null>(null);
  const [costReport, setCostReport] = useState<CostReportResponse | null>(null);
  const [outputLoading, setOutputLoading] = useState<boolean>(false);
  const [costLoading, setCostLoading] = useState<boolean>(false);
  const [outputError, setOutputError] = useState<string>('');
  const [costError, setCostError] = useState<string>('');
  const [mounted, setMounted] = useState<boolean>(false);

  const { data: workcenters = [], isPending: isFetchingWorkCenters } = useQuery(
    {
      queryKey: [
        'userWorkCenters',
        { userId: (authUser as any)?.user?.id, type: 'work center' },
      ],
      queryFn: productionBatchesServices.getUserWorkCenters as any,
      enabled: !!(authUser as any)?.user?.id,
    }
  ) as any;

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

  const handleGenerateReport = async (): Promise<void> => {
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
      ...(selectedWorkCenter?.id
        ? { work_center_id: selectedWorkCenter.id }
        : {}),
      ...(selectedCostCenter?.id
        ? { cost_center_id: selectedCostCenter.id }
        : {}),
    };

    const outputPromise = productionReportsServices
      .getOutputReport({
        ...sharedParams,
        ...(selectedProduct?.id ? { product_id: selectedProduct.id } : {}),
      } as any)
      .then((data) => {
        setOutputReport(data);
      })
      .catch((err: any) => {
        setOutputError(
          err?.response?.data?.message || 'Failed to load output report.'
        );
      })
      .finally(() => {
        setOutputLoading(false);
      });

    const costPromise = productionReportsServices
      .getCostReport(sharedParams as any)
      .then((data) => {
        setCostReport(data);
      })
      .catch((err: any) => {
        setCostError(
          err?.response?.data?.message || 'Failed to load cost report.'
        );
      })
      .finally(() => {
        setCostLoading(false);
      });

    await Promise.allSettled([outputPromise, costPromise]);
  };

  const handleCostCenterChange = (value: any): void => {
    setSelectedCostCenter(Array.isArray(value) ? value[0] || null : value);
  };

  if (!mounted) {
    return <></>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant='h4'>Production Reports</Typography>
      <JumboCardQuick sx={{ overflow: 'visible' }}>
        <Stack spacing={2}>
          <Box
            sx={{
              top: 0,
              zIndex: 5,
              bgcolor: 'background.paper',
              py: 1,
            }}
          >
            <Grid container spacing={2} alignItems='center'>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <DateTimePicker
                  label='From'
                  value={from}
                  onChange={(value) => setFrom(value as Dayjs)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <DateTimePicker
                  label='To'
                  value={to}
                  onChange={(value) => setTo(value as Dayjs)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2 }}>
                <Autocomplete
                  size='small'
                  loading={isFetchingWorkCenters}
                  options={workcenters}
                  value={selectedWorkCenter}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  getOptionLabel={(option) => option?.name || ''}
                  onChange={(_event, newValue) =>
                    setSelectedWorkCenter(newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label='Work Center' fullWidth />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 2 }}>
                <CostCenterSelector
                  label='Cost Center'
                  multiple={false}
                  defaultValue={selectedCostCenter}
                  onChange={handleCostCenterChange}
                />
              </Grid>
              {selectedTab === 0 && (
                <Grid size={{ xs: 12, md: 8, lg: 2 }}>
                  <Autocomplete
                    size='small'
                    options={productOptions}
                    value={selectedProduct}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    getOptionLabel={(option) =>
                      option?.name || option?.item_name || ''
                    }
                    onChange={(_event, newValue) =>
                      setSelectedProduct(newValue)
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Finished Product'
                        fullWidth
                      />
                    )}
                  />
                </Grid>
              )}
              <Grid
                size={{ xs: 12, md: 4, lg: selectedTab === 0 ? 12 : 2 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'end',
                }}
              >
                <Button
                  variant='contained'
                  size='small'
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </Button>
              </Grid>
            </Grid>
            {filterError && (
              <Alert severity='warning' sx={{ mt: 2 }}>
                {filterError}
              </Alert>
            )}
          </Box>

          {(outputLoading || costLoading) ?
              <div style={{ width: '100%', padding: '16px' }}>
                <Skeleton variant="text" width={180} height={32} style={{ borderRadius: 4, marginLeft: 'auto' }} />
                <Skeleton variant="rectangular" width="100%" height={48} style={{ borderRadius: 4 }} />
                <Skeleton variant="rectangular" width="100%" height={32} style={{ borderRadius: 4 }} />
              </div>
            :
            <>
              <Tabs
                value={selectedTab}
                onChange={(_event, newValue) => setSelectedTab(newValue)}
                variant='scrollable'
                scrollButtons='auto'
              >
                <Tab label='Output Report' />
                <Tab label='Cost Report' />
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
            </>
          }
        </Stack>
      </JumboCardQuick>
    </Stack>
  );
}

const ProductionReports: FC = () => {
  return (
    <ProductsSelectProvider>
      <ProductionReportsContent />
    </ProductsSelectProvider>
  );
};

export default ProductionReports;
