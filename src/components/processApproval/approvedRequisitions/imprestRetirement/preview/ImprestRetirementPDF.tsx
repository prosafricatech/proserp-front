import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';

type ImprestRetirementPDFProps = {
  retirement: any;
  organization: any;
};

function ImprestRetirementPDF({ retirement, organization }: ImprestRetirementPDFProps) {
  const currencyCode =
    retirement?.currency?.code ||
    retirement?.currency_code ||
    retirement?.imprest_approval?.requisition?.currency?.code ||
    'TZS';

  const items = Array.isArray(retirement?.items) ? retirement.items : [];
  const attachments = Array.isArray(retirement?.attachments) ? retirement.attachments : [];
  const imprestLedgerName = retirement?.ledger?.name || '-';

  const totalRetired = items.reduce(
    (sum: number, item: any) => sum + (Number.isFinite(Number(item?.amount)) ? Number(item.amount) : 0),
    0
  );

  const getItemSource = (item: any) => {
    if (item?.ledger) {
      return `${imprestLedgerName} (${item.ledger?.name || '-'})`;
    }

    const productName = item?.product?.item_name || item?.product?.name || '-';
    const storeName = item?.store?.name || '-';
    return `${productName} @ ${storeName}`;
  };

  const mainColor = organization?.settings?.main_color || '#2113AD';
  const lightColor = organization?.settings?.light_color || '#eceef8';
  const contrastText = organization?.settings?.contrast_text || '#FFFFFF';

  return (
    <Document
      title={`${retirement?.retirementNo || 'Imprest Retirement'} | ${organization?.name || 'ProsERP'}`}
      subject="Imprest Retirement"
      author={retirement?.creator?.name}
      creator="ProsERP"
      producer="ProsERP"
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>IMPREST RETIREMENT</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{retirement?.retirementNo || '-'}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Status</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{retirement?.status_label || retirement?.status || '-'}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Retirement Date</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(retirement?.retirement_date)}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Reference Requisition</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{retirement?.imprest_approval?.requisition?.requisitionNo || '-'}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Imprest Ledger</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{retirement?.ledger?.name || '-'}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Approved Amount</Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {Number(retirement?.imprest_approval?.amount || 0).toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
              })}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Total Retired</Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {Number(totalRetired).toLocaleString('en-US', {
                style: 'currency',
                currency: currencyCode,
              })}
            </Text>
          </View>
        </View>

        {retirement?.remarks && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{retirement.remarks}</Text>
            </View>
          </View>
        )}

        <View style={{ ...pdfStyles.table, minHeight: 220, marginBottom: 14 }}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.5 }}>Item Source</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5, textAlign: 'right' }}>
              Amount ({currencyCode})
            </Text>
          </View>

          {items.length > 0 ? (
            items.map((item: any, index: number) => (
              <View key={item?.id || index} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.5 }}>
                  {index + 1}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2.5 }}>
                  {getItemSource(item)}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2 }}>
                  {item?.description || '-'}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1.5,
                    textAlign: 'right',
                  }}
                >
                  {Number(item?.amount || 0).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))
          ) : (
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, flex: 6.5, textAlign: 'center' }}>No retirement items</Text>
            </View>
          )}
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <Text style={{ textAlign: 'center', flex: 3.5 }}></Text>
          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.3, textAlign: 'right' }}>Total</Text>
          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.7, textAlign: 'right' }}>
            {Number(totalRetired).toLocaleString('en-US', {
              style: 'currency',
              currency: currencyCode,
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default ImprestRetirementPDF;
