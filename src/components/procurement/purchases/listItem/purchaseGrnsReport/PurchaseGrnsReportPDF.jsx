import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function PurchaseGrnsReportPDF({organization,purchaseGrnsReport}) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF"

    const groupedGrnsItems = purchaseGrnsReport.purchase_order_items.reduce((acc, item) => {
        item.received_items.forEach((receivedItems) => {
          const key = receivedItems.grnNo;
          if (!acc[key]) {
            acc[key] = {
              grnNo: key,
              date_received: receivedItems.date_received,
              products: [],
            };
          }
          acc[key].products.push({
            ...receivedItems,
            productId: item.id,
            measurement_unit: item.measurement_unit,
          });
        });
        return acc;
    }, {});
    
    const receivedItems = Object.values(groupedGrnsItems);

  return (
    <Document 
      title={`${purchaseGrnsReport.orderNo}`}
      author={`${purchaseGrnsReport.creator?.name}`}
      subject='PURCHASE ORDER GRNS REPORT'
      creator='ProsERP'
      producer='ProsERP'
      keywords={purchaseGrnsReport.stakeholder?.name}
    >
        <Page size={receivedItems.length > 8 ? "A3" : "A4"} orientation={receivedItems.length > 3 ? 'landscape' : null} style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 30}}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization} />
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={{...pdfStyles.majorInfo, color: mainColor }}>PURCHASE ORDER GRNS REPORT</Text>
                    <Text style={{ ...pdfStyles.midInfo }}>{purchaseGrnsReport.orderNo}</Text>
                    <Text style={{ ...pdfStyles.minInfo }}>{`As at: ${readableDate(undefined,true)}`}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.table, minHeight: 230 }}>
                <View style={pdfStyles.tableRow}>
                    <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>
                        <Text style={{ ...pdfStyles.tableCell}}>S/N</Text>
                    </View>
                    <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4 }}>
                        <Text style={{ ...pdfStyles.tableCell}}>Products</Text>
                    </View>
                    <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.6 }}>
                        <Text style={{ ...pdfStyles.tableCell}}>Unit</Text>
                    </View>
                    <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                        <Text style={{ ...pdfStyles.tableCell}}>Ordered</Text>
                        <Text style={{ ...pdfStyles.tableCell}}>{readableDate(purchaseGrnsReport.order_date)}</Text>
                    </View>

                    {/* Dynamic headers based on grnNo */}
                    {receivedItems.map(item => (
                        <View key={item.grnNo} style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                            <Text style={{ ...pdfStyles.tableCell}}>{item.grnNo}</Text>
                            <Text style={{ ...pdfStyles.tableCell}}>{readableDate(item.date_received)}</Text>
                        </View>
                    ))}
    
                    <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                        <Text style={{ ...pdfStyles.tableCell}}>Pending</Text>
                        <Text style={{ ...pdfStyles.tableCell}}>{readableDate()}</Text>
                    </View>
                </View>
                
                {/* Render table rows */}
                {purchaseGrnsReport.purchase_order_items.map((item, index) => {
                    // Calculate total dispatched quantity for this product
                    const totalReceivedQuantity = receivedItems.reduce((total, receivedItems) => {
                        const product = receivedItems.products.find(p => p.productId === item.id);
                        return total + (product ? product.quantity : 0);
                    }, 0);

                    // Calculate undispatched quantity
                    const unReceivedQuantity = item.quantity - totalReceivedQuantity;

                    return (
                        <View key={item.id} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5 }}>{index + 1}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 4 }}>{item.product.name}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.6 }}>{item.measurement_unit.symbol}</Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>{item.quantity.toLocaleString('en-US',{maximumFractionDigits:3,minimumFractionDigits:3})}</Text>

                            {/* Render dispatched quantities for each delivery */}
                            {receivedItems.map((receivedItems) => {
                                const product = receivedItems.products.find(p => p.productId === item.id);
                                return (
                                    <Text key={receivedItems.grnNo} style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                                        {product ? product.quantity.toLocaleString('en-US',{maximumFractionDigits:3,minimumFractionDigits:3}) : 0}
                                    </Text>
                                );
                            })}

                            {/* Display undispatched quantity */}
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                                {unReceivedQuantity.toLocaleString('en-US',{maximumFractionDigits:3,minimumFractionDigits:3}) || 0}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <PageFooter/>
        </Page> 
    </Document>             
  )
}

export default PurchaseGrnsReportPDF