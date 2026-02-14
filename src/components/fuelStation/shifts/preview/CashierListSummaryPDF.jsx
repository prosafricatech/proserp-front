import pdfStyles from '@/components/pdf/pdf-styles';
import { Text, View } from '@react-pdf/renderer';

export default function CashierListSummaryPDF({
  shiftData,
  organization,
  fuel_pumps,
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

  // transactions summary
  const totalTransactionsSummary = Object.values(
    shiftData.cashiers
      ?.flatMap((c) => c.other_transactions)
      .reduce((acc, tx) => {
        const type = tx.debit_ledger.name;

        if (!acc[type]) {
          acc[type] = { type, count: 0, totalAmount: 0 };
        }

        acc[type].count++;
        acc[type].totalAmount += tx.amount;

        return acc;
      }, {})
  );

  // pump summary
  const pumpSummary = Object.values(
    shiftData.cashiers
      ?.flatMap((c) => c.pump_readings)
      .reduce((acc, pump) => {
        const product = productOptions?.find((p) => p.id === pump.product_id);
        const type = product?.name || `Product ${pump.product_id}`;
        const difference = (pump.closing || 0) - (pump.opening || 0);
        const fuelPrice = shiftData.fuel_prices.find(
          (fp) => fp.product_id === pump.product_id
        );

        const amount = difference * fuelPrice.price;

        if (!acc[type]) {
          acc[type] = { type, count: 0, totalDifference: 0 };
        }

        acc[type].count++;
        acc[type].totalDifference += amount;

        return acc;
      }, {})
  );

  // calculate grand total
  const totalFvAmount = shiftData.cashiers?.reduce((sum, c) => {
    const vouchersTotal =
      c.fuel_vouchers?.reduce((total, fv) => {
        const productPrice =
          shiftData.fuel_prices?.find((fp) => fp.product_id === fv.product_id)
            ?.price || 0;

        return total + fv.quantity * productPrice;
      }, 0) || 0;

    return sum + vouchersTotal;
  }, 0);

  const totalOtherTransactions = totalTransactionsSummary.reduce(
    (sum, tx) => sum + tx.totalAmount,
    0
  );

  const totalMainLedger = shiftData.cashiers?.reduce(
    (sum, c) => sum + c.main_ledger?.amount,
    0
  );

  const grandTotal = totalFvAmount + totalOtherTransactions + totalMainLedger;

  // cash distribution summary
  const mainLedgerTotalsObject = {
    type: 'Main Ledger',
    count: shiftData.cashiers?.length ?? 0,
    totalAmount: totalMainLedger,
  };

  // fuel voucher totals object
  const fuelVoucherTotalsObject = {
    type: 'Fuel Vouchers',
    count:
      shiftData.cashiers?.reduce(
        (sum, c) => sum + c.fuel_vouchers?.length,
        0
      ) ?? 0,
    totalAmount: totalFvAmount,
  };

  totalTransactionsSummary.unshift(mainLedgerTotalsObject);
  totalTransactionsSummary.push(fuelVoucherTotalsObject);

  return (
    <View style={{ marginBottom: 20, marginTop: 8, pageBreakInside: 'avoid' }}>
      {/* section header */}
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
          Cashiers Summary
        </Text>
      </View>

      {/* cashiers list */}
      <View style={{ marginBottom: 12 }}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, gap: 2 }}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 0.3,
                width: '10%',
              }}
            >
              Name
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '30%',
              }}
            >
              Pump Details
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1.3,
                width: '30%',
              }}
            >
              Cash Distributions
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                // flex: 1,
                width: '30%',
              }}
            >
              Cash Collection
            </Text>
          </View>

          {/* ===== sub-titles row ===== */}
          <View
            style={{
              ...pdfStyles.tableRow,
              gap: 2,
            }}
          >
            <View
              style={{
                ...pdfStyles.tableCell,
                // flex: 0.3,
                padding: 0,
                width: '10%',
                padding: '0px',
              }}
            ></View>
            <View
              style={{
                ...pdfStyles.tableCell,
                // flex: 1.02,
                width: '30%',
                padding: '0px',
              }}
            >
              <View style={pdfStyles.table}>
                <View style={{ ...pdfStyles.tableRow, marginTop: 2, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.5,
                      width: '30%',
                    }}
                  >
                    Name
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.5,
                      width: '35%',
                    }}
                  >
                    Fuel
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.5,
                      width: '35%',
                    }}
                  >
                    Amount
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                ...pdfStyles.tableCell,
                // flex: 1.31,
                width: '30%',
                padding: '0px',
              }}
            >
              <View style={pdfStyles.table}>
                <View style={{ ...pdfStyles.tableRow, marginTop: 2, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 1,
                      width: '40%',
                    }}
                  >
                    Description
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 1,
                      width: '20%',
                    }}
                  >
                    Count
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 1,
                      width: '40%',
                    }}
                  >
                    Amount
                  </Text>
                </View>
              </View>
            </View>
            <View
              style={{
                ...pdfStyles.tableCell,
                // flex: 1.01,
                width: '30%',
                padding: '0px',
              }}
            >
              <View style={pdfStyles.table}>
                <View style={{ ...pdfStyles.tableRow, marginTop: 2, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.8,
                      width: '35%',
                    }}
                  >
                    Expected
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.8,
                      width: '35%',
                    }}
                  >
                    Collected
                  </Text>
                  <Text
                    style={{
                      fontSize: '10px',
                      padding: 2,
                      backgroundColor: mainColor,
                      color: contrastText,
                      // flex: 0.8,
                      width: '30%',
                    }}
                  >
                    Over/Short
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {shiftData.cashiers?.map((cashier, index) => {
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

            // transactions summary
            const cashDistributionSummary = Object.values(
              cashier.other_transactions?.reduce((acc, tx) => {
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
              type: cashier.main_ledger?.name,
              count: 1,
              totalAmount: cashier.main_ledger?.amount,
            };

            // fuel vouchers object
            const voucherObj = {
              type: 'Fuel Vouchers',
              count: cashier.fuel_vouchers?.length,
              totalAmount:
                calculateCashierTotals(cashier).totalFuelVouchersAmount,
            };

            cashDistributionSummary.unshift(mainLedgerObj);
            cashDistributionSummary.push(voucherObj);

            const cashDistributionsTotalSummary =
              cashDistributionSummary.reduce(
                (acc, cd) => acc + cd.totalAmount,
                0
              );

            // total fuel vouchers for cashier
            const totalFuelVoucherAmount = cashier.fuel_vouchers?.reduce(
              (total, fv) => {
                const productPrice =
                  shiftData.fuel_prices.find(
                    (fp) => fp.product_id === fv.product_id
                  )?.price || 0;
                return total + fv.quantity * productPrice;
              },
              0
            );

            return (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableRow,
                  borderTopWidth: 0,
                  borderBottomWidth: 1,
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  borderColor: lightColor,
                }}
              >
                {/* ===== cashier's name ===== */}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    // flex: 0.3,
                    width: '10%',
                  }}
                >
                  {cashier.name}
                </Text>

                {/* ===== pump details ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    // flex: 1,
                    width: '30%',
                    padding: '0px',
                  }}
                >
                  <View style={pdfStyles.table}>
                    {cashier.pump_readings.map((pump, index) => {
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

                      return (
                        <View
                          key={index}
                          style={{ ...pdfStyles.tableRow, gap: 2 }}
                        >
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              // flex: 0.5,
                              width: '30%',
                            }}
                          >
                            {pumpInfo?.name || `Pump ${pump.fuel_pump_id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              // flex: 0.5,
                              width: '35%',
                            }}
                          >
                            {product?.name || `Product ${pump.product_id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              backgroundColor:
                                index % 2 === 0 ? '#FFFFFF' : lightColor,
                              textAlign: 'right',
                              // flex: 0.5,
                              width: '35%',
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
                    {/* === Total amount for pump details === */}
                    <View style={{ ...pdfStyles.tableRow, gap: 2 }}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: mainColor,
                          color: contrastText,
                          // flex: 1,
                          width: '65%',
                        }}
                      >
                        TOTAL
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: mainColor,
                          color: contrastText,
                          textAlign: 'right',
                          // flex: 0.5,
                          width: '35%',
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

                {/* ===== Cash Distributions ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    // flex: 1.3,
                    width: '30%',
                    padding: '0px',
                  }}
                >
                  <View style={pdfStyles.table}>
                    {/* === Cash Distribution Summary === */}
                    {cashDistributionSummary.map((t, index) => (
                      <View
                        key={index}
                        style={{ ...pdfStyles.tableRow, gap: 2 }}
                      >
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            // flex: 0.5,
                            width: '40%',
                          }}
                        >
                          {t.type}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            // flex: 0.5,
                            width: '20%',
                          }}
                        >
                          {t.count}
                        </Text>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            backgroundColor:
                              index % 2 === 0 ? '#FFFFFF' : lightColor,
                            // flex: 0.5,
                            width: '40%',
                          }}
                        >
                          {t.totalAmount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={{
                        ...pdfStyles.tableRow,
                        gap: 2,
                      }}
                    >
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: mainColor,
                          color: contrastText,
                          // flex: 0.5,
                          width: '60%',
                        }}
                      >
                        Total
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: mainColor,
                          color: contrastText,
                          // flex: 0.5,
                          width: '40%',
                        }}
                      >
                        {cashDistributionsTotalSummary.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ===== Cash Collections ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    width: '30%',
                    padding: '0px',
                  }}
                >
                  <View style={pdfStyles.table}>
                    <View style={{ ...pdfStyles.tableRow, gap: 2 }}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: '#FFFFFF',
                          textAlign: 'right',
                          width: '35%',
                        }}
                      >
                        {(
                          totalProductsAmount +
                          adjustmentsAmount -
                          totalFuelVouchersAmount -
                          otherTransactionsTotal
                        ).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: '#FFFFFF',
                          textAlign: 'right',
                          width: '35%',
                        }}
                      >
                        {cashier.collected_amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: '#FFFFFF',
                          textAlign: 'right',
                          width: '30%',
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
              </View>
            );
          })}

          {/* ===== TOTALS ===== */}
          <View
            style={{
              ...pdfStyles.tableRow,
            }}
          >
            <Text style={{ ...pdfStyles.tableCell, width: '10%' }}>TOTALS</Text>

            {/* pump details totals */}
            <View
              style={{ ...pdfStyles.tableCell, width: '30%', padding: '0px' }}
            >
              <View style={pdfStyles.table}>
                {pumpSummary.map((pump, index) => (
                  <View key={index} style={{ ...pdfStyles.tableRow, gap: 2 }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '30%',
                      }}
                    ></Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '35%',
                      }}
                    >
                      {pump.type}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        textAlign: 'right',
                        width: '35%',
                      }}
                    >
                      {pump.totalDifference.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                ))}
                <View
                  style={{
                    ...pdfStyles.tableRow,
                    gap: 2,
                  }}
                >
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      width: '65%',
                    }}
                  >
                    TOTAL
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      textAlign: 'right',
                      width: '35%',
                    }}
                  >
                    {pumpSummary
                      .reduce((acc, pump) => acc + pump.totalDifference, 0)
                      .toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </Text>
                </View>
              </View>
            </View>

            {/* === cash distribution totals */}
            <View
              style={{
                ...pdfStyles.tableCell,
                width: '30%',
                padding: '0px',
              }}
            >
              <View style={pdfStyles.table}>
                {totalTransactionsSummary?.map((t, index) => (
                  <View key={index} style={{ ...pdfStyles.tableRow, gap: 2 }}>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        width: '40%',
                      }}
                    >
                      {t.type}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        textAlign: 'right',
                        width: '20%',
                      }}
                    >
                      {t.count}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        textAlign: 'right',
                        width: '40%',
                      }}
                    >
                      {t.totalAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || 0.0}
                    </Text>
                  </View>
                ))}

                {/* Grand Total */}
                <View style={{ ...pdfStyles.tableRow, marginTop: 2, gap: 2 }}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '10px',
                      width: '60%',
                    }}
                  >
                    Grand Total
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontSize: '10px',
                      textAlign: 'right',
                      width: '40%',
                    }}
                  >
                    {grandTotal.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* === Cash collected totals === */}
            <View
              style={{
                ...pdfStyles.tableCell,
                width: '30%',
                padding: '0px',
              }}
            >
              <View style={pdfStyles.table}>
                <View style={{ ...pdfStyles.tableRow, gap: 2 }}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      textAlign: 'right',
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: 2,
                      width: '35%',
                    }}
                  >
                    {totalExpectedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      textAlign: 'right',
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: 2,
                      width: '35%',
                    }}
                  >
                    {totalCollectedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      textAlign: 'right',
                      backgroundColor: mainColor,
                      color: contrastText,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: 2,
                      width: '30%',
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
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
