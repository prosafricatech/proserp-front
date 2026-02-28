import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import CashierListSummaryPDF from './CashierListSummaryPDF';

function SalesShiftPDF({
  openDetails,
  shiftData,
  stationName,
  organization,
  fuel_pumps,
  tanks,
  productOptions,
  paymentReceived,
}) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

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

  // hide dipping summary table if openeing or closing reading is less than 1
  const hideDippingTable = shiftData.shift_tanks.some((st) => {
    return st.opening_reading < 1 || st.closing_reading < 1;
  });

  // total expected amount
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

  // total collected amount
  const totalCollectedAmount =
    shiftData.cashiers?.reduce((sum, c) => sum + c.collected_amount, 0) || 0.0;

  const totalShortOrOver = totalCollectedAmount - totalExpectedAmount;

  // payments received total
  const paymentsReceivedTotal = paymentReceived.reduce(
    (sum, pr) => sum + pr.amount,
    0
  );

  return (
    <Document
      title={`${shiftData.shiftNo} | ${organization.name}`}
      author={shiftData.creator?.name}
      subject={'Fuel Sales Shift'}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page
        size='A4'
        orientation={`${openDetails ? 'portrait' : 'landscape'}`}
        style={pdfStyles.page}
      >
        {/* ================= HEADER ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Fuel Sales Shift
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>{shiftData.shiftNo}</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{stationName}</Text>
          </View>
        </View>

        {/* ================= SHIFT INFO ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 6 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
              Sales Outlet Shift
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {shiftData.shift?.name || 'N/A'}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
              Shift Start
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {readableDate(shiftData.shift_start, true)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
              Shift End
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {readableDate(shiftData.shift_end, true)}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
              Recorded By:
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {shiftData.creator?.name}
            </Text>
          </View>
          {shiftData.fuel_prices?.map((price, index) => {
            const product = productOptions?.find(
              (p) => p.id === price.product_id
            );
            return (
              <View key={index} style={{ flex: 1, padding: 2 }}>
                <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
                  {product?.name || `Product ${price.product_id}`}
                </Text>
                <Text style={{ ...pdfStyles.midInfo }}>
                  {price.price?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ================= CASHIERS SECTION ================= */}
        {openDetails &&
          shiftData.cashiers?.map((cashier, cashierIndex) => {
            const cashierTotals = calculateCashierTotals(cashier);
            const mergedReadings = mergeCashierPumpReadings(
              cashier.pump_readings || []
            );
            const totalPumoAmount = cashier.pump_readings.reduce(
              (acc, pump) => {
                const difference = (pump.closing || 0) - (pump.opening || 0);

                const fuelPrice = shiftData.fuel_prices.find(
                  (fp) => fp.product_id === pump.product_id
                );

                const amount = difference * fuelPrice.price;

                return acc + amount;
              },
              0
            );

            // Calculate total products amount for this cashier
            const totalProductsAmount =
              cashier?.pump_readings?.reduce((total, pump) => {
                const productPrice =
                  shiftData.fuel_prices.find(
                    (fp) => fp.product_id === pump.product_id
                  )?.price || 0;
                const quantity = (pump.closing || 0) - (pump.opening || 0);
                return total + quantity * productPrice;
              }, 0) || 0;

            // Calculate adjustments amount for this cashier
            const adjustmentsAmount =
              cashier?.tank_adjustments?.reduce((total, adj) => {
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
              cashier?.fuel_vouchers?.reduce((total, fv) => {
                const productPrice =
                  shiftData.fuel_prices.find(
                    (fp) => fp.product_id === fv.product_id
                  )?.price || 0;
                return total + fv.quantity * productPrice;
              }, 0) || 0;

            // Calculate other transactions total for this cashier
            const otherTransactionsTotal =
              cashier.other_transactions?.reduce(
                (total, ot) => total + (ot.amount || 0),
                0
              ) || 0;

            // calculate short/over amount
            const expectedAmount =
              totalProductsAmount +
              adjustmentsAmount -
              totalFuelVouchersAmount -
              otherTransactionsTotal;

            const collectedAmount = cashier.collected_amount;

            const shortOrOver = collectedAmount - expectedAmount;

            return (
              <View
                key={cashier.id}
                style={{ marginBottom: 20, pageBreakInside: 'avoid' }}
              >
                {/* Cashier Pump Readings */}
                {cashier.pump_readings?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <View
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        backgroundColor: mainColor,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: contrastText,
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        {cashier.name} - Pump Readings
                      </Text>
                    </View>
                    <View style={pdfStyles.table}>
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '12%',
                          }}
                        >
                          Pump
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '13%',
                          }}
                        >
                          Product
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                          }}
                        >
                          Opening
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                          }}
                        >
                          Closing
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                          }}
                        >
                          Difference
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                          }}
                        >
                          Price
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                          }}
                        >
                          Amount
                        </Text>
                      </View>
                      {cashier.pump_readings.map((pump, index) => {
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
                        const totalAmount = totalQty * price;

                        return (
                          <View key={index} style={pdfStyles.tableRow}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '12%',
                              }}
                            >
                              {pumpInfo?.name || `Pump ${pump.fuel_pump_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '13%',
                              }}
                            >
                              {product?.name || `Product ${pump.product_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '15%',
                                textAlign: 'right',
                              }}
                            >
                              {(pump.opening || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '15%',
                                textAlign: 'right',
                              }}
                            >
                              {(pump.closing || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '15%',
                                textAlign: 'right',
                              }}
                            >
                              {difference.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '15%',
                                textAlign: 'right',
                              }}
                            >
                              {price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '15%',
                                textAlign: 'right',
                              }}
                            >
                              {totalAmount.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </View>
                        );
                      })}
                      {/* Total */}
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '85%',
                            fontWeight: 'bold',
                          }}
                        >
                          Total Amount
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '15%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {totalPumoAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cashier Fuel Vouchers */}
                {cashier.fuel_vouchers?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: mainColor,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {cashier.name} - Fuel Vouchers
                    </Text>
                    <View style={pdfStyles.table}>
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '18%',
                          }}
                        >
                          Voucher No
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '18%',
                          }}
                        >
                          Client
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '20%',
                          }}
                        >
                          Narration
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '18%',
                          }}
                        >
                          Product
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '13%',
                          }}
                        >
                          Quantity
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '13%',
                          }}
                        >
                          Amount
                        </Text>
                      </View>
                      {cashier.fuel_vouchers.map((fv, index) => {
                        const product = productOptions?.find(
                          (p) => p.id === fv.product_id
                        );
                        const price =
                          shiftData.fuel_prices.find(
                            (p) => p.product_id === fv.product_id
                          )?.price || 0;
                        const amount = fv.quantity * price;

                        return (
                          <View key={index} style={pdfStyles.tableRow}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '18%',
                              }}
                            >
                              {fv.voucherNo || `FV-${index + 1}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '18%',
                              }}
                            >
                              {fv.stakeholder?.name || 'Internal Expense'}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '20%',
                              }}
                            >
                              {fv.narration || '-'}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '18%',
                              }}
                            >
                              {product?.name || `Product ${fv.product_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '13%',
                                textAlign: 'right',
                              }}
                            >
                              {fv.quantity.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                width: '13%',
                                textAlign: 'right',
                              }}
                            >
                              {amount.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </View>
                        );
                      })}
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '87%',
                            fontWeight: 'bold',
                          }}
                        >
                          Total Fuel Vouchers
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '13%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {cashierTotals.totalFuelVouchersAmount.toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cashier Cash Distribution */}
                {(cashier.main_ledger ||
                  cashier.other_transactions?.length > 0) && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: mainColor,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {cashier.name} - Cash Distribution
                    </Text>
                    <View style={pdfStyles.table}>
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '20%',
                          }}
                        >
                          Account
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '50%',
                            textAlign: 'left',
                          }}
                        >
                          Narration
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '30%',
                            textAlign: 'right',
                          }}
                        >
                          Amount
                        </Text>
                      </View>

                      {/* Main Ledger */}
                      {cashier.main_ledger && (
                        <View style={pdfStyles.tableRow}>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor: '#FFFFFF',
                              width: '20%',
                            }}
                          >
                            {cashier.main_ledger.name ||
                              `Ledger ${cashier.main_ledger.id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor: '#FFFFFF',
                              width: '50%',
                              textAlign: 'right',
                            }}
                          ></Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor: '#FFFFFF',
                              width: '30%',
                              textAlign: 'right',
                            }}
                          >
                            {(cashier.main_ledger.amount || 0).toLocaleString(
                              'en-US',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </Text>
                        </View>
                      )}

                      {/* Other Transactions */}
                      {cashier.other_transactions?.map((transaction, index) => {
                        const ledger =
                          cashier.ledgers?.find(
                            (l) => l.id === transaction.id
                          ) ||
                          (transaction.debit_ledger
                            ? { name: transaction.debit_ledger.name }
                            : { name: `Transaction ${index + 1}` });

                        return (
                          <View key={index} style={pdfStyles.tableRow}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? lightColor : '#FFFFFF',
                                width: '20%',
                              }}
                            >
                              {transaction.debit_ledger.name}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? lightColor : '#FFFFFF',
                                width: '50%',
                                textAlign: 'left',
                              }}
                            >
                              {transaction.narration}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? lightColor : '#FFFFFF',
                                width: '30%',
                                textAlign: 'right',
                              }}
                            >
                              {(transaction.amount || 0).toLocaleString(
                                'en-US',
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </Text>
                          </View>
                        );
                      })}

                      {/* Total */}
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '70%',
                            fontWeight: 'bold',
                          }}
                        >
                          Total Distributed
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            width: '30%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {(
                            cashierTotals.otherTransactionsTotal +
                            (cashier.main_ledger?.amount || 0)
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                      {/* cash collected */}
                      <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: lightColor,
                            color: 'black',
                            width: '70%',
                            fontWeight: 'bold',
                            fontSize: '.7rem',
                          }}
                        >
                          Cash Collected
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: lightColor,
                            width: '30%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '.7rem',
                          }}
                        >
                          {(cashier.collected_amount || 0).toLocaleString(
                            'en-US',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </Text>
                      </View>
                      <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: lightColor,
                            color: 'black',
                            width: '70%',
                            fontWeight: 'bold',
                            fontSize: '.7rem',
                          }}
                        >
                          Short/Over
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: lightColor,
                            color: shortOrOver > 0 ? '#4a990eff' : 'red',
                            width: '30%',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '.7rem',
                          }}
                        >
                          {shortOrOver > 0
                            ? `+${shortOrOver.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : `${shortOrOver.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cashier Adjustments */}
                {cashier.tank_adjustments?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: mainColor,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {cashier.name} - Tank Adjustments
                    </Text>
                    <View style={pdfStyles.table}>
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1.5,
                          }}
                        >
                          Product
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1.5,
                          }}
                        >
                          Tank
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 2,
                          }}
                        >
                          Description
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1,
                          }}
                        >
                          Operator
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1,
                          }}
                        >
                          Quantity
                        </Text>
                      </View>
                      {cashier.tank_adjustments.map((adj, index) => {
                        const product = productOptions?.find(
                          (p) => p.id === adj.product_id
                        );
                        const tank = tanks?.find((t) => t.id === adj.tank_id);

                        return (
                          <View key={index} style={pdfStyles.tableRow}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 1.5,
                              }}
                            >
                              {product?.name || `Product ${adj.product_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 1.5,
                              }}
                            >
                              {tank?.name || `Tank ${adj.tank_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 2,
                              }}
                            >
                              {adj.description || '-'}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 1,
                              }}
                            >
                              {adj.operator}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 1,
                                textAlign: 'right',
                              }}
                            >
                              {adj.quantity.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}

        {/* ================= CASHIERS SUMMARY LISTING ================= */}
        {!openDetails && (
          <CashierListSummaryPDF
            shiftData={shiftData}
            organization={organization}
            fuel_pumps={fuel_pumps}
            productOptions={productOptions}
            paymentReceived={paymentReceived}
          />
        )}

        {/* ================= PAYMENTS RECEIVED SECTION ================= */}
        {paymentReceived.length && openDetails && (
          <View
            wrap={false}
            style={{ marginTop: 20, pageBreakInside: 'avoid' }}
          >
            <View
              style={{
                marginBottom: 8,
                padding: 8,
                backgroundColor: mainColor,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: contrastText,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Payments Received
              </Text>
            </View>

            {/* Payments Received */}
            <View style={{ marginBottom: 12 }}>
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Pay From (Credit)
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Pay To (Debit)
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1.5,
                    }}
                  >
                    Narration
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Amount
                  </Text>
                </View>
                {paymentReceived.map((pr, index) => {
                  return (
                    <View key={index} style={pdfStyles.tableRow}>
                      {/* credit */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        {pr.creditLedger.name}
                      </Text>
                      {/* Debit */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        {pr.debitLedger.name}
                      </Text>
                      {/* Narration */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1.5,
                          textAlign: 'left',
                        }}
                      >
                        {pr.narration}
                      </Text>
                      {/* Amount */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(pr.amount || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ================= CASH COLLECTION SUMMARY============== */}
        {openDetails && shiftData.cashiers.length && (
          <View
            wrap={false}
            style={{ marginTop: 20, pageBreakInside: 'avoid' }}
          >
            <View
              style={{
                marginBottom: 8,
                padding: 8,
                backgroundColor: mainColor,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: contrastText,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Cash Collection Summary
              </Text>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: '#FFFFFF',
                      width: '70%',
                    }}
                  >
                    Total Expected
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: '#FFFFFF',
                      width: '30%',
                      textAlign: 'right',
                    }}
                  >
                    {totalExpectedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      width: '70%',
                    }}
                  >
                    Total Collected
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      width: '30%',
                      textAlign: 'right',
                    }}
                  >
                    {totalCollectedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: '#FFFFFF',
                      width: '70%',
                    }}
                  >
                    Short/Over
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: '#FFFFFF',
                      color: totalShortOrOver > 0 ? '#4a990eff' : 'red',
                      width: '30%',
                      textAlign: 'right',
                    }}
                  >
                    {totalShortOrOver > 0
                      ? `+${totalShortOrOver.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : `${totalShortOrOver.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Text>
                </View>

                {paymentReceived.length && (
                  <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: mainColor,
                        color: contrastText,
                        fontWeight: 'bold',
                        fontSize: 10,
                        width: '70%',
                      }}
                    >
                      Grand Total (Total Collected + Total Payments Received)
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: mainColor,
                        color: contrastText,
                        fontWeight: 'bold',
                        fontSize: 10,
                        width: '30%',
                        textAlign: 'right',
                      }}
                    >
                      {(
                        totalCollectedAmount + paymentsReceivedTotal
                      ).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ================= DIPPING SECTION ================= */}
        {!hideDippingTable && (
          <View
            wrap={false}
            style={{ marginTop: 20, pageBreakInside: 'avoid' }}
          >
            <View
              style={{
                marginBottom: 8,
                padding: 8,
                backgroundColor: mainColor,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: contrastText,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Dipping Records
              </Text>
            </View>

            {/* Dipping summary */}
            <View style={{ marginBottom: 12 }}>
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1.5,
                    }}
                  >
                    Tank
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Opening
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Purchase
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Total
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Closing
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Tank Difference
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Actual Sold
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 1,
                    }}
                  >
                    Pos/Neg
                  </Text>
                </View>
                {shiftData.shift_tanks.map((st, index) => {
                  return (
                    <View key={index} style={pdfStyles.tableRow}>
                      {/* Tank */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1.5,
                        }}
                      >
                        {st.name || `Tank ${st.id}`}
                      </Text>
                      {/* Opening */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.opening_reading || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Purchase */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.incoming || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Total */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(
                          (st.opening_reading || 0) + (st.incoming || 0)
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Closing */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.closing_reading || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Tank Difference */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.tank_difference || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Actual Sold */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.actual_sold || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      {/* Pos/Neg */}
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {(st.deviation || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        <PageFooter />
      </Page>
    </Document>
  );
}

export default SalesShiftPDF;
