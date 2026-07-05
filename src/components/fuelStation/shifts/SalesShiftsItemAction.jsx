'use client';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useLedgerSelect } from '@/components/accounts/ledgers/forms/LedgerSelectProvider';
import { FileExportGrid } from '@/components/sharedComponents/FileExportGrid';
import PreviewTopBar from '@/components/sharedComponents/PreviewTopBar';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { JumboDdMenu } from '@jumbo/components';
import { useJumboDialog } from '@jumbo/components/JumboDialog/hooks/useJumboDialog';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import {
  DeleteOutlined,
  EditOutlined,
  HighlightOff,
  MoreHorizOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Box } from '@mui/system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useContext, useState } from 'react';
import PDFContent from '../../pdf/PDFContent';
import { useProductsSelect } from '../../productAndServices/products/ProductsSelectProvider';
import fuelStationServices from '../fuelStationServices';
import SalesShiftOnScreen from './preview/SalesShiftOnScreen';
import SalesShiftPDF from './preview/SalesShiftPDF';
import SaleShiftForm from './SaleShiftForm/SaleShiftForm';
import { StationFormContext } from './SalesShifts';

const EditShift = ({ ClosedShift, setOpenEditDialog }) => {
  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: async () => {
      return await fuelStationServices.showShiftDetails(ClosedShift.id);
    },
  });

  if (isFetching) {
    return <LinearProgress />;
  }

  return (
    <SaleShiftForm SalesShift={shiftData} setOpenDialog={setOpenEditDialog} />
  );
};

