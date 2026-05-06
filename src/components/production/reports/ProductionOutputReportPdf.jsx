import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  orgName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
  },
  reportTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    marginBottom: 2,
  },
  reportMeta: {
    fontSize: 8,
    textAlign: 'right',
    color: '#555555',
  },
  // ── Meta strip ──
  metaStrip: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 16,
  },
  metaBlock: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 8,
  },
  // ── Divider ──
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    marginBottom: 10,
  },
  // ── KPI cards ──
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    padding: 8,
  },
  kpiLabel: {
    fontSize: 7,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  // ── Section heading ──
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // ── Table ──
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 8,
    paddingHorizontal: 2,
  },
  tableCellRight: {
    fontSize: 8,
    paddingHorizontal: 2,
    textAlign: 'right',
  },
  // ── Batch block ──
  batchBlock: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 2,
  },
  batchHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  batchHeaderCell: {
    fontSize: 8,
    paddingHorizontal: 2,
  },
  batchHeaderCellRight: {
    fontSize: 8,
    paddingHorizontal: 2,
    textAlign: 'right',
  },
  subSectionHeading: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 6,
    paddingVertical: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: '#444444',
  },
  subTableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  subTableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  subTableCell: {
    fontSize: 7.5,
    paddingHorizontal: 2,
  },
  subTableCellRight: {
    fontSize: 7.5,
    paddingHorizontal: 2,
    textAlign: 'right',
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: '#888888',
  },
});

// ─── Formatters (exact copies from OutputReport.jsx) ─────────────────────────

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatUnitCost = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeading = ({ label, color }) => (
  <Text style={[styles.sectionHeading, { color }]}>{label}</Text>
);

const TableHeaderRow = ({ columns, color, contrastText, mainColor }) => (
  <View style={pdfStyles.tableRow}>
    {columns.map((col, i) => (
      <Text
        key={i}
        style={[
          col.right ? styles.tableCellRight : styles.tableCell,
          {
            ...pdfStyles.tableHeader,
            backgroundColor: mainColor,
            color: contrastText,
            // flex: col.flex || 1,
            width: col.width || '10%',
          },
        ]}
      >
        {col.label}
      </Text>
    ))}
  </View>
);

// ── Product Summary Table ─────────────────────────────────────────────────────
// Mirrors the Product Summary table inside OutputReport's first Accordion
// (report.summary?.products).

const ProductSummaryTable = ({
  products,
  mainColor,
  contrastText,
  lightColor,
}) => {
  const columns = [
    { label: 'Finished Product', width: '20%' },
    { label: 'Unit', width: '16%' },
    { label: 'Qty Produced', width: '16%', right: true },
    { label: 'Avg Unit Cost', width: '16%', right: true },
    { label: 'Total Value', width: '16%', right: true },
    { label: 'Batches', width: '16%', right: true },
  ];

  return (
    <View style={styles.table}>
      <TableHeaderRow
        columns={columns}
        color={mainColor}
        contrastText={contrastText}
        mainColor={mainColor}
      />
      {(products || []).map((item, index) => (
        <View
          key={`${item.product?.id || index}-${index}`}
          style={pdfStyles.tableRow}
        >
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '20%',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {item.product?.name}
          </Text>
          {/* mirrors: item.measurement_unit?.symbol || item.measurement_unit?.name */}
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '16%',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {item.measurement_unit?.symbol || item.measurement_unit?.name}
          </Text>
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '16%',
                textAlign: 'right',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {formatQuantity(item.total_quantity)}
          </Text>
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '16%',
                textAlign: 'right',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {formatUnitCost(item.average_unit_cost)}
          </Text>
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '16%',
                textAlign: 'right',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {formatCurrency(item.total_value)}
          </Text>
          <Text
            style={[
              pdfStyles.tableCell,
              {
                width: '16%',
                textAlign: 'right',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              },
            ]}
          >
            {item.batch_count}
          </Text>
        </View>
      ))}
    </View>
  );
};

// ── Batch Block ───────────────────────────────────────────────────────────────
// Mirrors one iteration of report.batches.map() in OutputReport.jsx,
// including the Outputs sub-table and By-Products sub-table inside the
// Accordion's expanded Collapse sections.

