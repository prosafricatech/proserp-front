import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';

function CertificatePDF({ certificate, organization }) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = certificate.currency?.code || 'TZS';

  const vatPercentage = certificate.vat_percentage || 0;
  const grossAmount = Number(certificate.amount) || 0;
  const vatAmount = (grossAmount * vatPercentage) / 100;

  const grossItem = {
    id: 'gross',
    particular: 'Gross Amount Certified',
    amount: grossAmount,
  };

  const vatItem = vatPercentage
    ? {
        id: 'vat',
        particular: `VAT (${vatPercentage}%)`,
        amount: vatAmount,
      }
    : null;

  const adjustmentItems = (certificate.adjustments || []).map((adj) => ({
    id: adj.id,
    particular: adj.description,
    complement_ledger: adj.complement_ledger,
    type: adj.type,
    amount: adj.amount,
  }));

  const summaryItems = [
    grossItem,
    ...(vatItem ? [vatItem] : []),
    ...adjustmentItems,
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount),0);

  const certifiedItems = certificate.items.map((it) => {
    const previousQty = it.previous_certified_quantity || 0;
    const presentQty = it.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = it.rate || 0;

    return {
      id: `T${it.task?.id}`,
      description: it.task?.name,
      unit: it.measurement_unit?.symbol,
      contractQty: it.task?.quantity,
      unitRate: rate,
      contractAmount: (it.task?.quantity || 0) * rate,
      previousQty,
      presentQty,
      cumulativeQty,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  });

  return (
    <Document title={certificate.certificateNo} author={certificate.creator?.name}>
      <Page size="A3" orientation="portrait" style={pdfStyles.page}>

        {/* ================= HEADER ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, justifyContent: 'space-between' }}>
          <View style={{ maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>

          <View style={{ textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Certificate</Text>
            <Text style={pdfStyles.minInfo}>{certificate.certificateNo}</Text>
          </View>
        </View>

        {/* ================= INFO ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Certificate Date</Text>
            <Text style={pdfStyles.minInfo}>
              {readableDate(certificate.certificate_date, false)}
            </Text>
          </View>

          {certificate.remarks && (
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
              <Text style={pdfStyles.minInfo}>{certificate.remarks}</Text>
            </View>
          )}
        </View>

        {/* ================= SUMMARY ================= */}
        <View style={{ marginBottom: 30, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: mainColor, marginBottom: 8 }}>
            Summary
          </Text>

          <View style={{ width: '50%', minWidth: 380 }}>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>S/N</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.6 }}>Particulars</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                  Amount ({currencyCode})
                </Text>
              </View>

              {summaryItems.map((item, index) => (
                <View key={item.id} style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 0.4 }}>
                    {index + 1}.
                  </Text>

                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2.6,
                    flexDirection: 'column',
                  }}
                >
                  <Text style={{ fontSize: 8 }}>
                    {item.particular}
                  </Text>

                  {item.complement_ledger?.name && (
                    <Text style={{ fontSize: 6.5, color: '#555' }}>
                      ({item.complement_ledger.name})
                    </Text>
                  )}
                </View>

                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 ? lightColor : '#FFF',
                      flex: 1,
                      textAlign: 'right',
                      fontSize: 7.5,
                      color: item.type === 'deduction' ? '#B00020' : '#000',
                    }}
                  >
                    {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}

              <View style={{ ...pdfStyles.tableRow, marginTop: 6 }}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.2, textAlign: 'center' }}>
                  Grand Total ({currencyCode})
                </Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}>
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ==================== CERTIFIED ITEMS WITH SMALLER AMOUNT FONT ==================== */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 12, color: mainColor, textAlign: 'center', marginBottom: 10 }}>
            Certified Items
          </Text>

          {(() => {
            const totals = certifiedItems.reduce(
              (acc, item) => ({
                contractAmount: acc.contractAmount + Number(item.contractAmount || 0),
                previousAmount: acc.previousAmount + Number(item.previousAmount || 0),
                presentAmount: acc.presentAmount + Number(item.presentAmount || 0),
                cumulativeAmount: acc.cumulativeAmount + Number(item.cumulativeAmount || 0),
              }),
              { contractAmount: 0, previousAmount: 0, presentAmount: 0, cumulativeAmount: 0 }
            );

            return (
              <View style={pdfStyles.table}>
                {/* Group Headers */}
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4.32 }}></Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.97, textAlign: 'center' }}>Price Schedule</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>Quantity</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>Amount ({currencyCode})</Text>
                </View>

                {/* Sub Headers */}
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Unit</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Qty</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Unit Rate ({currencyCode})</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Amount ({currencyCode})</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
                </View>

                {/* Body Rows - ALL AMOUNTS NOW SMALLER */}
                {certifiedItems.map((item, index) => (
                  <View key={item.id} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.5 }}>{index + 1}.</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 2 }}>{item.description}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.7, textAlign: 'center' }}>{item.unit}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right' }}>{item.contractQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right', fontSize: 7.5 }}>{item.unitRate.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right', fontSize: 7.5 }}>{item.contractamount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.previousQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.presentQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>{item.cumulativeQty}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.previousamount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.presentamount?.toLocaleString()}</Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right', fontSize: 7.5 }}>{item.cumulativeamount?.toLocaleString()}</Text>
                  </View>
                ))}

                {/* GRAND TOTAL - STILL BOLD & VISIBLE */}
                <View style={{ ...pdfStyles.tableRow, marginTop: 12 }}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 5.9, textAlign: 'right', fontSize: 7 }}>
                    GRAND TOTAL {currencyCode}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right', fontSize: 7 }}>
                    {totals.contractamount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.9 }}></Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.previousamount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.presentamount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2, textAlign: 'right', fontSize: 7 }}>
                    {totals.cumulativeamount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* ================= SIGNATURE ================= */}
        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ width: 300 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, marginBottom: 10 }}>
              Prepared By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo, borderTop: '1pt solid #000', paddingTop: 30 }}>
              {certificate.creator?.name}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default CertificatePDF;
