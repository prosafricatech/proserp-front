import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from '../../pdf/pdf-styles'
import PdfLogo from '../../pdf/PdfLogo';
import DocumentStakeholders from '../../pdf/DocumentStakeholders';
import PageFooter from '../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import { SalesOrder } from './SalesOrderType';

interface SalePDFProps {
  sale: SalesOrder;
  organization: Organization;
  thermalPrinter?: boolean;
}

const SalePDF: React.FC<SalePDFProps> = ({ sale, organization, thermalPrinter = false }) => {
    const currencyCode = sale.currency?.code;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    const PDF80mm = () => (
        <Page size={[80 * 2.83465, 297 * 2.83465]} style={{...pdfStyles.page, padding: 10 }}>
            <View style={{ transform: 'scale(1)'}}>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10, justifyContent: 'center' }}>
                    <View style={{ flex: 1, padding: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization} />
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10, textAlign: 'center' }}>
                    <View style={{ flex: 1, padding: 1 }}>
                        <Text style={{...pdfStyles.midInfo, color: mainColor }}>SALES ORDER</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{sale.saleNo}</Text>
                        {sale.reference && <Text style={{ ...pdfStyles.minInfo }}>Ref: {sale.reference}</Text>}
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5}}>
                    <View style={{ flex: 1.2, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sale Date & Time:</Text>
                        <Text style={{...pdfStyles.minInfo }}>{readableDate(sale.transaction_date, true)}</Text>
                    </View>
                    <View style={{flex: 0.3}}></View>
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Outlet:</Text>
                        <Text style={{...pdfStyles.minInfo }}>{sale.sales_outlet?.name || 'N/A'}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 5}}>
                    {sale.sales_person && (
                        <View style={{flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sales Person</Text>
                            <Text style={{...pdfStyles.minInfo }}>{sale.sales_person}</Text>
                        </View>
                    )}
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Served By</Text>
                        <Text style={{...pdfStyles.minInfo }}>{sale.creator?.name || 'N/A'}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <View style={{ flex: 1, padding: 1 }}>
                        <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, textAlign: 'center'}}>
                            {'SUPPLIER'}
                        </Text>
                        <Text style={{...pdfStyles.midInfo, textAlign: 'center'}}>{organization.name}</Text>
                        {organization?.address && <Text style={{...pdfStyles.minInfo, textAlign: 'center'}}>{organization.address}</Text>}
                        {organization?.tin && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>TIN:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{organization.tin}</Text>
                            </View>
                        )}
                        {organization?.settings?.vrn && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>VRN:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{organization.settings.vrn}</Text>
                            </View>
                        )}
                        {organization?.phone && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>Phone:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{organization.phone}</Text>
                            </View>
                        )}
                        {organization?.email && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>Email:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{organization.email}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <View style={{ flex: 1, padding: 1 }}>
                        <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, textAlign: 'center'}}>
                            {'CLIENT'}
                        </Text>
                        <Text style={{...pdfStyles.midInfo, fontWeight: 'bold', textAlign: 'center'}}>{sale.stakeholder?.name || 'N/A'}</Text>
                        {sale.stakeholder?.address && <Text style={{...pdfStyles.minInfo, textAlign: 'center'}}>{sale.stakeholder.address}</Text>}
                        {sale.stakeholder?.tin && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>TIN:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{sale.stakeholder.tin}</Text>
                            </View>
                        )}
                        {sale.stakeholder?.vrn && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>VRN:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{sale.stakeholder.vrn}</Text>
                            </View>
                        )}
                        {sale.stakeholder?.phone && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>Phone:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{sale.stakeholder.phone}</Text>
                            </View>
                        )}
                        {sale.stakeholder?.email && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <Text style={{...pdfStyles.minInfo}}>Email:</Text>
                                <Text style={{...pdfStyles.minInfo}}>{sale.stakeholder.email}</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={{...pdfStyles.table}}>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 0.6 }}>S/N</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product/Service</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.3 }}>Qty</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Price</Text>
                        <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.7 }}>Amount</Text>
                    </View>
                    {sale.sale_items?.map((saleItem, index) => (
                        <View key={saleItem.id} style={{ ...pdfStyles.tableRow, borderTop: '1px', borderTopStyle: 'solid', borderTopColor: mainColor }}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.6}}>{index+1}</Text>
                            <View
                                style={{
                                    ...pdfStyles.tableCell,
                                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                                    flex: 3,
                                    flexDirection: 'column',
                                }}
                            >
                                <Text>
                                    {saleItem.product.name}
                                </Text>
                                {saleItem.description && <Text>{`(${saleItem.description})`}</Text>}
                            </View>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.3, textAlign: 'right' }}>
                                {`${saleItem.quantity} ${saleItem.measurement_unit?.symbol || ''}`}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                                {(saleItem.rate * (1 + (saleItem?.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0))).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.7, textAlign: 'right' }}>
                                {(saleItem.quantity * saleItem.rate * (1 + (saleItem?.vat_exempted !== 1 ? sale.vat_percentage * 0.01 : 0))).toLocaleString('en-US', {maximumFractionDigits: 2})}
                            </Text>
                        </View>
                    ))}
                </View> 
                <View style={{...pdfStyles.tableRow, marginTop: 5}}>
                    <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2}}>Total</Text>
                    <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                        {sale.amount.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                    </Text>
                </View>
                {sale.vat_percentage > 0 && (
                    <React.Fragment>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
                            <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2}}>VAT</Text>
                            <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                {sale.vat_amount.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 2 }}>
                            <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2}}>Grand Total (VAT Incl.)</Text>
                            <Text style={{...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                {(sale.amount + sale.vat_amount).toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                    </React.Fragment>
                )}

                {sale.remarks && (
                    <View style={{ ...pdfStyles.tableRow, marginBottom: 5}}>
                        <View style={{ flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                            <Text style={{...pdfStyles.minInfo }}>{sale.remarks}</Text>
                        </View>
                    </View>
                )}
                    
                <View style={{ ...pdfStyles.tableRow, marginTop:20,}}>
                    <View style={{flex: 3, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Name`}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginTop:15,}}>
                    <View style={{flex: 1.5, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Signature`}</Text>
                    </View>
                    <View style={{flex: 1.5, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Date`}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginTop: 50, textAlign: 'center'}}>
                    <View style={{ flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo }}>Powered by: proserp.co.tz</Text>
                    </View>
                </View>
            </View>
        </Page> 
    )

    const PDFA4 = () => (
        <Page size="A4" style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization} />
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                    <Text style={{...pdfStyles.majorInfo, color: mainColor }}>SALES ORDER</Text>
                    <Text style={{ ...pdfStyles.midInfo }}>{sale.saleNo}</Text>
                    {sale.reference && <Text style={{ ...pdfStyles.minInfo }}>Ref: {sale.reference}</Text>}
                </View>
            </View>
            <DocumentStakeholders 
                fromLabel={'SUPPLIER'} 
                toLabel={'CLIENT'} 
                stakeholder={sale.stakeholder} 
                organization={organization}
            />
            <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
                <View style={{ flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sale Date & Time</Text>
                    <Text style={{...pdfStyles.minInfo }}>{readableDate(sale.transaction_date, true)}</Text>
                </View>
                <View style={{flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Outlet</Text>
                    <Text style={{...pdfStyles.minInfo }}>{sale.sales_outlet?.name || 'N/A'}</Text>
                </View>
                {sale.sales_person && (
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Sales Person</Text>
                        <Text style={{...pdfStyles.minInfo }}>{sale.sales_person}</Text>
                    </View>
                )}
                <View style={{flex: 1, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Served By</Text>
                    <Text style={{...pdfStyles.minInfo }}>{sale.creator?.name || 'N/A'}</Text>
                </View>
            </View>
            <View style={{...pdfStyles.table, minHeight: 230 }}>
                <View style={pdfStyles.tableRow}>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product/Service</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>Unit</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>Quantity</Text>
                    <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>
                        Price{sale?.vat_percentage ? ' (Excl.)' : ''}
                    </Text>
                    {sale?.vat_percentage > 0 && (
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                            VAT
                        </Text>
                    )}
                    <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                        Amount{sale?.vat_percentage ? ' (Incl.)' : ''}
                    </Text>
                </View>
                {sale.sale_items?.map((saleItem, index) => (
                    <View key={saleItem.id} style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.4 }}>{index+1}</Text>
                        <View
                            style={{
                                ...pdfStyles.tableCell,
                                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                                flex: 3,
                                flexDirection: 'column',
                            }}
                        >
                            <Text>
                                {saleItem.product.name}
                            </Text>
                            {saleItem.description && <Text>{`(${saleItem.description})`}</Text>}
                        </View>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.6 }}>{saleItem.measurement_unit?.symbol || ''}</Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.9, textAlign: 'right'}}>
                            {saleItem.quantity}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right'}}>
                            {saleItem.rate.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                        </Text>
                        {sale?.vat_percentage > 0 && (
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right'}}>
                                {(!saleItem.product?.vat_exempted ? sale.vat_percentage * saleItem.rate * 0.01 : 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                            </Text> 
                        )}
                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right'}}>
                            {(saleItem.quantity * saleItem.rate * (!saleItem.product?.vat_exempted ? (100 + sale.vat_percentage) * 0.01 : 1)).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})}
                        </Text> 
                    </View>
                ))}
            </View> 
            <View style={pdfStyles.tableRow}>
                <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>Total</Text>
                <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                    {sale.amount.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                </Text>
            </View>
            {sale.vat_percentage > 0 && (
                <React.Fragment>
                    <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                        <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>VAT</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                            {sale.vat_amount.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                        </Text>
                    </View>
                    <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                        <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>Grand Total (VAT Incl.)</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                            {(sale.amount + sale.vat_amount).toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                        </Text>
                    </View>
                </React.Fragment>
            )}
            <View style={{ ...pdfStyles.tableRow, marginTop:30,}}>
                <View style={{flex: 3, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Name`}</Text>
                </View>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Signature`}</Text>
                </View>
                <View style={{flex: 1.5, padding: 2}}>
                    <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Text>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>{`Date`}</Text>
                </View>
            </View>
            <PageFooter/>
        </Page> 
    )
    
    return (
        <Document 
            title={`${sale.saleNo}`}
            author={`${sale.creator?.name as string || 'ProsERP'}`}
            subject='Sale PDF'
            creator='ProsERP'
            producer='ProsERP'
            keywords={sale.stakeholder?.name || ''}
        >
            {thermalPrinter ? <PDF80mm/> : <PDFA4/>}
        </Document>             
    )
}

export default SalePDF;