import { Text, View, Document, Page } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';
import { Organization } from '@/types/auth-types';

interface AlertItem {
  product_name: string;
  threshold: number;
  available_stock: number;
  cost_centers: CostCenter[];
}

interface Store {
  name: string;
  alerts: AlertItem[];
}

interface LowStockStoresPDFProps {
  organization?: Organization | null;
  stores: Store[];
}

function LowStockStoresPDF({ organization = null, stores }: LowStockStoresPDFProps) {
  const mainColor = organization?.settings?.main_color || "#2113AD";
  const lightColor = organization?.settings?.light_color || "#bec5da";
  const contrastText = organization?.settings?.contrast_text || "#FFFFFF";
  const { authUser } = useJumboAuth();

  return (
    <Document 
        creator={` ${authUser?.user?.name} | Powered By ProsERP` }
        producer='ProsERP'
        title={'Low Stock Alerts'}
      >
        <Page size="A4" style={pdfStyles.page}>
          <View style={{ ...pdfStyles.table, marginBottom: 10  }}>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 15}}>
                <View style={{ flex: 1, maxWidth: 100}}>
                  <PdfLogo organization={organization as Organization}/>
                </View>
                <View style={{ flex: 1, textAlign: 'right' }}>
                  <Text style={{...pdfStyles.majorInfo, color: mainColor }}>{`LOW STOCKS ALERTS`}</Text>
                </View>
            </View>
            <View style={{ ...pdfStyles.tableRow}}>
                <View style={{ flex: 1, padding: 0.5}}>
                  <Text style={{...pdfStyles.minInfo, color: mainColor }}>Printed On</Text>
                  <Text style={{...pdfStyles.minInfo }}>{readableDate(undefined,true)}</Text>
                </View>
            </View>
          </View>
          {stores?.map((store, index) => (
            <React.Fragment key={index}>
              <View style={{ ...pdfStyles.tableRow, marginTop:10 }}>
                <Text style={{...pdfStyles.minInfo, color: mainColor }}>Store: </Text>
                <Text style={{...pdfStyles.minInfo }}>{store.name}</Text>
              </View>
              <View style={{ ...pdfStyles.table, padding:2 }}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>S/N</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Product</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>Threshold</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.3 }}>Available Stock</Text>
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1 }}>Cost Centers</Text>
              </View>
                {
                  store.alerts.map((item, itemIndex) => (
                    <View key={itemIndex} style={pdfStyles.tableRow}>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex:0.2 }}>{itemIndex+1}</Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex:1 }}>{item.product_name}</Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.3, textAlign:'right'  }}>{item.threshold}</Text>
                      <Text style={{ 
                        ...pdfStyles.tableCell, 
                        backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, 
                        flex: 0.3, 
                        textAlign:'right', 
                        color: item.available_stock < (item.threshold/2) ? '#d60404' : '#f54905' 
                      }}>
                        {item.available_stock}
                      </Text>
                      <Text style={{ ...pdfStyles.tableCell, backgroundColor: itemIndex % 2 === 0 ? '#FFFFFF' : lightColor, flex: 1}}>
                        {item.cost_centers.map(cc => cc.name).join(',')}
                      </Text>
                    </View>
                  ))
                }
              </View>
            </React.Fragment>
          ))
          }
        </Page>
    </Document>
  )
}

export default LowStockStoresPDF;