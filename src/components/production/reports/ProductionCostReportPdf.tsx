import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { CostReportResponse } from './productionReportsServices';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

type ByProductBatch = {
  batch_id?: string;
  batchNo?: string;
  end_date?: string;
  quantity?: number | string;
  market_value_per_unit?: number | string;
  total_market_value?: number | string;
};

type CostByProduct = CostReportResponse['by_products'][number] & {
  batches?: ByProductBatch[];
};

type CostReportPdfData = Omit<CostReportResponse, 'by_products'> & {
  by_products?: CostByProduct[];
};

interface OrganizationLike {
  name?: string;
  mainColor?: string;
  contrastText?: string;
  lightColor?: string;
  organization?: any;
}

interface UserLike {
  name?: string;
}

interface ProductionCostReportPdfProps {
  reportData: CostReportPdfData;
  organization?: OrganizationLike | null;
  user?: UserLike | null;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 24,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  subSectionHeading: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
    marginBottom: 2,
    color: '#555555',
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 2,
    marginRight: 6,
    padding: 6,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  breakdownCard: {
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 2,
    padding: 6,
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 1,
  },
  breakdownName: {
    width: '26%',
    fontSize: 7.5,
  },
  breakdownAmount: {
    width: '20%',
    fontSize: 7.5,
    textAlign: 'right',
  },
  breakdownPercent: {
    width: '10%',
    fontSize: 7.5,
    textAlign: 'right',
  },
  barTrack: {
    width: '44%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECECEC',
    overflow: 'hidden',
    marginLeft: 6,
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: '#777777',
  },
});

const formatCurrency = (value: number | string | undefined): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string | undefined): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const sectionHeader = (
  labels: string[],
  mainColor: string,
  contrastText: string,
  widths: string[]
) => (
  <View style={pdfStyles.tableRow}>
    {labels.map((label, idx) => (
      <Text
        key={`${label}-${idx}`}
        style={{
          ...pdfStyles.tableHeader,
          backgroundColor: mainColor,
          color: contrastText,
          width: widths[idx],
        }}
      >
        {label}
      </Text>
    ))}
  </View>
);

