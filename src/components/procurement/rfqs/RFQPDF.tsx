import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import DocumentStakeholders from '@/components/pdf/DocumentStakeholders';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { Organization } from '@/types/auth-types';
import { RFQ, RFQStakeholder } from './rfq-types';

const styles = pdfStyles;

interface RFQPDFProps {
  rfq: RFQ;
  supplier: RFQStakeholder;
  organization: Organization;
}

function RFQPDF({ rfq, supplier, organization }: RFQPDFProps) {
  const mainColor = (organization?.settings as any)?.main_color || '#2113AD';
  const lightColor = (organization?.settings as any)?.light_color || '#bec5da';
  const contrastText = (organization?.settings as any)?.contrast_text || '#FFFFFF';

  return (
    <Document
      title={rfq.rfqNo}
      author={rfq.creator?.name}
      subject="Request for Quotation"
      creator="ProsERP"
      producer="ProsERP"
      keywords={supplier?.name}
    >
      <Page size="A4" style={styles.page}>
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
              REQUEST FOR QUOTATION
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>{rfq.rfqNo}</Text>
          </View>
        </View>

        <DocumentStakeholders
          fromLabel="FROM"
          toLabel="SUPPLIER"
          stakeholder={supplier as any}
          organization={organization}
        />

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
              RFQ Date
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{readableDate(rfq.rfq_date)}</Text>
          </View>
          {!!rfq.response_deadline && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
                Respond By
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{readableDate(rfq.response_deadline)}</Text>
            </View>
          )}
          {!!rfq.reference && (
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
                Reference
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{rfq.reference}</Text>
            </View>
          )}
        </View>

        <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo }}>
              Please submit your quotation for the items listed below
              {rfq.response_deadline ? ` on or before ${readableDate(rfq.response_deadline)}` : ''}.
            </Text>
          </View>
        </View>

        <View style={{ ...pdfStyles.table }}>
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>
              S/N
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 4 }}>
              Product/Service
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>
              Unit
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 0.8 }}>
              Quantity
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.tableHeader, ...styles.midInfo, backgroundColor: mainColor, color: contrastText, flex: 2.5 }}>
              Remarks
            </Text>
          </View>
          {(rfq.items || []).map((item: any, index: number) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3 }}>
                {index + 1}
              </Text>
              <Text style={{ ...styles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 4 }}>
                {item.product?.name || item.product?.item_name || 'Item'}
              </Text>
              <Text style={{ ...styles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.8 }}>
                {item.measurement_unit?.symbol}
              </Text>
              <Text style={{ ...styles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.8, textAlign: 'right' }}>
                {item.quantity}
              </Text>
              <Text style={{ ...styles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 2.5 }}>
                {item.remarks || ''}
              </Text>
            </View>
          ))}
        </View>

        {!!rfq.remarks && (
          <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
                Remarks
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>{rfq.remarks}</Text>
            </View>
          </View>
        )}

        <View style={{ ...pdfStyles.tableRow, marginTop: 50 }}>
          <View style={{ flex: 0.8 }}></View>
          <View style={{ flex: 0.2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>
              Issued By:
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{rfq.creator?.name}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export default RFQPDF;
