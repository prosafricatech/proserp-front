import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function SubContractMaterialUsedPDF({SubContractMaterialUsedDetails,organization}) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  return (
    <Document 
        title={`${SubContractMaterialUsedDetails.issueNo}`}
        author={`${SubContractMaterialUsedDetails.creator?.name}`}
        subject='Subcontract Material Used'
        creator='ProsERP'
        producer='ProsERP'
    >
            <Page size="A4" style={pdfStyles.page}>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                    <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization}/>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{...pdfStyles.majorInfo, color: mainColor }}>Subcontract Material Used</Text>
                        <Text style={{ ...pdfStyles.minInfo, }}>{SubContractMaterialUsedDetails.issueNo}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                    <View style={{ flex: 0.5, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Issue Date</Text>
                        <Text style={{...pdfStyles.minInfo }}>{readableDate(SubContractMaterialUsedDetails.issue_date, false)}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Project</Text>
                        <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.subcontract.project.name}</Text>
                    </View>
                    <View style={{ flex: 0.5, padding: 2 }}>
                        {SubContractMaterialUsedDetails.reference && <Text style={{...pdfStyles.minInfo, color: mainColor }}>Reference</Text>}
                        {SubContractMaterialUsedDetails.reference && <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.reference}</Text>}
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow,marginBottom: 10}}>
                    <View style={{ flex: 0.5, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Subcontract No</Text>
                        <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.subcontract.subcontractNo}</Text>
                    </View>
                    <View style={{ flex: 1.5, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor }}>Subcontractor name</Text>
                        <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.subcontract.subcontractor.name}</Text>
                    </View>
                </View>
                <View style={{...pdfStyles.table, minHeight: 200 }}>
                    <View style={pdfStyles.tableRow}>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText,  flex : 0.3 }}>S/N</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 3 }}>Material</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.5 }}>Unit</Text>
                        <Text style={{...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.8 }}>Quantity</Text>
                    </View>
                    {
                        SubContractMaterialUsedDetails.items.map((item,index) => (
                            <View key={item.id} style={pdfStyles.tableRow}>
                                <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.3 }}>{index+1}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 3 }}>{item.product.name}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.5 }}>{item.measurement_unit.symbol}</Text>
                                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.8, textAlign : 'right'}}>{item.quantity}</Text>
                            </View>
                        ))
                    }
                </View> 
                {!!SubContractMaterialUsedDetails?.remarks &&
                    <View style={{ ...pdfStyles.tableRow,marginTop: 5}}>
                        <View style={{ flex: 1}}>
                            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                            <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.remarks}</Text>
                        </View>
                    </View>
                }
                <View style={{ ...pdfStyles.tableRow,marginTop: 20}}>
                    <View style={{ flex: 0.4, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, paddingBottom: 10 }}>Issued By:</Text>
                        <Text style={{...pdfStyles.minInfo }}>{SubContractMaterialUsedDetails.creator?.name}</Text>
                    </View>
                    <View style={{ flex: 0.4, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, paddingBottom: 10 }}>Received By:</Text>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline'}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                    </View>
                    <View style={{ flex: 0.2, padding: 2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, paddingBottom: 10, paddingLeft: 3 }}>Signature</Text>
                        <Text style={{...pdfStyles.minInfo, textDecoration: 'underline', paddingLeft: 3}}>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Text>
                    </View>
                </View>
                <PageFooter/>
            </Page>
    </Document>
  )
}

export default SubContractMaterialUsedPDF