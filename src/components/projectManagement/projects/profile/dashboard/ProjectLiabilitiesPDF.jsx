import PdfLogo from '@/components/pdf/PdfLogo';
import pdfStyles from '@/components/pdf/pdf-styles';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';

const formatReportAmount = (value) =>
  Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function ProjectLiabilitiesPDF({ organization, project, currencyCode, rows, total }) {
  const mainColor = organization?.settings?.main_color ?? '#2113AD';
  const lightColor = organization?.settings?.light_color ?? '#F4F6FB';
  const contrastText = organization?.settings?.contrast_text ?? '#FFFFFF';
  const organizationName = organization?.name || 'Organization';
  const projectName =
    project?.name || project?.project_name || project?.title || 'Project';

  return (
    <Document
      title={`Project Liabilities Summary | ${organizationName}`}
      author={organizationName}
      subject='Project Liabilities Summary'
      creator='Powered By ProsERP'
      producer='ProsERP'
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              Project Liabilities
            </Text>
            <Text style={pdfStyles.midInfo}>{projectName}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>
            As At
          </Text>
          <Text style={pdfStyles.midInfo}>
            {dayjs().format('DD MMM YYYY, HH:mm')}
          </Text>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Creditor
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
                textAlign: 'right',
              }}
            >
              {currencyCode || 'Amount'}
            </Text>
          </View>

          {rows.length ? (
            rows.map((row, index) => (
              <View style={pdfStyles.tableRow} key={`${row.label}-${index}`}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 2,
                  }}
                >
                  {row.label}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {formatReportAmount(row.value)}
                </Text>
              </View>
            ))
          ) : (
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableCell, padding: 10, flex: 1 }}>
                No liabilities available
              </Text>
            </View>
          )}

          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                backgroundColor: lightColor,
                flex: 2,
              }}
            >
              Total
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                ...pdfStyles.tableCell,
                backgroundColor: lightColor,
                flex: 1,
                textAlign: 'right',
              }}
            >
              {formatReportAmount(total)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default ProjectLiabilitiesPDF;