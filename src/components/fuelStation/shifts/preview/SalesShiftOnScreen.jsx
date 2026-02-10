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
  openDetails = true,
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

  const cashAccounts = [
    ...(shiftData.other_ledgers || []),
    shiftData.main_ledger,
  ].filter(Boolean);

  // Fuel Vouchers Total
  const totalFuelVouchersAmount = (shiftData.fuel_vouchers || []).reduce(
    (total, voucher) => {
      const price =
        shiftData.fuel_prices?.find((p) => p.product_id === voucher.product_id)
          ?.price || 0;
      return total + voucher.quantity * price;
    },
    0
  );

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

  const NumberCell = ({ value, bold = false, color = 'text.primary' }) => (
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
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
            Sales Outlet Shift
          </Typography>
          <Typography variant='body1'>
            {shiftData.shift?.name || 'N/A'}
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
        {shiftData.fuel_prices?.map((price, index) => {
          const product = productOptions?.find(
            (p) => p.id === price.product_id
          );
          return (
            <Grid key={index} size={{ xs: 6, sm: 3 }}>
              <Typography variant='subtitle2' sx={{ color: headerColor }}>
                {product?.name || `Product ${price.product_id}`}
              </Typography>
              <Typography variant='body1'>
                {price.price?.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
          );
        })}
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
        />
      ) : (
        <>
          {/* Detailed View - Per Cashier Breakdown */}
          {shiftData.cashiers?.map((cashier, cashierIndex) => {
            const cashierTotals = calculateCashierTotals(cashier);
            const mergedReadings = mergeCashierPumpReadings(
              cashier.pump_readings || []
            );

            return (
              <Paper
                key={cashier.id || cashierIndex}
                elevation={3}
                sx={{ mb: 3, overflow: 'hidden' }}
              >
                {/* Cashier Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: mainColor,
                    color: contrastText,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                    {cashier.name} - Summary
                  </Typography>
                </Box>

                {/* Cashier Summary Table */}
                <TableContainer sx={{ px: 2, pt: 2 }}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: theme.palette.background.default,
                        }}
                      >
                        <TableCell
                          sx={{ color: headerColor, fontWeight: 'bold' }}
                        >
                          Item
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{ color: headerColor, fontWeight: 'bold' }}
                        >
                          Amount
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow hover>
                        <TableCell>Total Sales Amount</TableCell>
                        <NumberCell value={cashierTotals.netSales} />
                      </TableRow>
                      <TableRow hover>
                        <TableCell>Fuel Vouchers Total</TableCell>
                        <NumberCell
                          value={cashierTotals.totalFuelVouchersAmount}
                        />
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          Cash Remaining
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            color:
                              cashierTotals.cashRemaining < 0
                                ? theme.palette.error.main
                                : headerColor,
                          }}
                        >
                          {cashierTotals.cashRemaining?.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || '—'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Cashier Pump Readings */}
                {cashier.pump_readings?.length > 0 && (
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
                      {cashier.name} - Pump Readings
                    </Typography>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
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
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Cashier Products Summary */}
                {mergedReadings.length > 0 && (
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
                      {cashier.name} - Products Summary
                    </Typography>
                    <TableContainer sx={{ px: 2, pb: 2 }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow sx={{ bgcolor: mainColor }}>
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
                          {mergedReadings.map((productSales, idx) => {
                            const product = productOptions?.find(
                              (p) => p.id === productSales.product_id
                            );
                            const price =
                              shiftData.fuel_prices.find(
                                (p) => p.product_id === productSales.product_id
                              )?.price || 0;

                            // Adjustments for this product and cashier
                            const adjustmentsQty = (
                              cashier.tank_adjustments || []
                            )
                              .filter(
                                (adj) =>
                                  adj.product_id === productSales.product_id
                              )
                              .reduce((sum, adj) => {
                                if (adj.operator === '+') {
                                  return sum - adj.quantity;
                                } else if (adj.operator === '-') {
                                  return sum + adj.quantity;
                                }
                                return sum;
                              }, 0);

                            const totalQty =
                              productSales.quantity + adjustmentsQty;
                            const totalAmount = totalQty * price;

                            return (
                              <TableRow key={idx} hover>
                                <TableCell>
                                  {product?.name ||
                                    `Product ${productSales.product_id}`}
                                </TableCell>
                                <QuantityCell value={totalQty} />
                                <NumberCell value={price} />
                                <NumberCell value={totalAmount} />
                              </TableRow>
                            );
                          })}
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell
                              colSpan={3}
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            >
                              Cashier Total
                            </TableCell>
                            <NumberCell
                              value={cashierTotals.netSales}
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
                              <NumberCell value={cashier.main_ledger.amount} />
                            </TableRow>
                          )}

                          {/* Other Transactions */}
                          {cashier.other_transactions?.map(
                            (transaction, idx) => {
                              const ledger =
                                cashier.ledgers?.find(
                                  (l) => l.id === transaction.id
                                ) ||
                                (transaction.debit_ledger
                                  ? { name: transaction.debit_ledger.name }
                                  : { name: `Transaction ${idx + 1}` });

                              return (
                                <TableRow key={idx} hover>
                                  <TableCell>
                                    {transaction.debit_ledger.name}
                                  </TableCell>
                                  <NumberCell value={transaction.amount} />
                                </TableRow>
                              );
                            }
                          )}

                          {/* Total */}
                          <TableRow sx={{ bgcolor: mainColor }}>
                            <TableCell
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            >
                              Total Distributed
                            </TableCell>
                            <NumberCell
                              value={
                                (cashier.other_transactions?.reduce(
                                  (sum, t) => sum + (t.amount || 0),
                                  0
                                ) || 0) + (cashier.main_ledger?.amount || 0)
                              }
                              sx={{ color: contrastText, fontWeight: 'bold' }}
                            />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Cashier Fuel Vouchers */}
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
                          <TableCell align='right' sx={{ color: contrastText }}>
                            Quantity
                          </TableCell>
                          <TableCell align='right' sx={{ color: contrastText }}>
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
        </>
      )}
    </Box>
  );
};

export default SalesShiftOnScreen;
