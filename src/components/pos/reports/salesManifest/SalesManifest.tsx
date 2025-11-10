import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { LoadingButton } from '@mui/lab';
import posServices from '../../pos-services';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '../../../pdf/pdf-styles';
import PDFContent from '../../../pdf/PDFContent';
import PdfLogo from '../../../pdf/PdfLogo';
import StakeholderSelector from '../../../masters/stakeholders/StakeholderSelector';
import SalesManifestOnScreen from './SalesManifestOnScreen';
import { CheckBox, CheckBoxOutlineBlank, HighlightOff } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import OutletSelector from '../../outlet/OutletSelector';
import { Div } from '@jumbo/shared';
import UsersSelector from '@/components/sharedComponents/UsersSelector';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { AuthObject } from '@/types/auth-types';
import { useSnackbar } from 'notistack';

interface SaleItem {
  id: number;
  cost: number;
  measurement_unit: MeasurementUnit;
  product: Product;
  quantity: number;
  rate: number;
}

interface SalesOutlet {
  id: number;
  name: string;
  address: string;
  status: string;
  type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface Counter {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  transaction_no: string;
  transaction_date: string;
  counter: string;
  currency: Currency;
  exchange_rate: number;
  items: SaleItem[];
  reference: string | null;
  stakeholder: Stakeholder;
  vat_percentage: number;
}

interface CollectionDistribution {
  name: string;
  amount: number;
}

interface ReportFilters {
  from: string;
  to: string;
  counters: Counter[];
  sales_outlets: SalesOutlet[];
  sales_people: string[];
  stakeholders: Stakeholder[];
}

interface ReportData {
  filters: ReportFilters;
  transactions: Transaction[];
  collection_distribution?: CollectionDistribution[];
}

interface SalesManifestPDFProps {
  userNames: string[];
  reportData: ReportData;
  separateVAT: boolean;
  authObject: AuthObject;
  title?: string;
}

interface FormValues {
  from: string;
  to: string;
  with_collection_distribution: boolean;
  sales_outlet_id?: number | null;
  counter_ids?: number[] | null;
  stakeholder_ids?: number[];
  user_ids?: number[];
  user_names?: string[];
  sales_people?: string[];
}

const SalesManifestPDF: React.FC<SalesManifestPDFProps> = ({
  userNames, 
  reportData, 
  separateVAT,
  authObject, 
  title = `Sales Manifest ${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`
}) => {
  const { authUser, checkOrganizationPermission, authOrganization: { organization } } = authObject;
  const user = authUser?.user;
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const financePersonnel = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS]);

  const saleAmount = (sale: Transaction): number => {
    return sale.items.reduce((amount: number, saleItem: SaleItem) => {
      if (saleItem.product.vat_exempted) {
        return amount + saleItem.quantity * saleItem.rate;
      } else {
        return amount + saleItem.quantity * saleItem.rate * (1 + sale.vat_percentage * 0.01);
      }
    }, 0);
  };

  const totalSalesVatInclusive = reportData.transactions.reduce((totalSales: number, sale: Transaction) => {
    return totalSales + saleAmount(sale);
  }, 0);

  const saleCost = (sale: Transaction): number => {
    return sale.items.reduce((cost: number, saleItem: SaleItem) => cost + saleItem.cost, 0);
  };

  const totalCoGS = reportData.transactions.reduce((totalCogs: number, sale: Transaction) => totalCogs + saleCost(sale), 0);

  const totalSaleAmount = (sale: Transaction): number => {
    return sale.items.reduce((amount: number, saleItem: SaleItem) => amount + saleItem.quantity * saleItem.rate, 0);
  };

  const totalSales = reportData.transactions.reduce((totalSales: number, sale: Transaction) => totalSales + totalSaleAmount(sale), 0);

  const totalCollectedAmount = reportData?.collection_distribution 
    ? reportData.collection_distribution.reduce((acc: number, cd: CollectionDistribution) => acc + (cd.amount || 0), 0) 
    : 0;

  return (
    <Document 
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={title}
    >
      <Page size="A4" orientation={'landscape'} style={pdfStyles.page}>
        {/* Header Section */}
        <View style={{ ...pdfStyles.table, marginBottom: 40 }}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 15 }}>
            <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250) }}>
              <PdfLogo organization={organization}/>
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>SALES MANIFEST</Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {`${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`}
              </Text>
            </View>
          </View>

          {/* Filter Summary */}
          <View style={{ ...pdfStyles.tableRow }}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Outlets</Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {reportData.filters.sales_outlets.map((sales_outlet) => sales_outlet.name).join(', ')}
              </Text>
            </View>
            
            {reportData?.filters?.counters?.length > 0 && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Counters</Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {reportData.filters.counters.map((counter) => counter.name).join(', ')}
                </Text>
              </View>
            )}
            
            {reportData.filters.stakeholders.length > 0 && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Clients</Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {reportData.filters.stakeholders.map((client) => client.name).join(', ')}
                </Text>
              </View>
            )}
            
            {userNames?.length > 0 && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Recorded By</Text>
                <Text style={{ ...pdfStyles.minInfo }}>{userNames.join(', ')}</Text>
              </View>
            )}
            
            {reportData.filters.sales_people.length > 0 && (
              <View style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Sales People</Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {reportData.filters.sales_people.join(', ')}
                </Text>
              </View>
            )}
            
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
            </View>
            
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{readableDate(undefined, true)}</Text>
            </View>
          </View>
        </View>

        {/* Summary Section */}
        <View style={{ ...pdfStyles.tableRow, justifyContent: 'space-between', marginBottom: 5 }}>
          <View style={{ flex: 2 }}>
            <View style={{ ...pdfStyles.tableRow }}>
              <View style={{ ...pdfStyles.table, flex: 1 }}>
                <View style={{ ...pdfStyles.tableRow }}>
                  <Text style={{ 
                    ...pdfStyles.tableHeader, 
                    backgroundColor: mainColor, 
                    color: contrastText, 
                    ...pdfStyles.midInfo, 
                    flex: 1, 
                    textAlign: 'center' 
                  }}>
                    Summary
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ ...pdfStyles.tableRow, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...pdfStyles.minInfo }}>Total Sales:</Text>
              <Text style={{ ...pdfStyles.minInfo, color: 'blue' }}>
                {totalSalesVatInclusive.toLocaleString('en-US', { 
                  maximumFractionDigits: 2, 
                  minimumFractionDigits: 2 
                })}
              </Text>
            </View>

            {separateVAT && (totalSalesVatInclusive - totalSales > 0) && (
              <>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...pdfStyles.minInfo }}>Sales (VAT Excl.)</Text>
                  <Text style={{ ...pdfStyles.minInfo }}>
                    {totalSales.toLocaleString('en-US', { 
                      maximumFractionDigits: 2, 
                      minimumFractionDigits: 2 
                    })}
                  </Text>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...pdfStyles.minInfo }}>VAT</Text>
                  <Text style={{ ...pdfStyles.minInfo }}>
                    {(totalSalesVatInclusive - totalSales).toLocaleString('en-US', { 
                      maximumFractionDigits: 2, 
                      minimumFractionDigits: 2 
                    })}
                  </Text>
                </View>
              </>
            )}

            {financePersonnel && (
              <>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...pdfStyles.minInfo }}>Total CoGS:</Text>
                  <Text style={{ ...pdfStyles.minInfo, color: 'red' }}>
                    {totalCoGS.toLocaleString('en-US', { 
                      maximumFractionDigits: 2, 
                      minimumFractionDigits: 2 
                    })}
                  </Text>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...pdfStyles.minInfo }}>Total Profit:</Text>
                  <Text style={{ ...pdfStyles.minInfo, color: 'green' }}>
                    {(totalSales - totalCoGS).toLocaleString('en-US', { 
                      maximumFractionDigits: 2, 
                      minimumFractionDigits: 2 
                    })}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Cash Distribution Section */}
          <View style={{ flex: 2 }}>
            {reportData?.collection_distribution && (
              <View style={{ ...pdfStyles.tableRow, marginBottom: 3, justifyContent: 'flex-end' }}>
                <View style={{ ...pdfStyles.table, minHeight: 50 }}>
                  <View style={{ ...pdfStyles.tableRow }}>
                    <Text style={{ 
                      ...pdfStyles.tableHeader, 
                      ...pdfStyles.midInfo, 
                      backgroundColor: mainColor, 
                      flex: 1, 
                      color: contrastText, 
                      textAlign: 'center' 
                    }}>
                      Collected Cash Distribution
                    </Text>
                  </View>
                  {reportData.collection_distribution.map((cd, index) => (
                    <View key={index} style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                      <Text style={{ 
                        ...pdfStyles.tableCell, 
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                        flex: 0.7 
                      }}>
                        {cd.name}
                      </Text>
                      <Text style={{ 
                        ...pdfStyles.tableCell, 
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                        flex: 0.3, 
                        textAlign: 'right' 
                      }}>
                        {cd.amount.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2
                        })}
                      </Text>
                    </View>
                  ))}
                  <View style={{ ...pdfStyles.tableRow, flexDirection: 'row' }}>
                    <Text style={{ 
                      ...pdfStyles.tableCell, 
                      backgroundColor: mainColor, 
                      color: contrastText, 
                      flex: 0.7 
                    }}>
                      Total
                    </Text>
                    <Text style={{ 
                      ...pdfStyles.tableCell, 
                      backgroundColor: mainColor, 
                      color: contrastText, 
                      flex: 0.3, 
                      textAlign: 'right' 
                    }}>
                      {totalCollectedAmount.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Transactions Section */}
        <View style={{ ...pdfStyles.tableRow, marginTop: 30 }}>
          <Text style={{ 
            ...pdfStyles.tableHeader, 
            backgroundColor: mainColor, 
            color: contrastText, 
            ...pdfStyles.midInfo, 
            flex: 1, 
            textAlign: 'center' 
          }}>
            Sales Details
          </Text>
        </View>

        {reportData.transactions.map((sale, index) => {
          const vat_percentage = sale.vat_percentage;

          return (
            <React.Fragment key={index}>
              <View style={{ ...pdfStyles.tableRow, marginTop:20 }}>
                <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{readableDate(sale.transaction_date)}</Text>
                <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{sale.transaction_no}</Text>
                <Text style={{ ...pdfStyles.midInfo, flex: 2 }}>{sale.stakeholder.name}</Text>
                <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{sale.reference && sale.reference}</Text>
              </View>
              <View style={{ ...pdfStyles.tableRow}}>
                <Text style={{ ...pdfStyles.midInfo, textAlign:'right' }}>{sale.counter}</Text>
              </View>
              
              <View style={{ ...pdfStyles.table, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, padding: 2}}>
                {/* Table Header */}
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex:0.5 }}>S/N</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4 }}>Product</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Quantity</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Price</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Amount</Text>
                  {
                    !!separateVAT && !!sale.vat_percentage &&
                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>VAT</Text>
                  }
                  {
                    financePersonnel &&
                    <React.Fragment>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>P.U Cost</Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>CoGS</Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Profit</Text>
                    </React.Fragment>
                  }
                </View>

                {/* Table Rows */}
                {
                  sale.items.map((saleItem,itemIndex) => (
                    <View key={itemIndex} style={pdfStyles.tableRow}>
                      <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor,flex:0.5 }}>{itemIndex+1}</Text>
                      <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor,flex:4 }}>{saleItem.product.name}</Text>
                      <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign:'right' }}>{`${saleItem.quantity} ${saleItem.measurement_unit.symbol}`}</Text>
                      <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{!!separateVAT ? saleItem.rate.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}) : (saleItem.rate + (!!saleItem.product.vat_exempted ? 0 : saleItem.rate * vat_percentage * 0.01)).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                      <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{!!separateVAT ? (saleItem.quantity*saleItem.rate).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2}) : ((saleItem.quantity*saleItem.rate) + (!!saleItem.product.vat_exempted ? 0 : (saleItem.quantity*saleItem.rate)*vat_percentage*0.01)).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                      {
                        !!separateVAT && !!sale.vat_percentage &&
                        <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{!!saleItem.product.vat_exempted ? 0 : (saleItem.quantity*saleItem.rate*vat_percentage*0.01).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                      }
                      {
                        financePersonnel &&
                        <React.Fragment>
                          <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{(saleItem.cost/saleItem.quantity).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                          <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{saleItem.cost.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                          <Text style={{ ...pdfStyles.tableCell,backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2, textAlign:'right'  }}>{((!!separateVAT ? (saleItem.quantity*saleItem.rate) : ((saleItem.quantity*saleItem.rate) + (!!saleItem.product.vat_exempted ? 0 : (saleItem.quantity*saleItem.rate)*vat_percentage*0.01))) - (saleItem.cost)).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                        </React.Fragment>
                      }
                    </View>
                  ))
                }

                {/* Table Footer */}
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 8.6, textAlign: 'right' }}>Total</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>{sale.items.reduce((total, currentItem) => total + (!!separateVAT ? (currentItem.quantity*currentItem.rate) : ((currentItem.quantity*currentItem.rate) + (!!currentItem.product.vat_exempted ? 0 : (currentItem.quantity*currentItem.rate)*vat_percentage*0.01))), 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                  {
                    !!separateVAT && !!vat_percentage &&
                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                      {sale.items.reduce((total, currentItem) => total + (!!currentItem.product.vat_exempted ? 0 : (currentItem.quantity*currentItem.rate*vat_percentage*0.01)), 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                    </Text>
                  }
                  {
                    financePersonnel &&
                    <React.Fragment>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}></Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                        {sale.items.reduce((total, currentItem) => total + currentItem.cost, 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}
                      </Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>{sale.items.reduce((total, currentItem) => total + (((!!separateVAT ? (currentItem.quantity*currentItem.rate) : ((currentItem.quantity*currentItem.rate) + (!!currentItem.product.vat_exempted ? 0 : (currentItem.quantity*currentItem.rate)*vat_percentage*0.01)))) - (currentItem.cost)), 0).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                    </React.Fragment>
                  }
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </Page>
    </Document>
  );
};

interface SalesManifestProps {
  setOpenSalesManifest: (open: boolean) => void;
}

const SalesManifest: React.FC<SalesManifestProps> = ({ setOpenSalesManifest }) => {
  const css = useProsERPStyles();
  const authObject = useJumboAuth();
  const { authOrganization } = authObject;
  const { enqueueSnackbar } = useSnackbar();
  const organization = authOrganization?.organization;
  const is_vat_registered = organization?.settings?.vat_registered;

  const [displayAs, setDisplayAs] = useState<'on screen' | 'pdf'>('on screen');
  const [counters, setCounters] = useState<any[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<any[]>([]);
  const [separateVAT, setSeparateVAT] = useState(false);
  const [updatedUsers, setUpdatedUsers] = useState<string[]>([]);
  const [withCashDistribution, setWithCashDistribution] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = React.useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0)

  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const validationSchema = yup.object({
    from: yup.string().required('Start Date is required').typeError('Start Date is required'),
  });

  const [reportData, setReportData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const { setValue, handleSubmit, watch } = useForm<FormValues>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
      with_collection_distribution: withCashDistribution
    },
  });

  const retrieveReport = async (filters: any) => {
    setIsFetching(true);
    const report = await posServices.salesManifest(filters);
    setReportData(report);
    setIsFetching(false);
  };

  const downloadExcelTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      setUploadFieldsKey((prevKey) => prevKey + 1);
      
      // Get all current filter parameters
      const filters = {
        from: watch('from'),
        to: watch('to'),
        sales_outlet_id: watch('sales_outlet_id'),
        counter_ids: watch('counter_ids'),
        stakeholder_ids: watch('stakeholder_ids'),
        user_ids: watch('user_ids'),
        sales_people: watch('sales_people'),
        with_collection_distribution: watch('with_collection_distribution'),
        separate_vat: separateVAT
      };

      // Pass all filters to the service
      const responseData = await posServices.downloadExcelTemplate(filters);
      
      const blob = new Blob([responseData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Sales Manifest.xlsx`;
      link.click();
      setIsDownloadingTemplate(false);
    } catch (error) {
      enqueueSnackbar('Error downloading Excel template', { variant: 'error' });
      setIsDownloadingTemplate(false);
    }
  };

  const { 
    data: salesPersons, 
    isLoading: isFetchingSalesPerson 
  } = useQuery({
    queryKey: ['salesPerson'],
    queryFn: posServices.getSalesPerson
  });

  if (isFetchingSalesPerson) {
    return <LinearProgress />;
  }

  const downloadFileName = reportData 
    ? `Sales Manifest ${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}` 
    : undefined;

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{ xs: 11, md: 12 }}>
            <Typography variant="h3">Sales Manifest</Typography>
          </Grid>
          {belowLargeScreen && (
            <Grid size={{ xs: 1 }}>
              <Tooltip title="Close">
                <IconButton 
                  sx={{ mb: 1 }} 
                  size='small' 
                  onClick={() => setOpenSalesManifest(false)} 
                >
                  <HighlightOff color="primary" />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        <span className={css.hiddenOnPrint}>
          <form autoComplete="off" key={uploadFieldsKey} onSubmit={handleSubmit(retrieveReport)}>
            <Grid container spacing={1}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <OutletSelector
                    onChange={(newValue: any) => {
                      setValue('sales_outlet_id', newValue ? newValue.id : null);
                      if (newValue) {
                        setCounters(newValue.counters);
                      } else {
                        setCounters([]);
                      }
                    }}
                  />
                </Div>
              </Grid>
              {String(watch(`sales_outlet_id`)) !== 'all' &&
                <Grid size={{ xs: 12, md: 3 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Autocomplete
                      size="small"
                      multiple
                      disableCloseOnSelect
                      options={counters ?? []}
                      value={selectedCounter}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      getOptionLabel={(option) => option.name}
                      renderInput={(params) => (
                        <TextField {...params} label="Counter" />
                      )}
                      renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option.id}
                            label={option.name}
                          />
                        ))
                      }
                      renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props;

                        return (
                          <li key={option.id} {...otherProps}>
                            <Checkbox
                              icon={<CheckBoxOutlineBlank fontSize="small" />}
                              checkedIcon={<CheckBox fontSize="small" />}
                              style={{ marginRight: 8 }}
                              checked={selected}
                            />
                            {option.name}
                          </li>
                        );
                      }}
                      onChange={(event, newValue) => {
                        setValue(
                          'counter_ids',
                          newValue ? newValue.map((counter) => counter.id) : null
                        );
                        setSelectedCounter(newValue);
                      }}
                    />
                  </Div>
                </Grid>
              }
              <Grid size={{ xs: 12, md: String(watch(`sales_outlet_id`)) !== 'all' ? 3 : 6 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <StakeholderSelector
                    label='Clients'
                    multiple={true}
                    onChange={(newValue: any) => {
                      setValue('stakeholder_ids', newValue ? newValue.map((value: any) => value.id) : []);
                    }}
                  />
                </Div>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <UsersSelector
                    label='Recorded By'
                    multiple={true}
                    onChange={(newValue: any) => {
                      setValue('user_ids', newValue.map((user: any) => user.id));
                      setValue('user_names', newValue.map((user: any) => user.name));
                    }}      
                />
                </Div>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Autocomplete
                    options={salesPersons || []}
                    multiple
                    isOptionEqualToValue={(option: string, value: string) => option === value}
                    getOptionLabel={(option: string) => option}
                    renderInput={(params) => (
                      <TextField {...params} label="Sales Person" size="small" fullWidth />
                    )}
                    renderTags={(tagValue: string[], getTagProps) => {
                      return tagValue.map((option, index) => (
                        <Chip {...getTagProps({ index })} key={option} label={option} />
                      ))
                    }}
                    onChange={(e, newValue: string[]) => {
                      setValue('sales_people', newValue);
                    }}
                  />
                </Div>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="From (MM/DD/YYYY)"
                    value={dayjs(watch('from'))}
                    minDate={dayjs(authOrganization?.organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('from', newValue ? newValue.toISOString() : dayjs().startOf('day').toISOString(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="To (MM/DD/YYYY)"
                    value={dayjs(watch('to'))}
                    minDate={dayjs(watch('from'))}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : dayjs().endOf('day').toISOString(), {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>

              {!!is_vat_registered && (
                <Grid size={{ xs: 12, md: 3.5 }} textAlign="start">
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Checkbox
                      checked={separateVAT}
                      onChange={(e) => setSeparateVAT(e.target.checked)}
                    />
                    Separate VAT
                  </Div>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: !!is_vat_registered ? 3.5 : 5 }} textAlign="start">
                <Div sx={{ mt: 1, mb: 1 }}>
                  <Checkbox
                    checked={withCashDistribution}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setValue('with_collection_distribution', isChecked);
                      setWithCashDistribution(isChecked);
                    }}
                  />
                  Collection Distribution
                </Div>
              </Grid>

              <Grid size={{ xs: 12, md: !!is_vat_registered ? 4 : 6 }} textAlign="start">
                <FormControl>
                  <FormLabel id="display_as_radiobuttons" sx={{ textAlign: 'center' }}>
                    Display As
                  </FormLabel>
                  <RadioGroup
                    row
                    aria-labelledby="display_as_radiobuttons"
                    name="row-radio-buttons-group"
                    value={displayAs}
                    onChange={(e) => setDisplayAs(e.target.value as 'on screen' | 'pdf')}
                  >
                    <FormControlLabel value="on screen" control={<Radio />} label="On Screen" />
                    <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, md: 1 }} textAlign="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                  <>                                
                    <LoadingButton
                      size="small"
                      onClick={downloadExcelTemplate}
                      loading={isDownloadingTemplate}
                      disabled
                      variant="contained"
                      color="success"
                    >
                      Excel
                    </LoadingButton>
                    <LoadingButton loading={isFetching} type="submit" size="small" variant="contained" onClick={()=> setUpdatedUsers(watch(`user_names`) as string[])}>
                      Filter
                    </LoadingButton>
                  </>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </span>
      </DialogTitle>

      {isFetching ? (
        <LinearProgress />
      ) : reportData?.transactions.length > 0 && (
        <DialogContent>
          {displayAs === 'pdf' ? (
            <PDFContent
              document={
                <SalesManifestPDF 
                  authObject={authObject as any} 
                  reportData={reportData} 
                  title={downloadFileName} 
                  userNames={updatedUsers} 
                  separateVAT={separateVAT}
                />
              }
              fileName={downloadFileName}
            />
          ) : displayAs === 'on screen' ? (
            <SalesManifestOnScreen 
              reportData={reportData} 
              authObject={authObject as any} 
              separateVAT={separateVAT}
            />
          ) : null}
        </DialogContent>
      )}

      <DialogActions className={css.hiddenOnPrint}>
        <Button sx={{ mt: 1 }} size='small' variant='outlined' onClick={() => setOpenSalesManifest(false)}>
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
};

export default SalesManifest;