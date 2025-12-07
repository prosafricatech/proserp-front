import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { DippingDetails } from './DippingsTypes';
import { Organization } from '@/types/auth-types';

const safe = (value: any, fallback = 'N/A') => (value !== null && value !== undefined ? value : fallback);

interface DippingsPDFProps {
  dippingData: DippingDetails;
  organization: Organization;
  productOptions?: any[]; // optional if used elsewhere
}

const DippingsPDF: React.FC<DippingsPDFProps> = ({ 
  dippingData, 
  organization 
}) => {
  const mainColor = organization?.settings?.main_color ?? '#2113AD';
  const lightColor = organization?.settings?.light_color ?? '#bec5da';
  const contrastText = organization?.settings?.contrast_text ?? '#FFFFFF';

  const orgName = safe(organization?.name, 'Organization');
  const stationName = safe(dippingData?.station?.name, 'Unknown Station');
  const creatorName = safe(dippingData?.creator?.name, 'Unknown User');
  const asAtDate = dippingData?.as_at ? readableDate(dippingData.as_at, true) : 'N/A';
  const remarks = safe(dippingData?.remarks, '-');

  const readings = Array.isArray(dippingData?.readings) ? dippingData.readings : [];

  return (
    <Document
      title={`Fuel Station Dippings | ${orgName}`}
      author={creatorName}
      subject="Fuel Station Dippings"
      creator="Powered By ProsERP"
      producer="ProsERP"
    >
      <Page size="A4" style={pdfStyles.page}>
        {/* Header – Logo + Title */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Dippings</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{stationName}</Text>
          </View>
        </View>

        {/* As At Date */}
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>As At</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{asAtDate}</Text>
          </View>
        </View>

        {/* Readings Table */}
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ ...pdfStyles.table, padding: 3, flex: 1, marginTop: 15 }}>
            {/* Table Header */}
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                Tank
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
                Product
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Reading
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1 }}>
                Deviation
              </Text>
            </View>

            {/* Table Body – no more crashes even if some fields are missing */}
            {readings.length > 0 ? (
              readings.map((reading, index) => (
                <View key={reading.id ?? index} style={pdfStyles.tableRow}>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1.5,
                    }}
                  >
                    {safe(reading?.tank?.name)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1.5,
                    }}
                  >
                    {safe(reading?.product?.name)}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {typeof reading?.reading === 'number'
                      ? reading.reading.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                      : '0.000'}
                  </Text>
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    {typeof reading?.deviation === 'number'
                      ? reading.deviation.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                      : '0.000'}
                  </Text>
                </View>
              ))
            ) : (
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, padding: 10, textAlign: 'center', flex: 1 }}>
                  No readings available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remarks */}
        <View style={{ ...pdfStyles.tableRow, marginTop: 5 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Remarks</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{remarks}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default DippingsPDF;