'use client'

import React, { useEffect, useState } from 'react'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import dayjs from 'dayjs'
import { DateTimePicker } from '@mui/x-date-pickers'
import {
  DialogTitle,
  DialogContent,
  Grid,
  LinearProgress,
  Typography,
  Autocomplete,
  TextField,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import fuelStationServices from '../../fuelStationServices'
import PDFContent from '../../../pdf/PDFContent'
import { useJumboAuth } from '@/app/providers/JumboAuthProvider'
import useProsERPStyles from '@/app/helpers/style-helpers'
import { readableDate } from '@/app/helpers/input-sanitization-helpers'
import { Span } from '@jumbo/shared'
import FuelVouchersReportPDF from './FuelVouchersReportPDF'
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector'


interface Station {
  id: number
  name: string
}

interface ReportFilters {
  station_id: number | null
  from: string | null
  to: string | null
  stakeholder_id?: number | null
}

interface ReportResponse {
  report_data: any
}

const validationSchema = yup.object({})

const FuelVouchersReport: React.FC = () => {
  const css = useProsERPStyles()
  const { authUser, authOrganization } = useJumboAuth()
  const organization = authOrganization?.organization
  const [activeStation, setActiveStation] = useState<Station | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isFetching, setIsFetching] = useState<boolean>(false)

  const { data: stations, isFetching: isFetchingStation } = useQuery<Station[]>({
    queryKey: ['userStations', { userId: authUser?.user?.id }],
    queryFn: fuelStationServices.getUserStations,
  })

  useEffect(() => {
    if (stations?.length === 1) {
      setActiveStation(stations[0])
    }
  }, [stations])

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
  })

  useEffect(() => {
    if (activeStation) {
      setValue('station_id', activeStation.id, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [activeStation, setValue])

  const retrieveReport = async (formFilters: ReportFilters) => {
    setIsFetching(true)

    const cleanFilters = Object.fromEntries(
      Object.entries(formFilters).filter(
        ([_, value]) => value !== null && value !== undefined
      )
    )

    const report: ReportResponse =
      await fuelStationServices.FuelVouchersReport(cleanFilters)

    setReportData(report.report_data)
    setIsFetching(false)
  }

  const downloadFileName = `Fuel Vouchers Report ${readableDate(
    dayjs().startOf('day').toISOString()
  )}-${readableDate(dayjs().endOf('day').toISOString())}`

  if (isFetchingStation) {
    return <LinearProgress />
  }

  return (
    <>
      <DialogTitle textAlign="center">
        <Typography variant="h4" fontWeight={600}>
          Fuel Vouchers Report
        </Typography>

        <Span className={css.hiddenOnPrint}>
          <form autoComplete="off" onSubmit={handleSubmit(retrieveReport)}>
            <Grid
              container
              spacing={2}
              mt={2}
              alignItems="center"
              justifyContent="center"
            >
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete<Station>
                  size="small"
                  options={stations ?? []}
                  getOptionLabel={(option) => option.name}
                  value={activeStation}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_, newValue) => {
                    setActiveStation(newValue)
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Station"
                      error={!!errors.station_id}
                      helperText={errors.station_id?.message}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <StakeholderSelector
                  label="Client"
                  onChange={(newValue: any) => {
                    setValue('stakeholder_id', newValue?.id, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="From"
                  defaultValue={dayjs().startOf('day')}
                  minDate={dayjs(organization?.recording_start_date)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                  onChange={(newValue) =>
                    setValue(
                      'from',
                      newValue ? newValue.toISOString() : null,
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <DateTimePicker
                  label="To"
                  defaultValue={dayjs().endOf('day')}
                  minDate={dayjs(organization?.recording_start_date)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true },
                  }}
                  onChange={(newValue) =>
                    setValue(
                      'to',
                      newValue ? newValue.toISOString() : null,
                      { shouldDirty: true, shouldValidate: true }
                    )
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }} textAlign="right">
                <LoadingButton
                  loading={isFetching}
                  type="submit"
                  size="small"
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
        {isFetching ? (
          <LinearProgress />
        ) : (
          reportData && (
            <PDFContent
              document={<FuelVouchersReportPDF/>}
              fileName={downloadFileName}
            />
          )
        )}
      </DialogContent>
    </>
  )
}

export default FuelVouchersReport
