import pdfStyles from '@/components/pdf/pdf-styles';
import { Text, View } from '@react-pdf/renderer';

export default function CashierListSummaryPDF({
  includeFuelVouchers,
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

  // total expected
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
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.5,
              }}
            >
              Name
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.8,
              }}
            >
              Pump Details
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              Cash Distributions
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Cash Collected
            </Text>
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
                key={index}
                style={{
                  ...pdfStyles.tableRow,
                  borderTopWidth: 0,
                  borderBottomWidth: 1,
                  borderLeftWidth: 0,
                  borderRightWidth: 0,
                  borderColor: 'black',
                }}
              >
                {/* ===== cashier's name ===== */}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    // backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.5,
                  }}
                >
                  {cashier.name}
                </Text>

                {/* ===== pump details ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    // backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.8,
                  }}
                >
                  <View style={pdfStyles.table}>
                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.5,
                        }}
                      >
                        Name
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.5,
                        }}
                      >
                        Fuel
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.5,
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
                        <View
                          key={index}
                          style={{
                            ...pdfStyles.tableRow,
                            // backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                          }}
                        >
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              flex: 0.5,
                            }}
                          >
                            {pumpInfo?.name || `Pump ${pump.fuel_pump_id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              flex: 0.5,
                            }}
                          >
                            {product?.name || `Product ${pump.product_id}`}
                          </Text>
                          <Text
                            style={{
                              ...pdfStyles.tableCell,
                              flex: 0.5,
                            }}
                          >
                            {difference.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* ===== Cash Distributions ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    // backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                  }}
                >
                  <View style={pdfStyles.table}>
                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 1,
                        }}
                      >
                        Main Ledger
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 1,
                        }}
                      >
                        Other Transactions
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 1,
                        }}
                      >
                        Fuel Vouchers
                      </Text>
                    </View>

                    <View
                      style={{
                        ...pdfStyles.tableRow,
                      }}
                    >
                      <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                        <View style={pdfStyles.table}>
                          <View style={{ ...pdfStyles.tableRow }}>
                            <Text style={{ ...pdfStyles.tableCell }}>
                              {cashier.main_ledger?.name}
                            </Text>
                          </View>
                          <View style={{ ...pdfStyles.tableRow }}>
                            <Text style={{ ...pdfStyles.tableCell }}>
                              {cashier.main_ledger?.amount.toLocaleString(
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
                      <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                        <View style={pdfStyles.table}>
                          <View style={{ ...pdfStyles.tableRow }}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor: lightColor,
                                flex: 1,
                              }}
                            >
                              Name
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                backgroundColor: lightColor,
                                flex: 1,
                              }}
                            >
                              Amount
                            </Text>
                          </View>
                          {cashier.other_transactions?.map((t, index) => (
                            <View key={index} style={{ ...pdfStyles.tableRow }}>
                              <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>
                                {t.debit_ledger.name}
                              </Text>
                              <Text style={{ ...pdfStyles.tableCell }}>
                                {t.amount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                        <View style={pdfStyles.table}>
                          <View style={{ ...pdfStyles.tableRow }}>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                flex: 1,
                                backgroundColor: lightColor,
                              }}
                            >
                              Count
                            </Text>
                            <Text
                              style={{
                                ...pdfStyles.tableCell,
                                flex: 1,
                                backgroundColor: lightColor,
                              }}
                            >
                              Amount
                            </Text>
                          </View>
                          <View style={{ ...pdfStyles.tableRow }}>
                            <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>
                              {cashier.fuel_vouchers?.length}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, flex: 1 }}>
                              {cashier.fuel_vouchers
                                ?.reduce((total, fv) => {
                                  const productPrice =
                                    shiftData.fuel_prices.find(
                                      (fp) => fp.product_id === fv.product_id
                                    )?.price || 0;
                                  return total + fv.quantity * productPrice;
                                }, 0)
                                .toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ===== Cash Collected ===== */}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    // backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                  }}
                >
                  <View style={pdfStyles.table}>
                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.8,
                        }}
                      >
                        Expected
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.8,
                        }}
                      >
                        Collected
                      </Text>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor: lightColor,
                          flex: 0.8,
                        }}
                      >
                        Over/Short
                      </Text>
                    </View>

                    <View style={pdfStyles.tableRow}>
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          flex: 0.8,
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
                          flex: 0.8,
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
                          flex: 0.8,
                        }}
                      >
                        {shortOrOver > 0
                          ? `+${shortOrOver.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : `-${shortOrOver.toLocaleString('en-US', {
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
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableCell, flex: 1.3 }}>
              <Text style={{ ...pdfStyles.tableCell }}>TOTALS</Text>
            </View>

            {/* === cash distribution totals */}
            <View
              style={{
                ...pdfStyles.tableCell,
                flex: 1.5,
              }}
            >
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 1,
                    }}
                  >
                    Main Ledger Totals
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 1,
                    }}
                  >
                    Other Transactions Totals
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 1,
                    }}
                  >
                    Total Vouchers for All Cashiers
                  </Text>
                </View>

                <View
                  style={{
                    ...pdfStyles.tableRow,
                  }}
                >
                  <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                    <View style={pdfStyles.table}>
                      <View style={{ ...pdfStyles.tableRow }}>
                        <Text style={{ ...pdfStyles.tableCell }}>
                          {shiftData.cashiers
                            ?.reduce((sum, c) => sum + c.main_ledger?.amount, 0)
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || 0.0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                    <View style={pdfStyles.table}>
                      <View style={{ ...pdfStyles.tableRow }}>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            flex: 1,
                          }}
                        >
                          {shiftData.cashiers
                            ?.reduce(
                              (sum, c) =>
                                sum +
                                (c.other_transactions?.reduce(
                                  (t, ot) => t + (ot.amount || 0),
                                  0
                                ) || 0),
                              0
                            )
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || 0.0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                    <View style={pdfStyles.table}>
                      <View style={{ ...pdfStyles.tableRow }}>
                        <Text
                          style={{
                            ...pdfStyles.tableCell,
                            flex: 1,
                          }}
                        >
                          {shiftData.cashiers
                            ?.reduce((sum, c) => {
                              const vouchersTotal =
                                c.fuel_vouchers?.reduce((total, fv) => {
                                  const productPrice =
                                    shiftData.fuel_prices?.find(
                                      (fp) => fp.product_id === fv.product_id
                                    )?.price || 0;

                                  return total + fv.quantity * productPrice;
                                }, 0) || 0;

                              return sum + vouchersTotal;
                            }, 0)
                            .toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* === Cash collected totals === */}
            <View
              style={{
                ...pdfStyles.tableCell,
                flex: 1,
              }}
            >
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 0.8,
                    }}
                  >
                    Total Expected
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 0.8,
                    }}
                  >
                    Total Collected
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: lightColor,
                      flex: 0.8,
                    }}
                  >
                    Total Over/Short
                  </Text>
                </View>

                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      flex: 0.8,
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
                      flex: 0.8,
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
                      flex: 0.8,
                    }}
                  >
                    {totalShortOrOver > 0
                      ? `+${totalShortOrOver.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : `-${totalShortOrOver.toLocaleString('en-US', {
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
