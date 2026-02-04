'use client';

import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

export default function CashierListSummaryOnScreen({
  shiftData,
  organization,
  shift_teams = [],
  fuel_pumps = [],
  tanks = [],
  productOptions = [],
  includeFuelVouchers = true,
}) {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;

  const [openSections, setOpenSections] = useState({
    cashiersSection: true,
    cashier: false,
    pumpdetails: false,
    cashDistributions: false,
    cashCollections: false,
    dippingSummarySection: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate totals for each cashier
  const calculateCashierTotals = (cashier) => {
    // Calculate total products amount for this cashier
    const totalProductsAmount =
      cashier.pump_readings?.reduce((total, pump) => {
        const productPrice =
          shiftData.fuel_prices.find((fp) => fp.product_id === pump.product_id)
            ?.price || 0;
        const quantity = (pump.closing || 0) - (pump.opening || 0);
        return total + quantity * productPrice;
      }, 0) || 0;

    // Calculate adjustments amount for this cashier
    const adjustmentsAmount =
      cashier.tank_adjustments?.reduce((total, adj) => {
        const productPrice =
          shiftData.fuel_prices.find((fp) => fp.product_id === adj.product_id)
            ?.price || 0;
        if (adj.operator === '-') {
          return total + adj.quantity * productPrice;
        } else if (adj.operator === '+') {
          return total - adj.quantity * productPrice;
        }
        return total;
      }, 0) || 0;

    // Calculate total fuel vouchers amount for this cashier
    const totalFuelVouchersAmount =
      cashier.fuel_vouchers?.reduce((total, fv) => {
        const productPrice =
          shiftData.fuel_prices.find((fp) => fp.product_id === fv.product_id)
            ?.price || 0;
        return total + fv.quantity * productPrice;
      }, 0) || 0;

    // Calculate other transactions total for this cashier
    const otherTransactionsTotal =
      cashier.other_transactions?.reduce(
        (total, ot) => total + (ot.amount || 0),
        0
      ) || 0;

    // Calculate cash remaining for this cashier
    const cashRemaining =
      totalProductsAmount + adjustmentsAmount - totalFuelVouchersAmount;

    return {
      totalProductsAmount,
      adjustmentsAmount,
      totalFuelVouchersAmount,
      otherTransactionsTotal,
      cashRemaining,
      netSales: totalProductsAmount + adjustmentsAmount,
    };
  };

  const SectionHeader = ({
    title,
    sectionKey,
    width = '100%',
    mt = 0,
    hasData = true,
  }) =>
    hasData && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          width: width,
          mt: mt,
          py: 1.5,
          px: 2,
          bgcolor: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`,
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
        onClick={() => toggleSection(sectionKey)}
      >
        <IconButton size='small' sx={{ mr: 1 }}>
          {openSections[sectionKey] ? (
            <KeyboardArrowDown />
          ) : (
            <KeyboardArrowRight />
          )}
        </IconButton>
        <Typography variant='h6' sx={{ color: headerColor }}>
          {title}
        </Typography>
      </Box>
    );

  return (
    <>
      <SectionHeader title='Cashiers Summary' sectionKey='cashiersSection' />
      {openSections.cashiersSection && (
        <Card>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              paddingX: '10px',
            }}
          >
            {/* === cashier === */}
            {shiftData.cashiers?.map((c, index) => {
              // Calculate total products amount for this cashier
              const totalProductsAmount =
                c?.pump_readings?.reduce((total, pump) => {
                  const productPrice =
                    shiftData.fuel_prices.find(
                      (fp) => fp.product_id === pump.product_id
                    )?.price || 0;
                  const quantity = (pump.closing || 0) - (pump.opening || 0);
                  return total + quantity * productPrice;
                }, 0) || 0;

              // Calculate adjustments amount for this cashier
              const adjustmentsAmount =
                c?.tank_adjustments?.reduce((total, adj) => {
                  const productPrice =
                    shiftData.fuel_prices.find(
                      (fp) => fp.product_id === adj.product_id
                    )?.price || 0;
                  if (adj.operator === '-') {
                    return total + adj.quantity * productPrice;
                  } else if (adj.operator === '+') {
                    return total - adj.quantity * productPrice;
                  }
                  return total;
                }, 0) || 0;

              // Calculate total fuel vouchers amount for this cashier
              const totalFuelVouchersAmount =
                c?.fuel_vouchers?.reduce((total, fv) => {
                  const productPrice =
                    shiftData.fuel_prices.find(
                      (fp) => fp.product_id === fv.product_id
                    )?.price || 0;
                  return total + fv.quantity * productPrice;
                }, 0) || 0;

              // Calculate other transactions total for this cashier
              const otherTransactionsTotal =
                c?.other_transactions?.reduce(
                  (total, ot) => total + (ot.amount || 0),
                  0
                ) || 0;

              // calculate short/over amount
              const expectedAmount =
                totalProductsAmount +
                adjustmentsAmount -
                totalFuelVouchersAmount -
                otherTransactionsTotal;

              const collectedAmount = c.collected_amount;

              const shortOrOver = collectedAmount - expectedAmount;

              const cashDistributionSummary = Object.values(
                c.other_transactions?.reduce((acc, tx) => {
                  const type = tx.debit_ledger.name;

                  if (!acc[type]) {
                    acc[type] = { type, count: 0, totalAmount: 0 };
                  }

                  acc[type].count++;
                  acc[type].totalAmount += tx.amount;

                  return acc;
                }, {})
              );

              // main ledger object
              const mainLedgerObj = {
                type: c.main_ledger?.name,
                count: 1,
                totalAmount: c.main_ledger?.amount,
              };

              // fuel vouchers object
              const voucherObj = {
                type: 'Fuel Vouchers',
                count: c.fuel_vouchers?.length,
                totalAmount: calculateCashierTotals(c).totalFuelVouchersAmount,
              };

              cashDistributionSummary.unshift(mainLedgerObj);
              cashDistributionSummary.push(voucherObj);

              return (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 0,
                    mt: 2,
                  }}
                >
                  <SectionHeader
                    width='95%'
                    title={c.name}
                    sectionKey='cashier'
                  />
                  {openSections.cashier && (
                    <>
                      {/* pump details */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          width: '90%',
                          py: 1,
                          px: 2,
                          bgcolor: theme.palette.background.default,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:hover': { bgcolor: theme.palette.action.hover },
                        }}
                        onClick={() => toggleSection('pumpdetails')}
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections['pumpdetails'] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Pump Details
                        </Typography>
                      </Box>
                      {openSections.pumpdetails && (
                        <>
                          <Grid
                            container
                            sx={{ marginTop: '4px', width: '85%' }}
                          >
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Name</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Fuel</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Description</Typography>
                            </Grid>
                          </Grid>
                          {c.pump_readings.map((pump, index) => {
                            const pumpInfo = fuel_pumps?.find(
                              (p) => p.id === pump.fuel_pump_id
                            );
                            const product = productOptions?.find(
                              (p) => p.id === pump.product_id
                            );
                            const difference =
                              (pump.closing || 0) - (pump.opening || 0);

                            return (
                              <Grid
                                key={index}
                                container
                                sx={{ marginTop: '4px', width: '85%' }}
                              >
                                <Grid
                                  size={4}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.default,
                                    borderRightColor: 'white',
                                    borderRightWidth: 2,
                                    padding: '5px',
                                  }}
                                >
                                  <Typography>
                                    {pumpInfo?.name ||
                                      `Pump ${pump.fuel_pump_id}`}
                                  </Typography>
                                </Grid>
                                <Grid
                                  size={4}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.default,
                                    padding: '5px',
                                  }}
                                >
                                  <Typography>
                                    {product?.name ||
                                      `Product ${pump.product_id}`}
                                  </Typography>
                                </Grid>
                                <Grid
                                  size={4}
                                  sx={{
                                    backgroundColor:
                                      theme.palette.background.default,
                                    padding: '5px',
                                  }}
                                >
                                  <Typography>
                                    {difference.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </Typography>
                                </Grid>
                              </Grid>
                            );
                          })}
                        </>
                      )}

                      {/* Cash distribution */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          width: '90%',
                          mt: 3,
                          py: 1,
                          px: 2,
                          bgcolor: theme.palette.background.default,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:hover': { bgcolor: theme.palette.action.hover },
                        }}
                        onClick={() => toggleSection('cashDistributions')}
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections['cashDistributions'] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Cash Distributions
                        </Typography>
                      </Box>
                      {openSections.cashDistributions && (
                        <>
                          <Grid
                            container
                            sx={{ marginTop: '4px', width: '85%' }}
                          >
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Description</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Count</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Amount</Typography>
                            </Grid>
                          </Grid>

                          {cashDistributionSummary.map((t, index) => (
                            <Grid
                              key={index}
                              container
                              sx={{ marginTop: '4px', width: '85%' }}
                            >
                              <Grid
                                size={4}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography>{t.type}</Typography>
                              </Grid>
                              <Grid
                                size={4}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                }}
                              >
                                <Typography>{t.count}</Typography>
                              </Grid>
                              <Grid
                                size={4}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                }}
                              >
                                <Typography>
                                  {t.totalAmount.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Grid>
                            </Grid>
                          ))}
                        </>
                      )}

                      {/* Cash Collection */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          width: '90%',
                          mt: 3,
                          py: 1,
                          px: 2,
                          bgcolor: theme.palette.background.default,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          '&:hover': { bgcolor: theme.palette.action.hover },
                        }}
                        onClick={() => toggleSection('cashCollections')}
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections['cashCollections'] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Cash Collections
                        </Typography>
                      </Box>
                      {openSections.cashCollections && (
                        <>
                          <Grid
                            container
                            sx={{ marginTop: '4px', width: '85%' }}
                          >
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Expected</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Collected</Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>Over/Short</Typography>
                            </Grid>
                          </Grid>
                          <Grid
                            container
                            sx={{ marginTop: '4px', width: '85%' }}
                          >
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                borderRightColor: 'white',
                                borderRightWidth: 2,
                                padding: '5px',
                              }}
                            >
                              <Typography>
                                {(
                                  totalProductsAmount +
                                  adjustmentsAmount -
                                  totalFuelVouchersAmount -
                                  otherTransactionsTotal
                                ).toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>
                                {c.collected_amount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Grid>
                            <Grid
                              size={4}
                              sx={{
                                backgroundColor:
                                  theme.palette.background.default,
                                padding: '5px',
                              }}
                            >
                              <Typography>
                                {shortOrOver > 0
                                  ? `+${shortOrOver.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`
                                  : `${shortOrOver.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`}
                              </Typography>
                            </Grid>
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* === Dipping Summary === */}
      <SectionHeader
        title='Dipping Summary'
        sectionKey='dippingSummarySection'
        mt={2}
      />
      {openSections.dippingSummarySection && (
        <Card>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              paddingX: '10px',
            }}
          >
            {shiftData.shift_tanks.map((st, index) => {
              return (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: 0,
                    mt: 1,
                  }}
                >
                  <SectionHeader
                    width='95%'
                    title={`Tank ${st.name}` || `Tank ${st.id}`}
                    sectionKey='tankDetails'
                  />
                  {openSections.tankDetails && (
                    <Grid container sx={{ marginTop: '4px', width: '85%' }}>
                      <Grid size={12}>
                        {/* Opening */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Opening</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {' '}
                              {(st.opening_reading || 0).toLocaleString(
                                'en-US',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Purchase */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Purchase</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {' '}
                              {(st.incoming || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Total */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Total</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {' '}
                              {(
                                (st.opening_reading || 0) + (st.incoming || 0)
                              ).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Closing */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Closing</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {(st.closing_reading || 0).toLocaleString(
                                'en-US',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Tank Difference */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Tank Difference</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {(st.tank_difference || 0).toLocaleString(
                                'en-US',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Actual Sold */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Actual Sold</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {(st.actual_sold || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                        {/* Pos/Neg */}
                        <Grid container sx={{ marginTop: '4px' }}>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              borderRightColor: 'white',
                              borderRightWidth: 2,
                              padding: '5px',
                            }}
                          >
                            <Typography>Pos/Neg</Typography>
                          </Grid>
                          <Grid
                            size={6}
                            sx={{
                              backgroundColor: theme.palette.background.default,
                              padding: '5px',
                            }}
                          >
                            <Typography>
                              {(st.deviation || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  )}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}
    </>
  );
}
