import { 
  Accordion, 
  AccordionDetails, 
  AccordionSummary, 
  Chip, 
  Divider, 
  Grid, 
  Tooltip, 
  Typography 
} from '@mui/material';
import React, { useState } from 'react';
import CounterSalesListItemAction from './CounterSalesListItemAction';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import SalesListItemTabs from './SalesListItemTabs';
import { VerifiedRounded } from '@mui/icons-material';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { SalesOrder } from '../SalesOrderType';

interface CounterSalesListItemProps {
  sale: SalesOrder;
}

const CounterSalesListItem: React.FC<CounterSalesListItemProps> = ({ sale }) => {
  const [expanded, setExpanded] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const getStatusColor = () => {
    switch(sale.status) {
      case 'Complete':
      case 'Fulfilled':
        return 'success';
      case 'Partially Fulfilled':
        return 'info';
      case 'Over Fulfilled':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
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
      onChange={() => setExpanded((prev) => !prev)}
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
            }
          },
          '.MuiAccordionSummary-expandIconWrapper': {
            borderRadius: 1,
            border: 1,
            color: 'text.secondary',  
            transform: 'none',
            mr: 0.5,
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
          paddingLeft={1}
          paddingRight={1}
          columnSpacing={1}
          alignItems={'center'}
          container
          width={'100%'}
        >
          <Grid size={{xs: 5.5, md: 2.5}}>
            <Tooltip title='Sale No.'>
              <Typography>{sale.saleNo}</Typography>
            </Tooltip>
            <Tooltip title='Sale Date'>
              <Typography variant='caption'>{readableDate(sale.transaction_date)}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 6.5, md: 3, lg: 4}}>
            <Tooltip title='Customer'>
              <Typography>{sale.stakeholder.name}</Typography>
            </Tooltip>
            {sale?.debit_ledger && sale.payment_method === 'Instant' && (
              <Tooltip title='Instantly Paid To'>
                <Chip
                  size='small' 
                  label={sale.debit_ledger.name}
                />
              </Tooltip>
            )}
          </Grid>
          <Grid size={{xs: 12, md: 2.5}}>
            <Tooltip title='Reference'>
              <Typography>{sale.reference}</Typography>
            </Tooltip>
            <Tooltip title='Remarks'>
              <Typography variant='caption'>{sale.remarks}</Typography>
            </Tooltip>
          </Grid>
          <Grid size={{xs: 12, md: 4, lg: 3}} display={'flex'} alignItems={'center'} justifyContent={'space-between'}>
            <Tooltip title='Status'>
              <Chip
                size='small' 
                label={sale.status}
                color={getStatusColor()}
              />
            </Tooltip>
            {sale.is_fully_paid && (
              <Tooltip title='Fully Paid'>
                <VerifiedRounded fontSize='small' color='success'/>
              </Tooltip>
            )}
            <Tooltip title='Amount'>
              <Typography>
                {(sale.amount + sale.vat_amount).toLocaleString("en-US", {
                  style: "currency",
                  currency: sale.currency.code
                })}
              </Typography>
            </Tooltip>
          </Grid>
        </Grid>
        <Divider/>
      </AccordionSummary>
      <AccordionDetails
        sx={{ 
          backgroundColor: 'background.paper',
          marginBottom: 3
        }}
      >
        <Grid container>
          <Grid size={12} textAlign={'end'}>
            <CounterSalesListItemAction 
              sale={sale} 
              openDispatchDialog={openDispatchDialog} 
              setOpenDispatchDialog={setOpenDispatchDialog}
            />
          </Grid>

          {/* Tabs */}
          {(!sale.is_instant_sale || !!sale.is_invoiceable || !!sale.is_invoiced) && (
            <SalesListItemTabs 
              sale={sale} 
              activeTab={activeTab} 
              expanded={expanded} 
              setActiveTab={setActiveTab}
            />
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(CounterSalesListItem);