'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Span } from '@jumbo/shared';
import { LoadingButton } from '@mui/lab';
import {
  Autocomplete,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
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
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import PDFContent from '../../../pdf/PDFContent';
import fuelStationServices from '../../fuelStationServices';
import FuelVouchersReportPDF from './FuelVouchersReportPDF';

interface Station {
  id: number;
  name: string;
}

interface ReportFilters {
  station_id: number | null;
  from: string | null;
  to: string | null;
  stakeholder_id?: number | null;
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
  const [reportData, setReportData] = useState<any>(null);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>(null);

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
    formState: { errors },
  } = useForm<ReportFilters>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: {
      station_id: null,
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
      stakeholder_id: null,
    },
  });

  useEffect(() => {
    if (activeStation) {
      setValue('station_id', activeStation.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [activeStation, setValue]);

  useEffect(() => {
    setFilters({
      from: dayjs().toISOString(),
      to: dayjs().toISOString(),
      stationName: activeStation?.name || '',
      stakeholder_name: '',
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

              <Grid size={{ xs: 12, md: 6 }}>
                <StakeholderSelector
                  label='Client'
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
        ) : (
          reportData && (
            <>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label='PDF' />
                <Tab label='EXCEL' />
                {belowLargeScreen && <Tab label='ONSCREEN' />}
              </Tabs>
              {activeTab === 0 && (
                <PDFContent
                  document={<FuelVouchersReportPDF />}
                  fileName={downloadFileName}
                />
              )}
              {activeTab === 1 && (
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
              )}
            </>
          )
        )}
      </DialogContent>
    </>
  );
};

export default FuelVouchersReport;