const DocumentDialog = ({
  organization,
  ClosedShift,
  isOpen,
  setOpenDocumentDialog,
}) => {
  const { activeStation } = useContext(StationFormContext);
  const { shift_teams, fuel_pumps, tanks } = activeStation;
  const { productOptions } = useProductsSelect();
  const { ungroupedLedgerOptions } = useLedgerSelect();
  const [openDetails, setOpenDetails] = useState(false);
  const [pdfKey, setPdfKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const handleDetailsChange = (e) => {
    const isChecked = e.target.checked;
    setOpenDetails(isChecked);
    setPdfKey((prev) => prev + 1);
  };

  const { data: shiftData, isFetching } = useQuery({
    queryKey: ['showshiftDetails', { id: ClosedShift.id }],
    queryFn: () => fuelStationServices.showShiftDetails(ClosedShift.id),
  });

  const [showOnScreen, setShowOnScreen] = useState(true);
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  if (isFetching) {
    return <LinearProgress />;
  }

  let paymentReceived = [];
  let allPaymentsReceived = [];

  if (shiftData?.payments_received?.length) {
    const ledgerMap = new Map(ungroupedLedgerOptions.map((ul) => [ul.id, ul]));

    shiftData.payments_received.forEach((p) => {
      const creditLedger = ledgerMap.get(p.credit_ledger_id);

      const debitLedger = ledgerMap.get(p.debit_ledger_id);

      p.creditLedger = creditLedger;
      p.debitLedger = debitLedger;
    });

    const cashPayments = shiftData.payments_received.filter(
      (p) => p.debitLedger.ledger_group_id === 13
    );

    paymentReceived = cashPayments;
    allPaymentsReceived = shiftData.payments_received;
  }

  const exportedData = {
    shiftData: shiftData,
    organization: organization,
    productOptions: productOptions,
    stationName: activeStation?.name,
    fuel_pumps: fuel_pumps,
    tanks: tanks,
    shift_teams: shift_teams,
    withDetails: openDetails,
    paymentReceived: paymentReceived,
    allPaymentsReceived: allPaymentsReceived,
  };

  const handlExcelExport = async (exportedData) => {
    setIsExporting(true);
    try {
      const blob =
        await fuelStationServices.exportSalesShiftsToExcel(exportedData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Shift-${exportedData.stationName}-${readableDate(exportedData.shiftData?.shift_end)}-${exportedData.shiftData?.shift?.name}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Optionally show error
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} maxWidth='xl' fullWidth fullScreen={belowLargeScreen}>
      <DialogTitle>
        <Stack
          direction={'row'}
          justifyContent={'center'}
          alignItems={'center'}
          position={'relative'}
        >
          <Typography>Detailed</Typography>
          <Switch
            checked={openDetails}
            onChange={handleDetailsChange}
            slotProps={{ input: { 'aria-label': 'controlled' } }}
          />

          {belowLargeScreen && (
            <Tooltip title='Close'>
              <IconButton
                size='small'
                onClick={() => setOpenDocumentDialog(false)}
                sx={{ position: 'absolute', right: 5 }}
              >
                <HighlightOff color='primary' />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <PreviewTopBar
          fileExportGrid={
            <FileExportGrid
              exportExcel
              handlExcelExport={() => handlExcelExport(exportedData)}
              exportPdf
              handlePdf={() => {
                setShowOnScreen((prev) => !prev);
              }}
              exportingExcel={isExporting}
            />
          }
        />

        {showOnScreen && (
          <SalesShiftOnScreen
            stationName={activeStation?.name}
            openDetails={openDetails}
            productOptions={productOptions}
            shiftData={shiftData}
            tanks={tanks}
            fuel_pumps={fuel_pumps}
            shift_teams={shift_teams}
            organization={organization}
            paymentReceived={paymentReceived}
            allPaymentsReceived={allPaymentsReceived}
          />
        )}
        {!showOnScreen && (
          <PDFContent
            key={pdfKey}
            fileName={shiftData.shiftNo}
            document={
              <SalesShiftPDF
                stationName={activeStation?.name}
                openDetails={openDetails}
                productOptions={productOptions}
                shiftData={shiftData}
                tanks={tanks}
                fuel_pumps={fuel_pumps}
                shift_teams={shift_teams}
                organization={organization}
                paymentReceived={paymentReceived}
                allPaymentsReceived={allPaymentsReceived}
              />
            }
          />
        )}

        {!belowLargeScreen && (
          <Box textAlign='right' mt={5}>
            <Button
              variant='outlined'
              size='small'
              color='primary'
              onClick={() => setOpenDocumentDialog(false)}
            >
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SalesShiftsItemAction = ({ ClosedShift }) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const {
    authOrganization: { organization },
    checkOrganizationPermission,
  } = useJumboAuth();
  const { showDialog, hideDialog } = useJumboDialog();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  //Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { mutate: deleteShift } = useMutation({
    mutationFn: fuelStationServices.deleteSalesShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salesShifts'] });
      enqueueSnackbar(data.message, {
        variant: 'success',
      });
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || 'Failed to delete outlet',
        { variant: 'error' }
      );
    },
  });

  const canUpdate = checkOrganizationPermission([
    PERMISSIONS.FUEL_SALES_SHIFTS_UPDATE,
  ]);
  const canDelete = checkOrganizationPermission([
    PERMISSIONS.FUEL_SALES_SHIFTS_DELETE,
  ]);
  const canBackdate = checkOrganizationPermission([
    PERMISSIONS.FUEL_SALES_SHIFTS_BACKDATE,
  ]);

  const isToday =
    ClosedShift?.shift_end &&
    dayjs(ClosedShift.shift_end).isSame(dayjs(), 'day');
  const canEdit = canUpdate || isToday || canBackdate;
  const canDeleteAction = canDelete || isToday || canBackdate;

  const menuItems = [
    { icon: <VisibilityOutlined />, title: 'View', action: 'open' },
    canEdit ? { icon: <EditOutlined />, title: 'Edit', action: 'edit' } : null,
    canDeleteAction
      ? {
          icon: <DeleteOutlined color='error' />,
          title: 'Delete',
          action: 'delete',
        }
      : null,
  ].filter(Boolean);

  const handleItemAction = (menuItem) => {
    switch (menuItem.action) {
      case 'open':
        setOpenDocumentDialog(true);
        break;
      case 'edit':
        setOpenEditDialog(true);
        break;
      case 'delete':
        showDialog({
          title: 'Delete',
          content: 'Are you sure you want to delete this Shift?',
          onYes: () => {
            hideDialog();
            deleteShift(ClosedShift.id);
          },
          onNo: () => hideDialog(),
          variant: 'confirm',
        });
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Dialog
        open={openEditDialog || openDocumentDialog}
        fullWidth
        fullScreen={belowLargeScreen}
        maxWidth={openDocumentDialog ? 'md' : 'lg'}
        scroll={belowLargeScreen ? 'body' : 'paper'}
        onClose={() => {
          setOpenDocumentDialog(false);
        }}
      >
        {openEditDialog && (
          <EditShift
            ClosedShift={ClosedShift}
            setOpenEditDialog={setOpenEditDialog}
          />
        )}
        {openDocumentDialog && (
          <DocumentDialog
            isOpen={openDocumentDialog}
            ClosedShift={ClosedShift}
            organization={organization}
            setOpenDocumentDialog={setOpenDocumentDialog}
          />
        )}
      </Dialog>
      <JumboDdMenu
        icon={
          <Tooltip title='Actions'>
            <MoreHorizOutlined />
          </Tooltip>
        }
        menuItems={menuItems}
        onClickCallback={handleItemAction}
      />
    </>
  );
};

export default SalesShiftsItemAction;
