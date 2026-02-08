'use client';

import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  Grid,
  Divider,
  AccordionDetails,
  Typography,
  Tooltip,
  useTheme,
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
  authOrganization,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<boolean[]>(Array(reportData.length).fill(false));
  const currencyCode = authOrganization.base_currency.code;

  const handleChange = (index: number) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  const currency = (value: number) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
    });

  return (
    <>
      {reportData.map((item, index) => {
        const incomingTotal =
          item.incoming_transactions
            ? Object.values(item.incoming_transactions).reduce((s, t) => s + t.amount, 0)
            : 0;

        const outgoingTotal =
          item.outgoing_transactions
            ? Object.values(item.outgoing_transactions).reduce((s, t) => s + t.amount, 0)
            : 0;

        const closingColor =
          item.closing_balance > 0
            ? theme.palette.info.main
            : item.closing_balance < 0
            ? theme.palette.warning.main
            : theme.palette.text.secondary;

        return (
          <Accordion
            key={index}
            expanded={expanded[index]}
            onChange={() => handleChange(index)}
            sx={{ borderRadius: 2, border: 1, borderColor: 'divider', mb: 1 }}
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
              <Grid container spacing={1} alignItems="center" width={'100%'}>
                <Grid 
                  size={12} 
                  textAlign="center"                   
                  sx={{
                    borderBottom: 2,
                    borderColor: 'divider'
                  }}
                >
                  <Tooltip title="Cash Account / Ledger Name">
                    <Typography variant="h4" fontWeight={expanded[index] ? 600 : 400}>
                      {item.name}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title="Balance at the beginning of the period">
                    <Typography variant="body2" color="text.secondary">
                      Opening Balance
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.opening_balance)}>
                    <Typography>{currency(item.opening_balance)}</Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title="Total amount received during the period">
                    <Typography variant="body2" color="text.secondary">
                      Incoming Total
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.incoming_total)}>
                    <Typography sx={{ color: theme.palette.success.main }} fontWeight={600}>
                      {currency(item.incoming_total)}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title="Total amount paid out during the period">
                    <Typography variant="body2" color="text.secondary">
                      Outgoing Total
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.outgoing_total)}>
                    <Typography sx={{ color: theme.palette.error.main }} fontWeight={600}>
                      {currency(item.outgoing_total)}
                    </Typography>
                  </Tooltip>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Tooltip title="Final balance after all transactions">
                    <Typography variant="body2" color="text.secondary">
                      Closing Balance
                    </Typography>
                  </Tooltip>
                  <Tooltip title={currency(item.closing_balance)}>
                    <Typography fontWeight={700} sx={{ color: closingColor }}>
                      {currency(item.closing_balance)}
                    </Typography>
                  </Tooltip>
                </Grid>
              </Grid>
            </AccordionSummary>

            <AccordionDetails>
              {/* INCOMING */}
              {item.incoming_transactions && (
                <>
                  <Tooltip title="All money received in this period">
                    <Typography variant="h6" textAlign="center" mt={2}>
                      Incoming Transactions
                    </Typography>
                  </Tooltip>

                  {Object.values(item.incoming_transactions).map((t, i) => (
                    <Grid
                      key={i}
                      container
                      spacing={1}
                      alignItems="center"
                      sx={{ borderTop: 1, borderColor: 'divider', py: 0.5 }}
                    >
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title="Transaction Date">
                          <Typography>{readableDate(t.transactionDate)}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="center">
                        <Tooltip title="Voucher / Reference">
                          <Typography>{t.voucherNo} {t.reference}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title="Transaction Description">
                          <Typography>{t.description}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="end">
                        <Tooltip title="Incoming Amount">
                          <Typography sx={{ color: theme.palette.success.main }}>
                            {currency(t.amount)}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}

                  <Tooltip title="Total incoming amount">
                    <Typography textAlign="end" mt={1} fontWeight={600}>
                      Total: {currency(incomingTotal)}
                    </Typography>
                  </Tooltip>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              {/* OUTGOING */}
              {item.outgoing_transactions && (
                <>
                  <Tooltip title="All money paid out in this period">
                    <Typography variant="h6" textAlign="center">
                      Outgoing Transactions
                    </Typography>
                  </Tooltip>

                  {Object.values(item.outgoing_transactions).map((t, i) => (
                    <Grid
                      key={i}
                      container
                      spacing={1}
                      alignItems="center"
                      sx={{ borderTop: 1, borderColor: 'divider', py: 0.5 }}
                    >
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title="Transaction Date">
                          <Typography>{readableDate(t.transactionDate)}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="center">
                        <Tooltip title="Voucher / Reference">
                          <Typography>{t.voucherNo} {t.reference}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }}>
                        <Tooltip title="Transaction Description">
                          <Typography>{t.description}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid size={{ xs: 6, md: 3 }} textAlign="end">
                        <Tooltip title="Outgoing Amount">
                          <Typography sx={{ color: theme.palette.error.main }}>
                            {currency(t.amount)}
                          </Typography>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}

                  <Tooltip title="Total outgoing amount">
                    <Typography textAlign="end" mt={1} fontWeight={600}>
                      Total: {currency(outgoingTotal)}
                    </Typography>
                  </Tooltip>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

export default CashierReportOnScreen;
