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

const SalesShiftOnScreen = ({
  shiftData,
  organization,
  shift_teams = [],
  fuel_pumps = [],
  tanks = [],
  productOptions = [],
  includeFuelVouchers = true,
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
    fuelVouchers: includeFuelVouchers && !!shiftData?.fuel_vouchers?.length,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
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

  const totalCash =
    cashAccounts.reduce((sum, acc) => sum + (acc.amount || 0), 0) +
    totalFuelVouchersAmount;

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
            Team
          </Typography>
          <Typography variant='body1'>
            {shift_teams?.find((t) => t.id === shiftData.shift_team_id)?.name ||
              '—'}
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

      <Paper elevation={3} sx={{ overflow: 'hidden' }}>
        {/* Pump Readings */}
        <SectionHeader title='Pump Readings' sectionKey='pumpReadings' />
        {openSections.pumpReadings && (
          <TableContainer sx={{ px: 2, pb: 2 }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: mainColor }}>
                  <TableCell sx={{ color: contrastText }}>Pump</TableCell>
                  <TableCell sx={{ color: contrastText }}>Product</TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Opening
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Closing
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Difference
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(shiftData.pump_readings || []).map((pump, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      {fuel_pumps?.find((p) => p.id === pump.fuel_pump_id)
                        ?.name || '—'}
                    </TableCell>
                    <TableCell>
                      {productOptions?.find((p) => p.id === pump.product_id)
                        ?.name || '—'}
                    </TableCell>
                    <QuantityCell value={pump.opening} />
                    <QuantityCell value={pump.closing} />
                    <QuantityCell value={pump.closing - pump.opening} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Products Sold */}
        <SectionHeader title='Products Sold' sectionKey='products' />
        {openSections.products && (
          <TableContainer sx={{ px: 2, pb: 2 }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: mainColor }}>
                  <TableCell sx={{ color: contrastText }}>Product</TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Quantity (L)
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Price
                  </TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mergedProducts.map((product, idx) => {
                  const price =
                    shiftData.fuel_prices?.find(
                      (p) => p.product_id === product.product_id
                    )?.price || 0;
                  const adjustments = (shiftData.adjustments || []).filter(
                    (a) => a.product_id === product.product_id
                  );
                  const adjTotal = adjustments.reduce(
                    (sum, a) =>
                      sum + (a.operator === '+' ? -a.quantity : a.quantity),
                    0
                  );
                  const finalQty = product.quantity + adjTotal;
                  const amount = finalQty * price;

                  return (
                    <TableRow key={idx} hover>
                      <TableCell>
                        {productOptions?.find(
                          (p) => p.id === product.product_id
                        )?.name || 'Unknown'}
                      </TableCell>
                      <QuantityCell value={finalQty} />
                      <NumberCell value={price} />
                      <NumberCell value={amount} bold />
                    </TableRow>
                  );
                })}
                <TotalRow
                  label='Total Products'
                  quantity={productsTotals.totalQuantity}
                  amount={productsTotals.totalAmount}
                />
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Cash Distribution */}
        <SectionHeader
          title='Cash Distribution'
          sectionKey='cashDistribution'
        />
        {openSections.cashDistribution && (
          <TableContainer sx={{ px: 2, pb: 2 }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: mainColor }}>
                  <TableCell sx={{ color: contrastText }}>Account</TableCell>
                  <TableCell align='right' sx={{ color: contrastText }}>
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cashAccounts.map((acc, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{acc.name}</TableCell>
                    <NumberCell value={acc.amount} />
                  </TableRow>
                ))}
                {totalFuelVouchersAmount > 0 && (
                  <TableRow hover>
                    <TableCell>Fuel Vouchers</TableCell>
                    <NumberCell value={totalFuelVouchersAmount} />
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Cash</TableCell>
                  <NumberCell value={totalCash} bold />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Tank Adjustments */}
        {!!shiftData?.adjustments?.length && (
          <>
            <SectionHeader
              title='Tank Adjustments'
              sectionKey='tankAdjustments'
            />
            {openSections.tankAdjustments && (
              <TableContainer sx={{ px: 2, pb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText }}>
                        Product
                      </TableCell>
                      <TableCell sx={{ color: contrastText }}>Tank</TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Description
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Quantity
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(shiftData.adjustments || []).map((adj, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          {productOptions?.find((p) => p.id === adj.product_id)
                            ?.name || '—'}
                        </TableCell>
                        <TableCell>
                          {tanks?.find((t) => t.id === adj.tank_id)?.name ||
                            '—'}
                        </TableCell>
                        <TableCell>{adj.description || '—'}</TableCell>
                        <TableCell
                          align='right'
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {`(${adj.operator})${adj.quantity.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            }
                          )}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Opening Dipping */}
        {shiftData?.opening_dipping?.readings?.length > 0 && (
          <>
            <SectionHeader
              title='Opening Dipping'
              sectionKey='openingDipping'
            />
            {openSections.openingDipping && (
              <TableContainer sx={{ px: 2, pb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText }}>Tank</TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Product
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Reading
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Cumulative Deviation
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(shiftData.opening_dipping.readings || []).map(
                      (d, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{d.tank?.name || '—'}</TableCell>
                          <TableCell>
                            {productOptions?.find((p) => p.id === d.product_id)
                              ?.name || '—'}
                          </TableCell>
                          <QuantityCell value={d.reading} />
                          <QuantityCell value={d.deviation} />
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Closing Dipping */}
        {shiftData?.closing_dipping?.readings?.length > 0 && (
          <>
            <SectionHeader
              title='Closing Dipping'
              sectionKey='closingDipping'
            />
            {openSections.closingDipping && (
              <TableContainer sx={{ px: 2, pb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText }}>Tank</TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Product
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Reading
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Cumulative Deviation
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(shiftData.closing_dipping.readings || []).map(
                      (d, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>{d.tank?.name || '—'}</TableCell>
                          <TableCell>
                            {productOptions?.find((p) => p.id === d.product_id)
                              ?.name || '—'}
                          </TableCell>
                          <QuantityCell value={d.reading} />
                          <QuantityCell value={d.deviation} />
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {/* Fuel Vouchers */}
        {includeFuelVouchers && shiftData?.fuel_vouchers?.length > 0 && (
          <>
            <SectionHeader title='Fuel Vouchers' sectionKey='fuelVouchers' />
            {openSections.fuelVouchers && (
              <TableContainer sx={{ px: 2, pb: 2 }}>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: mainColor }}>
                      <TableCell sx={{ color: contrastText }}>
                        Voucher No
                      </TableCell>
                      <TableCell sx={{ color: contrastText }}>Client</TableCell>
                      <TableCell sx={{ color: contrastText }}>
                        Reference
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
                        Price
                      </TableCell>
                      <TableCell align='right' sx={{ color: contrastText }}>
                        Amount
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(shiftData.fuel_vouchers || []).map((voucher, idx) => {
                      const price =
                        shiftData.fuel_prices?.find(
                          (p) => p.product_id === voucher.product_id
                        )?.price || 0;
                      const amount = voucher.quantity * price;

                      return (
                        <TableRow key={idx} hover>
                          <TableCell>{voucher.voucherNo}</TableCell>
                          <TableCell>
                            {voucher.stakeholder?.name || '—'}
                          </TableCell>
                          <TableCell>{voucher.reference || '—'}</TableCell>
                          <TableCell>{voucher.narration || '—'}</TableCell>
                          <TableCell>
                            {productOptions?.find(
                              (p) => p.id === voucher.product_id
                            )?.name || '—'}
                          </TableCell>
                          <QuantityCell value={voucher.quantity} />
                          <NumberCell value={price} />
                          <NumberCell value={amount} bold />
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ fontWeight: 'bold' }}>
                        Total Fuel Vouchers
                      </TableCell>
                      <NumberCell value={totalFuelVouchersAmount} bold />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SalesShiftOnScreen;
