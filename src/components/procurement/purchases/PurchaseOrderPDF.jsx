import React from 'react'
import { Text, View,Document,Page} from '@react-pdf/renderer'
import { PERMISSIONS } from '@/utilities/constants/permissions';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import DocumentStakeholders from '@/components/pdf/DocumentStakeholders';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';

const styles = pdfStyles;

function PurchaseOrderPDF({order,organization = null,checkOrganizationPermission}){
    const currencyCode = order.currency.code;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    const withPrices = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS,PERMISSIONS.PURCHASES_CREATE]);

    const vatAmount = order.purchase_order_items.reduce((total, item) => {
        return total += item.rate * item.quantity * item.vat_percentage*0.01;
    }, 0);

    return (
        <Document 
            title={order.orderNo}
            author={`${order.creator.name}`}
            subject='Purchase Order'
            creator='ProsERP'
            producer='ProsERP'
            keywords={order.stakeholder.name}
        >
            <Page size="A4" style={styles.page}>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                    <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization}/>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{...pdfStyles.majorInfo, color: mainColor }}>PURCHASE ORDER</Text>
                        <Text style={{ ...pdfStyles.midInfo, }}>{order.orderNo}</Text>
                    </View>
                </View>
                <DocumentStakeholders fromLabel={'ORDER FROM'} toLabel={'SUPPLIER'} stakeholder={order.stakeholder} order={order} organization={organization}/>
                <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                    <View style={{ flex: 1, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Order Date</Text>
                        <Text style={{...pdfStyles.minInfo }}>{readableDate(order.order_date)}</Text>
                    </View>
                    {
                        !!order?.date_required &&
                        <View style={{ flex: 1, padding: 2 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Date required</Text>
                            <Text style={{...pdfStyles.minInfo }}>{readableDate(order.date_required)}</Text>
                        </View>
                    }
                    {
                        order?.cost_centers &&
                        <View style={{ flex: 1, padding: 2 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Purchase For</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.cost_centers.map(cc => cc.name).join(',')}</Text>
                        </View>
                    }
                    {
                        (order?.reference || order?.requisitionNo) &&
                        <View style={{ flex: 1, padding: 2.5 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Reference</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.reference}</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.requisitionNo}</Text>
                        </View>
                    }
                    {
                        order?.currency_id > 1 &&
                        <View style={{ flex: 1, padding: 2 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Exchange Rate</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.exchange_rate}</Text>
                        </View>
                    }
                </View>
                <View style={{...pdfStyles.table, minHeight: 230 }}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 0.3 }}>S/N</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 4 }}>Product/Service</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 0.5 }}>Unit</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 0.8 }}>Quantity</Text>
                        {
                            withPrices &&
                            <>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1.2 }}>Price { vatAmount > 0 ? ' (Excl. )' : ''}</Text>
                                {vatAmount > 0 &&
                                    <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1 }}>VAT</Text>
                                }
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex : 1.5 }}>Amount { vatAmount > 0 ? ' (Incl. )' : ''}</Text>
                            </>
                        }
                    </View>
                    {
                        order.purchase_order_items.map((orderItem,index) => (
                            <View key={orderItem.id} style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3 }}>{index+1}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 4 }}>{orderItem.product.name}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.5 }}>{orderItem.measurement_unit.symbol}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.8, textAlign : 'right'}}>{orderItem.quantity}</Text>
                                {
                                    withPrices &&
                                    <>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1.2, textAlign : 'right'}}>{orderItem.rate.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                        {vatAmount > 0 &&
                                            <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1, textAlign : 'right'}}>{(orderItem.rate * orderItem.vat_percentage*0.01).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text> 
                                        }
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1.5, textAlign : 'right'}}>{(orderItem.rate * orderItem.quantity * (1 + orderItem.vat_percentage*0.01)).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text> 
                                    </>
                                }
                            </View>
                        ))
                    }
                </View>
                {
                    withPrices &&
                    <>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
                            <Text style={{ textAlign: 'center', flex : 4.5  }}></Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2, textAlign : 'right'}}>Total</Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2.2, textAlign : 'right'}}>{order.amount.toLocaleString("en-US", {style:"currency", currency:currencyCode})}</Text>
                        </View>
                        {
                            vatAmount > 0 &&
                            <React.Fragment>
                                <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                                    <Text style={{ textAlign: 'center', flex : 4.5  }}></Text>
                                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2, textAlign : 'right'}}>VAT</Text>
                                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2.2, textAlign : 'right'}}>{vatAmount.toLocaleString("en-US", {style:"currency", currency:currencyCode})}</Text>
                                </View>
                                <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                                    <Text style={{ textAlign: 'center', flex : 4.5  }}></Text>
                                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2, textAlign : 'right'}}>Grand Total (VAT Incl.)</Text>
                                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 2.2, textAlign : 'right'}}>{(order.amount + vatAmount).toLocaleString("en-US", {style:"currency", currency:currencyCode})}</Text>
                                </View>
                            </React.Fragment>
                        }
                    </>
                }
                {
                    !!order?.terms_of_payment &&
                    <View style={{ ...pdfStyles.tableRow,marginTop: 10}}>
                        <View style={{ flex: 1}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Payment Terms</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.terms_of_payment}</Text>
                        </View>
                    </View>
                }
                {
                    !!order?.remarks &&
                    <View style={{ ...pdfStyles.tableRow,marginTop: !!order?.terms_of_payment ? 5 : 10}}>
                        <View style={{ flex: 1}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Remarks</Text>
                            <Text style={{...pdfStyles.minInfo }}>{order.remarks}</Text>
                        </View>
                    </View>
                }
                <View style={{ ...pdfStyles.tableRow,marginTop: 50}}>
                    <View style={{ flex: 0.8 }}>
                    </View>
                    <View style={{ flex: 0.2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Created By:</Text>
                        <Text style={{...pdfStyles.minInfo }}>{order.creator?.name}</Text>
                    </View>
                </View>
                <PageFooter/>
            </Page>
        </Document>
    )
}

export default PurchaseOrderPDF;