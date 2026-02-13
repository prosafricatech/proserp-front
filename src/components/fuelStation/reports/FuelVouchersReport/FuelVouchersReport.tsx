'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import LedgerSelect from '@/components/accounts/ledgers/forms/LedgerSelect';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div, Span } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Autocomplete,
  Checkbox,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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

interface ReportFilters {
  station_id: number | null;
  from: string | null;
  to: string | null;
  stakeholder_id?: number | null;
  expense_ledger_ids: number[] | null;
  with_receipts?: 0 | 1;
}

interface ReportResponse {
  report_data: any;
}

const validationSchema = yup.object({});

const FuelVouchersReport: React.FC = () => {
  const css = useProsERPStyles();
  const { authUser, authOrganization } = useJumboAuth();
  const organization = authOrganization?.organization;
  const [activeStation, setActiveStation] = useState<Station | null>(null);
  const [activeLedgers, setActiveLedgers] = useState<Ledger[] | null>(null);
  const [withReceipts, setWithReceipts] = useState(0);
  const [reportData, setReportData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(null);
  const [pdfKey, setPdfKey] = useState(0);
  const [filterBy, setFilterBy] = useState<string>('');

  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: stations, isFetching: isFetchingStation } = useQuery<Station[]>(
    {
      queryKey: ['userStations', { userId: authUser?.user?.id }],
      queryFn: fuelStationServices.getUserStations,
    }
  );

  useEffect(() => {
    if (stations?.length === 1) {
      setActiveStation(stations[0]);
    }
  }, [stations]);

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReportFilters>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      station_id: null,
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
      stakeholder_id: null,
      expense_ledger_ids: null,
      with_receipts: 0,
    },
  });

  const expenseLedgerId = watch('expense_ledger_ids');
  const stakeholderId = watch('stakeholder_id');

  useEffect(() => {
    if ((!expenseLedgerId || expenseLedgerId.length === 0) && !stakeholderId) {
      setFilterBy('');
      setValue('with_receipts', 0);
    } else if (
      (!expenseLedgerId || expenseLedgerId.length === 0) &&
      stakeholderId
    ) {
      setFilterBy('stakeholder');
    } else if (!stakeholderId) {
      setFilterBy('expense_ledger');
      setValue('with_receipts', 0);
    }
  }, [expenseLedgerId, stakeholderId]);

  useEffect(() => {
    if (activeStation) {
      setValue('station_id', activeStation.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (activeLedgers) {
      setValue(
        'expense_ledger_ids',
        activeLedgers.map((ledger) => ledger.id),
        {
          shouldDirty: true,
          shouldValidate: true,
        }
      );
    }
  }, [activeStation, activeLedgers, setValue]);

  useEffect(() => {
    setFilters({
      from: dayjs().toISOString(),
      to: dayjs().toISOString(),
      stationName: activeStation?.name || '',
      stakeholder_name: '',
      expense_ledger_ids: [],
      with_receipts: 0,
    });
  }, []);

  const retrieveReport = async (formFilters: ReportFilters) => {
    setIsFetching(true);

    const cleanFilters = Object.fromEntries(
      Object.entries(formFilters).filter(
        ([_, value]) => value !== null && value !== undefined
      )
    );

    setFilters((prev: any) => ({
      ...prev,
      from: readableDate(dayjs(cleanFilters?.from)),
      to: readableDate(dayjs(cleanFilters?.to)),
      stationName: activeStation?.name,
      with_receipts: withReceipts,
    }));

    const report: ReportResponse =
      await fuelStationServices.FuelVouchersReport(cleanFilters);

    setReportData(report);
    setIsFetching(false);
  };

  const downloadFileName = `Fuel Vouchers Report ${readableDate(
    dayjs(filters?.from)?.startOf('day')?.toISOString()
  )}-${readableDate(dayjs(filters?.to)?.endOf('day')?.toISOString())}`;

  const exportedData = {
    fuelVouchers: reportData,
    filters: filters,
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
        <Typography variant='h4' fontWeight={600}>
          Fuel Vouchers Report
        </Typography>

        <Span className={css.hiddenOnPrint}>
          <form autoComplete='off' onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              spacing={2}
              mt={2}
              alignItems='center'
              justifyContent='center'
            >
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete<Station>
                  size='small'
                  options={stations ?? []}
                  getOptionLabel={(option) => option.name}
                  value={activeStation}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_, newValue) => {
                    setActiveStation(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Station'
                      error={!!errors.station_id}
                      helperText={errors.station_id?.message}
                    />
                  )}
                />
              </Grid>

              {(filterBy === '' || filterBy === 'expense_ledger') && (
                <Grid size={{ xs: 12, md: filterBy === '' ? 3 : 6 }}>
                  <Div>
                    <LedgerSelect
                      label={'Expense Ledgers'}
                      allowedGroups={['Expenses']}
                      multiple={true}
                      defaultValue={[]}
                      onChange={(newValue: any) => {
                        setValue(
                          'expense_ledger_ids',
                          newValue.length > 0 && newValue
                            ? newValue.map((ledger: Ledger) => ledger.id)
                            : null,
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        );
                      }}
                    />
                  </Div>
                </Grid>
              )}
              {(filterBy === '' || filterBy === 'stakeholder') && (
                <Grid
                  size={{
                    xs: filterBy === '' ? 12 : 8,
                    md: filterBy === '' ? 3 : 4,
                  }}
                >
                  <StakeholderSelector
                    label='Client'
                    defaultValue={0}
                    onChange={(newValue: any) => {
                      setValue('stakeholder_id', newValue?.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setFilters((prev: any) => ({
                        ...prev,
                        stakeholder_name: newValue?.name || '',
                      }));
                    }}
                  />
                </Grid>
              )}
              {filterBy === 'stakeholder' && (
                <Grid size={{ xs: 4, md: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        defaultChecked={false}
                        onChange={(e) => {
                          setValue('with_receipts', e.target.checked ? 1 : 0);
                          setFilters((prev: any) => ({
                            ...prev,
                            with_receipts: e.target.checked ? 1 : 0,
                          }));
                          setWithReceipts(e.target.checked ? 1 : 0);
                        }}
                      />
                    }
                    label='With Receipts'
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label='From'
                  defaultValue={dayjs().startOf('day')}
                  minDate={dayjs(organization?.recording_start_date)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                  onChange={(newValue) =>
                    setValue('from', newValue ? newValue.toISOString() : null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label='To'
                  defaultValue={dayjs().endOf('day')}
                  minDate={dayjs(organization?.recording_start_date)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                  onChange={(newValue) =>
                    setValue('to', newValue ? newValue.toISOString() : null, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }} textAlign='right'>
                <LoadingButton
                  loading={isExporting}
                  type='button'
                  onClick={() => handlExcelExport(exportedData)}
                  disabled={!reportData || reportData?.length < 1}
                  size='small'
                  variant='contained'
                  color='success'
                  sx={{ mr: 1 }}
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
                key={pdfKey}
                fileName={downloadFileName}
                document={
                  <FuelVouchersReportPDF
                    reportData={reportData}
                    organization={organization}
                    filters={filters}
                  />
                }
              />
            )}
            {/* {activeTab === 1 && (
              <Grid
                container
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Tooltip title='Export file'>
                  <IconButton
                    size='large'
                    onClick={() => handlExcelExport(exportedData)}
                    disabled={isExporting}
                  >
                    <FontAwesomeIcon icon={faFileExcel} color='green' />
                  </IconButton>
                </Tooltip>
              </Grid>
            )} */}
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
