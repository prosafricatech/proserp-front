'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
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
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
dayjs.extend(isSameOrAfter);
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
import PDFContent from '../../../pdf/PDFContent';
import fuelStationServices from '../../fuelStationServices';
import FuelVouchersReportPDF from './FuelVouchersReportPDF';

interface Station { id: number; name: string; }
interface Ledger { id: number; name: string; code: string | null; ledger_group_id: number; alias: string | null; nature_id?: number; }

interface QueryParams {
  station_id: number | null;
  from: string;
  to: string;
  stakeholder_id: number | null;
  expense_ledger_ids: number[] | null;
  with_receipts: 0 | 1;
}

interface PDFFilters {
  from: string;
  to: string;
  stationName: string;
  stakeholder_name: string;
  expense_ledger_ids: number[] | null;
  with_receipts: 0 | 1;
}

interface fvPdfDialog { closeDialog?: (value: boolean) => void; }

interface FilterFormValues {
  from: Dayjs;
  to: Dayjs;
  station: Station | null;
  stakeholder: any | null;
  expense_ledgers: Ledger[];
  with_receipts: boolean;
}

const filterSchema = yup.object({
  from: yup.mixed<Dayjs>().required('From date is required').test('is-dayjs', 'Invalid date', dayjs.isDayjs),
  to: yup.mixed<Dayjs>()
    .required('To date is required')
    .test('is-dayjs', 'Invalid date', dayjs.isDayjs)
    .test('after-or-same', 'To date must be after or same as From date', function (value) {
      const { from } = this.parent;
      return !from || !value || dayjs(value).isSameOrAfter(dayjs(from));
    }),
  station: yup.mixed<Station>().nullable(),
  stakeholder: yup.mixed().nullable().default(null),
  expense_ledgers: yup.array().of(yup.mixed<Ledger>()).default([]),
  with_receipts: yup.boolean().default(false),
}) as yup.ObjectSchema<FilterFormValues>;

