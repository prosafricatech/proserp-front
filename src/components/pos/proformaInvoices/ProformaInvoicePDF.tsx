import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from '../../pdf/pdf-styles'
import PdfLogo from '../../pdf/PdfLogo';
import DocumentStakeholders from '../../pdf/DocumentStakeholders';
import PageFooter from '../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Organization } from '@/types/auth-types';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';

interface Creator {
  name: string;
}

interface Product {
  name: string;
  vat_exempted?: boolean;
}

interface ProformaItem {
  id: number;
  product: Product;
  measurement_unit: MeasurementUnit;
  quantity: number;
  rate: number;
}

interface Proforma {
  proformaNo: string;
  proforma_date: string;
  expiry_date?: string;
  items: ProformaItem[];
  amount: number;
  vat_amount: number;
  vat_percentage: number;
  currency: Currency;
  creator?: Creator;
  stakeholder?: Stakeholder;
  remarks?: string;
}

interface ProformaInvoicePDFProps {
  proforma: Proforma;
  organization: Organization;
}

function ProformaInvoicePDF({ proforma, organization }: ProformaInvoicePDFProps) {
    const currencyCode = proforma.currency?.code;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    return (
        <Document 
            title={`${proforma.proformaNo}`}
            author={`${proforma.creator?.name || ''}`}
            subject='Proforma Invoice'
            creator='ProsERP'
            producer='ProsERP'
            keywords={proforma.stakeholder?.name || ''}
        >
            <Page size="A4" style={pdfStyles.page}>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                    <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization}/>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{...pdfStyles.majorInfo, color: mainColor }}>PROFORMA INVOICE</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{proforma.proformaNo}</Text>
                    </View>
                </View>
                
                {proforma.stakeholder && (
                    <DocumentStakeholders stakeholder={proforma.stakeholder} organization={organization}/>
                )}

                <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
                    <View style={{ flex: 1, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Proforma Date</Text>
                        <Text style={{...pdfStyles.minInfo }}>{readableDate(proforma.proforma_date)}</Text>
                    </View>
                    {proforma?.expiry_date && (
                        <View style={{ flex: 1, padding: 2 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Valid Until</Text>
                            <Text style={{...pdfStyles.minInfo }}>{readableDate(proforma.expiry_date)}</Text>
                        </View>
                    )}
                    <View style={{ flex: 2}}>
                        {/* Place holder */}
                    </View>
                </View>

                <View style={{...pdfStyles.table, minHeight: 200 }}>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product/Service</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>Unit</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>Quantity</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>
                            Price {proforma?.vat_percentage ? ' (Excl. )' : ''}
                        </Text>
                        {proforma?.vat_percentage > 0 && (
                            <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                                VAT
                            </Text>
                        )}
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, ...pdfStyles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                            Amount {proforma?.vat_percentage ? ' (Incl. )' : ''}
                        </Text>
                    </View>
                    
                    {proforma.items.map((proformaItem, index) => (
                        <View key={proformaItem.id} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3 }}>
                                {index + 1}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 3 }}>
                                {proformaItem.product.name}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5 }}>
                                {proformaItem.measurement_unit.symbol}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.8, textAlign: 'right' }}>
                                {proformaItem.quantity}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                                {proformaItem.rate.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            </Text>
                            {proforma?.vat_percentage > 0 && (
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                                    {(!proformaItem.product?.vat_exempted 
                                        ? proforma.vat_percentage * proformaItem.rate * 0.01 
                                        : 0
                                    ).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                                </Text> 
                            )}
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5, textAlign: 'right' }}>
                                {(proformaItem.quantity * proformaItem.rate * 
                                (!proformaItem.product?.vat_exempted 
                                    ? (100 + proforma.vat_percentage) * 0.01 
                                    : 1
                                )).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                            </Text> 
                        </View>
                    ))}
                </View>

                <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                    <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                        Total
                    </Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                        {proforma.amount.toLocaleString("en-US", { style: "currency", currency: currencyCode })}
                    </Text>
                </View>

                {proforma.vat_percentage > 0 && (
                    <>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                            <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                                VAT
                            </Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                {proforma.vat_amount.toLocaleString("en-US", { style: "currency", currency: currencyCode })}
                            </Text>
                        </View>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                            <Text style={{ textAlign: 'center', flex: 4.5 }}></Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                                Grand Total (VAT Incl.)
                            </Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                {(proforma.amount + proforma.vat_amount).toLocaleString("en-US", { style: "currency", currency: currencyCode })}
                            </Text>
                        </View>
                    </>
                )}

                {proforma?.remarks && (
                    <View style={{ ...pdfStyles.tableRow, marginTop: 5 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                            <Text style={{...pdfStyles.minInfo }}>{proforma.remarks}</Text>
                        </View>
                    </View>
                )}

                <PageFooter/>
            </Page>
        </Document>
    );
}

export default ProformaInvoicePDF;