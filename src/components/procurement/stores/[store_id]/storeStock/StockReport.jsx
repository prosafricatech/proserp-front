'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import productCategoryServices from '@/components/productAndServices/productCategories/productCategoryServices';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import {
  CheckBox,
  CheckBoxOutlineBlank,
  HighlightOff,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import storeServices from '../../store-services';
import StoreSelector from '../../StoreSelector';
import { useStoreProfile } from '../StoreProfileProvider';
import StockReportOnScreen from './StockReportOnScreen';

const ReportDocument = ({
  productCategories,
  stockData,
  authObject,
  store,
  costCenter,
  date,
  hasPermissionToView,
}) => {
  const {
    authOrganization,
    authUser: { user },
  } = authObject;
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const reportPeriod = `As at: ${readableDate(date, true)}`;

  //Total amount
  const totalAmount = stockData.reduce(
    (total, stock) => total + stock.latest_rate * stock.balance,
    0
  );

  return stockData ? (
    <Document
      creator={`ProsERP | ${user.name}`}
      title={`${store.name} Stock Report ${reportPeriod}`}
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Stock Report`}</Text>
              <Text style={{ ...pdfStyles.midInfo }}>{`${store.name}`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {costCenter?.length > 0 && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenter.map((cost_center) => cost_center.name).join(', ')}
              </Text>
            </View>
          )}
          {productCategories?.length > 0 && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Categories
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {productCategories.map((category) => category.name).join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.5,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 3,
              }}
            >
              Product Name
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Unit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Balance
            </Text>
            {hasPermissionToView && (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                  }}
                >
                  Latest Rate
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 2,
                  }}
                >
                  Amount
                </Text>
              </>
            )}
          </View>
          {stockData.map((stock, index) => {
            return (
              <View key={index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.5,
                  }}
                >
                  {index + 1}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                  }}
                >
                  {stock.name}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  {stock.measurement_unit.symbol}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                    textAlign: 'right',
                  }}
                >
                  {stock.balance.toLocaleString()}
                </Text>
                {hasPermissionToView && (
                  <>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 2,
                        textAlign: 'right',
                      }}
                    >
                      {stock.latest_rate.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 2,
                        textAlign: 'right',
                      }}
                    >
                      {(stock.balance * stock.latest_rate).toLocaleString(
                        'en-US',
                        { maximumFractionDigits: 2, minimumFractionDigits: 2 }
                      )}
                    </Text>
                  </>
                )}
              </View>
            );
          })}
          <View style={pdfStyles.tableRow}>
            {hasPermissionToView && (
              <>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    textAlign: 'center',
                    flex: 9.3,
                  }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    textAlign: 'right',
                    flex: 2,
                  }}
                >
                  {totalAmount?.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

function StockReport({ setOpenDialog, isFromDashboard }) {
  const classes = useProsERPStyles();
  const [today] = useState(dayjs());
  const authObject = useJumboAuth();
  const { authOrganization } = authObject;
  const { activeStore } = useStoreProfile();
  const [costCenter, setCostCenter] = useState(authOrganization.costCenters);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] =
    React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [stockAvailable, setStockAvailable] = useState([]);

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { checkOrganizationPermission } = useJumboAuth();
  const hasPermissionToView = checkOrganizationPermission(
    PERMISSIONS.ACCOUNTS_REPORTS
  );
  const [includeChildren, setIncludeChildren] = useState(true);
  const [withDetails, setWithDetails] = useState(false);

  const validationSchema = yup.object().shape({
    isFromDashboard: yup.boolean().default(false),
    store_id: yup
      .number()
      .nullable()
      .when('isFromDashboard', {
        is: true,
        then: (schema) =>
          schema.required('Store is required').typeError('Store is required'),
        otherwise: (schema) => schema.nullable(),
      }),
    sort_by: yup
      .string()
      .oneOf(
        ['brand', 'model', 'specifications', 'item_name', 'sku'],
        'Invalid sort field'
      )
      .default('item_name'),
    sort_direction: yup
      .string()
      .oneOf(['asc', 'desc'], 'Sort direction must be ascending or descending')
      .default('asc'),
    include_children: yup.boolean(),
  });

  const {
    setValue,
    watch,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: {
      as_at: dayjs().toISOString(),
      isFromDashboard: isFromDashboard || false,
      store_id: isFromDashboard ? null : activeStore?.id,
      cost_center_ids: authOrganization.costCenters.map(
        (cost_center) => cost_center.id
      ),
      show_zero_balance: 0,
      sort_by: 'item_name',
      sort_direction: 'asc',
      include_children: includeChildren,
    },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    setValue('include_children', includeChildren);
  }, [includeChildren, setValue]);

  const getAvailableStock = async (filters) => {
    setIsFetching(true);
    const fetchStock = await storeServices.getStock(filters);
    setStockAvailable(fetchStock);
    setIsFetching(false);
  };

  const buildFilters = (overrides = {}) => ({
    as_at: watch('as_at'),
    store_id: watch('store_id'),
    cost_center_ids: watch('cost_center_ids'),
    product_category_ids: watch('product_category_ids'),
    show_zero_balance: watch('show_zero_balance'),
    sort_by: watch('sort_by'),
    sort_direction: watch('sort_direction'),
    include_children: includeChildren,
    ...overrides,
  });

  const exportedData = {
    stockData: stockAvailable,
    authObject: authObject,
    store: isFromDashboard ? watch('store') : activeStore,
    productCategories: watch('product_categories'),
    costCenter: costCenter,
    date: watch('as_at'),
    hasPermissionToView: hasPermissionToView,
    withDetails: withDetails,
  };

  const handlExcelExport = async (exportedData) => {
    setIsDownloadingTemplate(true);
    try {
      const blob = await storeServices.exportStockReportToExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stock-Report.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  useEffect(() => {
    getAvailableStock(buildFilters());
  }, [!isFromDashboard]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  document.title = isFromDashboard
    ? 'Store Stock Report'
    : `${activeStore?.name} | Stock Report`;

  const { data: productCategories, isLoading: isLoadingProductCategories } =
    useQuery({
      queryKey: ['productCategoryOptions'],
      queryFn: productCategoryServices.getCategoryOptions,
    });

  if (isLoadingProductCategories) {
    return <LinearProgress />;
  }

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Span className={classes.hiddenOnPrint}>
          <form
            autoComplete='off'
            key={uploadFieldsKey}
            onSubmit={handleSubmit(getAvailableStock)}
          >
            <Grid container columnSpacing={1} rowSpacing={1}>
              <Grid container size={12}>
                <Grid size={belowLargeScreen ? 11 : 12}>
                  <Typography textAlign={'center'} variant='h3'>
                    Stock Report
                  </Typography>
                </Grid>
                {belowLargeScreen && (
                  <Grid size={1} textAlign='right'>
                    <Tooltip title='Close'>
                      <IconButton
                        size='small'
                        sx={{ mb: 1 }}
                        onClick={() => setOpenDialog(false)}
                      >
                        <HighlightOff color='primary' />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
              {isFromDashboard && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 0.3 }}>
                    <StoreSelector
                      allowSubStores={true}
                      label='Store'
                      frontError={errors.store_id}
                      proposedOptions={authOrganization?.stores}
                      onChange={(newValue) => {
                        setValue(`store`, newValue);
                        setValue(`store_id`, newValue ? newValue.id : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        getAvailableStock(
                          buildFilters({
                            store_id: newValue?.id,
                          })
                        );
                      }}
                    />
                  </Div>
                </Grid>
              )}
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3 }}>
                  <CostCenterSelector
                    label='Cost and Profit Centers'
                    multiple={true}
                    allowSameType={true}
                    onChange={(cost_centers) => {
                      let selectedCostCenters, selectedCostCenterIds;

                      if (cost_centers.length === 0) {
                        // If all options are deselected, set to all cost centers
                        selectedCostCenters = authOrganization.costCenters.map(
                          (cost_center) => cost_center
                        );
                        selectedCostCenterIds =
                          authOrganization.costCenters.map(
                            (cost_center) => cost_center.id
                          );
                      } else {
                        // Otherwise, use the selected cost centers
                        selectedCostCenters = cost_centers.map(
                          (cost_center) => cost_center
                        );
                        selectedCostCenterIds = cost_centers.map(
                          (cost_center) => cost_center.id
                        );
                      }

                      setCostCenter(selectedCostCenters);
                      setValue('cost_center_ids', selectedCostCenterIds);
                      getAvailableStock(
                        buildFilters({
                          cost_center_ids: selectedCostCenterIds,
                        })
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3 }}>
                  <Autocomplete
                    multiple
                    id='product-categories-select'
                    options={productCategories}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    renderOption={(props, option, { selected }) => (
                      <li {...props} key={`${option.id}-${props.id}`}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlank fontSize='small' />}
                          checkedIcon={<CheckBox fontSize='small' />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                          size='small'
                        />
                        <Typography variant='body2'>{option.name}</Typography>
                      </li>
                    )}
                    renderTags={(value, getTagProps) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            label={option.name}
                            size='small'
                            sx={{ maxWidth: 200 }}
                          />
                        ))}
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Product Categories'
                        size='small'
                        fullWidth
                      />
                    )}
                    onChange={(event, newValue) => {
                      const categoryIds = newValue.map(
                        (category) => category.id
                      );
                      const categories = newValue.map((category) => category);
                      setValue('product_category_ids', categoryIds);
                      setValue('product_categories', categories);
                      getAvailableStock(
                        buildFilters({
                          product_category_ids: categoryIds,
                        })
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3 }}>
                  <DateTimePicker
                    label='As at (MM/DD/YYYY HH:MM)'
                    fullWidth
                    maxDate={dayjs()}
                    minDate={dayjs(
                      authOrganization.organization.recording_start_date
                    )}
                    defaultValue={today}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue(
                        'as_at',
                        newValue ? newValue.toISOString() : null,
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        }
                      );

                      getAvailableStock(
                        buildFilters({
                          as_at: newValue.toISOString(),
                        })
                      );
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3, display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    {...register('show_zero_balance')}
                    size='small'
                    checked={watch('show_zero_balance') === 1}
                    onChange={(e) => {
                      const value = e.target.checked ? 1 : 0;
                      setValue('show_zero_balance', value);
                      getAvailableStock(
                        buildFilters({
                          show_zero_balance: value,
                        })
                      );
                    }}
                  />
                  <Typography variant='body2'>Include zero stock</Typography>
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3 }}>
                  <Autocomplete
                    options={[
                      'item_name',
                      'brand',
                      'model',
                      'specifications',
                      'sku',
                    ]}
                    value={watch('sort_by')}
                    onChange={(event, newValue) => {
                      setValue('sort_by', newValue || 'item_name');
                      getAvailableStock(
                        buildFilters({
                          sort_by: newValue || 'item_name',
                        })
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Sort By'
                        size='small'
                        fullWidth
                      />
                    )}
                    getOptionLabel={(option) => {
                      const labels = {
                        item_name: 'Item Name',
                        brand: 'Brand',
                        model: 'Model',
                        specifications: 'Specifications',
                        sku: 'SKU',
                      };
                      return labels[option] || option;
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{ xs: 12, md: isFromDashboard ? 6 : 4 }}>
                <Div sx={{ mt: 0.3 }}>
                  <Autocomplete
                    options={['asc', 'desc']}
                    value={watch('sort_direction')}
                    onChange={(event, newValue) => {
                      setValue('sort_direction', newValue || 'asc');
                      getAvailableStock(
                        buildFilters({
                          sort_direction: newValue || 'asc',
                        })
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Sort Direction'
                        size='small'
                        fullWidth
                      />
                    )}
                    getOptionLabel={(option) => {
                      const labels = {
                        asc: 'Ascending',
                        desc: 'Descending',
                      };
                      return labels[option] || option;
                    }}
                  />
                </Div>
              </Grid>
              <Grid container size={12} textAlign={'right'}>
                <Grid size={{ xs: 6, md: 4 }} textAlign={'left'}>
                  <Div sx={{ mt: 0.3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={includeChildren}
                          onChange={(e) => {
                            const nextValue = e.target.checked;
                            setIncludeChildren(nextValue);
                            setValue('include_children', nextValue);
                            getAvailableStock(
                              buildFilters({
                                include_children: nextValue,
                              })
                            );
                          }}
                        />
                      }
                      label='Include Substores'
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 6, md: 4 }} textAlign={'left'}>
                  <Div sx={{ mt: 0.3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={withDetails}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setWithDetails(newValue);
                            // Reset to On-Screen tab when withDetails is enabled
                            if (newValue) {
                              setSelectedTab(0);
                            }
                          }}
                        />
                      }
                      label='With more details'
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} textAlign={'right'}>
                  <Stack
                    direction='row'
                    spacing={0.5}
                    justifyContent='flex-end'
                    alignItems='center'
                  >
                    <>
                      <LoadingButton
                        size='small'
                        onClick={() => handlExcelExport(exportedData)}
                        loading={isDownloadingTemplate}
                        disabled={isFromDashboard && !watch('store_id')}
                        variant='contained'
                        color='success'
                      >
                        Excel
                      </LoadingButton>
                      <LoadingButton
                        loading={isFetching}
                        type='submit'
                        size='small'
                        variant='contained'
                      >
                        Filter
                      </LoadingButton>
                    </>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </form>
          {/* Tabs - hidden when withDetails is true on below large screens */}
          {belowLargeScreen &&
            !isFetching &&
            stockAvailable.length > 0 &&
            !withDetails && (
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                indicatorColor='primary'
                textColor='primary'
              >
                <Tab label='On-Screen' />
                <Tab label='PDF' />
              </Tabs>
            )}
        </Span>
      </DialogTitle>
      <DialogContent>
        {isFetching && <LinearProgress />}
        {!isFetching && stockAvailable.length > 0 && (
          <React.Fragment>
            {withDetails ? (
              // Show this message on ALL screens when withDetails is true
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 200,
                  p: 4,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h2' sx={{ fontSize: 40, mb: 2 }}>
                  📊
                </Typography>
                <Typography variant='h6' color='text.secondary' gutterBottom>
                  Download Excel to view more details
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  The detailed view is only available in Excel format. Please
                  click the Excel button above to download the complete report.
                </Typography>
              </Box>
            ) : (
              // Show normal content when withDetails is false
              <React.Fragment>
                {belowLargeScreen && selectedTab === 0 ? (
                  <StockReportOnScreen
                    stockData={stockAvailable}
                    authObject={authObject}
                    hasPermissionToView={hasPermissionToView}
                  />
                ) : (
                  <PDFContent
                    document={
                      <ReportDocument
                        stockData={stockAvailable}
                        authObject={authObject}
                        store={isFromDashboard ? watch('store') : activeStore}
                        productCategories={watch('product_categories')}
                        costCenter={costCenter}
                        date={watch('as_at')}
                        hasPermissionToView={hasPermissionToView}
                      />
                    }
                    fileName={
                      isFromDashboard
                        ? watch('store')?.name
                        : `${activeStore?.name} Stock Report ${readableDate(dayjs().toISOString())}`
                    }
                  />
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          sx={{ mt: 1 }}
          size='small'
          variant='outlined'
          onClick={() => setOpenDialog(false)}
        >
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
}

export default StockReport;
