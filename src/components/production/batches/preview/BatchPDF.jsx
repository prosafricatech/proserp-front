import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

function BatchPDF({ batch, organization }) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const totalConsumptions = batch.inventory_consumptions?.flatMap(consumption => consumption.items || []).reduce((total, item) => {
    const quantity = item.quantity || 0;
    const rate = item.unit_cost || item.rate || 0;
    return total + (quantity * rate);
  }, 0) || 0;
  const totalOtherExpenses = batch.ledger_expenses?.reduce((total, item) => total + (item.quantity * item.rate || 0), 0);
  const totalByProducts = batch.by_products?.reduce((total, item) => total + (item.quantity * item.market_value || 0), 0);

  const combinedInputsOtherExpensesByProduct = (totalConsumptions + totalOtherExpenses) - totalByProducts;

  return (
    <Document
      title={`${batch.batchNo} PDF Document`}
      creator={batch.creator?.name | `Powered By ProsERP`}
      producer='ProsERP'
    >
        <Page size="A4" style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250) }}>
                    <PdfLogo organization={organization} />
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Production Batch</Text>
                    <Text style={{ ...pdfStyles.midInfo }}>{batch.batchNo}</Text>
                    <Text style={{ ...pdfStyles.midInfo }}>
                        Period: {readableDate(batch.start_date, true)}
                        {batch.end_date 
                            ? ` - ${readableDate(batch.end_date, true)}`
                            : " (On Progress)"}
                    </Text>
                </View>
            </View>

            <View style={{ ...pdfStyles.tableRow, marginTop: 20 }}>
                {batch.outputs?.length > 0 &&
                    <View style={{ ...pdfStyles.table, flex: 1, marginTop: 5 }}>
                        <View style={{ ...pdfStyles.tableRow}}>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'center',...pdfStyles.midInfo }}>Outputs</Text>
                        </View>
                        <View style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>S/N</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>Product</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.25}}>Store</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Unit Cost</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Amount</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Value%</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.15 }}>Remarks</Text>
                        </View>
                        {batch?.outputs?.map((item, index) => (
                            <View key={index} style={pdfStyles.tableRow}>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.05}}>{index + 1}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.4}}>{item.product?.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.25 }}>{item.store?.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{item.quantity?.toLocaleString()} {item.measurement_unit?.symbol}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{(((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct) / item.quantity)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{item.value_percentage}%</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.15}}>{item.remarks}</Text>
                            </View>
                        ))}

                        <View style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 5.45, fontWeight: 'bold', textAlign: 'center' }}>
                                Total
                            </Text>
                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4.55, fontWeight: 'bold', textAlign: 'center' }}>
                                {
                                batch.outputs
                                    .reduce((total, item) => total + ((item.value_percentage / 100) * combinedInputsOtherExpensesByProduct), 0)
                                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                }
                            </Text>
                        </View>
                    </View>
                }            
            </View>

            <View style={{ ...pdfStyles.tableRow, paddingTop:10, paddingBottom:4 }}>
                {batch.by_products?.length > 0 &&
                    <View style={{ ...pdfStyles.table, flex: 1, marginTop: 5 }}>
                        <View style={{ ...pdfStyles.tableRow}}>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'center',...pdfStyles.midInfo }}>By Products</Text>
                        </View>
                        <View style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>S/N</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>Product</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.25}}>Store</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Market Value</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Amount</Text>
                            <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.15 }}>Remarks</Text>
                        </View>
                        {batch?.by_products?.map((item, index) => (
                            <View key={index} style={pdfStyles.tableRow}>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.05}}>{index + 1}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.4}}>{item.product?.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.25 }}>{item.store?.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{item.quantity?.toLocaleString()} {item.measurement_unit?.symbol}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{item.market_value?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right'}}>{(item.quantity * item.market_value)?.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.15}}>{item.remarks}</Text>
                            </View>
                        ))}
                        <View style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 8, fontWeight: 'bold', textAlign: 'center' }}>
                                Total
                            </Text>
                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4, fontWeight: 'bold', textAlign: 'center' }}>
                                {
                                batch.by_products
                                    .reduce((total, item) => total + (item.quantity || 0) * (item.market_value || 0), 0)
                                    .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                                }
                            </Text>
                        </View>
                    </View>
                }
            </View>

            {batch.inventory_consumptions.length > 0 &&
                <>
                    <View style={{ ...pdfStyles.tableRow, marginTop: 20}}>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, ...pdfStyles.midInfo, flex: 1, textAlign: 'center' }}>Inventory Consumptions</Text>
                    </View>
                    {
                        batch.inventory_consumptions.map((item,index) => {

                            return (
                            <React.Fragment key={index}>
                                <View style={{ ...pdfStyles.tableRow, marginTop:5 }}>
                                    <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{readableDate(item.consumption_date)}</Text>
                                    <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{item.consumptionNo}</Text>
                                    <Text style={{ ...pdfStyles.midInfo, flex: 1 }}>{item.store?.name}</Text>
                                </View>
                                
                                <View style={{ ...pdfStyles.table,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, paddingTop:4, paddingBottom:4 }}>
                                    <View style={pdfStyles.tableRow}>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex:0.05 }}>S/N</Text>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.55 }}>Product</Text>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Average Cost</Text>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Amount</Text>
                                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Description</Text>
                                    </View>
                                    {item.items.map((it, idx) => (
                                        <View key={idx} style={pdfStyles.tableRow}>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.05 }}>{idx + 1}</Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.55 }}>{it.product.name}</Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                                {it?.quantity} {it?.unit_symbol || it?.measurement_unit?.symbol || it?.product?.unit_symbol}
                                            </Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                                {(it.unit_cost || it.rate)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }) || 0}
                                            </Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                                {((it.unit_cost || it.rate) * it.quantity || 0)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                            </Text>
                                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2 }}>{it.description}</Text>
                                        </View>
                                        ))}

                                        <View style={pdfStyles.tableRow}>
                                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.57, fontWeight: 'bold', textAlign: 'center' }}>
                                                Total
                                            </Text>
                                            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.43, fontWeight: 'bold', textAlign: 'center' }}>
                                                {
                                                item.items
                                                    .reduce((total, it) => total + (it.quantity || 0) * (it.unit_cost || it.rate || 0), 0)
                                                    .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                                                }
                                            </Text>
                                        </View>
                                </View>
                            </React.Fragment>
                        )})
                    }
                </>
            }
            
            <View style={{ ...pdfStyles.tableRow, marginTop: 20 }}>
                {batch.ledger_expenses?.length > 0 && (
                    <View style={{ ...pdfStyles.table, flex: 1, marginTop: 5 }}>
                    {/* Table Header */}
                    <View style={{ ...pdfStyles.tableRow }}>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'center', ...pdfStyles.midInfo }}>
                        Other Expenses
                        </Text>
                    </View>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>S/N</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>Ledger</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Rate</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.25 }}>Amount</Text>
                    </View>

                    {/* Table Rows */}
                    {batch?.ledger_expenses?.map((item, index) => (
                        <View key={index} style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,flex:0.05 }}>{index+1}</Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.4 }}>
                            {item.ledger?.name}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                            {item.quantity?.toLocaleString()}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                            {item.rate?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.25, textAlign: 'right' }}>
                            {(item.quantity * item.rate)?.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                        </Text>
                        </View>
                    ))}

                    {/* Total Amount Row */}
                    <View style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.785, fontWeight: 'bold', textAlign: 'center' }}>
                            Total
                        </Text>
                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.215, fontWeight: 'bold', textAlign: 'right' }}>
                        {batch.ledger_expenses
                            .reduce((total, item) => total + item.quantity * item.rate, 0)
                            .toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                        }
                        </Text>
                    </View>
                    </View>
                )}
            </View>

            <View style={{ ...pdfStyles.tableRow,marginTop: 50}}>
                <View style={{ flex: 1, padding: 0.5}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Created By</Text>
                    <Text style={{...pdfStyles.minInfo }}>{batch.creator.name}</Text>
                </View>
                <View style={{ flex: 1, padding: 0.5}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                    <Text style={{...pdfStyles.minInfo }}>{batch.remarks}</Text>
                </View>
            </View>
        </Page>
    </Document>
  );
}

export default BatchPDF;
