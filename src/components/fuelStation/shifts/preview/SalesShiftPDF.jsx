import { Document, Page, Text, View } from '@react-pdf/renderer';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import PageFooter from '@/components/pdf/PageFooter';

function SalesShiftPDF({ includeFuelVouchers, shiftData, stationName, organization, shift_teams, fuel_pumps, tanks, productOptions }) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const cashAccounts = [...shiftData.other_ledgers, shiftData.main_ledger].filter(account => !!account);

  // Calculate the total amount of all fuel vouchers
  const totalFuelVouchersAmount = shiftData.fuel_vouchers.reduce((total, fuelVoucher) => {
    const productPrice = shiftData.fuel_prices.find(product => product.product_id === fuelVoucher.product_id)?.price || 0;
    return total + (fuelVoucher.quantity * productPrice);
  }, 0);

  //Merge Products
  const mergePumpReadings = (pumpReadings) => {
        const merged = pumpReadings.reduce((acc, pump) => {
            if (!acc[pump.product_id]) {
                acc[pump.product_id] = { ...pump, quantity: pump.closing - pump.opening };
            } else {
                acc[pump.product_id].quantity += pump.closing - pump.opening;
            }
            return acc;
        }, {});
        return Object.values(merged);
    };

    const mergedReadings = mergePumpReadings(shiftData.pump_readings);

  // Add the total fuel vouchers amount to the cashAccounts array
  totalFuelVouchersAmount > 0 && cashAccounts.push({
    name: 'Fuel Vouchers',
    amount: totalFuelVouchersAmount,
  });

  // Calculate the total amount of all cash accounts
  const totalCashAccountsAmount = cashAccounts.reduce((total, account) => total + account.amount, 0);

  return (
    <Document
      title={`${shiftData.shiftNo} | ${organization.name}`}
      author={shiftData.creator?.name}
      subject={'Fuel Sales Shift'}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size="A4" style={pdfStyles.page}>
        {/* ================= HEADER ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Fuel Sales Shift</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{shiftData.shiftNo}</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{stationName}</Text>
          </View>
        </View>

        {/* ================= SHIFT INFO ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 12 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Team</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{shift_teams?.find(team => team.id === shiftData.shift_team_id)?.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Shift Start</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{readableDate(shiftData.shift_start, true)}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Shift End</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{readableDate(shiftData.shift_end, true)}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Recorded By:</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{shiftData.creator?.name}</Text>
          </View>
        </View>

        {/* 1. PUMP READINGS */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
            Pump Readings
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Pump</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Product Name</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Closing</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Opening</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Difference</Text>
            </View>
            {shiftData.pump_readings.map((pump, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                  {fuel_pumps.find(p => p.id === pump.fuel_pump_id)?.name}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                    {productOptions?.find(p => p.id === pump.product_id)?.name}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                  {pump.closing.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                  {pump.opening.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                  {(pump.closing - pump.opening).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. PRODUCTS */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
            Products
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Product Name</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Quantity</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Price</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Amount</Text>
            </View>
            {mergedReadings.map((productSales, index) => {
              const price = shiftData.fuel_prices.find(p => p.product_id === productSales.product_id)?.price || 0;
              const adjustmentsQty = shiftData.adjustments
                .filter(adj => adj.product_id === productSales.product_id)
                .reduce((sum, adj) => adj.operator === '+' ? sum - adj.quantity : sum + adj.quantity, 0);

              const totalQty = productSales.quantity + adjustmentsQty;
              const totalAmount = totalQty * price;

              return (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                    {productOptions?.find(p => p.id === productSales.product_id)?.name}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {totalQty.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              );
            })}

            <View
              style={{
                ...pdfStyles.tableRow,
                backgroundColor: mainColor,
                color: contrastText,
                marginTop: 4,
                borderRadius: 2,
              }}
            >
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 3.71, textAlign: 'left', fontWeight: 'bold' }}>
                Total
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right', fontWeight: 'bold' }}>
                {mergedReadings.reduce((total, product) => {
                  const productPrice = shiftData.fuel_prices.find(price => price.product_id === product.product_id);
                  const price = !!productPrice?.price ? productPrice.price : 0;
                  const totalAdjustmentQuantity = shiftData.adjustments
                    .filter(adjustment => adjustment.product_id === product.product_id)
                    .reduce((totalAdjustment, adj) => adj.operator === '+' ? totalAdjustment - adj.quantity : totalAdjustment + adj.quantity, 0);
                  return total + (product.quantity + totalAdjustmentQuantity) * price;
                }, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. CASH DISTRIBUTION */}
        {cashAccounts.length > 0 &&
            <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
                Cash Distribution
            </Text>
            <View style={pdfStyles.table}>
                {/* Simple Headers: Name + Amount */}
                <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Name</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'right' }}>Amount</Text>
                </View>

                {cashAccounts.map((account, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 3 }}>
                    {account.name}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {account.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
                ))}

                {/* Original Colored Total */}
                <View style={{ ...pdfStyles.tableRow }}>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 3, textAlign: 'left', fontWeight: 'bold' }}>
                    Total
                </Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>
                    {totalCashAccountsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                </View>
            </View>
            </View>
        }

        {/* 4. Opening Dipping */}
        {shiftData?.opening_dipping?.readings.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
              Opening Dipping
            </Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Tank</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Product</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Reading</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Cumulative Deviation</Text>
              </View>
              {shiftData.opening_dipping.readings.map((od, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{od.tank.name}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                    {productOptions?.find(p => p.id === od.product_id)?.name}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {od.reading.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {od.deviation.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Closing Dipping */}
        {shiftData?.closing_dipping?.readings.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
              Closing Dipping
            </Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Tank</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Product</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Reading</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Cumulative Deviation</Text>
              </View>
              {shiftData.closing_dipping.readings.map((cd, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{cd.tank.name}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>
                    {productOptions?.find(p => p.id === cd.product_id)?.name}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {cd.reading.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                    {cd.deviation.toLocaleString('en-US', { minimumFractionDigits: 3 })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginTop: 5 }}>
            {shiftData?.adjustments?.length > 0 &&
                <View style={{ ...pdfStyles.table, padding: 3, flex: 1, marginTop: 5 }}>
                    <View style={{ ...pdfStyles.tableRow}}>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'center',...pdfStyles.midInfo, marginBottom: 1 }}>Tank Adjustments</Text>
                    </View>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Product</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1}}>Tank</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.3 }}>Description</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Quantity</Text>
                    </View>
                    {shiftData?.adjustments?.map((adjustment, index) => (
                        <View key={index} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1}}>{productOptions?.find(product => product.id === adjustment.product_id)?.name}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1 }}>{tanks?.find(tank => tank.id === adjustment.tank_id).name}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.3}}>{adjustment.description}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.7, textAlign: 'right' }}>
                                { `(${adjustment.operator})${adjustment.quantity.toLocaleString('en-US',{
                                    minimumFractionDigits: 3, maximumFractionDigits:3
                                })}`}
                            </Text>
                        </View>
                    ))}
                </View>
            }
        </View>

        {/* 6. FUEL VOUCHERS */}
        {!!includeFuelVouchers && shiftData.fuel_vouchers.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 12, color: mainColor, marginBottom: 4, textAlign: 'center' }}>
              Fuel Vouchers
            </Text>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Voucher No</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.5 }}>Client</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Reference</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Narration</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.5 }}>Product</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Quantity</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Price</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Amount</Text>
              </View>
              {shiftData.fuel_vouchers.map((fuelVoucher, index) => (
                <View key={index} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{fuelVoucher.voucherNo}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2.5 }}>{fuelVoucher.stakeholder.name}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{fuelVoucher.reference}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{fuelVoucher.narration}</Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2.5 }}>
                    {productOptions?.find(p => p.id === fuelVoucher.product_id)?.name}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {fuelVoucher.quantity.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {shiftData.fuel_prices.find(p => p.product_id === fuelVoucher.product_id)?.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                    {(fuelVoucher.quantity * (shiftData.fuel_prices.find(p => p.product_id === fuelVoucher.product_id)?.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              <View style={{ ...pdfStyles.tableRow }}>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 13.5, textAlign: 'left', fontWeight: 'bold' }}>
                  Total
                </Text>
                <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>
                  {totalFuelVouchersAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
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