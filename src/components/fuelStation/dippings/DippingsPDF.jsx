import { Document, Page, Text, View } from '@react-pdf/renderer';
import { readableDate } from 'app/helpers/input-sanitization-helpers';
import PdfLogo from 'app/prosServices/prosERP/pdf/PdfLogo';
import pdfStyles from 'app/prosServices/prosERP/pdf/pdf-styles';

function DippingsPDF({ dippingData, organization }) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Document
      title={`Fuel Station Dippings | ${organization.name}`}
      author={dippingData.creator?.name}
      subject={'Fuel Station Dippings'}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size="A4" style={pdfStyles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250) }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>Dippings</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{dippingData.station.name}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>As At</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{readableDate(dippingData.as_at, true)}</Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow }}>
          <View style={{ ...pdfStyles.table, padding: 3, flex: 1,marginTop:15 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Tank</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>Product</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Reading</Text>
              <Text style={{ ...pdfStyles.tableHeader, ...pdfStyles.tableCell, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Deviation</Text>
            </View>
            {dippingData?.readings.map((reading, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5 }}>{reading.tank.name}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1.5}}>{reading.product.name}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{reading.reading.toLocaleString('en-US',{minimumFractionDigits: 3, maximumFractionDigits:3})}</Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1, textAlign: 'right' }}>{reading.deviation.toLocaleString('en-US',{minimumFractionDigits: 3, maximumFractionDigits:3})}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ ...pdfStyles.tableRow, marginTop: 5 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.midInfo, color: mainColor }}>Remarks</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{dippingData.remarks}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default DippingsPDF;
