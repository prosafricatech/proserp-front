'use client'
import React, { useState } from 'react';
import { 
  Alert, 
  Box, 
  Chip, 
  Grid, 
  IconButton, 
  Tooltip, 
  Typography, 
  useMediaQuery 
} from '@mui/material';
import { 
  AttachmentOutlined, 
  ContentPasteSearchOutlined, 
  DeleteOutlined, 
  EditOutlined, 
  LocalShipping 
} from '@mui/icons-material';
import SaleDeliveryNotesItemAction from './SaleDeliveryNotesItemAction';
import posServices from '../../pos-services';
import dayjs from 'dayjs';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { useQuery } from '@tanstack/react-query';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { SalesOrder } from '../SalesOrderType';
import { BackdropSpinner } from '@/shared/ProgressIndicators/BackdropSpinner';

interface DeliveryNote {
  id: string;
  deliveryNo: string;
  dispatch_date: string;
  dispatch_from: string;
  destination: string;
  driver_information?: string;
  vehicle_information?: string;
  remarks?: string;
  is_invoiced: boolean;
}

interface SaleDeliveryNotesProps {
  expanded: boolean;
  sale: SalesOrder;
}

const SaleDeliveryNotes: React.FC<SaleDeliveryNotesProps> = ({ expanded, sale }) => {
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  const [openDeliveryNoteDeleteDialog, setOpenDeliveryNoteDeleteDialog] = useState(false);
  const [openDeliveryEditDialog, setOpenDeliveryEditDialog] = useState(false);
  const [openDispatchPreview, setOpenDispatchPreview] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);

  const { checkOrganizationPermission } = useJumboAuth();
  
  // Screen handling constants
  const { theme } = useJumboTheme();
  const belowLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));

  const { data: saleDeliveryNotes, isLoading } = useQuery({
    queryKey: ['saleDeliveryNotes', { saleId: sale.id }],
    queryFn: () => posServices.saleDeliveryNotes(sale.id),
    enabled: !!expanded && !sale.is_instant_sale, // Fetch data only when the accordion is open and is_instant_sale is false
  });

  return (
    <React.Fragment>
      {isLoading && <BackdropSpinner/>}
      {saleDeliveryNotes?.length > 0 ? (
        saleDeliveryNotes.map((deliveryNote: DeliveryNote) => (
          <Grid
            key={deliveryNote.id}
            sx={{
              cursor: 'pointer',
              borderTop: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
              paddingX: 1,
            }}
            columnSpacing={2}
            alignItems={'center'}
            mb={1}
            container
          >
            <Grid size={{xs: 6, md: 2, lg: 2}}>
              <Tooltip title={'Delivery No.'}>
                <Typography fontWeight={'bold'}>{deliveryNote.deliveryNo}</Typography>
              </Tooltip>
              <Tooltip title={'Dispatch Date'}>
                <Typography>
                  {readableDate(deliveryNote.dispatch_date)}
                </Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2, lg: 3}}>
              <Tooltip title={'Dispatch From'}>
                <Typography>{deliveryNote.dispatch_from}</Typography>
              </Tooltip>
              <Tooltip title={'Destination'}>
                <Typography>{deliveryNote.destination}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 6, md: 2, lg: 3}} mt={0.5}>
              {deliveryNote.driver_information && (
                <Tooltip title={'Driver Information'}>
                  <Typography>{deliveryNote.driver_information}</Typography>
                </Tooltip>
              )}
              {deliveryNote.vehicle_information && (
                <Tooltip title={'Vehicle Information'}>
                  <Chip
                    label={deliveryNote.vehicle_information}
                    size='small'
                  />
                </Tooltip>
              )}
            </Grid>
            <Grid size={{xs: 6, md: 3, lg: 2}} mt={0.5}>
              <Tooltip title={'Remarks'}>
                <Typography>{deliveryNote.remarks}</Typography>
              </Tooltip>
            </Grid>
            <Grid size={{xs: 12, md: 3, lg: 2}}>
              <Box
                display={'flex'}
                flexDirection={'row'}
                justifyContent={'flex-end'}
              >
                <Tooltip title={belowLargeScreen ? `Download Dispatch ${deliveryNote.deliveryNo}` : `View Dispatch ${deliveryNote.deliveryNo}`}>
                  <IconButton
                    onClick={() => {
                      setSelectedDeliveryNote(deliveryNote);
                      setOpenDocumentDialog(true);
                      setOpenDispatchPreview(true);
                    }}
                  >
                    <ContentPasteSearchOutlined fontSize={'small'}/>
                  </IconButton>
                </Tooltip>
                <Tooltip title={belowLargeScreen ? `Download Delivery Note ${deliveryNote.deliveryNo}` : `View Delivery Note ${deliveryNote.deliveryNo}`}>
                  <IconButton
                    onClick={() => {
                      setSelectedDeliveryNote(deliveryNote);
                      setOpenDocumentDialog(true);
                      setOpenDispatchPreview(false);
                    }}
                  >
                    <LocalShipping fontSize={'small'}/>
                  </IconButton>
                </Tooltip>

                <Tooltip title={`${deliveryNote.deliveryNo} Attachments`}>
                  <IconButton onClick={() => {
                    setAttachDialog(true);
                    setSelectedDeliveryNote(deliveryNote);
                  }}>
                    <AttachmentOutlined/>
                  </IconButton>
                </Tooltip>

                {(checkOrganizationPermission(PERMISSIONS.SALES_DISPATCH_BACKDATE) || 
                  deliveryNote.dispatch_date >= dayjs().startOf('date').toISOString()) && 
                  !deliveryNote.is_invoiced && (
                  <Tooltip title={`Edit ${deliveryNote.deliveryNo}`}>
                    <IconButton 
                      onClick={() => {
                        setSelectedDeliveryNote(deliveryNote);
                        setOpenDeliveryEditDialog(true);
                      }}
                    >
                      <EditOutlined fontSize={'small'} />
                    </IconButton>
                  </Tooltip>
                )}
                {(checkOrganizationPermission(PERMISSIONS.SALES_DISPATCH_BACKDATE) || 
                  deliveryNote.dispatch_date >= dayjs().startOf('date').toISOString()) && 
                  !deliveryNote.is_invoiced && (
                  <Tooltip title={`Delete ${deliveryNote.deliveryNo}`}>
                    <IconButton
                      onClick={() => {
                        setSelectedDeliveryNote(deliveryNote);
                        setOpenDeliveryNoteDeleteDialog(true);
                      }}
                    >
                      <DeleteOutlined color="error" fontSize={'small'} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Grid>
          </Grid>
        ))
      ) : (
        !isLoading && <Alert variant='outlined' severity='info'>No dispatch found</Alert>       
      )}

      {/* DeliveryNotesItemAction */}
      <SaleDeliveryNotesItemAction
        openDocumentDialog={openDocumentDialog}
        setOpenDocumentDialog={setOpenDocumentDialog}
        openDispatchPreview={openDispatchPreview}
        openDeliveryEditDialog={openDeliveryEditDialog} 
        setOpenDeliveryEditDialog={setOpenDeliveryEditDialog}
        openDeliveryNoteDeleteDialog={openDeliveryNoteDeleteDialog}
        setOpenDeliveryNoteDeleteDialog={setOpenDeliveryNoteDeleteDialog} 
        selectedDeliveryNote={selectedDeliveryNote}
        setSelectedDeliveryNote={setSelectedDeliveryNote}
        setAttachDialog={setAttachDialog}
        attachDialog={attachDialog}
      />
    </React.Fragment>
  );
};

export default SaleDeliveryNotes;