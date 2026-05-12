import {
  DisabledByDefault,
  EditOutlined,
  VisibilityOutlined,
  AccountBalanceWalletOutlined,
} from '@mui/icons-material';
import { Dialog, Divider, Grid, IconButton, LinearProgress, ListItemText, Tooltip, Typography } from '@mui/material';
import React, { useState, Dispatch, SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { RequisitionLedgerItem } from '../../RequisitionType';
import { Currency } from '@/utilities/constants/countries';
import purchaseServices from '@/components/procurement/purchases/purchase-services';
import RelatableOrderDetails from '../listItem/tabs/form/RelatableOrderDetails';
import RequisitionLedgerItemForm from './RequisitionLedgerItemForm';
import projectsServices from '@/components/projectManagement/projects/project-services.js';
import CertificateOnScreen from '@/components/projectManagement/projects/profile/subcontracts/tabs/certificatesTab/preview/CertificateOnScreen';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { Organization } from '@/types/auth-types';
import LedgerBudgetCheckDetails from '../listItem/tabs/form/LedgerBudgetCheckDetails';

interface FetchRelatableDetailsProps {
  relatable: any;
  toggleOpen: (open: boolean) => void;
}

interface RequisitionLedgerItemRowProps {
  currencyDetails?: Currency;
  ledger_item: RequisitionLedgerItem;
  index: number;
  requisition_ledger_items?: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<SetStateAction<RequisitionLedgerItem[]>>;
  isDuplicate?: boolean;
  costCenterId?: number;
}


const FetchRelatableDetails = ({ relatable, toggleOpen, ledger_item }: FetchRelatableDetailsProps & { ledger_item: RequisitionLedgerItem }) => {
  const { authOrganization } = useJumboAuth();
  if (!relatable) return null;

  if (relatable.relatable_type === 'purchase' || ledger_item.relatable_type === 'purchase') {
    const { data: orderDetails, isFetching } = useQuery({
      queryKey: ['purchaseOrder', relatable?.id],
      queryFn: () => purchaseServices.orderDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen} />;
  }

  if (relatable.relatable_type === 'subcontract_certificate' || ledger_item.relatable_type === 'subcontract_certificate') {
    const { data: certificateDetails, isFetching } = useQuery({
      queryKey: ['subcontractCertificate', relatable?.id],
      queryFn: () => projectsServices.getCertificateDetails(relatable?.id),
    });
    if (isFetching) {
      return <LinearProgress />;
    }
    return <CertificateOnScreen isFromProcessApproval={true} certificate={certificateDetails} organization={authOrganization?.organization as Organization} />;
  }

  return null;
};

function RequisitionLedgerItemRow({
  currencyDetails,
  ledger_item,
  index,
  requisition_ledger_items = [],
  setRequisition_ledger_items,
  isDuplicate = false,
  costCenterId
}: RequisitionLedgerItemRowProps) {
  const [showForm, setShowForm] = useState(
    isDuplicate && Boolean(ledger_item?.relatable_id)
  );
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRelated, setSelectedRelated] = useState<any>(null);
  const [openLedgerBudgetDialog, setOpenLedgerBudgetDialog] = useState(false);
  const [ledgerDialogData, setLedgerDialogData] = useState<{
    ledgerId: number;
    ledgerName: string;
    costCenterId?: number;
    currency?: Currency;
  } | null>(null);

  const handleRemoveItem = () => {
    setRequisition_ledger_items(currentItems => {
      const newItems = [...currentItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  console.log('Rendering RequisitionLedgerItemRow with ledger_item:', ledger_item);

  return (
    <React.Fragment>
      <Divider />
      {!showForm ? (
        <Grid
          container
          sx={{
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'action.hover',
            }
          }}
        >
          <Grid size={{xs: 1, md: 0.5}}>
            {index + 1}.
          </Grid>
          <Grid size={{xs: 11, md: !ledger_item.relatable_id ? 5.5 : 4.5, lg: !ledger_item.relatable_id ? 4.5 : 3.5}}>
            <ListItemText
              primary={
                <Tooltip title={'Relatable To'}>
                  <Typography variant={"h5"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                    {ledger_item.ledger?.name}
                    {ledger_item.ledger && (
                      <Tooltip title={`${ledger_item.ledger.name} Budget check`}>
                        <IconButton
                          size='small'
                          sx={{ ml: 1 }}
                          onClick={() => {
                            const selectedLedger = ledger_item.ledger;
                            if (!selectedLedger) return;
                            setLedgerDialogData({
                              ledgerId: selectedLedger.id,
                              ledgerName: selectedLedger.name,
                              costCenterId: costCenterId,
                              currency: currencyDetails,
                            });
                            setOpenLedgerBudgetDialog(true);
                          }}
                        >
                          <AccountBalanceWalletOutlined fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Typography>
                </Tooltip>
              }
              secondary={
                <Tooltip title={'Remarks'}>
                    <Typography component="span" variant="body2" fontSize={14} lineHeight={1.25} mb={0}>
                        {ledger_item.remarks}
                    </Typography>
                </Tooltip>
              }
            />
          </Grid>
          {ledger_item.relatable_id && (
            <Grid size={{xs: 7, md: 1}}>
              <ListItemText
                primary={
                  <Tooltip title={'Relatable To'}>
                    <Typography variant={"caption"} fontSize={14} lineHeight={1.25} mb={0} noWrap>
                      {ledger_item?.relatableNo}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <>
                    <Tooltip title={'Order Date - (Amount)'}>
                      <Typography variant={"caption"} fontSize={14} lineHeight={1.25} mb={0}>
                        {`${readableDate(ledger_item.relatable?.order_date || ledger_item.relatable?.certificate_date, false)} - ${ledger_item.relatable?.unapproved_amount?.toLocaleString('en-US', 
                          {
                            style: 'currency',
                            currency: ledger_item.relatable?.currency?.code,
                          })|| ''}`
                        }
                      </Typography>
                    </Tooltip>
                    <Tooltip title={`View ${ledger_item.relatable_type === 'purchase' ? 'Order' : 'Certificate'} Details`}>
                      <IconButton onClick={() => {
                        setSelectedRelated(ledger_item.relatable); 
                        setOpenViewDialog(true);
                      }}>
                        <VisibilityOutlined />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              />
            </Grid>
          )}
          <Grid 
            textAlign={!ledger_item.relatable_id ? { md: 'end' } : 'end'}
            size={{xs: !ledger_item.relatable_id ? 8 : 5, md: 2}}
          >
            <Tooltip title="Quantity">
              <Typography>
                {ledger_item.quantity?.toLocaleString()} {''}
                {ledger_item?.unit_symbol || 
                 ledger_item.measurement_unit?.symbol || 
                 ledger_item.product?.unit_symbol}
              </Typography>
            </Tooltip>
          </Grid>
          <Grid 
            textAlign={!ledger_item.relatable_id ? 'end' : { md: 'end' }}
            size={{xs: !ledger_item.relatable_id ? 4 : 6, md: 2}}
          >
            <Tooltip title="Rate">
              <Typography>{ledger_item.rate?.toLocaleString()}</Typography>
            </Tooltip>
          </Grid>
          <Grid 
            textAlign={!ledger_item.relatable_id ? { md: 'end' } : 'end'} 
            size={{xs: 6, md: 2}}
          >
            <Tooltip title="Amount">
                <Typography>
                    {((ledger_item?.rate ?? 0) * (ledger_item?.quantity ?? 0)).toLocaleString('en-US', {
                        style: 'currency',
                        currency: currencyDetails?.code,
                    })}
                </Typography>
            </Tooltip>
          </Grid>
          <Grid textAlign={'end'} size={{xs: 12, lg: 1}}>
            <Tooltip title='Edit Item'>
              <IconButton size='small' onClick={() => setShowForm(true)}>
                <EditOutlined fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Remove Item'>
              <IconButton size='small' onClick={handleRemoveItem}>
                <DisabledByDefault fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <RequisitionLedgerItemForm
          ledger_item={ledger_item} 
          setShowForm={setShowForm} 
          index={index}
          isDuplicate={isDuplicate}
          requisition_ledger_items={requisition_ledger_items} 
          setRequisition_ledger_items={setRequisition_ledger_items}
        />
      )}

      <Dialog open={openViewDialog} maxWidth='md' fullWidth onClose={() => setOpenViewDialog(false)}>
        <FetchRelatableDetails relatable={selectedRelated} toggleOpen={setOpenViewDialog} ledger_item={ledger_item} />
      </Dialog>

      <LedgerBudgetCheckDetails
        open={openLedgerBudgetDialog}
        onClose={() => setOpenLedgerBudgetDialog(false)}
        ledgerId={ledgerDialogData?.ledgerId || 0}
        costCenterId={ledgerDialogData?.costCenterId || 0}
        currency={ledgerDialogData?.currency as any}
        ledgerName={ledgerDialogData?.ledgerName || ''}
      />
    </React.Fragment>
  );
}

export default RequisitionLedgerItemRow;