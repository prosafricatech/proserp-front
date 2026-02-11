import { Document, Page, Text, View } from '@react-pdf/renderer';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

function DippingReportPDF({ reportData, organization, filters, activeStation }) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const allReadings = reportData.flatMap(data => data.readings); // Collect all readings in the same array

  // Step 1: Create a Map to aggregate tanks by product id
  const productMap = new Map();

  // Populate the Map with tanks grouped by checking product id
  allReadings.forEach(product => {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        id: product.id,
        name: product.name,
        tanks: new Map()
      });
    }
    const productData = productMap.get(product.id);

    // Aggregate tanks by their names
    product.tanks.forEach(tank => {
      if (!productData.tanks.has(tank.tank)) {
        productData.tanks.set(tank.tank, {
          tank: tank.tank,
          opening: tank.opening,
          stock_in: 0,
          stock_out: 0,
          reading: tank.reading,
          calculated_stock: tank.calculated_stock,
          deviation: 0,
          cummulative_deviation: tank.cummulative_deviation,
        });
      }
      const tankData = productData.tanks.get(tank.tank);
    
      // Only update opening if it hasn't been set before
      if (tankData.opening === undefined) {
        tankData.opening = tank?.opening || 0;
      }
    
      tankData.stock_in += tank.stock_in || 0;
      tankData.stock_out += tank.stock_out || 0;
      tankData.reading = tank.reading || 0;
      tankData.calculated_stock = tank.calculated_stock || 0;
      tankData.deviation += tank.deviation || 0;
      tankData.cummulative_deviation = tank.cummulative_deviation || 0;
    });    
  });

  const productArray = Array.from(productMap.values()).map(product => ({
    ...product,
    tanks: Array.from(product.tanks.values())
  }));

  return (
    <Document
      title={`Dipping Report | ${organization.name}`}
      author={reportData.creator?.name}
      subject="Dipping Report"
      creator="Powered By ProsERP"
      producer="ProsERP"
    >
      <Page size="A3" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right', marginBottom: 5 }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>{activeStation.name}</Text>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Dipping Report</Text>
            <Text style={{ ...pdfStyles.midInfo }}>
              {`${readableDate(filters.from,true)} - ${readableDate(filters.to,true)}`}
            </Text>
          </View>
        </View>

        {reportData.map((dipping, index) => (
          <View key={index} style={{ border: '0.5', marginTop: 20 }}>
            {/* Header Row */}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Period</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 3, textAlign: 'center' }}>Details</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Opening</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Stock In</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Stock Out</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Closing</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Tank Difference</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Calculated Stock</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Deviation</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2 }}>{'Cumulative \nDeviation'}</Text>
            </View>

            <View style={pdfStyles.tableRow}>
              <View style={{ ...pdfStyles.tableCell, flex: 2 }}>
                <Text style={{ textAlign: 'center' }}>
                  {`\n\n\n${readableDate(dipping.from, true)}\nTo\n${readableDate(dipping.to, true)}\n\n${dipping.dippingNo}`}
                </Text>
              </View>

              <View style={{ ...pdfStyles.tableCell, flex: 15, border: '0.3', padding: 0 }}>
                {dipping.readings.map((reading, readingIndex) => {
                  const tanks = reading.tanks;

                  // Calculate totals for the current reading
                  const readingTotals = tanks.reduce((acc, tank) => {
                    acc.opening += tank.opening || 0;
                    acc.stockIn += tank.stock_in || 0;
                    acc.stockOut += tank.stock_out || 0;
                    acc.reading += tank.reading || 0;
                    acc.tankDifference += tank.tank_difference || 0;
                    acc.deviation += tank.deviation || 0;
                    acc.calculatedStock += tank.calculated_stock || 0;
                    acc.cumulativeDeviation += tank.cummulative_deviation || 0;
                    return acc;
                  }, {
                    opening: 0,
                    stockIn: 0,
                    stockOut: 0,
                    reading: 0,
                    tankDifference: 0,
                    deviation: 0,
                    calculatedStock: 0,
                    cumulativeDeviation: 0
                  });

                  return (
                    <View key={readingIndex} style={{ border: '0.3' }}>
                      <View style={{...pdfStyles.tableRow, marginBottom: readingIndex !== dipping.readings.length - 1 ? 10 : 0 }}>
                        <View style={{ ...pdfStyles.tableCell, flex: 1.45, borderBottom: 0.3}}>
                          <Text>{reading.name}</Text>
                        </View>

                        <View style={{ ...pdfStyles.tableCell, flex: 13.5, padding: 0 }}>
                          {tanks.map((tank, tankIndex) => {
                            const tankDifference = (tank.opening + tank.stock_in - tank.reading) || 0; 
                            return (
                              <View key={tankIndex} style={{ ...pdfStyles.tableRow }}>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.5, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, borderLeft: 0.3  }}>{tank.tank}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.1 , backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.opening?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.stock_in?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.stock_out?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.reading?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 2.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tankDifference?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 2.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.calculated_stock?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 1.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.deviation?.toLocaleString() || 0}</Text>
                                <Text style={{ ...pdfStyles.tableCell, flex: 2.1, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, textAlign: 'right' }}>{tank.cummulative_deviation?.toLocaleString() || 0}</Text>
                              </View>
                            );
                          })}
                          {/* Total Row */}
                          <View style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.5 , fontWeight: 'bold' }}>TOTAL</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.opening?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.stockIn?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.stockOut?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.reading?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.tankDifference?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.calculatedStock?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.deviation?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2.1 , textAlign: 'right', fontWeight: 'bold' }}>{readingTotals.cumulativeDeviation?.toLocaleString() || 0}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ))}

        {/* Summary */}
        <View style={{ border: '0.4', paddingTop: 20 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1, textAlign: 'center' }}>Summary</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.35 }}>Period</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 2.15 }}>Details</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Opening</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Stock In</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Stock Out</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Closing</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Calculated Stock</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 0.9}}>Deviation</Text>
            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>{'Cumulative \nDeviation'}</Text>
          </View>

          <View style={pdfStyles.tableRow}>
              <View style={{ ...pdfStyles.tableCell, flex: 2}}>
                <Text style={{ textAlign: 'center' }}>
                  {`\n${readableDate(filters.from, true)}\nTo\n${readableDate(filters.to, true)}\n\nSUMMARY`}
                </Text>
              </View>

              <View style={{ ...pdfStyles.tableCell, flex: 15, border: '0.3', padding: 0 }}>
                {productArray.map((product, index) => {
                  // Calculate totals for the current product
                  const productTotals = product.tanks.reduce((acc, tank) => {
                    acc.opening += tank.opening || 0;
                    acc.stockIn += tank.stock_in || 0;
                    acc.stockOut += tank.stock_out || 0;
                    acc.reading += tank.reading || 0;
                    acc.deviation += tank.deviation || 0;
                    acc.calculatedStock += tank.calculated_stock || 0;
                    acc.cumulativeDeviation += tank.cummulative_deviation || 0;
                    return acc;
                  }, {
                    opening: 0,
                    stockIn: 0,
                    stockOut: 0,
                    reading: 0,
                    deviation: 0,
                    calculatedStock: 0,
                    cumulativeDeviation: 0
                  });

                  return (
                    <View key={product.id} style={{ ...pdfStyles.tableRow, border: '0.3', marginBottom: index !== productArray.length - 1 ? 10 : 0 }}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 2 }}>{product.name}</Text>
                      <View style={{ ...pdfStyles.tableCell, border: '0.3', flex: 15, padding: 0 }}>
                        {product.tanks.map((tank, tankIndex) => (
                          <View key={tankIndex} style={{ ...pdfStyles.tableRow, border: '0.3' }}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.05}}>{tank.tank}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.1, textAlign: 'right' }}>{tank.opening?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.1, textAlign: 'right' }}>{tank.stock_in?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.1, textAlign: 'right' }}>{tank.stock_out?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.1, textAlign: 'right' }}>{tank.reading?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.1, textAlign: 'right' }}>{tank.calculated_stock?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.05, textAlign: 'right' }}>{tank.deviation?.toLocaleString() || 0}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: tankIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1,  textAlign: 'right' }}>{tank.cummulative_deviation?.toLocaleString() || 0}</Text>
                          </View>
                        ))}
                        {/* Total Row */}
                        <View style={pdfStyles.tableRow}>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.05}}>TOTAL</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1, textAlign: 'right' }}>{productTotals.opening?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1, textAlign: 'right' }}>{productTotals.stockIn?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1, textAlign: 'right' }}>{productTotals.stockOut?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1, textAlign: 'right' }}>{productTotals.reading?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.1, textAlign: 'right' }}>{productTotals.calculatedStock?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.05, textAlign: 'right' }}>{productTotals.deviation?.toLocaleString() || 0}</Text>
                          <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>{productTotals.cumulativeDeviation?.toLocaleString() || 0}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
        </View>
      </Page>
    </Document>
  );
}

export default DippingReportPDF;
