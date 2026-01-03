// ClaimPDF.tsx
import React from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Currency } from '@/components/masters/Currencies/CurrencyType';
import { Organization } from '@/types/auth-types';
interface RevenueLedger {
  name?: string;
}

interface ProjectDeliverable {
  description?: string;
  quantity?: number;
  contract_rate?: number;
  measurement_unit?: MeasurementUnit;
}

interface ClaimItem {
  project_deliverable?: ProjectDeliverable;
  revenue_ledger?: RevenueLedger;
  remarks?: string | null;
}

interface ComplementLedger {
  name?: string;
}

interface Adjustment {
  description: string;
  type: 'addition' | 'deduction';
  amount: number | string;
  complement_ledger?: ComplementLedger;
}

interface Creator {
  name?: string;
}

interface Claim {
  claimNo: string;
  claim_date: string;
  remarks?: string | null;
  currency?: Currency;
  creator?: Creator;
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

  const claimedItems = claim.claim_items.map((it, index) => {
    const rate = it.project_deliverable?.contract_rate || 0;
    const contractQty = it.project_deliverable?.quantity || 0;
    const unit = it.project_deliverable?.measurement_unit?.symbol || '';

    return {
      sn: index + 1,
      description: it.project_deliverable?.description || '',
      unit,
      contractQty,
      unitRate: rate,
      contractAmount: contractQty * rate,
      ledger: it.revenue_ledger?.name || '',
      remarks: it.remarks || '',
    };
  });

  const claimedTotal = claimedItems.reduce(
    (sum, item) => sum + item.contractAmount,
    0
  );

  const grossAmount = claimedTotal; 

  const adjustmentItems = (claim.adjustments || []).map((adj, index) => ({
    sn: index + 1,
    description: adj.description,
    type: adj.type,
    amount: Number(adj.amount) || 0,
    ledger: adj.complement_ledger?.name || '',
  }));

  const netAdjustments = adjustmentItems.reduce(
    (sum, adj) => sum + (adj.type === 'addition' ? adj.amount : -adj.amount),
    0
  );


  return (
    <Document title={claim.claimNo} author={claim.creator?.name}>
      <Page size="A3" orientation="portrait" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20, justifyContent: 'space-between' }}>
          <View style={{ maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>CLAIM</Text>
            <Text style={pdfStyles.minInfo}>{claim.claimNo}</Text>
          </View>
        </View>

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

        {adjustmentItems.length > 0 && (
          <View style={{ marginBottom: 40, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, color: mainColor, marginBottom: 10 }}>
              Adjustments
            </Text>

            <View style={{ width: '50%', minWidth: 380 }}>
              <View style={pdfStyles.table}>
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.4 }}>
                    S/N
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>
                    Description
                  </Text>
                  <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                    Complement Ledger
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

                {adjustmentItems.map((item, index) => (
                  <View key={item.sn} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 0.4 }}>
                      {item.sn}.
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 2 }}>
                      {item.description}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 1, fontSize: 7 }}>
                      {item.ledger}
                    </Text>
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: index % 2 ? lightColor : '#FFF',
                        flex: 1,
                        textAlign: 'right',
                        color: item.type === 'deduction' ? '#B00020' : '#000',
                      }}
                    >
                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}

                <View style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableHeader,
                      backgroundColor: mainColor,
                      color: contrastText,
                      flex: 3.4,
                      textAlign: 'right',
                    }}
                  >
                    Total Amount ({currencyCode})
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
                    {netAdjustments.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 12, color: mainColor, textAlign: 'center', marginBottom: 10 }}>
            Claimed Deliverables
          </Text>

          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>
                S/N
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2 }}>
                Description
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Revenue
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Qty
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Rate
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Amount
              </Text>
            </View>

            {claimedItems.map((item, index) => (
              <View key={item.sn} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 0.5 }}>
                  {item.sn}.
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 2 }}>
                  {item.description}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 1, fontSize: 7 }}>
                  {item.ledger}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 ? lightColor : '#FFF', flex: 1, textAlign: 'right' }}>
                  {item.contractQty}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 ? lightColor : '#FFF',
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
                    backgroundColor: index % 2 ? lightColor : '#FFF',
                    flex: 1,
                    textAlign: 'right',
                    fontSize: 7.5,
                  }}
                >
                  {item.contractAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}

            <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 5.6,
                  textAlign: 'right',
                }}
              >
                TOTAL ({currencyCode})
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
                {claimedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <View style={{ width: 300 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, marginBottom: 10 }}>
              Prepared By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo, borderTop: '1pt solid #000', paddingTop: 30 }}>
              {claim.creator?.name || ''}
            </Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
};

export default ClaimPDF;