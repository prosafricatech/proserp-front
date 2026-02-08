import { DisabledByDefault, EditOutlined, VisibilityOutlined } from '@mui/icons-material';
import { Dialog, Divider, Grid, IconButton, LinearProgress, ListItemText, Tooltip, Typography } from '@mui/material';
import React, { useState, Dispatch, SetStateAction } from 'react';
import RequisitionLedgerItemForm from './RequisitionLedgerItemForm';
import RelatableOrderDetails from '../listItem/tabs/form/RelatableOrderDetails';
import purchaseServices from '../../procurement/purchases/purchase-services';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { RequisitionLedgerItem } from '../RequisitionType';
import { Currency } from '@/utilities/constants/countries';

interface FetchRelatableDetailsProps {
  relatable: any;
  toggleOpen: (open: boolean) => void;
}

interface RequisitionLedgerItemRowProps {
  setClearFormKey: Dispatch<SetStateAction<number>>;
  submitMainForm?: () => void;
  setSubmitItemForm: Dispatch<SetStateAction<boolean>>;
  submitItemForm: boolean;
  setIsDirty: Dispatch<SetStateAction<boolean>>;
  currencyDetails?: Currency;
  ledger_item: RequisitionLedgerItem;
  index: number;
  requisition_ledger_items?: RequisitionLedgerItem[];
  setRequisition_ledger_items: Dispatch<SetStateAction<RequisitionLedgerItem[]>>;
}

const FetchRelatableDetails = ({ relatable, toggleOpen }: FetchRelatableDetailsProps) => {
    const { data: orderDetails, isFetching } = useQuery({
        queryKey: ['purchaseOrder', relatable?.id],
        queryFn: () => purchaseServices.orderDetails(relatable?.id),
    });

    if (isFetching) {
        return <LinearProgress />;
    }

  return (
    <RelatableOrderDetails order={orderDetails} toggleOpen={toggleOpen} />
  );
};

function RequisitionLedgerItemRow({
  setClearFormKey,
  submitMainForm,
  setSubmitItemForm,
  submitItemForm,
  setIsDirty,
  currencyDetails,
  ledger_item,
  index,
  requisition_ledger_items = [],
  setRequisition_ledger_items,
}: RequisitionLedgerItemRowProps) {
  const [showForm, setShowForm] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRelated, setSelectedRelated] = useState<any>(null);

  const handleRemoveItem = () => {
    setRequisition_ledger_items(currentItems => {
      const newItems = [...currentItems];
      newItems.splice(index, 1);
      return newItems;
    });
  };

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
                      {ledger_item.relatable?.relatableNo}
                    </Typography>
                  </Tooltip>
                }
                secondary={
                  <>
                    <Tooltip title={'Order Date - (Amount)'}>
                      <Typography variant={"caption"} fontSize={14} lineHeight={1.25} mb={0}>
                        {`${readableDate(ledger_item.relatable?.order_date, false)} - ${ledger_item.relatable?.total_amount?.toLocaleString('en-US', 
                          {
                            style: 'currency',
                            currency: ledger_item.relatable?.currency?.code,
                          })}`
                        }
                      </Typography>
                    </Tooltip>
                    <Tooltip title={`View Order`}>
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
                {ledger_item.quantity?.toLocaleString()} 
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
          setClearFormKey={setClearFormKey} 
          submitMainForm={submitMainForm} 
          setSubmitItemForm={setSubmitItemForm} 
          submitItemForm={submitItemForm} 
          setIsDirty={setIsDirty} 
          ledger_item={ledger_item} 
          setShowForm={setShowForm} 
          index={index} 
          requisition_ledger_items={requisition_ledger_items} 
          setRequisition_ledger_items={setRequisition_ledger_items}
        />
      )}

      <Dialog open={openViewDialog} maxWidth='md' fullWidth onClose={() => setOpenViewDialog(false)}>
        <FetchRelatableDetails relatable={selectedRelated} toggleOpen={setOpenViewDialog} />
      </Dialog>
    </React.Fragment>
  );
}

export default RequisitionLedgerItemRow;