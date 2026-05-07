import { Fragment, JSX } from 'react';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { OutputReportResponse } from './productionReportsServices';

interface OrganizationLike {
  mainColor?: string;
  contrastText?: string;
  lightColor?: string;
  organization?: unknown;
}

interface UserLike {
  name?: string;
}

interface ProductionOutputReportPdfProps {
  reportData: OutputReportResponse;
  organization?: OrganizationLike | null;
  user?: UserLike | null;
}

type SummaryProduct = OutputReportResponse['summary']['products'][number];
type OutputBatch = OutputReportResponse['batches'][number];
type OutputItem = OutputBatch['outputs'][number];
type ByProductItem = OutputBatch['by_products'][number];

interface ColumnDefinition {
  label: string;
  width: string;
  right?: boolean;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
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
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  table: {
    width: '100%',
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
  batchBlock: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#DDDDDD',
    borderRadius: 2,
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

const formatCurrency = (value: number | string | undefined): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number | string | undefined): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const formatUnitCost = (value: number | string | undefined): string =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

interface SectionHeadingProps {
  label: string;
  color: string;
}

function SectionHeading({ label, color }: SectionHeadingProps): JSX.Element {
  return <Text style={[styles.sectionHeading, { color }]}>{label}</Text>;
}

interface TableHeaderRowProps {
  columns: ColumnDefinition[];
  contrastText: string;
  mainColor: string;
}

function TableHeaderRow({
  columns,
  contrastText,
  mainColor,
}: TableHeaderRowProps): JSX.Element {
  return (
    <View style={pdfStyles.tableRow}>
      {columns.map((column) => (
        <Text
          key={`${column.label}-${column.width}`}
          style={[
            column.right ? styles.tableCellRight : styles.tableCell,
            {
              ...pdfStyles.tableHeader,
              backgroundColor: mainColor,
              color: contrastText,
              width: column.width,
            },
          ]}
        >
          {column.label}
        </Text>
      ))}
    </View>
  );
}

interface ProductSummaryTableProps {
  products?: SummaryProduct[];
  mainColor: string;
  contrastText: string;
  lightColor: string;
}

function ProductSummaryTable({
  products,
  mainColor,
  contrastText,
  lightColor,
}: ProductSummaryTableProps): JSX.Element {
  const columns: ColumnDefinition[] = [
    { label: 'Finished Product', width: '20%' },
    { label: 'Unit', width: '16%' },
    { label: 'Qty Produced', width: '16%' },
    { label: 'Avg Unit Cost', width: '16%' },
    { label: 'Total Value', width: '16%' },
    { label: 'Batches', width: '16%' },
  ];

  return (
    <View style={styles.table}>
      <TableHeaderRow
        columns={columns}
        contrastText={contrastText}
        mainColor={mainColor}
      />
      {(products || []).map((item, index) => (
        <View
          key={`${item.product?.id || index}-${index}`}
          style={pdfStyles.tableRow}
        >
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '20%',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {item.product?.name}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '16%',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {item.measurement_unit?.symbol || item.measurement_unit?.name}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '16%',
              textAlign: 'right',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {formatQuantity(item.total_quantity)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '16%',
              textAlign: 'right',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {formatUnitCost(item.average_unit_cost)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '16%',
              textAlign: 'right',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {formatCurrency(item.total_value)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              width: '16%',
              textAlign: 'right',
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
            }}
          >
            {item.batch_count}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface BatchBlockProps {
  batch: OutputBatch;
  mainColor: string;
  contrastText: string;
  lightColor: string;
}

function BatchBlock({
  batch,
  mainColor,
  contrastText,
  lightColor,
}: BatchBlockProps): JSX.Element {
  const outputColumns: ColumnDefinition[] = [
    { label: 'Product', width: '20%' },
    { label: 'Unit', width: '16%' },
    { label: 'Qty', width: '16%', right: true },
    { label: 'Unit Cost', width: '16%', right: true },
    { label: 'Total Value', width: '16%', right: true },
    { label: 'Value %', width: '16%', right: true },
  ];

  const byProductColumns: ColumnDefinition[] = [
    { label: 'Product', width: '20%' },
    { label: 'Unit', width: '20%' },
    { label: 'Qty', width: '20%', right: true },
    { label: 'Market Value / Unit', width: '20%', right: true },
    { label: 'Total Market Value', width: '20%', right: true },
  ];

  return (
    <View style={styles.batchBlock} wrap={false}>
      <View style={pdfStyles.tableRow}>
        <Text style={{ ...pdfStyles.tableCell, width: '20%' }}>
          {batch.batchNo}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {readableDate(batch.start_date, true)} - {readableDate(batch.end_date, true)}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {batch.work_center?.name}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, width: '16%' }}>
          {batch.work_center?.cost_center?.name}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, textAlign: 'right', width: '16%' }}>
          {formatCurrency(batch.total_output_value)}
        </Text>
        <Text style={{ ...pdfStyles.tableCell, textAlign: 'right', width: '16%' }}>
          {formatCurrency(batch.total_by_product_value)}
        </Text>
      </View>

      <Text style={styles.subSectionHeading}>Outputs</Text>
      <View style={pdfStyles.tableRow}>
        {outputColumns.map((column) => (
          <Text
            key={`${column.label}-${column.width}`}
            style={{
              ...pdfStyles.tableHeader,
              backgroundColor: '#888888',
              color: contrastText,
              width: column.width,
            }}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {(batch.outputs || []).map((output: OutputItem, index) => (
        <View key={output.id} style={pdfStyles.tableRow}>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '20%',
            }}
          >
            {output.product?.name}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
            }}
          >
            {output.measurement_unit?.symbol}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatQuantity(output.quantity)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatUnitCost(output.unit_cost)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatCurrency(output.total_value)}
          </Text>
          <Text
            style={{
              ...pdfStyles.tableCell,
              backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
              width: '16%',
              textAlign: 'right',
            }}
          >
            {formatQuantity(output.value_percentage)}%
          </Text>
        </View>
      ))}

      {(batch.by_products || []).length > 0 && (
        <>
          <Text style={[styles.subSectionHeading, { marginTop: 4 }]}>By-Products</Text>
          <View
            style={{
              ...pdfStyles.tableRow,
              backgroundColor: '#888888',
              paddingHorizontal: 10,
            }}
          >
            {byProductColumns.map((column) => (
              <Text
                key={`${column.label}-${column.width}`}
                style={{
                  ...(column.right ? styles.subTableCellRight : styles.subTableCell),
                  width: column.width,
                  color: '#FFFFFF',
                  fontFamily: 'Helvetica-Bold',
                  fontSize: 7.5,
                }}
              >
                {column.label}
              </Text>
            ))}
          </View>
          {(batch.by_products || []).map((byProduct: ByProductItem, index) => (
            <View
              key={byProduct.id}
              style={[
                styles.subTableRow,
                index % 2 !== 0 ? styles.subTableRowAlt : null,
              ]}
            >
              <Text style={{ ...styles.subTableCell, width: '20%' }}>
                {byProduct.product?.name}
              </Text>
              <Text style={{ ...styles.subTableCell, width: '20%' }}>
                {byProduct.measurement_unit?.symbol}
              </Text>
              <Text style={{ ...styles.subTableCellRight, width: '20%' }}>
                {formatQuantity(byProduct.quantity)}
              </Text>
              <Text style={{ ...styles.subTableCellRight, width: '20%' }}>
                {formatCurrency(byProduct.market_value_per_unit)}
              </Text>
              <Text style={{ ...styles.subTableCellRight, width: '20%' }}>
                {formatCurrency(byProduct.total_market_value)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

function ProductionOutputReportPdf({
  reportData,
  organization,
  user,
}: ProductionOutputReportPdfProps): JSX.Element {
  const mainColor = organization?.mainColor || '#1E3A5F';
  const contrastText = organization?.contrastText || '#FFFFFF';
  const lightColor = organization?.lightColor || '#E8EEF5';

  const { period, summary, batches } = reportData;
  const userName = user?.name || '';
  const periodLabel = `${readableDate(period?.from, true)} - ${readableDate(period?.to, true)}`;
  const printedOn = readableDate(new Date().toISOString(), true);

  const batchHeaderColumns: ColumnDefinition[] = [
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
        <View style={styles.headerRow}>
          <View style={{ flex: 1, maxWidth: 120 }}>
            <PdfLogo organization={organization?.organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Production Output Report
            </Text>
            <Text style={pdfStyles.minInfo}>Period: {periodLabel}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Report Period
            </Text>
            <Text style={pdfStyles.minInfo}>{periodLabel}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={pdfStyles.minInfo}>{userName}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={pdfStyles.minInfo}>{printedOn}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}>
            <Text style={[styles.kpiLabel, { color: mainColor }]}>Total Batches</Text>
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {summary?.total_batches ?? 0}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: mainColor }]}>
            <Text style={[styles.kpiLabel, { color: mainColor }]}>Total Output Value</Text>
            <Text style={[styles.kpiValue, { color: mainColor }]}>
              {formatCurrency(summary?.total_output_value)}
            </Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: '#888888' }]}>
            <Text style={[styles.kpiLabel, { color: '#888888' }]}>By-Product Value</Text>
            <Text style={[styles.kpiValue, { color: '#888888' }]}>
              {formatCurrency(summary?.total_by_product_value)}
            </Text>
          </View>
        </View>

        <SectionHeading label='Product Summary' color={mainColor} />
        <ProductSummaryTable
          products={summary?.products}
          mainColor={mainColor}
          contrastText={contrastText}
          lightColor={lightColor}
        />

        <SectionHeading label='Batch Detail' color={mainColor} />
        {(batches || []).map((batch, index) => (
          <Fragment key={batch.id || index}>
            <View
              style={{
                ...pdfStyles.tableRow,
                marginTop: index > 0 ? 3 : 1,
              }}
            >
              {batchHeaderColumns.map((column) => (
                <Text
                  key={`${column.label}-${column.width}`}
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    width: column.width,
                  }}
                >
                  {column.label}
                </Text>
              ))}
            </View>
            <BatchBlock
              batch={batch}
              mainColor={mainColor}
              contrastText={contrastText}
              lightColor={lightColor}
            />
          </Fragment>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Production Output Report</Text>
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
}

export default ProductionOutputReportPdf;