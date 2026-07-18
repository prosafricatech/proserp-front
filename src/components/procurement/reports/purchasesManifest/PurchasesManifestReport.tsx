import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import CostCenterSelector from '@/components/masters/costCenters/CostCenterSelector';
import StakeholderSelector from '@/components/masters/stakeholders/StakeholderSelector';
import PDFContent from '@/components/pdf/PDFContent';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import { Organization, User } from '@/types/auth-types';
import { yupResolver } from '@hookform/resolvers/yup';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { Div } from '@jumbo/shared';
import { HighlightOff, InfoOutline } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import purchaseServices from '../../purchases/purchase-services';
import PurchasesManifestOnScreen, {
  PurchaseManifestItem,
} from './PurchasesManifestOnScreen';
import PurchasesManifestPDF from './PurchasesManifestPDF';

interface PurchasesManifestOnScreenProps {
  reportData: {
    filters: {
      cost_centers: Array<{
        id: number;
        name: string;
        code: string | null;
        type: string;
      }> | null;
      from: string;
      to: string;
      suppliers: any;
      status: string;
    };
    items: PurchaseManifestItem[];
  };
  organization: Organization;
}

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
  const { authOrganization, authUser } = useJumboAuth();
  const user = authUser?.user;
  const { enqueueSnackbar } = useSnackbar();
  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const [isFetching, setisFetching] = useState(false);
  const [reportsData, setReportsData] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [showOnScreen, setShowOnScreen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const getMovements = async (filters: any) => {
    try {
      setisFetching(true);
      const data = await purchaseServices.getPurchasesManifestData(filters);
      setReportsData(data);
      setisFetching(false);
    } catch (error) {
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
    status: yup.string(),
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

  useEffect(() => {
    setValue('status', selectedStatus);
  }, [selectedStatus]);

  const handleChange = (e: SelectChangeEvent) => {
    setSelectedStatus(e.target.value);
  };

  const exportedData = {
    reportData: reportsData,
    organization: authOrganization?.organization,
    user: user as User,
  };

  const handlExcelExport = async (exportedData: any) => {
    setIsExporting(true);
    try {
      const blob =
        await purchaseServices.exportPurchaseManifestReportToExcel(
          exportedData
        );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${`Purchase-Manifest-Report from ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}`}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('error exporting: ', e);
    } finally {
      setIsExporting(false);
    }
  };

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
                  minDate={dayjs(
                    authOrganization?.organization.recording_start_date
                  )}
                  maxDate={dayjs()}
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
                  minDate={dayjs(
                    authOrganization?.organization.recording_start_date
                  )}
                  maxDate={dayjs()}
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
                  <InputLabel id='status-label'>Type</InputLabel>
                  <Select
                    labelId='status-label'
                    id='process-types-filter-select'
                    label='Status'
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
                    {reportsData?.items.length > 0 && (
                      <FileExportGrid
                        exportExcel
                        handlExcelExport={() => handlExcelExport(exportedData)}
                        exportingExcel={isExporting}
                        exportPdf
                        handlePdf={() => {
                          setShowOnScreen((prev) => !prev);
                        }}
                      />
                    )}
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
      </DialogTitle>
      <DialogContent>
        {isFetching ? (
          <LinearProgress />
        ) : reportsData && reportsData?.items.length > 0 ? (
          showOnScreen ? (
            <PurchasesManifestOnScreen
              reportData={reportsData}
              organization={authOrganization?.organization}
            />
          ) : (
            <PDFContent
              document={
                <PurchasesManifestPDF
                  reportData={reportsData}
                  organization={authOrganization?.organization}
                  user={user as User}
                />
              }
              fileName={`Purchase-Manifest-Report from ${readableDate(watch('from'), true)} to ${readableDate(watch('to'), true)}`}
            />
          )
        ) : (
          !isFetching &&
          reportsData?.items.length < 1 && (
            <Alert variant='outlined' color='info' icon={<InfoOutline />}>
              No records found for the selected filters
            </Alert>
          )
        )}
      </DialogContent>
    </>
  );
};

export default PurchasesManifestReport;
