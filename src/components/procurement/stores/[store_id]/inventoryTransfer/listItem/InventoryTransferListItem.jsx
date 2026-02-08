import React, { createContext, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Chip, Divider, Grid, LinearProgress, Tooltip, Typography } from '@mui/material';
import inventoryTransferServices from '../inventoryTransfer-services';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import InventoryTransferTrns from './InventoryTransferTrns';
import InventoryTransferListItemAction from './InventoryTransferListItemAction';
import InventoryTransferTrnsItemAction from './InventoryTransferTrnsItemAction';
import { useQuery } from '@tanstack/react-query';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

export const listItemContext = createContext({});

const TransferListItem = ({ transfer, type }) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedInventoryTrn, setSelectedInventoryTrn] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDocumentDialog, setOpenDocumentDialog] = useState(false);

  const { data: inventoryTrns, isLoading } = useQuery({
    queryKey: ['inventoryTrns', { orderId: transfer.id }],
    queryFn: () => inventoryTransferServices.getInventoryTrns(transfer.id),
    enabled: expanded,
  });

  return (
    <listItemContext.Provider value={{ transfer,inventoryTrns,expanded,setExpanded,selectedInventoryTrn,setSelectedInventoryTrn,openDialog,setOpenDialog,openDocumentDialog,setOpenDocumentDialog}}>
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
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                  '&.Mui-expanded': {
                    margin: '12px 0',
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
                    fontSize: '1.25rem',
                  },
                },
              }}
            >
              <Grid
                paddingLeft={0.5}
                paddingRight={0.5}
                columnSpacing={3}
                container
                width="100%"
              >
                <Grid size={{xs: 5, md: 3}}>
                  <Tooltip title={'Transfer Date'}>
                    <Typography>{readableDate(transfer.transfer_date)}</Typography>
                  </Tooltip>
                  <Tooltip title={'Transfer No.'}>
                    <Typography>{transfer.transferNo}</Typography>
                  </Tooltip>
                </Grid>
              { (type === 'external' || type === 'internal') &&
                <>
                  <Grid size={{xs: 7, md: 6}} sx={{ textAlign: { 'xs': 'start' , 'md': 'center'}}}>
                    <Tooltip title={'Source and Destination Store'}>
                      <Typography>{`${transfer.source_store?.name} ➡ ${transfer.destination_store?.name}`}</Typography>
                    </Tooltip>
                    { transfer.cost_center_change_transfer === null ?
                      <Tooltip title={'Cost Center'}>
                        <Chip size='small' label={transfer.source_cost_center?.name} color="default" />
                      </Tooltip> 
                      : 
                      <Tooltip title={'Source and Destination Cost Centers'}>
                        <Chip size='small' label={`${transfer.source_cost_center?.name} ➡ ${transfer.destination_cost_center?.name}`} color="default" />
                      </Tooltip>
                    }
                  </Grid>
                </>
              }
              { type === 'cost center change' &&
                <Grid size={{xs: 7, md: 6}} sx={{ textAlign: { 'xs': 'start' , 'md': 'center'}}}>
                  <Tooltip title={'Source and Destination Cost Center'}>
                    <Chip label={`${transfer.source_cost_center?.name} ➡ ${transfer.destination_cost_center?.name}`} color="default" />
                  </Tooltip>
                </Grid>
              }
                <Grid size={{xs: 11, md: 3}} textAlign='right'>
                  <Tooltip title={'Status'}>
                      <Chip
                        size='small' 
                        label={transfer.status}
                        color={transfer.status === 'Completed' || transfer.status === 'Fully Received' ? 'success' : (transfer.status === 'Partially Received' ? 'info' : 'primary')}
                      />
                    </Tooltip>
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
                  <InventoryTransferListItemAction transfer={transfer} />
                </Grid>
                
                {/*Trns*/}
                <InventoryTransferTrns/>
              </Grid>
            </AccordionDetails>
          </Accordion>

            {/*TrnsItemAction*/}
            <InventoryTransferTrnsItemAction/>
        </React.Fragment>
    </listItemContext.Provider>

  );
};

export default TransferListItem;