const BatchBlock = ({ batch, index, mainColor, contrastText, lightColor }) => {
  const outputCols = [
    { label: 'Product', width: '20%' },
    { label: 'Unit', width: '16%' },
    { label: 'Qty', width: '16%', right: true },
    { label: 'Unit Cost', width: '16%', right: true },
    { label: 'Total Value', width: '16%', right: true },
    { label: 'Value %', width: '16%', right: true },
  ];

  const byProductCols = [
    { label: 'Product', width: '20%' },
    { label: 'Unit', width: '20%' },
    { label: 'Qty', width: '20%', right: true },
    { label: 'Market Value / Unit', width: '20%', right: true },
    { label: 'Total Market Value', width: '20%', right: true },
  ];

  return (
    <View style={styles.batchBlock} wrap={false}>
      {/* ── Batch summary header ──
          Columns mirror the Grid columns in the AccordionSummary:
          batchNo | start_date | end_date | work_center + cost_center | total_output_value | total_by_product_value */}

      <View style={pdfStyles.tableRow}>
        <Text
          style={{
            ...pdfStyles.tableCell,
            width: '20%',
          }}
        >
          {batch.batchNo}
        </Text>
        {/* readableDate(batch.start_date, true) */}
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {readableDate(batch.start_date, true)} -{' '}
          {readableDate(batch.end_date, true)}
        </Text>
        {/* batch.work_center?.name + batch.work_center?.cost_center?.name */}
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {batch.work_center?.name}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {batch.work_center?.cost_center?.name}
        </Text>
        {/* formatCurrency(batch.total_output_value) */}
        <Text
          style={{ ...pdfStyles.tableCell, textAlign: 'right', width: '16%' }}
        >
          {formatCurrency(batch.total_output_value)}
        </Text>
        {/* formatCurrency(batch.total_by_product_value) */}
        <Text
          style={{ ...pdfStyles.tableCell, textAlign: 'right', width: '16%' }}
        >
          {formatCurrency(batch.total_by_product_value)}
        </Text>
      </View>

      {/* ── Outputs sub-table ──
          Mirrors the Outputs TableContainer inside the first Collapse */}
      <Text style={styles.subSectionHeading}>Outputs</Text>
      <View style={pdfStyles.tableRow}>
        {outputCols.map((col, i) => (
          <Text
            key={i}
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              width: col.width,
            }}
          >
            {col.label}
          </Text>
        ))}
      </View>
      {(batch.outputs || []).map((output, i) => (
        <View key={output.id} style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '20%',
            }}
          >
            {output.product?.name}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
            }}
          >
            {output.measurement_unit?.symbol}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatQuantity(output.quantity)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatUnitCost(output.unit_cost)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatCurrency(output.total_value)}
          </Text>
          {/* formatQuantity matches OutputReport's formatQuantity(output.value_percentage) */}
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatQuantity(output.value_percentage)}%
          </Text>
        </View>
      ))}

      {/* ── By-Products sub-table ── */}
      {(batch.by_products || []).length > 0 && (
        <>
          <Text style={[styles.subSectionHeading, { marginTop: 4 }]}>
            By-Products
          </Text>
          <View
            style={[
              styles.tableHeaderRow,
              { backgroundColor: '#888888', paddingHorizontal: 10 },
            ]}
          >
            {byProductCols.map((col, i) => (
              <Text
                key={i}
                style={[
                  col.right ? styles.tableCellRight : styles.tableCell,
                  {
                    flex: col.flex || 1,
                    color: '#FFFFFF',
                    fontFamily: 'Helvetica-Bold',
                    fontSize: 7.5,
                  },
                ]}
              >
                {col.label}
              </Text>
            ))}
          </View>
          {(batch.by_products || []).map((byProduct, i) => (
            <View
              key={byProduct.id}
              style={[styles.subTableRow, i % 2 !== 0 && styles.subTableRowAlt]}
            >
              <Text style={[styles.subTableCell, { flex: 2.5 }]}>
                {byProduct.product?.name}
              </Text>
              <Text style={[styles.subTableCell, { flex: 0.8 }]}>
                {byProduct.measurement_unit?.symbol}
              </Text>
              <Text style={[styles.subTableCellRight, { flex: 1 }]}>
                {formatQuantity(byProduct.quantity)}
              </Text>
              <Text style={[styles.subTableCellRight, { flex: 1.4 }]}>
                {formatCurrency(byProduct.market_value_per_unit)}
              </Text>
              <Text style={[styles.subTableCellRight, { flex: 1.5 }]}>
                {formatCurrency(byProduct.total_market_value)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// ─── Main Document ────────────────────────────────────────────────────────────

/**
 * ProductionOutputReportPdf
 *
 * Called from OutputReport.jsx as:
 *   <ProductionOutputReportPdf
 *     reportData={report}
 *     organization={authOrganization}
 *     user={user}
 *   />
 *
 * Props:
 *  - reportData   : full API response from GET /api/v1/production-output-report
 *  - organization : authOrganization from useJumboAuth()
 *                   expected to carry: name, logo, address, mainColor, contrastText, lightColor
 *  - user         : user object from useJumboAuth() — { name }
 */
const ProductionOutputReportPdf = ({ reportData, organization, user }) => {
  // ── Branding — read from authOrganization, mirroring IncomeStatementPDF ──
  const mainColor = organization?.mainColor || '#1E3A5F';
  const contrastText = organization?.contrastText || '#FFFFFF';
  const lightColor = organization?.lightColor || '#E8EEF5';

  const { period, summary, batches } = reportData;

  const orgName = organization?.name || '';
  const orgLogo = organization?.logo || null;
  const orgAddress = organization?.address || '';
  const userName = user?.name || '';

  // Use readableDate from the shared helper with the same `true` flag that
  // OutputReport.jsx uses throughout (e.g. readableDate(report?.period?.from, true)).
  const periodLabel = `${readableDate(period?.from, true)} – ${readableDate(period?.to, true)}`;
  const printedOn = readableDate(new Date().toISOString(), true);

  // Column defs for the batch header label row — order matches the Grid
  // columns in OutputReport's AccordionSummary (batchNo, start, end,
  // work_center, cost_center, output_value, by_product_value).
  const batchHeaderCols = [
    { label: 'Batch #', width: '20%' },
    { label: 'Start Date', width: '16%' },
    { label: 'Work Center', width: '16%' },
    { label: 'Cost Center', width: '16%' },
    { label: 'Output Value', width: '16%', right: true },
    { label: 'By-Product Val', width: '16%', right: true },
  ];

  return (
    <Document
      title={`Production Output Report ${periodLabel}`}
      author={userName}
      creator='ERP System'
    >
      <Page size='A4' orientation='landscape' style={styles.page}>
        {/* ── PAGE HEADER ── */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization?.organization} />
          </View>

          {/* Right: report title + period */}
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Production Output Report
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>Period: {periodLabel}</Text>
          </View>
        </View>

        {/* ── META STRIP ── */}
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Report Period
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{periodLabel}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{userName}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{printedOn}</Text>
          </View>
        </View>

        {/* ── KPI CARDS ──
            Mirrors the three <SummaryCard> components in OutputReport.jsx */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}>
            <Text style={[styles.kpiLabel, { color: mainColor }]}>
              Total Batches
            </Text>
            {/* report.summary?.total_batches ?? 0 */}
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {summary?.total_batches ?? 0}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}>
            <Text style={[styles.kpiLabel, { color: mainColor }]}>
              Total Output Value
            </Text>
            {/* formatCurrency(report.summary?.total_output_value) */}
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {formatCurrency(summary?.total_output_value)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#888888' }]}>
            <Text style={[styles.kpiLabel, { color: '#888888' }]}>
              By-Product Value
            </Text>
            {/* formatCurrency(report.summary?.total_by_product_value) */}
            <Text style={[styles.kpiValue, { color: '#888888' }]}>
              {formatCurrency(summary?.total_by_product_value)}
            </Text>
          </View>
        </View>

        {/* ── PRODUCT SUMMARY TABLE ──
            Mirrors report.summary?.products table (first Accordion) */}
        <SectionHeading label='Product Summary' color={mainColor} />
        <ProductSummaryTable
          products={summary?.products}
          mainColor={mainColor}
          contrastText={contrastText}
          lightColor={lightColor}
        />

        {/* ── BATCH DETAIL ── */}
        <SectionHeading label='Batch Detail' color={mainColor} />

        {(batches || []).map((batch, i) => (
          <React.Fragment key={i}>
            <View
              // key={i + 0.1}
              style={[
                pdfStyles.tableRow,
                {
                  marginTop: i > 0 ? 3 : 1,
                },
              ]}
            >
              {batchHeaderCols.map((col, i) => (
                <Text
                  key={i}
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: col.width,
                  }}
                >
                  {col.label}
                </Text>
              ))}
            </View>
            <BatchBlock
              // key={batch.id}
              batch={batch}
              index={i}
              mainColor={mainColor}
              contrastText={contrastText}
              lightColor={lightColor}
            />
          </React.Fragment>
        ))}

        {/* ── PAGE FOOTER ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {orgName} — Production Output Report
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
          <Text style={styles.footerText}>Period: {periodLabel}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProductionOutputReportPdf;
