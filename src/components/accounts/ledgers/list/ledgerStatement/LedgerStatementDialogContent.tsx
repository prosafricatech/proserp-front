import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PDFContent from '@/components/pdf/PDFContent';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { deviceType } from '@/utilities/helpers/user-agent-helpers';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Div } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ledgerServices from '../../ledger-services';
import LedgerStatementOnScreen from './LedgerStatementOnScreen';

interface ReportDocumentProps {
  transactionsData: {
    transactions: Array<{
      transactionDate: string;
      voucherNo?: string;
      reference?: string;
      description: string;
      debit: number;
      credit: number;
    }>;
    filters: {
      from: string;
      to: string;
      cost_centers: Array<{ id: number; name: string }>;
      ledgerName?: string;
    };
  };
  authOrganization: {
    organization: Organization;
    costCenters?: Array<{ id: number; name: string }>;
  };
  user: {
    name: string;
  };
  ledger?: {
    id: number;
    name: string;
    increasesWith?: 'DR' | 'CR';
  };
  ledgerName?: string;
  increasesWith?: 'DR' | 'CR';
}

interface LedgerStatementDialogContentProps {
  setOpen: (open: boolean) => void;
  ledger?: {
    id: number;
    name: string;
    increasesWith?: 'DR' | 'CR';
  };
  commingFilters?: {
    from: string;
    to: string;
    ledger_id?: number;
    cost_center_ids: number[] | 'all';
    with_item_description: boolean;
    ledgerName?: string;
    increasesWith?: 'DR' | 'CR';
  };
}

