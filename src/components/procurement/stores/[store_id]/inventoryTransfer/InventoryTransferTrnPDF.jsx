import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function InventoryTransferTrnPDF({trn,organization}) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Document 
        title={`${trn.trnNo}`}
        // author={`${}`}
        subject='TRN'
        creator='ProsERP'
        producer='ProsERP'
        // keywords={}
    >
        <Page size="A4" style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization}/>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                     <Text style={{...pdfStyles.majorInfo, color: mainColor }}>TRN</Text>
                    <Text style={{ ...pdfStyles.minInfo, }}>{trn.trnNo}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                <View style={{ flex: 1, padding: 0.5}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Transfer No</Text>
                    <Text style={{...pdfStyles.minInfo }}>{trn.transfer.transferNo}</Text>
                </View>
                <View style={{ flex: 1, padding: 0.5 }}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Date Received</Text>
                    <Text style={{...pdfStyles.minInfo }}>{readableDate(trn.date_received)}</Text>
                </View>
                <View style={{ flex: 1, padding: 0.5}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Received by</Text>
                    <Text style={{...pdfStyles.minInfo }}>{trn.creator.name}</Text>
                </View>
            </View>
            <View style={{...pdfStyles.table, minHeight: 80}}>
                <View style={pdfStyles.tableRow}>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText,  flex : 0.5 }}>S/N</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 3 }}>Product</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 1 }}>Units</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 1.5}}>Quantity</Text>
                </View>
                {
                        trn.items.map((item,index) => (
                            <View key={index} style={pdfStyles.tableRow}>
                                <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.5 }}>{index+1}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 3 }}>{item.product.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1 }}>{item.measurement_unit.symbol}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 1.5, textAlign:'right'}}>{item.quantity}</Text>
                            </View>
                        ))
                    }
            </View>
            <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                <View style={{ flex: 1, padding: 0.5}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                    <Text style={{...pdfStyles.minInfo }}>{trn.remarks}</Text>
                </View>
            </View>
            <PageFooter/>
        </Page>
    </Document>
  )
}

export default InventoryTransferTrnPDF