import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Organization } from '@/types/auth-types';
import { Currency } from '@/components/masters/Currencies/CurrencyType';

interface RevenueLedger {
  name?: string;
}

interface ProjectDeliverable {
  description?: string;
  contract_rate?: number;
  measurement_unit?: MeasurementUnit;
}

interface ClaimItem {
  id?: string | number;
  project_deliverable?: ProjectDeliverable;
  revenue_ledger?: RevenueLedger;
  measurement_unit?: MeasurementUnit;
  certified_quantity?: number;
  previous_certified_quantity?: number;
  remarks?: string | null;
}

interface ComplementLedger {
  id?: string | number;
  name?: string;
}

interface Adjustment {
  id?: string | number;
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Creator {
  name?: string;
}

interface Project {
  name?: string;
}

interface Claim {
  claimNo: string;
  claim_date: string;
  project?: Project;
  remarks?: string | null;
  currency?: Currency;
  creator?: Creator;
  amount?: number | string;
  vat_percentage?: number;
  claim_items: ClaimItem[];
  adjustments?: Adjustment[];
}

const ClaimPDF: React.FC<{ claim: Claim; organization: Organization }> = ({
  claim,
  organization,
}) => {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';
  const currencyCode = claim.currency?.code || 'TZS';

  // ==================== Summary Section ====================
  const grossAmount = Number(claim.amount) || 0;
  const vatPercentage = claim.vat_percentage || 0;
  const vatAmount = grossAmount * vatPercentage / 100;

  const summaryItems = [
    {
      id: 'gross',
      particular: 'Gross Amount Certified',
      amount: grossAmount,
      complement_ledger: null as ComplementLedger | null,
      type: null as 'addition' | 'deduction' | null,
    },

    ...(claim.adjustments || []).map((adj) => ({
      id: adj.id ?? `adj-${Math.random()}`,
      particular: adj.description,
      complement_ledger: adj.complement_ledger ?? null,
      type: adj.type,
      amount: adj.type === 'deduction' ? -Number(adj.amount) : Number(adj.amount),
    })),

    ...(vatPercentage > 0
    ? [
        {
          id: 'vat',
          particular: `VAT (${vatPercentage}%)`,
          amount: vatAmount,
          complement_ledger: null,
          type: null as 'addition' | 'deduction' | null,
        },
      ]
    : []),
  ];

  const grandTotal = summaryItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // ==================== Claim Derivations ====================
  const claimedItems = claim.claim_items.map((item, index) => {
    const previousQty = item.previous_certified_quantity || 0;
    const presentQty = item.certified_quantity || 0;
    const cumulativeQty = previousQty + presentQty;
    const rate = item.project_deliverable?.contract_rate || 0;

    return {
      sn: index + 1,
      description: item.project_deliverable?.description || '',
      unit: item.measurement_unit?.symbol || '',
      ledger: item.revenue_ledger?.name || '',
      remarks: item.remarks || '',
      previousQty,
      presentQty,
      cumulativeQty,
      unitRate: rate,
      previousAmount: previousQty * rate,
      presentAmount: presentQty * rate,
      cumulativeAmount: cumulativeQty * rate,
    };
  });

  const totals = claimedItems.reduce(
    (acc, item) => ({
      previousAmount: acc.previousAmount + item.previousAmount,
      presentAmount: acc.presentAmount + item.presentAmount,
      cumulativeAmount: acc.cumulativeAmount + item.cumulativeAmount,
    }),
    { previousAmount: 0, presentAmount: 0, cumulativeAmount: 0 }
  );

  return (
    <Document title={claim.claimNo} author={claim.creator?.name}>
      <Page size="A3" orientation="portrait" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, justifyContent: 'space-between' }}>
          <View style={{ maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Payment Claim</Text>
            <Text style={pdfStyles.minInfo}>{claim.claimNo}</Text>
            <Text style={pdfStyles.minInfo}>{claim.project?.name || ''}</Text>
          </View>
        </View>

        {/* ==================== Claim Info ==================== */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, gap: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Claim Date</Text>
            <Text style={pdfStyles.minInfo}>{readableDate(claim.claim_date, false)}</Text>
          </View>
          {claim.remarks && (
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
              <Text style={pdfStyles.minInfo}>{claim.remarks}</Text>
            </View>
          )}
        </View>

        {/* ==================== Summary Table ==================== */}
        <View style={{ marginBottom: 40, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, color: mainColor, marginBottom: 8, fontWeight: 'bold' }}>
            Summary
          </Text>
          <View style={{ width: '50%', minWidth: 380 }}>
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>
                  S/N
                </Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.6 }}>
                  Particulars
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
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
                      backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                      flex: 2.6,
                      flexDirection: 'column',
                    }}
                  >
                    <Text style={{ fontSize: 8 }}>{item.particular}</Text>
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
                    {Number(item.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}

              <View style={{ ...pdfStyles.tableRow, marginTop: 8 }}>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 3.2,
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  Grand Total ({currencyCode})
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                    textAlign: 'right',
                    fontWeight: 'bold',
                  }}
                >
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ==================== Claim Derivations Table ==================== */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 12, color: mainColor, textAlign: 'center', marginBottom: 12, fontWeight: 'bold' }}>
            Claim Derivations
          </Text>
          <View style={pdfStyles.table}>
            {/* Group Headers */}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4.32 }}></Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.97, textAlign: 'center' }}>
                Price Schedule
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>
                Quantity
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.6, textAlign: 'center' }}>
                Amount ({currencyCode})
              </Text>
            </View>

            {/* Sub Headers */}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>S/N</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>Description</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.7 }}>Unit</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Qty</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Rate</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Amount</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Previous</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Present</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.2 }}>Cumulative</Text>
            </View>

            {/* Rows */}
            {claimedItems.map((item, index) => (
              <View key={item.sn} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.5 }}>
                  {item.sn}.
                </Text>
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 2,
                    flexDirection: 'column',
                  }}
                >
                  <Text style={{ fontSize: 8 }}>{item.description}</Text>
                  {item.ledger && (
                    <Text style={{ fontSize: 6.5, color: '#555' }}>({item.ledger})</Text>
                  )}
                  {item.remarks && (
                    <Text style={{ fontSize: 6.5, color: '#888' }}>({item.remarks})</Text>
                  )}
                </View>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 0.7, textAlign: 'center' }}>
                  {item.unit}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1, textAlign: 'right' }}>
                  {item.presentQty}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.unitRate.toLocaleString()}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                  {item.previousQty}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                  {item.presentQty}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFF' : lightColor, flex: 1.2, textAlign: 'right' }}>
                  {item.cumulativeQty}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFF' : lightColor,
                    flex: 1.2,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}

            {/* Totals Row */}
            <View style={{ ...pdfStyles.tableRow, marginTop: 12 }}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 5.9,
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                GRAND TOTAL ({currencyCode})
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1, textAlign: 'right' }}></Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 3.9 }}></Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.2,
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {totals.previousAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.2,
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {totals.presentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.2,
                  textAlign: 'right',
                  fontWeight: 'bold',
                }}
              >
                {totals.cumulativeAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* ==================== Signature ==================== */}
        <View style={{ marginTop: 50, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ width: 300 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Prepared By:
            </Text>
            <View style={{ paddingTop: 2 }}>
              <Text style={pdfStyles.minInfo}>{claim.creator?.name || ''}</Text>
            </View>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default ClaimPDF;