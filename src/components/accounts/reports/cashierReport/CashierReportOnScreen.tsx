import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  Grid,
  Divider,
  AccordionDetails,
  Typography,
  Tooltip,
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { AuthOrganization } from '@/types/auth-types';

interface Transaction {
  transactionDate: string;
  voucherNo: string;
  reference: string;
  description: string;
  amount: number;
}

interface ReportItem {
  name: string;
  opening_balance: number;
  incoming_total: number;
  outgoing_total: number;
  closing_balance: number;
  incoming_transactions?: Record<string, Transaction>;
  outgoing_transactions?: Record<string, Transaction>;
}

interface CashierReportOnScreenProps {
  reportData: ReportItem[];
  authOrganization: AuthOrganization;
}

const CashierReportOnScreen: React.FC<CashierReportOnScreenProps> = ({ 
  reportData, 
  authOrganization 
}) => {
  const [expanded, setExpanded] = useState<boolean[]>(Array(reportData.length).fill(false));
  const currencyCode = authOrganization.base_currency.code;

  const handleChange = (index: number) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  return (
    <>
      {reportData.map((item, index) => {
        const incomingTotal = item.incoming_transactions
          ? Object.values(item.incoming_transactions).reduce(
              (sum: number, transaction: Transaction) => sum + transaction.amount, 
              0
            )
          : 0;

        const outgoingTotal = item.outgoing_transactions
          ? Object.values(item.outgoing_transactions).reduce(
              (sum: number, transaction: Transaction) => sum + transaction.amount, 
              0
            )
          : 0;

        return (
          <Accordion
            key={index}
            square
            expanded={expanded[index]}
            onChange={() => handleChange(index)}
            sx={{
              borderRadius: 2,
              borderTop: 2,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <AccordionSummary
              expandIcon={expanded[index] ? <RemoveIcon /> : <AddIcon />}
              sx={{
                px: 3,
                flexDirection: 'row-reverse',
                '.MuiAccordionSummary-content': {
                  alignItems: 'center',
                  '&.Mui-expanded': {
                    margin: '12px 0',
                  },
                },
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
                '&:hover': {
                  '.MuiTypography-root': {
                  },
                },
              }}
            >
              <Grid
                paddingLeft={1}
                paddingRight={1}
                columnSpacing={1}
                rowSpacing={1}
                alignItems={'center'}
                container
                width={'100%'}
              >
                <Grid size={12} textAlign={'center'}
                  sx={{
                    borderBottom: 2,
                    borderColor: 'divider'
                  }}
                >
                  <Typography 
                    variant="h4" 
                    sx={{ fontWeight: expanded[index] ? 'bold' : 'normal' }}
                  >
                    {item.name}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <Typography>Opening Balance</Typography>
                  <Typography>
                    {item.opening_balance.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: currencyCode 
                    })}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <Typography>Incoming Total</Typography>
                  <Typography sx={{color:'green'}} variant="caption">
                    {item.incoming_total.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: currencyCode 
                    })}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <Typography>Outgoing Total</Typography>
                  <Typography sx={{color:'red'}} variant="caption">
                    {item.outgoing_total.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: currencyCode 
                    })}
                  </Typography>
                </Grid>
                <Grid size={{xs: 12, md: 3}}>
                  <Typography>Closing Balance</Typography>
                  <Typography sx={{color:'blue'}}>
                    {item.closing_balance.toLocaleString('en-US', { 
                      style: 'currency', 
                      currency: currencyCode 
                    })}
                  </Typography>
                </Grid>
              </Grid>
              <Divider />
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: 'background.paper',
                marginBottom: 3,
              }}
            >
              <Grid container>
                <Grid size={12}>
                  {item.incoming_transactions && Object.values(item.incoming_transactions).length > 0 && (
                    <>
                      <Typography 
                        variant="h5" 
                        sx={{ marginBottom: 1, marginTop: 2, textAlign: 'center' }}
                      >
                        Incoming Transactions
                      </Typography>
                      {Object.values(item.incoming_transactions).map((incomingItem, idx) => (
                        <Grid
                          key={idx}
                          size={12}
                          sx={{
                            cursor: 'pointer',
                            borderTop: 2,
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            padding: 0.5
                          }}
                          columnSpacing={2}
                          alignItems={'center'}
                          container
                        >
                          <Grid size={{xs: 6, md: 3}}>
                            <Tooltip title="Transaction Date">
                              <Typography>{readableDate(incomingItem.transactionDate)}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} sx={{ textAlign: { xs: 'end', md: 'center' } }}>
                            <Tooltip title="Reference">
                              <Typography>
                                {`${incomingItem.voucherNo} ${incomingItem.reference?.trim() ? '/' : ''} ${incomingItem.reference}`}
                              </Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} sx={{ textAlign: { xs: 'start'} }}>
                            <Tooltip title="Description">
                              <Typography>{incomingItem.description}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} textAlign="end">
                            <Tooltip title="Amount">
                              <Typography>
                                {incomingItem.amount.toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: currencyCode
                                })}
                              </Typography>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      ))}
                      {/* Incoming Transactions Total */}
                      <Grid size={12} sx={{ marginTop: 2 }}>
                        <Typography variant="h6" sx={{ textAlign: 'end' }}>
                          Total: {incomingTotal.toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: currencyCode 
                          })}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>
              <Grid container marginTop={2}>
                <Grid size={12}>
                  {item.outgoing_transactions && Object.values(item.outgoing_transactions).length > 0 && (
                    <>
                      <Typography 
                        variant="h5" 
                        sx={{ marginBottom: 1, marginTop: 2, textAlign: 'center' }}
                      >
                        Outgoing Transactions
                      </Typography>
                      {Object.values(item.outgoing_transactions).map((outgoingItem, idx) => (
                        <Grid
                          key={idx}
                          size={12}
                          sx={{
                            cursor: 'pointer',
                            borderTop: 1,
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            padding: 0.5
                          }}
                          columnSpacing={2}
                          alignItems={'center'}
                          container
                        >
                          <Grid size={{xs: 6, md: 3}}>
                            <Tooltip title="Transaction Date">
                              <Typography>{readableDate(outgoingItem.transactionDate)}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} sx={{ textAlign: { xs: 'end', md: 'center' } }}>
                            <Tooltip title="Reference">
                              <Typography>
                                {`${outgoingItem.voucherNo} ${outgoingItem.reference?.trim() ? '/' : ''} ${outgoingItem.reference}`}
                              </Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} sx={{ textAlign: { xs: 'start'} }}>
                            <Tooltip title="Description">
                              <Typography>{outgoingItem.description}</Typography>
                            </Tooltip>
                          </Grid>
                          <Grid size={{xs: 6, md: 3}} textAlign="end">
                            <Tooltip title="Amount">
                              <Typography>
                                {outgoingItem.amount.toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: currencyCode
                                })}
                              </Typography>
                            </Tooltip>
                          </Grid>
                        </Grid>
                      ))}
                      {/* Outgoing Transactions Total */}
                      <Grid size={12} sx={{ marginTop: 2 }}>
                        <Typography variant="h6" sx={{ textAlign: 'end' }}>
                          Total: {outgoingTotal.toLocaleString('en-US', { 
                            style: 'currency', 
                            currency: currencyCode 
                          })}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

export default CashierReportOnScreen;