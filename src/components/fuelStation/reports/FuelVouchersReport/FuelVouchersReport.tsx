'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Checkbox,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import PDFContent from '../../../pdf/PDFContent';
import fuelStationServices from '../../fuelStationServices';
import FuelVouchersReportPDF from './FuelVouchersReportPDF';

interface Station {
  id: number;
  name: string;
}

interface Ledger {
  id: number;
  name: string;
  code: string | null;
  ledger_group_id: number;
  alias: string | null;
  nature_id?: number;
}

interface QueryParams {
  station_id: number | null;
  from: string | null;
  to: string | null;
  stakeholder_id?: number | null;
  expense_ledger_ids: number[] | null;
  with_receipts?: 0 | 1;
}

interface PDFFilters {
  from: string;
  to: string;
  stationName: string;
  stakeholder_name: string;
  expense_ledger_ids: number[] | null;
  with_receipts: 0 | 1;
}

interface fvPdfDialog {
  closeDialog?: (value: boolean) => void;
}

const FuelVouchersReport: React.FC<fvPdfDialog> = ({
  closeDialog,
}: fvPdfDialog) => {
  const css = useProsERPStyles();
  const { authUser, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filterBy, setFilterBy] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  // Query params for API call
  const [queryParams, setQueryParams] = useState<QueryParams>({
    station_id: null,
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    stakeholder_id: null,
    expense_ledger_ids: null,
    with_receipts: 0,
  });

  // Filters for PDF display
  const [pdfFilters, setPdfFilters] = useState<PDFFilters>({
    from: readableDate(dayjs().startOf('day')),
    to: readableDate(dayjs().endOf('day')),
    stationName: '',
    stakeholder_name: '',
    expense_ledger_ids: null,
    with_receipts: 0,
  });

  const { data: stations, isFetching: isFetchingStation } = useQuery<Station[]>(
    {
      queryKey: ['userStations', { userId: authUser?.user?.id }],
      queryFn: fuelStationServices.getUserStations,
    }
  );

  // Auto-fetch report when query params change
  const { data: reportData, isFetching } = useQuery({
    queryKey: ['fuelVouchersReport', queryParams],
    queryFn: async () => {
      const cleanFilters = Object.fromEntries(
        Object.entries(queryParams).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      );
      return await fuelStationServices.FuelVouchersReport(cleanFilters);
    },
    enabled: !!queryParams.station_id,
    refetchOnWindowFocus: false,
  });

  // Set default station when stations load
  useEffect(() => {
    if (stations?.length === 1 && !queryParams.station_id) {
      setQueryParams((prev) => ({ ...prev, station_id: stations[0].id }));
      setPdfFilters((prev) => ({ ...prev, stationName: stations[0].name }));
    }
  }, [stations, queryParams.station_id]);

  // Update filterBy based on selected filters
  useEffect(() => {
    const hasExpenseLedgers =
      queryParams.expense_ledger_ids &&
      queryParams.expense_ledger_ids.length > 0;
    const hasStakeholder = !!queryParams.stakeholder_id;

    if (!hasExpenseLedgers && !hasStakeholder) {
      setFilterBy('');
      setQueryParams((prev) => ({ ...prev, with_receipts: 0 }));
      setPdfFilters((prev) => ({ ...prev, with_receipts: 0 }));
    } else if (!hasExpenseLedgers && hasStakeholder) {
      setFilterBy('stakeholder');
    } else if (!hasStakeholder) {
      setFilterBy('expense_ledger');
      setQueryParams((prev) => ({ ...prev, with_receipts: 0 }));
      setPdfFilters((prev) => ({ ...prev, with_receipts: 0 }));
    }
  }, [queryParams.expense_ledger_ids, queryParams.stakeholder_id]);

  const downloadFileName = `Fuel Vouchers Report ${pdfFilters.from}-${pdfFilters.to}`;

  const exportedData = {
    fuelVouchers: reportData,
    filters: pdfFilters,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    const blob =
      await fuelStationServices.exportFuelVouchersToExcel(exportedData);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  if (isFetchingStation) {
    return <LinearProgress />;
  }

  return (
    <>
      <DialogTitle textAlign='center'>
        <Stack
          direction={'row'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant='h4' fontWeight={600}>
            Fuel Vouchers Report
          </Typography>
          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                sx={{ position: 'absolute', right: '20px', top: '10px' }}
                onClick={() => closeDialog?.(false)}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Span className={css.hiddenOnPrint}>
          <Grid
            container
            spacing={2}
            mt={2}
            alignItems='center'
            justifyContent='center'
          >
            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label='From'
                value={dayjs(queryParams.from)}
                minDate={dayjs(organization?.recording_start_date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
                onChange={(newValue) => {
                  const isoValue = newValue ? newValue.toISOString() : null;
                  setQueryParams((prev) => ({ ...prev, from: isoValue }));
                  setPdfFilters((prev) => ({
                    ...prev,
                    from: readableDate(newValue || dayjs()),
                  }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <DateTimePicker
                label='To'
                value={dayjs(queryParams.to)}
                minDate={dayjs(organization?.recording_start_date)}
                slotProps={{
                  textField: { size: 'small', fullWidth: true },
                }}
                onChange={(newValue) => {
                  const isoValue = newValue ? newValue.toISOString() : null;
                  setQueryParams((prev) => ({ ...prev, to: isoValue }));
                  setPdfFilters((prev) => ({
                    ...prev,
                    to: readableDate(newValue || dayjs()),
                  }));
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Autocomplete<Station>
                size='small'
                options={stations ?? []}
                getOptionLabel={(option) => option.name}
                value={
                  stations?.find((s) => s.id === queryParams.station_id) || null
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => {
                  setQueryParams((prev) => ({
                    ...prev,
                    station_id: newValue?.id || null,
                  }));
                  setPdfFilters((prev) => ({
                    ...prev,
                    stationName: newValue?.name || '',
                  }));
                }}
                renderInput={(params) => (
                  <TextField {...params} label='Station' />
                )}
              />
            </Grid>

            {(filterBy === '' || filterBy === 'stakeholder') && (
              <Grid
                size={{
                  xs: filterBy === '' ? 12 : 12,
                  md: filterBy === '' ? 6 : 8,
                }}
              >
                <StakeholderSelector
                  label='Client'
                  defaultValue={0}
                  onChange={(newValue: any) => {
                    setQueryParams((prev) => ({
                      ...prev,
                      stakeholder_id: newValue?.id || null,
                    }));
                    setPdfFilters((prev) => ({
                      ...prev,
                      stakeholder_name: newValue?.name || '',
                    }));
                  }}
                />
              </Grid>
            )}

            {filterBy === 'stakeholder' && (
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={queryParams.with_receipts === 1}
                      onChange={(e) => {
                        const value = e.target.checked ? 1 : 0;
                        setQueryParams((prev) => ({
                          ...prev,
                          with_receipts: value as 0 | 1,
                        }));
                        setPdfFilters((prev) => ({
                          ...prev,
                          with_receipts: value as 0 | 1,
                        }));
                      }}
                    />
                  }
                  label='With Receipts'
                />
              </Grid>
            )}

            {(filterBy === '' || filterBy === 'expense_ledger') && (
              <Grid size={{ xs: 12, md: filterBy === '' ? 6 : 12 }}>
                <Div>
                  <LedgerSelect
                    label={'Expense'}
                    allowedGroups={['Expenses']}
                    multiple={true}
                    defaultValue={[]}
                    onChange={(newValue: Ledger[]) => {
                      const ledgerIds =
                        newValue.length > 0
                          ? newValue.map((ledger: Ledger) => ledger.id)
                          : null;
                      setQueryParams((prev) => ({
                        ...prev,
                        expense_ledger_ids: ledgerIds,
                      }));
                      setPdfFilters((prev) => ({
                        ...prev,
                        expense_ledger_ids: ledgerIds,
                      }));
                    }}
                  />
                </Div>
              </Grid>
            )}

            <Grid
              size={{ xs: 12 }}
              textAlign='right'
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'end',
                gap: 1,
              }}
            >
              <LoadingButton
                size='small'
                onClick={() => handlExcelExport(exportedData)}
                disabled={
                  !reportData ||
                  reportData?.length < 1 ||
                  isExporting ||
                  isFetching
                }
                loading={isExporting}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
                color='success'
                variant='contained'
              >
                <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
              </LoadingButton>
            </Grid>
          </Grid>
        </Span>
      </DialogTitle>

      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : reportData && reportData.length > 0 ? (
          <>
            {belowLargeScreen && (
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label='PDF' />
                <Tab label='ONSCREEN' />
              </Tabs>
            )}
            {activeTab === 0 && (
              <PDFContent
                fileName={downloadFileName}
                document={
                  <FuelVouchersReportPDF
                    reportData={reportData}
                    organization={organization}
                    filters={pdfFilters}
                  />
                }
              />
            )}
          </>
        ) : (
          <Alert variant='outlined' severity='info'>
            No data found
          </Alert>
        )}
      </DialogContent>
    </>
  );
};

export default FuelVouchersReport;
