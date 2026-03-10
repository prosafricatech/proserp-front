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
  paymentReceived = [],
  openDetails = true,
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

  // hide dipping summary table if openeing or closing reading is less than 1
  const hideDippingTable = shiftData.shift_tanks.some((st) => {
    return st.opening_reading < 1 || st.closing_reading < 1;
  });

  // Calculate totals
  const totalExpectedAmount =
    shiftData.cashiers?.reduce((sum, c) => {
      const {
        totalProductsAmount,
        adjustmentsAmount,
        totalFuelVouchersAmount,
        otherTransactionsTotal,
      } = calculateCashierTotals(c);

      return (
        sum +
        totalProductsAmount +
        adjustmentsAmount -
        totalFuelVouchersAmount -
        otherTransactionsTotal
      );
    }, 0) || 0;

  const totalCollectedAmount =
    shiftData.cashiers?.reduce((sum, c) => sum + c.collected_amount, 0) || 0.0;

  const totalShortOrOver = totalCollectedAmount - totalExpectedAmount;

  // payments received total
  const paymentsReceivedTotal = paymentReceived.reduce(
    (sum, pr) => sum + pr.amount,
    0
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
                totalAmount: c.main_ledger?.amount + adjustmentsAmount,
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
                    mt: 1,
                  }}
                >
                  <SectionHeader
                    width='95%'
                    title={c.name}
                    sectionKey={`cashier-${index}`}
                  />
                  {openSections[`cashier-${index}`] && (
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
                        onClick={() => toggleSection(`pumpdetails-${index}`)}
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections[`pumpdetails-${index}`] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Pump Details
                        </Typography>
                      </Box>
                      {openSections[`pumpdetails-${index}`] && (
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
                              <Typography sx={{ color: headerColor }}>
                                Name
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
                              <Typography sx={{ color: headerColor }}>
                                Fuel
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
                              <Typography sx={{ color: headerColor }}>
                                Amount
                              </Typography>
                            </Grid>
                          </Grid>
                          {(() => {
                            let pumpReadingsSubTotal = 0;

                            return (
                              <>
                                {c.pump_readings.map((pump, index) => {
                                  const pumpInfo = fuel_pumps?.find(
                                    (p) => p.id === pump.fuel_pump_id
                                  );
                                  const product = productOptions?.find(
                                    (p) => p.id === pump.product_id
                                  );
                                  const difference =
                                    (pump.closing || 0) - (pump.opening || 0);

                                  const fuelPrice = shiftData.fuel_prices.find(
                                    (fp) => fp.product_id === pump.product_id
                                  );

                                  const amount = difference * fuelPrice.price;
                                  pumpReadingsSubTotal += amount;

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
                                          textAlign: 'right',
                                        }}
                                      >
                                        <Typography>
                                          {amount.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  );
                                })}

                                {/* Sub-total if there are adjustments */}
                                {c.tank_adjustments?.length > 0 && (
                                  <Grid
                                    container
                                    sx={{ marginTop: '8px', width: '85%' }}
                                  >
                                    <Grid
                                      size={8}
                                      sx={{
                                        backgroundColor: mainColor,
                                        color: contrastText,
                                        padding: '5px',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          color: contrastText,
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        Sub-total
                                      </Typography>
                                    </Grid>
                                    <Grid
                                      size={4}
                                      sx={{
                                        backgroundColor: mainColor,
                                        color: contrastText,
                                        padding: '5px',
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      <Typography
                                        sx={{
                                          color: contrastText,
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        {pumpReadingsSubTotal.toLocaleString(
                                          'en-US',
                                          {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          }
                                        )}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                )}

                                {/* Tank Adjustments Section */}
                                {c.tank_adjustments?.length > 0 && (
                                  <>
                                    <Grid
                                      container
                                      sx={{ marginTop: '8px', width: '85%' }}
                                    >
                                      <Grid
                                        size={12}
                                        sx={{
                                          backgroundColor: mainColor,
                                          color: contrastText,
                                          padding: '5px',
                                          textAlign: 'center',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            color: contrastText,
                                            fontWeight: 'bold',
                                          }}
                                        >
                                          Tank Adjustments
                                        </Typography>
                                      </Grid>
                                    </Grid>

                                    {(() => {
                                      // Group adjustments by tank
                                      const groupedAdjustments =
                                        c.tank_adjustments.reduce(
                                          (acc, adj) => {
                                            if (!acc[adj.tank_id]) {
                                              acc[adj.tank_id] = 0;
                                            }
                                            const qty =
                                              adj.operator === '-'
                                                ? adj.quantity
                                                : -adj.quantity;
                                            acc[adj.tank_id] += qty;
                                            return acc;
                                          },
                                          {}
                                        );

                                      return Object.entries(
                                        groupedAdjustments
                                      ).map(([tankId, totalQty], idx) => {
                                        const tank = shiftData.shift_tanks.find(
                                          (t) => t.id === Number(tankId)
                                        );
                                        if (!tank) return null;

                                        const productId = tank.product.id;
                                        const priceObj =
                                          shiftData.fuel_prices.find(
                                            (p) => p.product_id === productId
                                          );
                                        const price = priceObj
                                          ? priceObj.price
                                          : 0;
                                        const totalAmount = totalQty * price;

                                        return (
                                          <Grid
                                            key={idx}
                                            container
                                            sx={{
                                              marginTop: '4px',
                                              width: '85%',
                                            }}
                                          >
                                            <Grid
                                              size={4}
                                              sx={{
                                                backgroundColor:
                                                  theme.palette.background
                                                    .default,
                                                borderRightColor: 'white',
                                                borderRightWidth: 2,
                                                padding: '5px',
                                              }}
                                            >
                                              <Typography>
                                                {tank.name}
                                              </Typography>
                                            </Grid>
                                            <Grid
                                              size={4}
                                              sx={{
                                                backgroundColor:
                                                  theme.palette.background
                                                    .default,
                                                padding: '5px',
                                                textAlign: 'right',
                                              }}
                                            >
                                              <Typography>
                                                {totalQty > 0
                                                  ? `+${totalQty.toLocaleString()}`
                                                  : totalQty.toLocaleString()}
                                              </Typography>
                                            </Grid>
                                            <Grid
                                              size={4}
                                              sx={{
                                                backgroundColor:
                                                  theme.palette.background
                                                    .default,
                                                padding: '5px',
                                                textAlign: 'right',
                                              }}
                                            >
                                              <Typography>
                                                {totalAmount > 0
                                                  ? `+${totalAmount.toLocaleString(
                                                      'en-US',
                                                      {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                      }
                                                    )}`
                                                  : totalAmount.toLocaleString(
                                                      'en-US',
                                                      {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                      }
                                                    )}
                                              </Typography>
                                            </Grid>
                                          </Grid>
                                        );
                                      });
                                    })()}

                                    {/* Adjustments Sub-total */}
                                    <Grid
                                      container
                                      sx={{ marginTop: '8px', width: '85%' }}
                                    >
                                      <Grid
                                        size={8}
                                        sx={{
                                          backgroundColor: mainColor,
                                          color: contrastText,
                                          padding: '5px',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            color: contrastText,
                                            fontWeight: 'bold',
                                          }}
                                        >
                                          Sub-total (+/-)
                                        </Typography>
                                      </Grid>
                                      <Grid
                                        size={4}
                                        sx={{
                                          backgroundColor: mainColor,
                                          color: contrastText,
                                          padding: '5px',
                                          textAlign: 'right',
                                          fontWeight: 'bold',
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            color: contrastText,
                                            fontWeight: 'bold',
                                          }}
                                        >
                                          {adjustmentsAmount > 0
                                            ? `+${adjustmentsAmount.toLocaleString(
                                                'en-US',
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                }
                                              )}`
                                            : adjustmentsAmount.toLocaleString(
                                                'en-US',
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                }
                                              )}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </>
                                )}

                                {/* TOTAL Row */}
                                <Grid
                                  container
                                  sx={{ marginTop: '8px', width: '85%' }}
                                >
                                  <Grid
                                    size={8}
                                    sx={{
                                      backgroundColor: mainColor,
                                      color: contrastText,
                                      padding: '5px',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: contrastText,
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      TOTAL
                                    </Typography>
                                  </Grid>
                                  <Grid
                                    size={4}
                                    sx={{
                                      backgroundColor: mainColor,
                                      color: contrastText,
                                      padding: '5px',
                                      textAlign: 'right',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        color: contrastText,
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      {(
                                        pumpReadingsSubTotal + adjustmentsAmount
                                      ).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </>
                            );
                          })()}
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
                        onClick={() =>
                          toggleSection(`cashDistributions-${index}`)
                        }
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections[`cashDistributions-${index}`] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Cash Distributions
                        </Typography>
                      </Box>
                      {openSections[`cashDistributions-${index}`] && (
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
                              <Typography sx={{ color: headerColor }}>
                                Description
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
                              <Typography sx={{ color: headerColor }}>
                                Count
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
                              <Typography sx={{ color: headerColor }}>
                                Amount
                              </Typography>
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
                                  textAlign: 'right',
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
                        onClick={() =>
                          toggleSection(`cashCollections-${index}`)
                        }
                      >
                        <IconButton size='small' sx={{ mr: 1 }}>
                          {openSections[`cashCollections-${index}`] ? (
                            <KeyboardArrowDown />
                          ) : (
                            <KeyboardArrowRight />
                          )}
                        </IconButton>
                        <Typography variant='h6' sx={{ color: headerColor }}>
                          Cash Collections
                        </Typography>
                      </Box>
                      {openSections[`cashCollections-${index}`] && (
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
                              <Typography sx={{ color: headerColor }}>
                                Expected
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
                              <Typography sx={{ color: headerColor }}>
                                Collected
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
                              <Typography sx={{ color: headerColor }}>
                                Over/Short
                              </Typography>
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
                                textAlign: 'right',
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
                                textAlign: 'right',
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
                                textAlign: 'right',
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

      {/* === Totals Section === */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {/* Expected Amount */}
          <Grid container sx={{ marginTop: '4px' }}>
            <Grid
              size={8}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
                fontWeight: 'bold',
              }}
            >
              <Typography
                sx={{
                  color: contrastText,
                  fontWeight: 'bold',
                }}
              >
                Total Expected Amount
              </Typography>
            </Grid>
            <Grid
              size={4}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              <Typography
                sx={{
                  color: contrastText,
                  fontWeight: 'bold',
                }}
              >
                {totalExpectedAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          </Grid>

          {/* Collected Amount */}
          <Grid container sx={{ marginTop: '4px' }}>
            <Grid
              size={8}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
              }}
            >
              <Typography>Total Collected Amount</Typography>
            </Grid>
            <Grid
              size={4}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
                textAlign: 'right',
              }}
            >
              <Typography>
                {totalCollectedAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          </Grid>

          {/* Short/Over */}
          <Grid container sx={{ marginTop: '4px' }}>
            <Grid
              size={8}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
              }}
            >
              <Typography>Short/Over</Typography>
            </Grid>
            <Grid
              size={4}
              sx={{
                backgroundColor: theme.palette.background.default,
                padding: '8px',
                textAlign: 'right',
              }}
            >
              <Typography
                sx={{
                  color: totalShortOrOver >= 0 ? '#4caf50' : '#f44336',
                  fontWeight: 'bold',
                }}
              >
                {totalShortOrOver > 0
                  ? `+${totalShortOrOver.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : totalShortOrOver.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </Typography>
            </Grid>
          </Grid>

          {/* Payments Received */}
          {paymentReceived?.length > 0 && (
            <Grid container sx={{ marginTop: '4px' }}>
              <Grid
                size={8}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  padding: '8px',
                  textAlign: 'left',
                }}
              >
                <Typography
                  sx={{
                    color: contrastText,
                    fontWeight: 'bold',
                  }}
                >
                  Total Cash Payments Received
                </Typography>
              </Grid>
              <Grid
                size={4}
                sx={{
                  backgroundColor: theme.palette.background.default,
                  padding: '8px',
                  textAlign: 'right',
                }}
              >
                <Typography
                  sx={{
                    color: contrastText,
                    fontWeight: 'bold',
                  }}
                >
                  {paymentsReceivedTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Grand Total */}
          <Grid container sx={{ marginTop: '12px' }}>
            <Grid
              size={8}
              sx={{
                backgroundColor: mainColor,
                color: contrastText,
                padding: '10px',
                fontWeight: 'bold',
              }}
            >
              <Typography
                sx={{
                  color: contrastText,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
              >
                GRAND TOTAL
              </Typography>
            </Grid>
            <Grid
              size={4}
              sx={{
                backgroundColor: mainColor,
                color: contrastText,
                padding: '10px',
                textAlign: 'right',
                fontWeight: 'bold',
              }}
            >
              <Typography
                sx={{
                  color: contrastText,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                }}
              >
                {(totalCollectedAmount + paymentsReceivedTotal).toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* === Dipping Summary === */}
      {!hideDippingTable && (
        <>
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
                        sectionKey={`tankDetails-${index}`}
                      />
                      {openSections[`tankDetails-${index}`] && (
                        <Grid container sx={{ marginTop: '4px', width: '85%' }}>
                          <Grid size={12}>
                            {/* Opening */}
                            <Grid container sx={{ marginTop: '4px' }}>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Opening
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
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
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Purchase
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
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
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Total
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
                                }}
                              >
                                <Typography>
                                  {' '}
                                  {(
                                    (st.opening_reading || 0) +
                                    (st.incoming || 0)
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
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Closing
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
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
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Tank Difference
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
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
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Actual Sold
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
                                }}
                              >
                                <Typography>
                                  {(st.actual_sold || 0).toLocaleString(
                                    'en-US',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </Typography>
                              </Grid>
                            </Grid>
                            {/* Pos/Neg */}
                            <Grid container sx={{ marginTop: '4px' }}>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  borderRightColor: 'white',
                                  borderRightWidth: 2,
                                  padding: '5px',
                                }}
                              >
                                <Typography sx={{ color: headerColor }}>
                                  Pos/Neg
                                </Typography>
                              </Grid>
                              <Grid
                                size={6}
                                sx={{
                                  backgroundColor:
                                    theme.palette.background.default,
                                  padding: '5px',
                                  textAlign: 'right',
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
      )}
    </>
  );
}