const ReportDocument: React.FC<ReportDocumentProps> = ({
  transactionsData,
  authOrganization,
  user,
  ledger,
  ledgerName,
  increasesWith,
}) => {
  const [openingBalanceTx, ...restTransactions] = transactionsData.transactions;

  // Opening balance seeds cumulative balance but is excluded from DR/CR totals
  const openingBalance = openingBalanceTx
    ? increasesWith === 'DR'
      ? openingBalanceTx.debit - openingBalanceTx.credit
      : openingBalanceTx.credit - openingBalanceTx.debit
    : 0;

  const totalCredits = restTransactions.reduce(
    (total: number, transaction) => total + transaction.credit,
    0
  );
  const totalDebits = restTransactions.reduce(
    (total: number, transaction) => total + transaction.debit,
    0
  );
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const costCenters = transactionsData.filters.cost_centers;

  let runningBalance = openingBalance;

  const tableRows = [
    ...(openingBalanceTx
      ? [
          {
            transactionDate: openingBalanceTx.transactionDate,
            reference: '',
            description: openingBalanceTx.description,
            debit: null as number | null,
            credit: null as number | null,
            balance: openingBalance,
          },
        ]
      : []),
    ...restTransactions.map((transaction) => {
      runningBalance +=
        increasesWith === 'DR'
          ? transaction.debit - transaction.credit
          : transaction.credit - transaction.debit;

      return {
        transactionDate: transaction.transactionDate,
        reference:
          `${transaction.voucherNo ? transaction.voucherNo : ''} ${transaction.reference ? transaction.reference : ''}`.trim(),
        description: transaction.description,
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
      };
    }),
  ];

  return transactionsData ? (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${ledger?.name || ledgerName} Statement ${readableDate(transactionsData.filters.from)} to ${readableDate(transactionsData.filters.to)}`}
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
              >{`Ledger Statement`}</Text>
              <Text
                style={{ ...pdfStyles.midInfo }}
              >{`${ledger?.name || ledgerName}`}</Text>
              <Text
                style={{ ...pdfStyles.minInfo }}
              >{`${readableDate(transactionsData.filters.from, true)} - ${readableDate(transactionsData.filters.to, true)}`}</Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Credits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalCredits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Debits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalDebits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
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
          <View style={{ ...pdfStyles.tableRow, marginBottom: 2 }}>
            {Array.isArray(costCenters) && costCenters.length > 0 && (
              <View style={{ flex: 2, padding: 2 }}>
                <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                  Cost Centers
                </Text>
                <Text style={{ ...pdfStyles.minInfo }}>
                  {costCenters
                    .map((cost_centers) => cost_centers.name)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              Date
            </Text>
            {/* <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Reference</Text> */}
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Debit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Credit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              Balance
            </Text>
          </View>
          {tableRows.map((row, index) => (
            <View
              key={`${row.transactionDate}-${index}`}
              style={pdfStyles.tableRow}
            >
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1.5,
                }}
              >
                {readableDate(row.transactionDate)}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                }}
              >
                {row.reference}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 2,
                }}
              >
                {row.description}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {row.debit && row.debit !== 0
                  ? row.debit.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })
                  : '-'}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {row.credit && row.credit !== 0
                  ? row.credit.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })
                  : '-'}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                {row.balance.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }) === '-0.00'
                  ? '0.00'
                  : row.balance.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
          ))}
          {/* TOTAL row */}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                textAlign: 'center',
                flex: 4.7,
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'right',
              }}
            >
              {totalDebits.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'right',
              }}
            >
              {totalCredits.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            ></Text>
          </View>
        </View>
        <PageFooter />
      </Page>
    </Document>
  ) : null;
};

const LedgerStatementDialogContent: React.FC<
  LedgerStatementDialogContentProps
> = ({ setOpen, ledger, commingFilters = null }) => {
  const [transactions, setTransactions] = useState<
    ReportDocumentProps['transactionsData'] | null
  >(null);
  const { authOrganization, authUser, checkOrganizationPermission } =
    useJumboAuth();
  const user = authUser?.user;
  const [withItemDescription, setWithItemDescription] =
    useState(!!commingFilters);
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = deviceType() === 'mobile';
  const { enqueueSnackbar } = useSnackbar();
  //   const [isDownloadingTemplate, setIsDownloadingTemplate] =
  //     React.useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadFieldsKey, setUploadFieldsKey] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const { setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      from: commingFilters?.from || dayjs().startOf('day').toISOString(),
      to: commingFilters?.to || dayjs().endOf('day').toISOString(),
      ledger_id: commingFilters?.ledger_id ?? ledger?.id,
      cost_center_ids:
        commingFilters?.cost_center_ids ??
        (checkOrganizationPermission(PERMISSIONS.COST_CENTERS_ALL)
          ? 'all'
          : authOrganization?.costCenters?.map(
              (cost_center: any) => cost_center.id
            ) || []),
      with_item_description: commingFilters ? true : withItemDescription,
    },
  });

  const fetchTransactions = useCallback(
    async (filters: {
      from: string;
      to: string;
      ledger_id?: number;
      cost_center_ids: number[] | 'all';
      with_item_description: boolean;
    }) => {
      try {
        setIsFetching(true);
        const data = await ledgerServices.statement(filters);
        setTransactions(data);
      } catch (err) {
        setTransactions(null);
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  //   const downloadExcelTemplate = async () => {
  //     try {
  //       setIsDownloadingTemplate(true);
  //       setUploadFieldsKey((prevKey) => prevKey + 1);

  //       // Get all current filter parameters
  //       const filters = {
  //         from: watch('from') || commingFilters?.from,
  //         to: watch('to') || commingFilters?.to,
  //         ledger_id:
  //           watch('ledger_id') ?? commingFilters?.ledger_id ?? ledger?.id,
  //         cost_center_ids:
  //           watch('cost_center_ids') ?? commingFilters?.cost_center_ids,
  //         with_item_description: watch('with_item_description'),
  //       };

  //       const responseData = await ledgerServices.downloadExcelTemplate(filters);

  //       const blob = new Blob([responseData], {
  //         type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //       });

  //       const link = document.createElement('a');
  //       link.href = window.URL.createObjectURL(blob);
  //       link.download = `${ledger?.name || ledgerName} Statement.xlsx`;
  //       link.click();
  //       setIsDownloadingTemplate(false);
  //     } catch (error) {
  //       enqueueSnackbar('Error downloading Excel Statement', {
  //         variant: 'error',
  //       });
  //       setIsDownloadingTemplate(false);
  //     }
  //   };

  useEffect(() => {
    if (commingFilters) {
      const initialFilters = {
        ...commingFilters,
        with_item_description: true,
      };
      setWithItemDescription(true);
      setValue('with_item_description', true, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('from', commingFilters.from, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('to', commingFilters.to, {
        shouldValidate: false,
        shouldDirty: false,
      });
      setValue('cost_center_ids', commingFilters.cost_center_ids, {
        shouldValidate: false,
        shouldDirty: false,
      });
      fetchTransactions(initialFilters);
    }
  }, [commingFilters, fetchTransactions, setValue]);

  const ledgerName = commingFilters?.ledgerName;
  const effectiveFrom = watch('from') || commingFilters?.from;
  const effectiveTo = watch('to') || commingFilters?.to;
  const downloadFileName = `${ledger?.name || ledgerName} Statement ${readableDate(effectiveFrom)}-${readableDate(effectiveTo)}`;

  const exportedData = {
    transactionsData: transactions,
    authOrganization: authOrganization,
    user: user,
    ledger: ledger,
    ledgerName: ledgerName,
    increasesWith: ledger?.increasesWith || commingFilters?.increasesWith,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    try {
      const blob = await ledgerServices.exportLedgerStatement(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${'Ledger_Statement_Report_'} ${readableDate(exportedData.transactionsData?.filters?.from, true)} - ${readableDate(exportedData.transactionsData?.filters?.to, true)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      //   console.log('blob: ', blob);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <React.Fragment>
      <DialogTitle textAlign={'center'}>
        <form
          autoComplete='off'
          key={uploadFieldsKey}
          onSubmit={handleSubmit(fetchTransactions)}
        >
          <Grid
            container
            columnSpacing={1}
            rowSpacing={1}
            alignItems={'center'}
            justifyContent={'center'}
          >
            {!commingFilters && (
              <>
                <Grid size={{ xs: 12 }}>
                  {ledger && ledger.name + ' statement'}
                </Grid>
                {!ledger && (
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Div sx={{ mt: 1, mb: 1 }}></Div>
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <CostCenterSelector
                    label='Cost Centers'
                    multiple={true}
                    allowSameType={true}
                    onChange={(cost_centers) => {
                      if (Array.isArray(cost_centers)) {
                        setValue(
                          'cost_center_ids',
                          cost_centers.map((cost_center) => cost_center.id)
                        );
                      } else {
                        setValue('cost_center_ids', []);
                      }
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label='From (MM/DD/YYYY)'
                      sx={{ width: '100%' }}
                      minDate={dayjs(
                        authOrganization?.organization.recording_start_date
                      )}
                      value={dayjs(watch('from'))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue(
                          'from',
                          newValue ? newValue.toISOString() : '',
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <DateTimePicker
                      label='To (MM/DD/YYYY)'
                      sx={{ width: '100%' }}
                      minDate={dayjs(watch('from'))}
                      value={dayjs(watch('to'))}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                        },
                      }}
                      onChange={(newValue) => {
                        setValue('to', newValue ? newValue.toISOString() : '', {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                  </Div>
                </Grid>
                <Grid size={{ xs: 12, md: 11 }}>
                  <Div sx={{ mt: 1, mb: 1 }}>
                    <Checkbox
                      checked={withItemDescription}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setWithItemDescription(isChecked);
                        setValue('with_item_description', isChecked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }}
                    />
                    With Items Description
                  </Div>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 12 }} textAlign={'right'}>
              <Stack
                direction='row'
                spacing={0.5}
                justifyContent='flex-end'
                alignItems='center'
              >
                <LoadingButton
                  size='small'
                  onClick={() => handlExcelExport(exportedData)}
                  loading={isExporting}
                  disabled={isFetching}
                  variant='contained'
                  color='success'
                >
                  <FontAwesomeIcon icon={faFileExcel} color='green' />
                  Excel
                </LoadingButton>
                {!commingFilters && (
                  <LoadingButton
                    loading={isFetching}
                    type='submit'
                    size='small'
                    variant='contained'
                  >
                    Filter
                  </LoadingButton>
                )}
              </Stack>
            </Grid>
            <Grid size={12}>
              {transactions && isMobile && (
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant='fullWidth'
                >
                  <Tab label='On-Screen' />
                  <Tab label='PDF' />
                </Tabs>
              )}
            </Grid>
          </Grid>
        </form>
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <div style={{ width: '100%', padding: '16px' }}>
            <Skeleton
              variant='text'
              width={180}
              height={32}
              style={{ borderRadius: 4, marginLeft: 'auto' }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={48}
              style={{ borderRadius: 4 }}
            />
            <Skeleton
              variant='rectangular'
              width='100%'
              height={32}
              style={{ borderRadius: 4 }}
            />
          </div>
        ) : (
          transactions &&
          authOrganization &&
          user && (
            <>
              {isMobile && activeTab === 0 ? (
                <LedgerStatementOnScreen
                  transactionsData={transactions}
                  authOrganization={authOrganization}
                  increasesWith={
                    ledger?.increasesWith || commingFilters?.increasesWith
                  }
                />
              ) : (
                <PDFContent
                  document={
                    <ReportDocument
                      increasesWith={
                        ledger?.increasesWith || commingFilters?.increasesWith
                      }
                      transactionsData={transactions}
                      authOrganization={authOrganization}
                      user={user}
                      ledger={ledger}
                      ledgerName={ledgerName}
                    />
                  }
                  fileName={downloadFileName}
                />
              )}
            </>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button size='small' variant='outlined' onClick={() => setOpen(false)}>
          Close
        </Button>
      </DialogActions>
    </React.Fragment>
  );
};

export default LedgerStatementDialogContent;
