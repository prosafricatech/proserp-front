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
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as yup from 'yup';
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

interface FilterFormValues {
  from: Dayjs;
  to: Dayjs;
  station: Station | null;
  stakeholder?: any;
  expense_ledgers: Ledger[];
  with_receipts: boolean;
}

// Validation schema
const filterSchema: yup.ObjectSchema<FilterFormValues> = yup.object().shape({
  from: yup
    .mixed<Dayjs>()
    .required('From date is required')
    .test('is-dayjs', 'Invalid date', (value) => dayjs.isDayjs(value)),
  to: yup
    .mixed<Dayjs>()
    .required('To date is required')
    .test('is-dayjs', 'Invalid date', (value) => dayjs.isDayjs(value))
    .test('is-after-from', 'To date must be after From date', function (value) {
      const { from } = this.parent;
      if (!from || !value) return true;
      return (
        dayjs(value).isAfter(dayjs(from)) || dayjs(value).isSame(dayjs(from))
      );
    }),
  station: yup.mixed<Station>().nullable(),
  stakeholder: yup.mixed<any>().nullable().default(null),
  expense_ledgers: yup.array().of(yup.mixed<Ledger>().required()).default([]),
  with_receipts: yup.boolean().default(false),
}) as yup.ObjectSchema<FilterFormValues>;

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

  // Query params for API call - only updated on form submission
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

  // Initialize react-hook-form with validation
  const { control, handleSubmit, watch, setValue } = useForm<FilterFormValues>({
    resolver: yupResolver(filterSchema),
    defaultValues: {
      from: dayjs().startOf('day'),
      to: dayjs().endOf('day'),
      station: null,
      stakeholder: null,
      expense_ledgers: [],
      with_receipts: false,
    },
  });

  const { data: stations, isFetching: isFetchingStation } = useQuery<Station[]>(
    {
      queryKey: ['userStations', { userId: authUser?.user?.id }],
      queryFn: fuelStationServices.getUserStations,
    }
  );

  // Fetch report only when queryParams change (triggered by form submission)
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
    enabled: true,
    refetchOnWindowFocus: false,
  });

  // Watch all form values for auto-refetch and filterBy updates
  const watchFrom = watch('from');
  const watchTo = watch('to');
  const watchStation = watch('station');
  const watchStakeholder = watch('stakeholder');
  const watchExpenseLedgers = watch('expense_ledgers');
  const watchWithReceipts = watch('with_receipts');

  // Update filterBy based on form values
  useEffect(() => {
    const hasExpenseLedgers =
      watchExpenseLedgers && watchExpenseLedgers.length > 0;
    const hasStakeholder = !!watchStakeholder;

    if (!hasExpenseLedgers && !hasStakeholder) {
      setFilterBy('');
      setValue('with_receipts', false);
    } else if (!hasExpenseLedgers && hasStakeholder) {
      setFilterBy('stakeholder');
    } else if (!hasStakeholder) {
      setFilterBy('expense_ledger');
      setValue('with_receipts', false);
    }
  }, [watchExpenseLedgers, watchStakeholder, setValue]);

  // Auto-refetch when any filter changes (restore original behavior)
  useEffect(() => {
    const formData: FilterFormValues = {
      from: watchFrom,
      to: watchTo,
      station: watchStation,
      stakeholder: watchStakeholder,
      expense_ledgers: watchExpenseLedgers,
      with_receipts: watchWithReceipts,
    };
    onSubmit(formData);
  }, [
    watchFrom,
    watchTo,
    watchStation,
    watchStakeholder,
    watchExpenseLedgers,
    watchWithReceipts,
  ]);

  // Form submission handler
  const onSubmit = (data: FilterFormValues) => {
    // Update query params to trigger API call
    setQueryParams({
      station_id: data.station?.id || null,
      from: data.from.toISOString(),
      to: data.to.toISOString(),
      stakeholder_id: data.stakeholder?.id || null,
      expense_ledger_ids:
        data.expense_ledgers.length > 0
          ? data.expense_ledgers.map((ledger) => ledger.id)
          : null,
      with_receipts: data.with_receipts ? 1 : 0,
    });

    // Update PDF filters
    setPdfFilters({
      from: readableDate(data.from),
      to: readableDate(data.to),
      stationName: data.station?.name || '',
      stakeholder_name: data.stakeholder?.name || '',
      expense_ledger_ids:
        data.expense_ledgers.length > 0
          ? data.expense_ledgers.map((ledger) => ledger.id)
          : null,
      with_receipts: data.with_receipts ? 1 : 0,
    });
  };

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
          <form autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
            <Grid
              container
              spacing={2}
              mt={2}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='from'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DateTimePicker
                      label='From'
                      value={field.value}
                      minDate={dayjs(organization?.recording_start_date)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                      onChange={(newValue) => field.onChange(newValue)}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='to'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <DateTimePicker
                      label='To'
                      value={field.value}
                      minDate={dayjs(organization?.recording_start_date)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          fullWidth: true,
                          error: !!error,
                          helperText: error?.message,
                        },
                      }}
                      onChange={(newValue) => field.onChange(newValue)}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Controller
                  name='station'
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                    <Autocomplete<Station>
                      size='small'
                      options={stations ?? []}
                      getOptionLabel={(option) => option.name}
                      value={field.value ?? null}
                      isOptionEqualToValue={(option, value) =>
                        value != null && option.id === value.id
                      }
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Station'
                          error={!!error}
                          helperText={error?.message}
                        />
                      )}
                    />
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
                  <Controller
                    name='stakeholder'
                    control={control}
                    render={({ field }) => (
                      <StakeholderSelector
                        label='Client'
                        defaultValue={0}
                        onChange={(newValue: any) => field.onChange(newValue)}
                      />
                    )}
                  />
                </Grid>
              )}

              {filterBy === 'stakeholder' && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller
                    name='with_receipts'
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label='With Receipts'
                      />
                    )}
                  />
                </Grid>
              )}

              {(filterBy === '' || filterBy === 'expense_ledger') && (
                <Grid size={{ xs: 12, md: filterBy === '' ? 6 : 12 }}>
                  <Div>
                    <Controller
                      name='expense_ledgers'
                      control={control}
                      render={({ field }) => (
                        <LedgerSelect
                          label={'Expense'}
                          allowedGroups={['Expenses']}
                          multiple={true}
                          defaultValue={[]}
                          onChange={(newValue: any) =>
                            field.onChange(newValue || [])
                          }
                        />
                      )}
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

                <LoadingButton
                  size='small'
                  type='submit'
                  loading={isFetching}
                  variant='contained'
                >
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
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
            No fuel vouchers present
          </Alert>
        )}
      </DialogContent>
    </>
  );
};

export default FuelVouchersReport;