const ProductionCostReportPdf = ({
  reportData,
  organization,
  user,
}: ProductionCostReportPdfProps) => {
  const mainColor = organization?.mainColor || '#1E3A5F';
  const contrastText = organization?.contrastText || '#FFFFFF';
  const lightColor = organization?.lightColor || '#E8EEF5';

  const materialCost = Number(reportData?.summary?.total_material_cost || 0);
  const expenseCost = Number(reportData?.summary?.total_ledger_expense_cost || 0);
  const byProductOffset = Number(reportData?.summary?.total_by_product_offset || 0);
  const breakdownTotal = materialCost + expenseCost + byProductOffset;

  const costBreakdownRows = [
    { label: 'Materials', value: materialCost, color: '#1976d2' },
    { label: 'Ledger Expenses', value: expenseCost, color: '#ed6c02' },
    { label: 'By-Product Offset', value: byProductOffset, color: '#2e7d32' },
  ];

  const periodLabel = `${readableDate(reportData?.period?.from, true)} - ${readableDate(reportData?.period?.to, true)}`;
  const printedOn = readableDate(new Date().toISOString(), true);

  return (
    <Document
      title={`Production Cost Report ${periodLabel}`}
      author={user?.name || ''}
      creator='ERP System'
    >
      <Page size='A4' orientation='landscape' style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Production Cost Report
            </Text>
            <Text style={pdfStyles.minInfo}>Period: {periodLabel}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed By</Text>
            <Text style={pdfStyles.minInfo}>{user?.name || ''}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
            <Text style={pdfStyles.minInfo}>{printedOn}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Report Period</Text>
            <Text style={pdfStyles.minInfo}>{periodLabel}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}> 
            <Text style={[styles.kpiLabel, { color: mainColor }]}>Total Material Cost</Text>
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {formatCurrency(reportData?.summary?.total_material_cost)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}> 
            <Text style={[styles.kpiLabel, { color: mainColor }]}>Total Expense Cost</Text>
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {formatCurrency(reportData?.summary?.total_ledger_expense_cost)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#2E7D32' }]}> 
            <Text style={[styles.kpiLabel, { color: '#2E7D32' }]}>By-Product Offset</Text>
            <Text style={[styles.kpiValue, { color: '#2E7D32' }]}>
              {formatCurrency(reportData?.summary?.total_by_product_offset)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: mainColor, marginRight: 0 }]}> 
            <Text style={[styles.kpiLabel, { color: mainColor }]}>Net Production Cost</Text>
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {formatCurrency(reportData?.summary?.net_production_cost)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: mainColor }]}>Cost Breakdown</Text>
        <View style={styles.breakdownCard}>
          {costBreakdownRows.map((row) => {
            const share = breakdownTotal > 0 ? (row.value / breakdownTotal) * 100 : 0;
            return (
              <View key={row.label} style={styles.breakdownRow}>
                <Text style={styles.breakdownName}>{row.label}</Text>
                <Text style={styles.breakdownAmount}>{formatCurrency(row.value)}</Text>
                <Text style={styles.breakdownPercent}>{`${share.toFixed(1)}%`}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={{
                      ...styles.barFill,
                      width: `${Math.max(0, Math.min(100, share))}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionHeading, { color: mainColor }]}>Material Consumptions</Text>
        {sectionHeader(
          ['S/N', 'Product', 'Unit', 'Total Qty', 'Avg Unit Cost', 'Total Cost'],
          mainColor,
          contrastText,
          ['8%', '24%', '10%', '18%', '18%', '22%']
        )}
        {(reportData?.material_consumptions || []).map((item, idx) => (
          <View key={`${item.product?.id || idx}-${idx}`}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, width: '8%', textAlign: 'center', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {idx + 1}.
              </Text>
              <Text style={{ ...pdfStyles.tableCell, width: '24%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {item.product?.name}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, width: '10%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {item.measurement_unit?.symbol}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, width: '18%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {formatQuantity(item.total_quantity)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, width: '18%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {formatCurrency(item.average_unit_cost)}
              </Text>
              <Text style={{ ...pdfStyles.tableCell, width: '22%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                {formatCurrency(item.total_cost)}
              </Text>
            </View>

            {!!item?.batches?.length && (
              <View style={{ marginBottom: 3, marginTop: 1 }}>
                <Text style={styles.subSectionHeading}>Batches that consumed this material</Text>
                {sectionHeader(
                  ['Batch', 'Date', 'Qty', 'Unit Cost', 'Total'],
                  '#888888',
                  '#FFFFFF',
                  ['24%', '24%', '16%', '18%', '18%']
                )}
                {(item.batches || []).map((batch, batchIdx) => (
                  <View key={`${batch.batch_id || batchIdx}-${batchIdx}`} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, width: '24%', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                      {batch.batchNo}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '24%', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                      {readableDate(batch.end_date, true)}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '16%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                      {formatQuantity(batch.quantity)}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '18%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                      {formatCurrency(batch.unit_cost)}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '18%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                      {formatCurrency(batch.total_cost)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        <Text style={[styles.sectionHeading, { color: mainColor }]}>Ledger Expenses</Text>
        {sectionHeader(
          ['S/N', 'Ledger', 'Currency', 'Total Amount'],
          mainColor,
          contrastText,
          ['10%', '40%', '20%', '30%']
        )}
        {(reportData?.ledger_expenses || []).map((item, idx) => (
          <View key={`${item.ledger?.id || idx}-${idx}`}>
            {(() => {
              const showExchangeRate = (item.batches || []).some(
                (batch) => Number(batch.exchange_rate || 1) !== 1
              );
              const nestedLabels = showExchangeRate
                ? ['Batch', 'Date', 'Qty', 'Rate', 'Exchange Rate', 'Total', 'Remarks']
                : ['Batch', 'Date', 'Qty', 'Rate', 'Total', 'Remarks'];
              const nestedWidths = showExchangeRate
                ? ['14%', '18%', '10%', '12%', '14%', '14%', '18%']
                : ['16%', '20%', '12%', '14%', '16%', '22%'];

              return (
                <>
                  <View style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, width: '10%', textAlign: 'center', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                      {idx + 1}.
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '40%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                      {item.ledger?.name}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '20%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                      {item.currency?.name}
                    </Text>
                    <Text style={{ ...pdfStyles.tableCell, width: '30%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                      {formatCurrency(item.total_amount)}
                    </Text>
                  </View>

                  {!!item?.batches?.length && (
                    <View style={{ marginBottom: 3, marginTop: 1 }}>
                      <Text style={styles.subSectionHeading}>
                        Production batches receiving this expense allocation
                      </Text>
                      {sectionHeader(
                        nestedLabels,
                        '#888888',
                        '#FFFFFF',
                        nestedWidths
                      )}
                      {(item.batches || []).map((batch, batchIdx) => (
                        <View key={`${batch.batch_id || batchIdx}-${batchIdx}`} style={pdfStyles.tableRow}>
                          <Text style={{ ...pdfStyles.tableCell, width: nestedWidths[0], backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {batch.batchNo}
                          </Text>
                          <Text style={{ ...pdfStyles.tableCell, width: nestedWidths[1], backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {readableDate(batch.end_date, true)}
                          </Text>
                          <Text style={{ ...pdfStyles.tableCell, width: nestedWidths[2], textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {formatQuantity(batch.quantity)}
                          </Text>
                          <Text style={{ ...pdfStyles.tableCell, width: nestedWidths[3], textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {formatCurrency(batch.rate)}
                          </Text>
                          {showExchangeRate && (
                            <Text style={{ ...pdfStyles.tableCell, width: nestedWidths[4], textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                              {formatQuantity(batch.exchange_rate)}
                            </Text>
                          )}
                          <Text style={{ ...pdfStyles.tableCell, width: showExchangeRate ? nestedWidths[5] : nestedWidths[4], textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {formatCurrency(batch.total)}
                          </Text>
                          <Text style={{ ...pdfStyles.tableCell, width: showExchangeRate ? nestedWidths[6] : nestedWidths[5], backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                            {batch.remarks || '-'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        ))}

        {(reportData?.by_products || []).length > 0 && (
          <>
            <Text style={[styles.sectionHeading, { color: mainColor }]}>By-Products Offset</Text>
            {sectionHeader(
              ['S/N', 'Product', 'Unit', 'Total Qty', 'Cost Reduction'],
              mainColor,
              contrastText,
              ['10%', '20%', '15%', '25%', '30%']
            )}
            {(reportData?.by_products || []).map((item, idx) => (
              <View key={`${item.product?.id || idx}-${idx}`}>
                <View style={pdfStyles.tableRow}>
                  <Text style={{ ...pdfStyles.tableCell, width: '10%', textAlign: 'center', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    {idx + 1}.
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, width: '20%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    {item.product?.name}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, width: '15%', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    {item.measurement_unit?.symbol}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, width: '25%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    {formatQuantity(item.total_quantity)}
                  </Text>
                  <Text style={{ ...pdfStyles.tableCell, width: '30%', textAlign: 'right', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : lightColor }}>
                    {formatCurrency(item.total_market_value)}
                  </Text>
                </View>

                {!!item?.batches?.length && (
                  <View style={{ marginBottom: 3, marginTop: 1 }}>
                    <Text style={styles.subSectionHeading}>
                      Production batches producing this by-product offset
                    </Text>
                    {sectionHeader(
                      ['Batch', 'Date', 'Qty', 'Market Value / Unit', 'Total Market Value'],
                      '#888888',
                      '#FFFFFF',
                      ['20%', '22%', '16%', '21%', '21%']
                    )}
                    {(item.batches || []).map((batch, batchIdx) => (
                      <View key={`${batch.batch_id || batchIdx}-${batchIdx}`} style={pdfStyles.tableRow}>
                        <Text style={{ ...pdfStyles.tableCell, width: '20%', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                          {batch.batchNo}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, width: '22%', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                          {readableDate(batch.end_date, true)}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, width: '16%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                          {formatQuantity(batch.quantity)}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, width: '21%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                          {formatCurrency(batch.market_value_per_unit)}
                        </Text>
                        <Text style={{ ...pdfStyles.tableCell, width: '21%', textAlign: 'right', backgroundColor: batchIdx % 2 === 0 ? '#FFFFFF' : '#F7F7F7' }}>
                          {formatCurrency(batch.total_market_value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
};

export default ProductionCostReportPdf;
