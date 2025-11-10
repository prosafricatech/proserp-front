import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import QRCode from 'qrcode';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import DocumentStakeholders from '@/components/pdf/DocumentStakeholders';
import PageFooter from '@/components/pdf/PageFooter';
import { Organization } from '@/types/auth-types';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';

interface InvoiceItem {
  id: number;
  product:{ name: string};
  description: string;
  measurement_unit?: {
    symbol: string;
  } | string;
  quantity: number;
  rate: number;
  vat_amount: number;
  vat_exempted?: number;
}

interface VFDReceipt {
  verification_url: string;
  verification_code: string;
  receipt_date: string;
  receipt_time: string;
}

interface Invoice {
  invoiceNo: string;
  currency: {
    code: string;
  };
  items: InvoiceItem[];
  vfd_receipt?: VFDReceipt;
  creator: {
    name: string;
  };
  stakeholder: Stakeholder;
  transaction_date: string;
  due_date?: string;
  internal_reference?: string;
  customer_reference?: string;
  narration?: string;
  terms_and_instructions?: string;
  amount: number;
}

interface InvoicePDFProps {
  invoice: Invoice;
  organization: Organization;
}

function InvoicePDF({ invoice, organization }: InvoicePDFProps) {
    const currencyCode = invoice.currency.code;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

    //Total For only Items require VAT Inclusive
    const totalAmountForVAT = invoice.items
      .filter(item => item.vat_exempted !== 1)
      .reduce((total, item) => total + item.vat_amount, 0);

    // Function that generates a data URL for a QR code
    const generateQRCodeDataUrl = () => {
        if (!invoice.vfd_receipt) return '';
        return QRCode.toDataURL(invoice.vfd_receipt.verification_url);
    }; 

    return (
        <Document 
            title={`${invoice.invoiceNo}`}
            author={`${invoice.creator.name}`}
            subject='Invoice Note'
            creator='ProsERP'
            producer='ProsERP'
        >
            <Page size="A4" style={pdfStyles.page}>
                {/* Header Section */}
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization} />
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{...pdfStyles.majorInfo, color: mainColor }}>
                            {invoice.vfd_receipt ? 'TAX INVOICE' : 'INVOICE'}
                        </Text>
                        <Text style={{ ...pdfStyles.midInfo }}>{invoice.invoiceNo}</Text>
                        
                        {/* Verification code section */}
                        {invoice.vfd_receipt && (
                            <>
                                <View style={{ ...pdfStyles.tableRow, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10}}>
                                    <View>
                                        <View style={{ ...pdfStyles.tableRow}}>
                                            <Text style={{ ...pdfStyles.microInfo}}>
                                                {invoice.vfd_receipt.verification_code}
                                            </Text>
                                        </View>
                                        <View style={{ ...pdfStyles.tableRow}}>
                                            <Text style={{ ...pdfStyles.microInfo}}>
                                                {readableDate(invoice.vfd_receipt.receipt_date)}
                                            </Text>
                                        </View>
                                        <View style={{ ...pdfStyles.tableRow}}>
                                            <Text style={{ ...pdfStyles.microInfo}}>
                                                {invoice.vfd_receipt.receipt_time}
                                            </Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Image 
                                            src={generateQRCodeDataUrl()} 
                                            style={{ width: 50, height: 50 }}
                                        />
                                    </View>
                                </View>
                                <View style={{ ...pdfStyles.tableRow, textAlign: 'right'}}>
                                    <View style={{ flex: 1}}>
                                        <Text style={{...pdfStyles.microInfo}}>
                                            {invoice.vfd_receipt.verification_url}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                <DocumentStakeholders stakeholder={invoice.stakeholder} organization={organization}/>
                
                {/* Invoice Details */}
                <View style={{ ...pdfStyles.tableRow, marginBottom:8}}>
                    <View style={{ flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Invoice Date</Text>
                        <Text style={{...pdfStyles.minInfo }}>{readableDate(invoice.transaction_date, false)}</Text>
                    </View>
                    {invoice.due_date && (
                        <View style={{ flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Due Date</Text>
                            <Text style={{...pdfStyles.minInfo }}>{readableDate(invoice.due_date, false)}</Text>
                        </View>
                    )}
                    {invoice.internal_reference && (
                        <View style={{flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Internal Reference</Text>
                            <Text style={{...pdfStyles.minInfo }}>{invoice.internal_reference}</Text>
                        </View>
                    )}
                    {invoice.customer_reference && (
                        <View style={{flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Customer Reference</Text>
                            <Text style={{...pdfStyles.minInfo }}>{invoice.customer_reference}</Text>
                        </View>
                    )}
                </View>

                {/* Items Table */}
                <View style={{...pdfStyles.table, minHeight: 130 }}>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>S/N</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3 }}>Product</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>Unit</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Quantity</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Unit Price</Text>
                        <Text style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Amount</Text>
                    </View>
                    {invoice.items.map((invoiceItem, index) => (
                        <View key={`${invoiceItem.id}-${index}`} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3}}>
                                {index+1}
                            </Text>
                            <View
                                style={{
                                    ...pdfStyles.tableCell,
                                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                                    flex: 3,
                                    flexDirection: 'column',
                                }}
                            >
                                <Text>
                                    {invoiceItem.product.name}
                                </Text>
                                {invoiceItem.description && <Text>{`(${invoiceItem.description})`}</Text>}
                            </View>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5}}>
                                {typeof invoiceItem.measurement_unit === 'object' 
                                    ? invoiceItem.measurement_unit?.symbol 
                                    : invoiceItem.measurement_unit}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                                {invoiceItem.quantity}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                                {invoiceItem.rate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>
                                {(invoiceItem.quantity * invoiceItem.rate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totals Section */}
                <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
                    <Text style={{ textAlign: 'center', flex: 4.3 }}></Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                        Total
                    </Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                        {invoice.amount.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                    </Text>
                </View>

                {totalAmountForVAT > 0 && (
                    <>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 1}}>
                            <Text style={{ textAlign: 'center', flex: 4.3 }}></Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                VAT
                            </Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                                {totalAmountForVAT.toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                        <View style={{ ...pdfStyles.tableRow, marginTop: 1, marginBottom:30}}>
                            <Text style={{ textAlign: 'center', flex: 4.3 }}></Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right'}}>
                                Grand Total (VAT Incl.)
                            </Text>
                            <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right'}}>
                                {(invoice.amount + totalAmountForVAT).toLocaleString("en-US", {style: "currency", currency: currencyCode})}
                            </Text>
                        </View>
                    </>
                )}

                {/* Additional Information */}
                <View style={{ ...pdfStyles.tableRow, marginTop: 5}}>
                    {invoice.narration && (
                        <View style={{flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
                            <Text style={{...pdfStyles.minInfo }}>{invoice.narration}</Text>
                        </View>
                    )}
                    {invoice.terms_and_instructions && (
                        <View style={{flex: 1, padding: 2}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Terms And Instructions</Text>
                            <Text style={{...pdfStyles.minInfo }}>{invoice.terms_and_instructions}</Text>
                        </View>
                    )}
                </View>

                <View style={{ ...pdfStyles.tableRow, marginTop: 15}}>
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Prepared By</Text>
                        <Text style={{...pdfStyles.minInfo, paddingTop: 5 }}>{invoice.creator.name}</Text>
                    </View>
                    <View style={{flex: 1, padding: 2}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Received By</Text>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline', paddingTop: 5}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                    </View>
                </View>
                
                <PageFooter/>
            </Page> 
        </Document>             
    );
}

export default InvoicePDF;