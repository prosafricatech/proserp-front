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
  cashiers,
  fuel_pumps,
  tanks,
  productOptions,
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

    // Calculate cash transactions total for this cashier
    const cashTransactionsTotal =
      cashier.cash_transactions?.reduce(
        (total, ct) => total + (ct.amount || 0),
        0
      ) || 0;

    // Calculate cash remaining for this cashier
    const cashRemaining =
      totalProductsAmount + adjustmentsAmount - totalFuelVouchersAmount;

    return {
      totalProductsAmount,
      adjustmentsAmount,
      totalFuelVouchersAmount,
      cashTransactionsTotal,
      cashRemaining,
      netSales: totalProductsAmount + adjustmentsAmount,
    };
  };

  // Calculate overall totals
  const overallTotals = shiftData.cashiers?.reduce(
    (acc, cashier) => {
      const cashierTotals = calculateCashierTotals(cashier);
      return {
        totalProductsAmount:
          acc.totalProductsAmount + cashierTotals.totalProductsAmount,
        adjustmentsAmount:
          acc.adjustmentsAmount + cashierTotals.adjustmentsAmount,
        totalFuelVouchersAmount:
          acc.totalFuelVouchersAmount + cashierTotals.totalFuelVouchersAmount,
        cashTransactionsTotal:
          acc.cashTransactionsTotal + cashierTotals.cashTransactionsTotal,
        cashRemaining: acc.cashRemaining + cashierTotals.cashRemaining,
        netSales: acc.netSales + cashierTotals.netSales,
      };
    },
    {
      totalProductsAmount: 0,
      adjustmentsAmount: 0,
      totalFuelVouchersAmount: 0,
      cashTransactionsTotal: 0,
      cashRemaining: 0,
      netSales: 0,
    }
  );

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

  return (
    <Document
      title={`${shiftData.shiftNo} | ${organization.name}`}
      author={shiftData.creator?.name}
      subject={'Fuel Sales Shift'}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
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

            return (
              <View
                key={cashier.id}
                style={{ marginBottom: 20, pageBreakInside: 'avoid' }}
              >
                {/* Cashier Header */}
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
                    {cashier.name} - Summary
                  </Text>
                </View>

                {/* Cashier Summary */}
                <View style={{ marginBottom: 12 }}>
                  <View style={pdfStyles.table}>
                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableHeader,
                          backgroundColor: lightColor,
                          color: mainColor,
                          flex: 2,
                        }}
                      >
                        Item
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableHeader,
                          backgroundColor: lightColor,
                          color: mainColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        Amount
                      </Text>
                    </View>
                    <View style={pdfStyles.tableRow}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
                        Total Sales Amount
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {cashierTotals.netSales.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                    <View style={pdfStyles.tableRow}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>
                        Fuel Vouchers Total
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {cashierTotals.totalFuelVouchersAmount.toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </Text>
                    </View>
                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          flex: 2,
                          fontWeight: 'bold',
                        }}
                      >
                        Cash Remaining
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          flex: 1,
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color:
                            cashierTotals.cashRemaining < 0
                              ? '#FF0000'
                              : '#000000',
                        }}
                      >
                        {cashierTotals.cashRemaining.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Cashier Pump Readings */}
                {cashier.pump_readings?.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: mainColor,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {cashier.name} - Pump Readings
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
                          Pump
                        </Text>
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
                          Difference
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
                              {pumpInfo?.name || `Pump ${pump.fuel_pump_id}`}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 1.5,
                              }}
                            >
                              {product?.name || `Product ${pump.product_id}`}
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
                              {(pump.opening || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
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
                              {(pump.closing || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
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
                              {difference.toLocaleString('en-US', {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Cashier Products Summary */}
                {mergedReadings.length > 0 && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: mainColor,
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                    >
                      {cashier.name} - Products Summary
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
                            flex: 1,
                          }}
                        >
                          Quantity
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1,
                          }}
                        >
                          Price
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
                      {mergedReadings.map((productSales, index) => {
                        const product = productOptions?.find(
                          (p) => p.id === productSales.product_id
                        );
                        const price =
                          shiftData.fuel_prices.find(
                            (p) => p.product_id === productSales.product_id
                          )?.price || 0;

                        // Adjustments for this product and cashier
                        const adjustmentsQty = (cashier.tank_adjustments || [])
                          .filter(
                            (adj) => adj.product_id === productSales.product_id
                          )
                          .reduce((sum, adj) => {
                            if (adj.operator === '+') {
                              return sum - adj.quantity;
                            } else if (adj.operator === '-') {
                              return sum + adj.quantity;
                            }
                            return sum;
                          }, 0);

                        const totalQty = productSales.quantity + adjustmentsQty;
                        const totalAmount = totalQty * price;

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
                              {product?.name ||
                                `Product ${productSales.product_id}`}
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
                              {totalQty.toLocaleString('en-US', {
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
                              })}
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
                                flex: 1,
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
                      <View style={pdfStyles.tableRow}>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 3.5,
                            fontWeight: 'bold',
                          }}
                        >
                          Cashier Total
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            ...pdfStyles.tableCell,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1,
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {cashierTotals.netSales.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cashier Cash Distribution */}
                {(cashier.main_ledger ||
                  cashier.cash_transactions?.length > 0) && (
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
                            flex: 3,
                          }}
                        >
                          Account
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableHeader,
                            backgroundColor: mainColor,
                            color: contrastText,
                            flex: 1.5,
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
                              flex: 3,
                            }}
                          >
                            {cashier.main_ledger.name ||
                              `Ledger ${cashier.main_ledger.id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor: '#FFFFFF',
                              flex: 1.5,
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

                      {/* Cash Transactions */}
                      {cashier.cash_transactions?.map((transaction, index) => {
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
                                flex: 3,
                              }}
                            >
                              {ledger.name}
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor:
                                  index % 2 === 0 ? lightColor : '#FFFFFF',
                                flex: 1.5,
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
                            flex: 3,
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
                            flex: 1.5,
                            textAlign: 'right',
                            fontWeight: 'bold',
                          }}
                        >
                          {(
                            cashierTotals.cashTransactionsTotal +
                            (cashier.main_ledger?.amount || 0)
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Cashier Fuel Vouchers */}
                {/* {openDetails && cashier.fuel_vouchers?.length > 0 && ( */}
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
                          flex: 1.5,
                        }}
                      >
                        Voucher No
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableHeader,
                          backgroundColor: mainColor,
                          color: contrastText,
                          flex: 2,
                        }}
                      >
                        Client
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
                          flex: 1,
                        }}
                      >
                        Quantity
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
                              flex: 1.5,
                            }}
                          >
                            {fv.voucherNo || `FV-${index + 1}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              flex: 2,
                            }}
                          >
                            {fv.stakeholder?.name || 'Internal Expense'}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              flex: 1.5,
                            }}
                          >
                            {fv.narration || '-'}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              flex: 1.5,
                            }}
                          >
                            {product?.name || `Product ${fv.product_id}`}
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
                            {fv.quantity.toLocaleString('en-US', {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })}
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
                          flex: 7,
                          fontWeight: 'bold',
                        }}
                      >
                        Cashier Total Fuel Vouchers
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableHeader,
                          ...pdfStyles.tableCell,
                          backgroundColor: mainColor,
                          color: contrastText,
                          flex: 1,
                          textAlign: 'right',
                          fontWeight: 'bold',
                        }}
                      >
                        {cashierTotals.totalFuelVouchersAmount.toLocaleString(
                          'en-US',
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
                {/* )} */}

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
                                minimumFractionDigits: 3,
                                maximumFractionDigits: 3,
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
          />
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
                  {/* <Text
                      style={{
                        ...pdfStyles.tableHeader,
                        backgroundColor: mainColor,
                        color: contrastText,
                        flex: 1.5,
                      }}
                    >
                      Product
                    </Text> */}
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