const FuelVouchersReport: React.FC<fvPdfDialog> = ({ closeDialog }) => {
  const css = useProsERPStyles();
  const { authUser, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [isExporting, setIsExporting] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [queryParams, setQueryParams] = useState<QueryParams | null>(null);
  const [pdfFilters, setPdfFilters] = useState<PDFFilters | null>(null);
  const [pdfKey, setPdfKey] = useState(0);
  const [submittedNames, setSubmittedNames] = useState<{ station: string; stakeholder: string }>({
    station: '',
    stakeholder: '',
  });

  const { control, handleSubmit, setValue, watch } = useForm<FilterFormValues>({
    resolver: yupResolver(filterSchema) as any,
    defaultValues: {
      from: dayjs(),
      to: dayjs(),
      station: null,
      stakeholder: null,
      expense_ledgers: [],
      with_receipts: false,
    },
  });

  const watchStakeholder = watch('stakeholder');
  const watchExpenseLedgers = watch('expense_ledgers');

  const { data: stations, isFetching: isFetchingStations } = useQuery<Station[]>({
    queryKey: ['userStations', { userId: authUser?.user?.id }],
    queryFn: fuelStationServices.getUserStations,
  });

  const { data: reportData, isFetching: isFetchingReport } = useQuery({
    queryKey: ['fuelVouchersReport', queryParams],
    queryFn: async () => {
      if (!queryParams) return null;
      const clean = Object.fromEntries(
        Object.entries(queryParams).filter(([, v]) => v !== null && v !== undefined)
      );
      return await fuelStationServices.FuelVouchersReport(clean);
    },
    enabled: !!queryParams,
    refetchOnWindowFocus: false,
  });

  // Update filterBy logic
  useEffect(() => {
    const hasStakeholder = !!watchStakeholder;
    const hasLedgers = watchExpenseLedgers?.length > 0;

    if (!hasStakeholder && !hasLedgers) {
      setFilterBy('');
      setValue('with_receipts', false);
    } else if (hasStakeholder && !hasLedgers) {
      setFilterBy('stakeholder');
    } else if (!hasStakeholder && hasLedgers) {
      setFilterBy('expense_ledger');
      setValue('with_receipts', false);
    }
  }, [watchStakeholder, watchExpenseLedgers, setValue]);

  // Set PDF-ready filters + key only after successful fetch
  useEffect(() => {
    if (reportData && queryParams) {
      setPdfFilters({
        from: readableDate(dayjs(queryParams.from)),
        to: readableDate(dayjs(queryParams.to)),
        stationName: submittedNames.station,
        stakeholder_name: submittedNames.stakeholder,
        expense_ledger_ids: queryParams.expense_ledger_ids,
        with_receipts: queryParams.with_receipts ?? 0,
      });
      setPdfKey(prev => prev + 1);
    }
  }, [reportData, queryParams, submittedNames]);

  const onSubmit = (data: FilterFormValues) => {
    setSubmittedNames({
      station: data.station?.name || '',
      stakeholder: data.stakeholder?.name || '',
    });

    setQueryParams({
      station_id: data.station?.id ?? null,
      from: data.from.toISOString(),
      to: data.to.toISOString(),
      stakeholder_id: data.stakeholder?.id ?? null,
      expense_ledger_ids: data.expense_ledgers.length > 0
        ? data.expense_ledgers.map(l => l.id)
        : null,
      with_receipts: data.with_receipts ? 1 : 0,
    });
  };

  const handleExcelExport = async () => {
    if (!reportData || !pdfFilters) return;
    setIsExporting(true);
    try {
      const blob = await fuelStationServices.exportFuelVouchersToExcel({
        fuelVouchers: reportData,
        filters: pdfFilters,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fuel Vouchers Report ${pdfFilters.from}-${pdfFilters.to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  if (isFetchingStations) return <LinearProgress />;

  const hasData = !!reportData && reportData.length > 0 && !!pdfFilters;

  return (
    <>
      <DialogTitle textAlign="center">
        <Stack direction="row" justifyContent="center" alignItems="center" position="relative">
          <Typography variant="h4" fontWeight={600}>
            Fuel Vouchers Report
          </Typography>
          {belowLargeScreen && (
            <Tooltip title="Close">
              <IconButton
                size="small"
                sx={{ position: 'absolute', right: 20, top: 10 }}
                onClick={() => closeDialog?.(false)}
              >
                <HighlightOff color="primary" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Span className={css.hiddenOnPrint}>
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <Grid container spacing={2} mt={2} alignItems="center" justifyContent="center">
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="from"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DateTimePicker
                      label="From"
                      value={field.value}
                      minDate={dayjs(organization?.recording_start_date)}
                      ampm={false}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="to"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DateTimePicker
                      label="To"
                      value={field.value}
                      minDate={dayjs(organization?.recording_start_date)}
                      ampm={false}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name="station"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Autocomplete<Station>
                      size="small"
                      options={stations ?? []}
                      getOptionLabel={option => option.name}
                      value={field.value}
                      isOptionEqualToValue={(option, value) => option.id === value?.id}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Station"
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
                  )}
                />
              </Grid>

              {(filterBy === '' || filterBy === 'stakeholder') && (
                <Grid size={{ xs: 12, md: filterBy === '' ? 6 : 8 }}>
                  <Controller
                    name="stakeholder"
                    control={control}
                    render={({ field }) => (
                      <StakeholderSelector
                        label="Client"
                        defaultValue={0}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Grid>
              )}

              {filterBy === 'stakeholder' && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name="with_receipts"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={e => field.onChange(e.target.checked)}
                          />
                        }
                        label="With Receipts"
                      />
                    )}
                  />
                </Grid>
              )}

              {(filterBy === '' || filterBy === 'expense_ledger') && (
                <Grid size={{ xs: 12, md: filterBy === '' ? 6 : 12 }}>
                  <Div>
                    <Controller
                      name="expense_ledgers"
                      control={control}
                      render={({ field }) => (
                        <LedgerSelect
                          label="Expense"
                          allowedGroups={['Expenses']}
                          multiple={true}
                          defaultValue={[]}
                          onChange={newValue => field.onChange(newValue || [])}
                        />
                      )}
                    />
                  </Div>
                </Grid>
              )}

              <Grid
                size={{ xs: 12 }}
                textAlign="right"
                sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'end', gap: 1 }}
              >
                <LoadingButton
                  size="small"
                  onClick={handleExcelExport}
                  disabled={!hasData || isExporting || isFetchingReport}
                  loading={isExporting}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  color="success"
                  variant="contained"
                >
                  <FontAwesomeIcon icon={faFileExcel} color="green" /> Excel
                </LoadingButton>

                <LoadingButton
                  size="small"
                  type="submit"
                  loading={isFetchingReport}
                  variant="contained"
                >
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>

      <DialogContent>
        {isFetchingReport ? (
          <LinearProgress />
        ) : hasData ? (
          <>
            {belowLargeScreen && (
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="PDF" />
                <Tab label="ONSCREEN" />
              </Tabs>
            )}

            {activeTab === 0 && (
              <PDFContent
                key={pdfKey}
                fileName={`Fuel Vouchers Report ${pdfFilters!.from}-${pdfFilters!.to}`}
                document={
                  <FuelVouchersReportPDF
                    reportData={reportData}
                    organization={organization}
                    filters={pdfFilters!}
                  />
                }
              />
            )}
          </>
        ) : (
          <Alert variant="outlined" severity="info">
            {queryParams
              ? 'No fuel vouchers present for the selected filters'
              : 'Please select filters and click "Filter" to generate the report'}
          </Alert>
        )}
      </DialogContent>
    </>
  );
};

export default FuelVouchersReport;