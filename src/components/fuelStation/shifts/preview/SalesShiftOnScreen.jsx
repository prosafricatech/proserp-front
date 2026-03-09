'use client';

import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { KeyboardArrowDown, KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';
import CashierListSummaryOnScreen from './CashierListSummaryOnScreen';

const SalesShiftOnScreen = ({
  shiftData,
  organization,
  shift_teams = [],
  fuel_pumps = [],
  tanks = [],
  productOptions = [],
  openDetails,
  paymentReceived,
  allPaymentsReceived,
}) => {
  const theme = useTheme();
  const isDark = theme.type === 'dark';

  const mainColor = organization.settings?.main_color || '#2113AD';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const headerColor = isDark ? '#29f096' : mainColor;

  const [openSections, setOpenSections] = useState({
    products: true,
    cashDistribution: true,
    pumpReadings: true,
    tankAdjustments: !!shiftData?.adjustments?.length,
    openingDipping: !!shiftData?.opening_dipping?.readings?.length,
    closingDipping: !!shiftData?.closing_dipping?.readings?.length,
    fuelVouchers: openDetails && !!shiftData?.fuel_vouchers?.length,
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

  // Merge pump readings by product for a specific cashier
  const mergeCashierPumpReadings = (pumpReadings) => {
    const merged = pumpReadings.reduce((acc, pump) => {
      if (!acc[pump.product_id]) {
        acc[pump.product_id] = {
          ...pump,
          quantity: (pump.closing || 0) - (pump.opening || 0),
          opening: pump.opening || 0,
          closing: pump.closing || 0,
        };
      } else {
        acc[pump.product_id].quantity +=
          (pump.closing || 0) - (pump.opening || 0);
        acc[pump.product_id].opening += pump.opening || 0;
        acc[pump.product_id].closing += pump.closing || 0;
      }
      return acc;
    }, {});
    return Object.values(merged);
  };

  // Products Sold Calculations (with adjustments)
  const mergedPumpReadings = (shiftData.pump_readings || []).reduce(
    (acc, pump) => {
      if (!acc[pump.product_id]) {
        acc[pump.product_id] = {
          ...pump,
          quantity: pump.closing - pump.opening,
        };
      } else {
        acc[pump.product_id].quantity += pump.closing - pump.opening;
      }
      return acc;
    },
    {}
  );

  const mergedProducts = Object.values(mergedPumpReadings);

  const productsTotals = mergedProducts.reduce(
    (acc, product) => {
      const price =
        shiftData.fuel_prices?.find((p) => p.product_id === product.product_id)
          ?.price || 0;
      const adjustments = (shiftData.adjustments || []).filter(
        (a) => a.product_id === product.product_id
      );
      const adjTotal = adjustments.reduce(
        (sum, a) => sum + (a.operator === '+' ? -a.quantity : a.quantity),
        0
      );
      const finalQty = product.quantity + adjTotal;
      const amount = finalQty * price;

      acc.totalQuantity += finalQty;
      acc.totalAmount += amount;
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0 }
  );

  // Calculate total expected amount
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

  // Calculate total collected amount
  const totalCollectedAmount =
    shiftData.cashiers?.reduce((sum, c) => sum + c.collected_amount, 0) || 0.0;

  const totalShortOrOver = totalCollectedAmount - totalExpectedAmount;

  // Calculate payments received total
  const paymentsReceivedTotal = paymentReceived.reduce(
    (sum, pr) => sum + pr.amount,
    0
  );

  const allPaymentsTotal = allPaymentsReceived.reduce(
    (sum, pr) => sum + pr.amount,
    0
  );

  // hide dipping summary table if opening or closing reading is less than 1
  const hideDippingTable = shiftData.shift_tanks?.some((st) => {
    return st.opening_reading < 1 || st.closing_reading < 1;
  });

  const SectionHeader = ({ title, sectionKey, hasData = true }) =>
    hasData && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
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

  const NumberCell = ({ value, bold = false, color = contrastText }) => (
    <TableCell
      align='right'
      sx={{
        fontFamily: 'monospace',
        fontWeight: bold ? 'bold' : 'regular',
        color: bold ? headerColor : color,
      }}
    >
      {value?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || '—'}
    </TableCell>
  );

  const QuantityCell = ({ value }) => (
    <TableCell align='right' sx={{ fontFamily: 'monospace' }}>
      {value?.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || '—'}
    </TableCell>
  );

  const TotalRow = ({ label, amount, quantity = null }) => (
    <TableRow>
      <TableCell sx={{ fontWeight: 'bold' }}>{label}</TableCell>
      {quantity !== null && <QuantityCell value={quantity} />}
      <TableCell />
      <NumberCell value={amount} bold />
    </TableRow>
  );

  return (
    <Box sx={{ p: { xs: 0, md: 3 }, width: '100%' }}>
      {/* Header */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography
            variant='h4'
            sx={{ color: headerColor, fontWeight: 'bold', textAlign: 'center' }}
          >
            {shiftData.shiftNo}
          </Typography>
        </Grid>
      </Grid>

      {/* Metadata */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant='subtitle2' sx={{ color: headerColor }}>
            Team
          </Typography>
          <Typography variant='body1'>
            {shift_teams?.find((t) => t.id === shiftData.sales_outlet_shift_id)
              ?.name || '—'}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant='subtitle2' sx={{ color: headerColor }}>
            Start Time
          </Typography>
          <Typography variant='body1'>
            {readableDate(shiftData.shift_start, true)}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Typography variant='subtitle2' sx={{ color: headerColor }}>
            End Time
          </Typography>
          <Typography variant='body1'>
            {readableDate(shiftData.shift_end, true)}
          </Typography>
        </Grid>
      </Grid>

      {/* Conditional rendering based on openDetails */}
      {!openDetails ? (
        <CashierListSummaryOnScreen
          shiftData={shiftData}
          organization={organization}
          shift_teams={shift_teams}
          fuel_pumps={fuel_pumps}
          tanks={tanks}
          productOptions={productOptions}
          openDetails={openDetails}
          paymentReceived={paymentReceived}
        />
      ) : (
        <>
          {/* Detailed View - Per Cashier Breakdown */}
          {shiftData.cashiers?.map((cashier, cashierIndex) => {
            const cashierTotals = calculateCashierTotals(cashier);

            // Calculate total pump amount for this cashier
            const totalPumpAmount =
              cashier.pump_readings?.reduce((acc, pump) => {
                const difference = (pump.closing || 0) - (pump.opening || 0);
                const fuelPrice = shiftData.fuel_prices.find(
                  (fp) => fp.product_id === pump.product_id
                );
                const price = fuelPrice?.price || 0;

                // Calculate adjustments for this specific pump's product
                const adjustmentsQty = (cashier.tank_adjustments || [])
                  .filter((adj) => adj.product_id === pump.product.id)
                  .reduce((sum, adj) => {
                    if (adj.operator === '+') {
                      return sum - adj.quantity;
                    } else if (adj.operator === '-') {
                      return sum + adj.quantity;
                    }
                    return sum;
                  }, 0);

                const totalQty = difference + adjustmentsQty;
                const amount = totalQty * price;

                return acc + amount;
              }, 0) || 0;

            return (
              <Paper
                key={cashier.id || cashierIndex}
                elevation={3}
                sx={{ mb: 3, overflow: 'hidden' }}
              >
                {/* Cashier Pump Readings */}
                {cashier.pump_readings?.length > 0 && (
                  <Box>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: mainColor,
                        color: contrastText,
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                        {cashier.name} - Pump Readings
                      </Typography>
                    </Box>
                    <TableContainer sx={{ px: 2, pt: 2, pb: 2 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell sx={{ color: contrastText }}>
                              Pump
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Product
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Opening
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Closing
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Difference
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Price
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Amount
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cashier.pump_readings.map((pump, idx) => {
                            const pumpInfo = fuel_pumps?.find(
                              (p) => p.id === pump.fuel_pump_id
                            );
                            const product = productOptions?.find(
                              (p) => p.id === pump.product_id
                            );
                            const difference =
                              (pump.closing || 0) - (pump.opening || 0);

                            const price =
                              shiftData.fuel_prices.find(
                                (p) => p.product_id === pump.product.id
                              )?.price || 0;

                            const adjustmentsQty = (
                              cashier.tank_adjustments || []
                            )
                              .filter(
                                (adj) => adj.product_id === pump.product.id
                              )
                              .reduce((sum, adj) => {
                                if (adj.operator === '+') {
                                  return sum - adj.quantity;
                                } else if (adj.operator === '-') {
                                  return sum + adj.quantity;
                                }
                                return sum;
                              }, 0);

                            const totalQty = difference + adjustmentsQty;
                            const totalAmount = totalQty * price;

                            return (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  {pumpInfo?.name ||
                                    `Pump ${pump.fuel_pump_id}`}
                                </TableCell>
                                <TableCell>
                                  {product?.name ||
                                    `Product ${pump.product_id}`}
                                </TableCell>
                                <QuantityCell value={pump.opening} />
                                <QuantityCell value={pump.closing} />
                                <QuantityCell value={difference} />
                                <NumberCell value={price} />
                                <NumberCell value={totalAmount} />
                              </TableRow>
                            );
                          })}
                          {/* Total Row */}
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell
                              colSpan={6}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            >
                              Total Amount
                            </TableCell>
                            <NumberCell
                              value={totalPumpAmount}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Cashier Fuel Vouchers */}
                {cashier.fuel_vouchers?.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        color: headerColor,
                        textAlign: 'center',
                        mb: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      {cashier.name} - Fuel Vouchers
                    </Typography>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell sx={{ color: contrastText }}>
                              Voucher No
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Client
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Narration
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Product
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Quantity
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Amount
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cashier.fuel_vouchers?.map((fv, idx) => {
                            const product = productOptions?.find(
                              (p) => p.id === fv.product_id
                            );
                            const price =
                              shiftData.fuel_prices.find(
                                (p) => p.product_id === fv.product_id
                              )?.price || 0;
                            const amount = fv.quantity * price;

                            return (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  {fv.voucherNo || `FV-${idx + 1}`}
                                </TableCell>
                                <TableCell>
                                  {fv.stakeholder?.name || 'Internal Expense'}
                                </TableCell>
                                <TableCell>{fv.narration || '-'}</TableCell>
                                <TableCell>
                                  {product?.name || `Product ${fv.product_id}`}
                                </TableCell>
                                <QuantityCell value={fv.quantity} />
                                <NumberCell value={amount} />
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell
                              colSpan={5}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            >
                              Cashier Total Fuel Vouchers
                            </TableCell>
                            <NumberCell
                              value={cashierTotals.totalFuelVouchersAmount}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Cashier Cash Distribution */}
                {(cashier.main_ledger ||
                  cashier.other_transactions?.length > 0) && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        color: headerColor,
                        textAlign: 'center',
                        mb: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      {cashier.name} - Cash Distribution
                    </Typography>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell sx={{ color: contrastText }}>
                              Account
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Narration
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Amount
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {/* Main Ledger */}
                          {cashier.main_ledger && (
                            <TableRow hover>
                              <TableCell>
                                {cashier.main_ledger.name ||
                                  `Ledger ${cashier.main_ledger.id}`}
                              </TableCell>
                              <TableCell align='right'></TableCell>
                              <NumberCell value={cashier.main_ledger.amount} />
                            </TableRow>
                          )}

                          {/* Other Transactions */}
                          {cashier.other_transactions?.map(
                            (transaction, idx) => {
                              return (
                                <TableRow key={idx} hover>
                                  <TableCell>
                                    {transaction.debit_ledger?.name || '-'}
                                  </TableCell>
                                  <TableCell align='right'>
                                    {transaction.narration || '-'}
                                  </TableCell>
                                  <NumberCell value={transaction.amount} />
                                </TableRow>
                              );
                            }
                          )}

                          {/* Total */}
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell
                              colSpan={2}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            >
                              Total Distributed
                            </TableCell>
                            <NumberCell
                              value={
                                cashierTotals.otherTransactionsTotal +
                                (cashier.main_ledger?.amount || 0)
                              }
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            />
                          </TableRow>

                          {/* Cash Collected */}
                          <TableRow
                            sx={{
                              bgcolor: theme.palette.background.default,
                            }}
                          >
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                              Cash Collected
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                              }}
                            >
                              {(cashier.collected_amount || 0)?.toLocaleString(
                                'en-US',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </TableCell>
                          </TableRow>

                          {/* Short/Over */}
                          <TableRow
                            sx={{
                              bgcolor: theme.palette.background.default,
                            }}
                          >
                            <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                              Short/Over
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color:
                                  (cashier.collected_amount || 0) -
                                    (cashierTotals.totalProductsAmount +
                                      cashierTotals.adjustmentsAmount -
                                      cashierTotals.totalFuelVouchersAmount -
                                      cashierTotals.otherTransactionsTotal) >
                                  0
                                    ? '#4a990eff'
                                    : theme.palette.error.main,
                              }}
                            >
                              {(() => {
                                const expectedAmount =
                                  cashierTotals.totalProductsAmount +
                                  cashierTotals.adjustmentsAmount -
                                  cashierTotals.totalFuelVouchersAmount -
                                  cashierTotals.otherTransactionsTotal;
                                const collectedAmount =
                                  cashier.collected_amount || 0;
                                const shortOrOver =
                                  collectedAmount - expectedAmount;

                                return shortOrOver > 0
                                  ? `+${shortOrOver?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`
                                  : `${shortOrOver?.toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`;
                              })()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Cashier Tank Adjustments */}
                {cashier.tank_adjustments?.length > 0 && (
                  <Box sx={{ mt: 3, pb: 2 }}>
                    <Typography
                      variant='subtitle1'
                      sx={{
                        color: headerColor,
                        textAlign: 'center',
                        mb: 1,
                        fontWeight: 'bold',
                      }}
                    >
                      {cashier.name} - Tank Adjustments
                    </Typography>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell sx={{ color: contrastText }}>
                              Product
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Tank
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Description
                            </TableCell>
                            <TableCell sx={{ color: contrastText }}>
                              Operator
                            </TableCell>
                            <TableCell
                              align='right'
                              sx={{ color: contrastText }}
                            >
                              Quantity
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cashier.tank_adjustments.map((adj, idx) => {
                            const product = productOptions?.find(
                              (p) => p.id === adj.product_id
                            );
                            const tank = tanks?.find(
                              (t) => t.id === adj.tank_id
                            );

                            return (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  {product?.name || `Product ${adj.product_id}`}
                                </TableCell>
                                <TableCell>
                                  {tank?.name || `Tank ${adj.tank_id}`}
                                </TableCell>
                                <TableCell>{adj.description || '-'}</TableCell>
                                <TableCell>{adj.operator}</TableCell>
                                <QuantityCell value={adj.quantity} />
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Paper>
            );
          })}

          {/* ================= PAYMENTS RECEIVED SECTION ================= */}
          {allPaymentsReceived.length > 0 && (
            <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: mainColor,
                  color: contrastText,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                  Payments Received
                </Typography>
              </Box>

              <TableContainer sx={{ px: 2, pt: 2, pb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText }}>
                        Pay From (Credit)
                      </TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Pay To (Debit)
                      </TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Narration
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPaymentsReceived.map((pr, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{pr.creditLedger?.name || '-'}</TableCell>
                        <TableCell>{pr.debitLedger?.name || '-'}</TableCell>
                        <TableCell>{pr.narration || '-'}</TableCell>
                        <NumberCell value={pr.amount} />
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell
                        colSpan={3}
                        sx={{ color: contrastText, fontWeight: 'bold' }}
                      >
                        Total Payments
                      </TableCell>
                      <NumberCell
                        value={allPaymentsTotal}
                        sx={{ color: contrastText, fontWeight: 'bold' }}
                      />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* ================= CASH COLLECTION SUMMARY ================= */}
          {shiftData.cashiers?.length > 0 && (
            <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: mainColor,
                  color: contrastText,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                  Cash Collection Summary
                </Typography>
              </Box>

              <TableContainer sx={{ px: 2, pt: 2, pb: 2 }}>
                <Table size='small'>
                  <TableBody>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Total Expected
                      </TableCell>
                      <NumberCell value={totalExpectedAmount} />
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Total Collected
                      </TableCell>
                      <NumberCell value={totalCollectedAmount} />
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        Short/Over
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color:
                            totalShortOrOver > 0
                              ? '#4a990eff'
                              : theme.palette.error.main,
                        }}
                      >
                        {totalShortOrOver > 0
                          ? `+${totalShortOrOver?.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : `${totalShortOrOver?.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}
                      </TableCell>
                    </TableRow>

                    {paymentReceived.length > 0 && (
                      <>
                        <TableRow hover>
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            Total Payments
                          </TableCell>
                          <NumberCell value={paymentsReceivedTotal} />
                        </TableRow>
                        <TableRow sx={{ bgcolor: mainColor }}>
                          <TableCell
                            sx={{ color: contrastText, fontWeight: 'bold' }}
                          >
                            Grand Total (Total Collected + Total Payments
                            Received)
                          </TableCell>
                          <TableCell
                            align='right'
                            sx={{
                              fontFamily: 'monospace',
                              fontWeight: 'bold',
                              color: contrastText,
                            }}
                          >
                            {(
                              totalCollectedAmount + paymentsReceivedTotal
                            )?.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* ================= DIPPING RECORDS SECTION ================= */}
          {!hideDippingTable && shiftData.shift_tanks?.length > 0 && (
            <Paper elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: mainColor,
                  color: contrastText,
                  textAlign: 'center',
                }}
              >
                <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                  Dipping Records
                </Typography>
              </Box>
              <TableContainer sx={{ px: 2, pb: 2, overflowX: 'auto' }}>
                <Table size='small' sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText, minWidth: 120 }}>
                        Tank
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Opening
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Purchase
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Total
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Closing
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 120 }}
                      >
                        Tank Difference
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Actual Sold
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: contrastText, minWidth: 100 }}
                      >
                        Pos/Neg
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shiftData.shift_tanks.map((st, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{st.name || `Tank ${st.id}`}</TableCell>
                        <NumberCell value={st.opening_reading} />
                        <NumberCell value={st.incoming} />
                        <NumberCell
                          value={(st.opening_reading || 0) + (st.incoming || 0)}
                        />
                        <NumberCell value={st.closing_reading} />
                        <NumberCell value={st.tank_difference} />
                        <NumberCell value={st.actual_sold} />
                        <NumberCell value={st.deviation} />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default SalesShiftOnScreen;
