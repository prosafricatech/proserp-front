import { Document, Page, Text, View } from '@react-pdf/renderer'
import React from 'react'
import pdfStyles from '../../../../pdf/pdf-styles';
import PdfLogo from '../../../../pdf/PdfLogo';
import PageFooter from '../../../../pdf/PageFooter';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import { Organization } from '@/types/auth-types';
import { MeasurementUnit } from '@/components/masters/measurementUnits/MeasurementUnitType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { Product } from '@/components/productAndServices/products/ProductType';

interface SalesDispatchReportProps {
  organization: Organization;
  dispatchReport: DispatchReport;
}

interface DispatchedItem {
  deliveryNo: string;
  dispatch_date: string;
  quantity: number;
  productId: string;
  measurement_unit: MeasurementUnit;
}

interface DispatchItem {
  id: string;
  product: Product;
  quantity: number;
  measurement_unit: MeasurementUnit;
  dispatched_items: DispatchedItem[];
}

interface Creator {
  name: string;
}

interface DispatchReport {
  saleNo: string;
  transaction_date: string;
  items: DispatchItem[];
  creator?: Creator;
  stakeholder?: Stakeholder;
}

interface GroupedDispatchedItem {
  deliveryNo: string;
  dispatch_date: string;
  products: {
    productId: string;
    quantity: number;
    measurement_unit: MeasurementUnit;
  }[];
}

const SalesDispatchReport: React.FC<SalesDispatchReportProps> = ({
  organization,
  dispatchReport
}) => {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const groupedDispatchedItems = dispatchReport.items.reduce((acc: Record<string, GroupedDispatchedItem>, item) => {
    item.dispatched_items.forEach((dispatchedItem) => {
      const key = dispatchedItem.deliveryNo;
      if (!acc[key]) {
        acc[key] = {
          deliveryNo: key,
          dispatch_date: dispatchedItem.dispatch_date,
          products: [],
        };
      }
      acc[key].products.push({
        productId: item.id,
        quantity: dispatchedItem.quantity,
        measurement_unit: item.measurement_unit,
      });
    });
    return acc;
  }, {});
  
  const dispatchedItems = Object.values(groupedDispatchedItems);
  
  return (
    <Document 
      title={`${dispatchReport.saleNo}`}
      author={`${dispatchReport.creator?.name}`}
      subject='SALES DISPATCH REPORT'
      creator='ProsERP'
      producer='ProsERP'
      keywords={dispatchReport.stakeholder?.name}
    >
      <Page 
        size={dispatchedItems.length > 8 ? "A3" : "A4"} 
        orientation={dispatchedItems.length > 3 ? 'landscape' : undefined} 
        style={pdfStyles.page}
      >
        <View style={{ ...pdfStyles.tableRow, marginBottom: 30}}>
          <View style={{ flex: 1, maxWidth: (organization?.settings?.logo_path ? 130 : 250)}}>
            <PdfLogo organization={organization} />
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>SALES DISPATCH REPORT</Text>
            <Text style={{ ...pdfStyles.midInfo }}>{dispatchReport.saleNo}</Text>
            <Text style={{ ...pdfStyles.minInfo }}>{`As at: ${readableDate(undefined,true)}`}</Text>
          </View>
        </View>
        <View style={{ ...pdfStyles.table, minHeight: 230 }}>
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.5 }}>
              <Text style={{ ...pdfStyles.tableCell}}>S/N</Text>
            </View>
            <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 4 }}>
              <Text style={{ ...pdfStyles.tableCell}}>Products</Text>
            </View>
            <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.6 }}>
              <Text style={{ ...pdfStyles.tableCell}}>Unit</Text>
            </View>
            <View style={{ ...pdfStyles.tableCell, ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 1.5 }}>
              <Text style={{ ...pdfStyles.tableCell}}>Ordered</Text>
              <Text style={{ ...pdfStyles.tableCell}}>{readableDate(dispatchReport.transaction_date)}</Text>
            </View>

            {/* Dynamic headers based on deliveryNo */}
            {dispatchedItems.map(item => (
              <View 
                key={item.deliveryNo} 
                style={{ 
                  ...pdfStyles.tableCell, 
                  ...pdfStyles.tableHeader, 
                  backgroundColor: mainColor, 
                  color: contrastText, 
                  flex: 1.5 
                }}
              >
                <Text style={{ ...pdfStyles.tableCell}}>{item.deliveryNo}</Text>
                <Text style={{ ...pdfStyles.tableCell}}>{readableDate(item.dispatch_date)}</Text>
              </View>
            ))}

            <View style={{ 
              ...pdfStyles.tableCell, 
              ...pdfStyles.tableHeader, 
              backgroundColor: mainColor, 
              color: contrastText, 
              flex: 1.5 
            }}>
              <Text style={{ ...pdfStyles.tableCell}}>Balance</Text>
              <Text style={{ ...pdfStyles.tableCell}}>{readableDate()}</Text>
            </View>
          </View>
          
          {/* Render table rows */}
          {dispatchReport.items.map((item, index) => {
            const totalDispatchedQuantity = dispatchedItems.reduce((total, dispatchedItem) => {
              const product = dispatchedItem.products.find(p => p.productId === item.id);
              return total + (product ? product.quantity : 0);
            }, 0);

            const undispatchedQuantity = item.quantity - totalDispatchedQuantity;

            return (
              <View key={item.id} style={pdfStyles.tableRow}>
                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                  flex: 0.5 
                }}>
                  {index + 1}
                </Text>
                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                  flex: 4 
                }}>
                  {item.product.name}
                </Text>
                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                  flex: 0.6 
                }}>
                  {item.measurement_unit.symbol}
                </Text>
                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                  flex: 1.5, 
                  textAlign: 'right' 
                }}>
                  {item.quantity}
                </Text>

                {/* Render dispatched quantities for each delivery */}
                {dispatchedItems.map((dispatchedItem) => {
                  const product = dispatchedItem.products.find(p => p.productId === item.id);
                  return (
                    <Text 
                      key={dispatchedItem.deliveryNo} 
                      style={{ 
                        ...pdfStyles.tableCell, 
                        backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                        flex: 1.5, 
                        textAlign: 'right' 
                      }}
                    >
                      {product ? Math.floor(product.quantity) : 0}
                    </Text>
                  );
                })}

                {/* Display undispatched quantity */}
                <Text style={{ 
                  ...pdfStyles.tableCell, 
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, 
                  flex: 1.5, 
                  textAlign: 'right' 
                }}>
                  {undispatchedQuantity || 0}
                </Text>
              </View>
            );
          })}
        </View>

        <PageFooter/>
      </Page> 
    </Document>             
  );
};

export default SalesDispatchReport