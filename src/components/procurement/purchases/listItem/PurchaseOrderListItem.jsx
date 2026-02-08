import React, { createContext, lazy, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import PurchaseOrderListItemAction from './PurchaseOrderListItemAction';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import purchaseServices from '../purchase-services';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { PERMISSIONS } from '@/utilities/constants/permissions';

export const listItemContext = createContext({});//will be used as distrubuter of all useStates and needed data
const PurchaseOrderGrns = lazy(() => import('./PurchaseOrderGrns'));
const PurchaseOrderGrnsItemAction = lazy(() => import('./PurchaseOrderGrnsItemAction'));

const PurchaseOrderListItem = ({ order }) => {
  const {checkOrganizationPermission} = useJumboAuth()
  const [expanded, setExpanded] = useState(false);
  const [selectedOrderGrn, setSelectedOrderGrn] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [attachDialog, setAttachDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

  const { data: purchaseOrderGrns, isLoading } = useQuery({
    queryKey: ['purchaseOrderGrns', { orderId: order.id }],
    queryFn: () => purchaseServices.getPurchaseOrderGrns(order.id),
    enabled: expanded,
  });

  return (
    <listItemContext.Provider value={{attachDialog, setAttachDialog, purchaseOrderGrns,expanded,setExpanded,selectedOrderGrn,setSelectedOrderGrn,openDialog,setOpenDialog,openDocumentDialog,setOpenDocumentDialog}}>
      <React.Fragment>
        <Accordion
          expanded={expanded}
          square
          sx={{ 
            borderRadius: 2, 
            borderTop: 2,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          onChange={()=> setExpanded((prevExpanded) => !prevExpanded)}
        >
          <AccordionSummary
            expandIcon={expanded ? <RemoveIcon /> : <AddIcon />}
            sx={{
              px: 2,
              flexDirection: 'row-reverse',
              '.MuiAccordionSummary-content': {
                alignItems: 'center',
                '&.Mui-expanded': {
                  margin: '10px 0',
                }},
              '.MuiAccordionSummary-expandIconWrapper': {
                borderRadius: 1,
                border: 1,
                color: 'text.secondary',  
                transform: 'none',
                mr: 1,
                '&.Mui-expanded': {
                  transform: 'none',
                  color: 'primary.main',
                  borderColor: 'primary.main',
                },
                '& svg': {
                  fontSize: '0.9rem',
                },
              },
            }}
          >
            <Grid
              container
              spacing={1}
              alignItems="center"
              sx={{ width: '100%', m: 0 }}
            >
              <Grid size={{xs: 6, md: 2.5}}>
                <ListItemText
                  primary={
                    <>
                      <Stack direction={'row'}>
                        <Tooltip title="Order No.">
                          <Typography>{order.orderNo}</Typography>
                        </Tooltip>
                        {
                          !!order?.requisitionNo &&
                          <Tooltip title="Requisition No.">
                            <Typography variant='caption' color={'gray'}> &nbsp;{` - ${order.requisitionNo}`}</Typography>
                          </Tooltip>
                        }
                      </Stack>
                      <Tooltip title="Date">
                        <Typography variant="caption">
                          {readableDate(order.order_date)}
                        </Typography>
                      </Tooltip>
                    </>
                  }
                />
              </Grid>
              <Grid size={{xs: 6, md: 5}}>
                <Tooltip title={'Supplier'}>
                  <Typography>{order.stakeholder.name}</Typography>
                </Tooltip>
                {order.cost_centers.length > 0 && (
                  <Tooltip title="Cost Centers">
                    <div>
                      {order.cost_centers.map((cc) => (
                        <Chip
                          key={cc.id}
                          size="small"
                          label={cc.name}
                          style={{ margin: '1px' }}
                        />
                      ))}
                    </div>
                  </Tooltip>
                )}
              </Grid>
              <Grid size={{xs: 12, md: 4.5}} display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
                <Tooltip title={'Status'}>
                  <Chip
                    size="small"
                    label={order.status}
                    color={
                      order.status === 'Completed' ||
                      order.status === 'Fully Received' ||
                      order.status === 'Instantly Received'
                        ? 'success'
                        : order.status === 'Partially Received'
                        ? 'warning'
                        : order.status === 'Closed' 
                        ? 'info'
                        : 'primary'
                    }
                  />
                </Tooltip>
                {
                checkOrganizationPermission(PERMISSIONS.PURCHASES_CREATE) &&
                  <Tooltip title={'Amount'}>
                    <Typography>
                      {
                        (order.amount + order.vat_amount).toLocaleString('en-US', {
                        style: 'currency',
                        currency: order.currency.code,
                      })}
                    </Typography>
                  </Tooltip>
                }
              </Grid>
            </Grid>
            <Divider/>
          </AccordionSummary>
          <AccordionDetails
            sx={{ 
              backgroundColor:'background.paper',
              marginBottom: 3
            }}
          >
            {
            isLoading && <LinearProgress/>
            }
            <Grid container>
              <Grid size={12} textAlign={'end'}>
                <PurchaseOrderListItemAction order={order} />
              </Grid>
              
              {/*OrderGrns*/}
              <PurchaseOrderGrns order={order}/>
            </Grid>
          </AccordionDetails>
        </Accordion>

          {/*OrderGrnsItemAction*/}
          <PurchaseOrderGrnsItemAction/>
      </React.Fragment>
    </listItemContext.Provider>
  );
};

export default PurchaseOrderListItem;
