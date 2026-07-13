import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { HighlightOff } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import purchaseServices from '../../purchases/purchase-services';

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'closed', label: 'Closed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Partially Received', label: 'Partially Received' },
  { value: 'Fully Received', label: 'Fully Received' },
];

const PurchasesManifestReport = ({
  toggleOpen,
}: {
  toggleOpen: (value: boolean) => {};
}) => {
  const { authOrganization } = useJumboAuth();
  const { enqueueSnackbar } = useSnackbar();
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [isFetching, setisFetching] = useState(false);
  const [reprotsData, setReprotsData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const handleChange = (e: SelectChangeEvent) => {
    setSelectedStatus(e.target.value);
  };

  const getMovements = async (filters: any) => {
    try {
      console.log('filters: ', filters);
      setisFetching(true);
      const data = await purchaseServices.getPurchasesManifestData(filters);

      setReprotsData(data);
      console.log('data: ', data);
      setisFetching(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // 1. Server response message (most common)
        console.log(error.response?.data?.message);

        // 2. Server response error
        console.log(error.response?.data?.error);

        // 3. HTTP status message
        console.log(error.response?.statusText); // e.g., "Not Found"

        // 4. Axios error message
        console.log(error.message); // e.g., "Network Error", "Request failed with status code 404"

        // 5. Error code
        console.log(error.code); // e.g., "ERR_NETWORK", "ERR_BAD_REQUEST"

        // 6. Full error object
        console.log(error);
      }
      enqueueSnackbar('an error occurred', { variant: 'error' });
      setisFetching(false);
    }
  };

  // Validation schema
  const validationSchema = yup.object({
    from: yup.string(),
    to: yup.string(),
    stakeholder_ids: yup.array().of(yup.number()).nullable(),
    cost_center_ids: yup.array().of(yup.number()).nullable(),
  });

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().toISOString(),
      stakeholder_ids: null,
      cost_center_ids: authOrganization?.costCenters.map(
        (cost_center: any) => cost_center.id
      ),
    },
  });

  return (
    <>
      <DialogTitle textAlign={'center'}>
        <form autoComplete='off' onSubmit={handleSubmit(getMovements)}>
          <Grid
            container
            columnSpacing={1}
            paddingTop={2}
            rowSpacing={1}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Grid container size={12}>
              <Grid size={belowLargeScreen ? 11 : 12}>
                <Typography variant='h3'>Purchase Manifest</Typography>
              </Grid>
              {belowLargeScreen && (
                <Grid size={1}>
                  <Tooltip title='Close'>
                    <IconButton
                      size='small'
                      sx={{ mb: 1 }}
                      onClick={() => toggleOpen(false)}
                    >
                      <HighlightOff color='primary' />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 0.3 }}>
                <DatePicker
                  label='From (MM/DD/YYYY)'
                  // minDate={dayjs(
                  //   authOrganization?.organization.recording_start_date
                  // )}
                  //   maxDate={dayjs()}
                  value={watch('from') ? dayjs(watch('from')) : null}
                  onChange={(newValue) => {
                    setValue(
                      'from',
                      newValue ? newValue.toISOString() : undefined,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 0.3 }}>
                <DatePicker
                  label='To (MM/DD/YYYY)'
                  // minDate={dayjs(
                  //   authOrganization.organization.recording_start_date
                  // )}
                  //   maxDate={dayjs()}
                  value={watch('to') ? dayjs(watch('to')) : null}
                  onChange={(newValue) => {
                    setValue(
                      'to',
                      newValue ? newValue.toISOString() : undefined,
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      }
                    );
                  }}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                    },
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 0.3 }}>
                <CostCenterSelector
                  label='Cost  Centers'
                  multiple={true}
                  allowSameType={true}
                  onChange={(cost_centers) => {
                    if (cost_centers && Array.isArray(cost_centers)) {
                      setValue(
                        'cost_center_ids',
                        cost_centers.map((cost_center: any) => cost_center.id)
                      );
                    }
                  }}
                />
              </Div>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Div sx={{ mt: 0.3 }}>
                <StakeholderSelector
                  label='Stake Holders'
                  multiple={true}
                  onChange={(newValue) => {
                    if (newValue && Array.isArray(newValue)) {
                      setValue(
                        'stakeholder_ids',
                        newValue.map((value) => value.id)
                      );
                    } else {
                      setValue('stakeholder_ids', []);
                    }
                  }}
                />
              </Div>
            </Grid>
            <Grid container size={{ xs: 12, md: 12 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='process-types-filter-label'>Type</InputLabel>
                  <Select
                    labelId='process-types-filter-label'
                    id='process-types-filter-select'
                    label='Type'
                    value={selectedStatus}
                    onChange={handleChange}
                    sx={{ textAlign: 'left' }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          '& .MuiMenuItem-root': {
                            justifyContent: 'flex-start',
                            textAlign: 'left',
                          },
                        },
                      },
                    }}
                  >
                    {STATUS_OPTIONS.map((itm, idx) => (
                      <MenuItem value={itm.value} key={idx}>
                        {itm.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} textAlign={'right'}>
                <Stack
                  direction='row'
                  spacing={0.5}
                  justifyContent='flex-end'
                  alignItems='center'
                >
                  <>
                    <LoadingButton
                      size='small'
                      // onClick={() => handlExcelExport(exportedData)}
                      // loading={isDownloadingTemplate}
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
      </DialogTitle>
    </>
  );
};

export default PurchasesManifestReport;
