import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function InventoryTransferPDF({transfer,organization}) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Document 
        title={`${transfer.transferNo}`}
        subject='transfers Invoice'
        creator='ProsERP'
        producer='ProsERP'
    >
        <Page size="A4" style={pdfStyles.page}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                    <PdfLogo organization={organization}/>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                     <Text style={{...pdfStyles.majorInfo, color: mainColor }}>INVENTORY TRANSFER</Text>
                    <Text style={{ ...pdfStyles.minInfo, }}>{transfer.transferNo}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                <View style={{ flex: 1, padding: 0.5 }}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Transfer Date</Text>
                    <Text style={{...pdfStyles.minInfo }}>{readableDate(transfer.transfer_date)}</Text>
                </View>
                {transfer?.type !== 'Cost Center Change' &&
                    <View style={{ flex: 1}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Center</Text>
                        <Text style={{...pdfStyles.minInfo }}>{transfer.source_cost_center.name}</Text>
                    </View>
                }
                <View style={{ flex: 0.6}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>From</Text>
                    <Text style={{...pdfStyles.minInfo }}>{transfer.type === 'Cost Center Change' ? `${transfer.source_cost_center?.name}` : `${transfer.source_store.name}`}</Text>
                </View>
                <View style={{ flex: 0.4}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>To</Text>
                    <Text style={{...pdfStyles.minInfo }}>{transfer.type === 'Cost Center Change' ? `${transfer.destination_cost_center?.name}` : `${transfer.destination_store.name}`}</Text>
                </View>
            </View>
            <View style={{...pdfStyles.table, minHeight: 230 }}>
                <View style={pdfStyles.tableRow}>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText,  flex : 0.05 }}>S/N</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.6 }}>Product</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.15 }}>Unit</Text>
                    <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.2, textAlign:'right'}}>Quantity</Text>
                </View>
                {
                        transfer.items.map((transfersItem,index) => (
                            <View key={transfersItem.id} style={pdfStyles.tableRow}>
                                <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.05 }}>{index+1}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.6 }}>{transfersItem.product.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.15 }}>{transfersItem.measurement_unit?.symbol}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.2, textAlign:'right'}}>{transfersItem.quantity}</Text>
                            </View>
                        ))
                    }
            </View>
            <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                { transfer.vehicle_information !== null &&
                    <View style={{ flex: 0.6}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Vehicle Information</Text>
                        <Text style={{...pdfStyles.minInfo }}>{`${transfer.vehicle_information}`}</Text>
                    </View>
                }
                {transfer.driver_information !== null &&
                    <View style={{ flex: 0.4}}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Driver Information</Text>
                        <Text style={{...pdfStyles.minInfo }}>{`${transfer.driver_information}`}</Text>
                    </View>
                }
            </View>
            <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                <View style={{ flex: 0.6}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
                    <Text style={{...pdfStyles.minInfo }}>{`${transfer.narration}`}</Text>
                </View>
                <View style={{ flex: 0.4}}>
                    <Text style={{...pdfStyles.minInfo, color: mainColor }}>Transfered By</Text>
                    <Text style={{...pdfStyles.minInfo }}>{`${transfer.creator.name}`}</Text>
                </View>
            </View>
            <PageFooter/>
        </Page>
    </Document>
  )
}

export default InventoryTransferPDF