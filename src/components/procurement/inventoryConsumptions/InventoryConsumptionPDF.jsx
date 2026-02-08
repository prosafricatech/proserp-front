import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import {Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'

function InventoryConsumptionPDF({inventoryConsumption,authObject}) {
  const {authOrganization : { organization }, authUser : { user}} = authObject;
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const transformedItems = inventoryConsumption.items.map((item, index) => {
    const journal = inventoryConsumption.journals[index];
    return {
      ...item,
      ledger: journal?.debit_ledger ,
    };
  });

  return (
    <Document
        title={`${inventoryConsumption.consumptionNo} | ${organization.name}`}
        author={inventoryConsumption.creator.name}
        subject={'Inventory Consumption Document'}
        keywords={inventoryConsumption.narration}
        creator={`${user && user.name} | Powered By ProsERP`}
        producer='ProsERP'
    >
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
              <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                  <PdfLogo organization={organization}/>
              </View>
              <View style={{ flex: 1, textAlign: 'right' }}>
                  <Text style={{...pdfStyles.majorInfo, color: mainColor }}>INVENTORY CONSUMPTION</Text>
                  <Text style={{ ...pdfStyles.midInfo}}>{inventoryConsumption.consumptionNo}</Text>
              </View>
          </View>
          <View style={{ ...pdfStyles.tableRow}}>
            <View style={{ flex: 1, padding: 2 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Consumption Date</Text>
                <Text style={{...pdfStyles.minInfo }}>{readableDate(inventoryConsumption.consumption_date)}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Store</Text>
                <Text style={{...pdfStyles.minInfo }}>{inventoryConsumption.store.name}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Cost Center</Text>
                <Text style={{...pdfStyles.minInfo }}>{inventoryConsumption.cost_center.name}</Text>
            </View>
          </View>
          <View style={{...pdfStyles.table, minHeight: 230,marginTop: 10 }}>
            <View style={pdfStyles.tableRow}>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.05 }}>S/N</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.45 }}>Product</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.4 }}>Expense Ledger</Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex : 0.1}}>Quantity</Text>
            </View>
            {
              transformedItems.map((item,index) => (
                  <View key={index} style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.05 }}>{index+1}</Text>
                    <View
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.45,
                        flexDirection: 'column',
                      }}
                    >
                      <Text>
                        {item.product.name}
                      </Text>

                      {item.description && (
                        <Text>
                          {`(${item.description})`}
                        </Text>
                      )}
                    </View>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.4 }}>{item.ledger.name}</Text>
                    <Text style={{ ...pdfStyles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex : 0.1, textAlign : 'right' }}>{item.quantity} {item.measurement_unit.symbol}</Text>
                  </View>
                )
              )
            }
          </View>
          <View style={{ ...pdfStyles.tableRow,marginTop: 20}}>
            <View style={{ flex: 1, padding: 2 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Narration</Text>
                <Text style={{...pdfStyles.minInfo }}>{inventoryConsumption.narration}</Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Posted By</Text>
                <Text style={{...pdfStyles.minInfo }}>{inventoryConsumption.creator.name}</Text>
            </View>
          </View>
        </Page>
      </Document>
  )
}

export default InventoryConsumptionPDF