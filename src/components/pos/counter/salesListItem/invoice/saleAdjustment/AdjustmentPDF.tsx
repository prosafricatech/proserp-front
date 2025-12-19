import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

interface AdjustmentItem {
  quantity: number;
  rate: number;
  vat_percentage: number;
  vat_exempted: number;
  description?: string;
  product?: {
    name: string;
  };
  measurement_unit?: {
    symbol?: string;
  } | string;
}

interface Adjustment {
  id: number;
  voucherNo: string;
  note_type: 'debit' | 'credit';
  transaction_date: string;
  narration: string;
  currency: { code: string };
  items: AdjustmentItem[];
  cost_centers: { name: string }[];
  creator: { name: string };
}

interface AuthObject {
  authUser: {
    user: {
      name: string;
    };
  };
  authOrganization: {
    organization: Organization;
  };
}

interface AdjustmentPDFProps {
  adjustment: Adjustment;
  authObject: AuthObject;
}

const AdjustmentPDF: React.FC<AdjustmentPDFProps> = ({ adjustment, authObject }) => {
  const currencyCode = adjustment.currency.code;
  const {
    authUser: { user },
  } = authObject;
  const {
    authOrganization: { organization },
  } = authObject;

  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  // Calculate VAT amount
  const totalAmountForVAT = adjustment.items
    .filter((item) => item.vat_exempted !== 1)
    .reduce((total, item) => {
      const itemAmount = item.quantity * item.rate;
      const vatAmount = itemAmount * (item.vat_percentage / 100);
      return total + vatAmount;
    }, 0);

  // Calculate total amount
  const totalAmount = adjustment.items.reduce((total, item) => {
    return total + item.quantity * item.rate;
  }, 0);

  // Calculate grand total
  const grandTotal = totalAmount + totalAmountForVAT;

  return (
    <Document
      title={`${adjustment.voucherNo} | ${organization.name}`}
      author={adjustment.creator.name}
      subject={'Transfer Voucher Document'}
      keywords={adjustment.narration}
      creator={`${user?.name || ''} | Powered By ProsERP`}
      producer="ProsERP"
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              {adjustment.note_type === 'debit' ? 'Debit Note' : 'Credit Note'}
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>{adjustment.voucherNo}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Adjustment Date</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(adjustment.transaction_date)}</Text>
          </View>
          {adjustment.cost_centers.length > 0 && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Cost center</Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {adjustment.cost_centers.map((cc) => cc.name).join(', ')}
              </Text>
            </View>
          )}
        </View>

        <View style={{ ...pdfStyles.table, minHeight: 130 }}>
          {/* Table Header */}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.3,
              }}
            >
              S/N
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 3,
              }}
            >
              Product
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 0.5,
              }}
            >
              Unit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Quantity
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Rate
            </Text>
            {totalAmountForVAT > 0 && (
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1,
                }}
              >
                VAT
              </Text>
            )}
            <Text
              style={{
                ...pdfStyles.tableCell,
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Amount
            </Text>
          </View>

          {/* Table Rows */}
          {adjustment.items.map((invoiceItem, index) => {
            const itemAmount = invoiceItem.quantity * invoiceItem.rate;
            const vatAmount =
              invoiceItem.vat_exempted !== 1
                ? itemAmount * (invoiceItem.vat_percentage / 100)
                : 0;

            return (
              <View key={index} style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.3,
                  }}
                >
                  {index + 1}
                </Text>
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 3,
                    flexDirection: 'column',
                  }}
                >
                  <Text>{invoiceItem?.product?.name}</Text>
                  {invoiceItem.description && <Text>{`(${invoiceItem.description})`}</Text>}
                </View>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.5,
                  }}
                >
                  {typeof invoiceItem.measurement_unit === 'string'
                    ? invoiceItem.measurement_unit
                    : invoiceItem.measurement_unit?.symbol}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {invoiceItem.quantity}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {invoiceItem.rate.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                {totalAmountForVAT > 0 && (
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {invoiceItem.vat_exempted !== 1
                      ? vatAmount?.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : 'Exempt'}
                  </Text>
                )}
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {itemAmount?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={{ ...pdfStyles.tableRow, marginTop: 4 }}>
          <Text style={{ textAlign: 'center', flex: totalAmountForVAT > 0 ? 5.3 : 4.3 }}></Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 2.2,
              textAlign: 'right',
            }}
          >
            Total
          </Text>
          <Text
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              flex: 2,
              textAlign: 'right',
            }}
          >
            {totalAmount?.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
          </Text>
        </View>

        {totalAmountForVAT > 0 && (
          <>
            <View style={{ ...pdfStyles.tableRow, marginTop: 1 }}>
              <Text style={{ textAlign: 'center', flex: 5.3 }}></Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2.2,
                  textAlign: 'right',
                }}
              >
                VAT
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                  textAlign: 'right',
                }}
              >
                {totalAmountForVAT.toLocaleString('en-US', {
                  style: 'currency',
                  currency: currencyCode,
                })}
              </Text>
            </View>
            <View style={{ ...pdfStyles.tableRow, marginTop: 1, marginBottom: 30 }}>
              <Text style={{ textAlign: 'center', flex: 5.3 }}></Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2.2,
                  textAlign: 'right',
                }}
              >
                Grand Total (VAT Incl.)
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 2,
                  textAlign: 'right',
                }}
              >
                {grandTotal.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
              </Text>
            </View>
          </>
        )}

        <View style={{ ...pdfStyles.tableRow, marginTop: 20 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{adjustment.narration}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Posted By</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{adjustment.creator.name}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default AdjustmentPDF;
