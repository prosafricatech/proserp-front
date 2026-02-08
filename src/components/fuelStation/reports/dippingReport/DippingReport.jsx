import React, { useEffect, useState } from 'react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import { DateTimePicker } from '@mui/x-date-pickers';
import {
  DialogTitle,
  DialogContent,
  Grid,
  LinearProgress,
  Typography,
  Autocomplete,
  TextField,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm } from 'react-hook-form';
import fuelStationServices from '../../fuelStationServices';
import PDFContent from '../../../pdf/PDFContent';
import DippingReportPDF from './DippingReportPDF';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import useProsERPStyles from '@/app/helpers/style-helpers';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Div, Span } from '@jumbo/shared';

function DippingReport() {
  const { authUser } = useJumboAuth();
  const { data: stations, isFetching: isFetchingStation } = useQuery({
    queryKey: ['userStations', {userId: authUser?.user?.id}],
    queryFn: fuelStationServices.getUserStations
  });

  const [activeStation, setActiveStation] = useState(null);

  useEffect(() => {
    if (stations?.length === 1) {
      setActiveStation(stations[0]);
    }
  }, [stations]);

  document.title = 'Dipping Report';
  const css = useProsERPStyles();
  const { authOrganization: { organization }} = useJumboAuth();
  const [reportData, setReportData] = useState(null);

  const [filters, setFilters] = useState({
    from: dayjs().startOf('day').toISOString(),
    to: dayjs().endOf('day').toISOString(),
    fuel_station_id: activeStation?.id,
    with_calculated_stock: 1
  });

  useEffect(() => {
    if (activeStation) {
      setValue('fuel_station_id', activeStation?.id, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setFilters((prevFilters) => ({
        ...prevFilters,
        fuel_station_id: activeStation.id,
      }));
    }
  }, [activeStation]);

  const validationSchema = yup.object({
    fuel_station_id: yup.number().required("Station is required").typeError('Station is required'),
    from: yup.string().required('Start Date is required').typeError('Start Date is required'),
    to: yup.string().required('End Date is required').typeError('End Date is required'),
  });

  const { setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: filters,
  });

  const [isFetching, setisFetching] = useState(false);

  const retrieveReport = async (formFilters) => {
    setisFetching(true);
    const filtersWithStation = { ...formFilters, fuel_station_id: activeStation.id };
    const report = await fuelStationServices.dippingReport(filtersWithStation);
    setReportData(report.report_data);
    setisFetching(false);
    setFilters(filtersWithStation); // Update the filters state after fetching the report
  };

  const downloadFileName = `Dipping Report ${readableDate(filters.from)}-${readableDate(filters.to)}`;

  if (isFetchingStation) {
    return <LinearProgress />
  }

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <Grid container>
          <Grid size={{xs: 12, md: 12}}>
            <Typography variant="h3" textAlign={'center'}>Dipping Report</Typography>
          </Grid>
        </Grid>
        <Span className={css.hiddenOnPrint}>
          <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              columnSpacing={1}
              rowSpacing={1}
              alignItems="center"
              justifyContent="center"
            >
              <Grid size={{xs: 12, md: 4}}>
                <Autocomplete
                  size="small"
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  options={stations}
                  getOptionLabel={(option) => option.name}
                  defaultValue={stations?.length === 1 ? stations[0] : null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Station"
                      error={errors && !!errors?.fuel_station_id}
                      helperText={errors && errors.fuel_station_id?.message}
                    />
                  )}
                  onChange={(event, newValue) => {
                    if (newValue) {
                      setValue('fuel_station_id', newValue.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setActiveStation(newValue);
                    } else {
                      setValue('fuel_station_id', null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setActiveStation(null);
                    }
                  }}
                />
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="From (MM/DD/YYYY)"
                    defaultValue={dayjs().startOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('from', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <Div sx={{ mt: 1, mb: 1 }}>
                  <DateTimePicker
                    label="To (MM/DD/YYYY)"
                    defaultValue={dayjs().endOf('day')}
                    minDate={dayjs(organization.recording_start_date)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        fullWidth: true,
                      },
                    }}
                    onChange={(newValue) => {
                      setValue('to', newValue ? newValue.toISOString() : null, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </Div>
              </Grid>
              <Grid size={12} textAlign="right">
                <LoadingButton loading={isFetching} type="submit" size="small" variant="contained">
                  Filter
                </LoadingButton>
              </Grid>
            </Grid>
          </form>
        </Span>
      </DialogTitle>
      <DialogContent>
        {
          isFetching ? <LinearProgress /> :
            reportData &&
            (
              <PDFContent
                document={<DippingReportPDF reportData={reportData} activeStation={activeStation} filters={filters} organization={organization} />}
                fileName={downloadFileName}
              />
            )
        }
      </DialogContent>
    </>
  );
}

export default DippingReport;
