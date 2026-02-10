import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '@/components/pdf/PageFooter';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Organization } from '@/types/auth-types';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { Requisition, RequisitionItem } from '../../RequisitionType';

interface Creator {
  name: string;
}

interface Approval {
  id: number;
  approval_date: string;
  items: RequisitionItem[];
  requisition: Requisition;
  creator: Creator;
  remarks?: string;
  amount: number;
  vat_amount: number;
  status?: string;
}

interface ApprovalPDFProps {
  approval: Approval;
  organization: Organization;
}

function ApprovalPDF({ approval, organization }: ApprovalPDFProps) {
  const mainColor = organization.settings?.main_color || "#2113AD";
  const lightColor = organization.settings?.light_color || "#bec5da";
  const contrastText = organization.settings?.contrast_text || "#FFFFFF";

  const totalVAT = approval.items
    ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
    .reduce((total: number, item: RequisitionItem) => 
      total + (item.rate * item.quantity * (item.vat_percentage || 0) * 0.01), 0) || 0;

  const grandTotal = approval.items
    ?.reduce((total: number, item: RequisitionItem) => 
      total + (item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01)), 0) || 0;

  return (
    <Document 
      title={`Approval`}
      subject='Approval'
      creator='ProsERP'
      producer='ProsERP'
    >
      <Page size="A4" style={pdfStyles.page}>
        {approval.status?.toLowerCase() === 'rejected' && (
          <View style={pdfStyles.watermark} fixed>
            <Text style={pdfStyles.watermarkText}>REJECTED</Text>
          </View>
        )}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
            <PdfLogo organization={organization}/>
          </View>
          <View style={{ flex: 1, textAlign: 'right' }}>
            <Text style={{...pdfStyles.majorInfo, color: mainColor }}>
              {approval.requisition.process_type?.toLowerCase() === 'purchase' 
                ? 'Purchase Requisition Approval' 
                : 'Payment Requisition Approval'}
            </Text>
            <Text style={{ ...pdfStyles.midInfo }}>{approval.requisition.requisitionNo}</Text>
          </View>
        </View>
        
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
          <View style={{ flex: 1, padding: 0.5 }}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Approval Date</Text>
            <Text style={{...pdfStyles.minInfo }}>{readableDate(approval.approval_date)}</Text>
          </View>
        </View>
        
        <View style={{...pdfStyles.table, minHeight: 150, marginBottom: 50}}>
          <View style={pdfStyles.tableRow}>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>S/N</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.35 }}>
                {approval.requisition.process_type?.toLowerCase() === 'purchase' ? 'Product' : 'Ledger'}
            </Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Rate</Text>
            {approval.requisition.process_type?.toLowerCase() === 'purchase' && approval.vat_amount > 0 && (
                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>VAT</Text>
            )}
            <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Amount</Text>
          </View>
          
          {approval.items?.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={pdfStyles.tableRow}>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.05 }}>
                  {index + 1}
                </Text>
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                    flex: 0.35,
                    flexDirection: 'column',
                  }}
                >
                  <Text>
                    {approval.requisition.process_type?.toLowerCase() === 'purchase'
                      ? item.requisition_product?.product?.name
                      : item.requisition_ledger_item?.ledger?.name}
                  </Text>
                  {item.relatableNo && <Text>{`${item.relatableNo}`}</Text>}
                  {item.remarks && <Text>{`(${item.remarks})`}</Text>}
                </View>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                  {item.quantity?.toLocaleString()} {item.measurement_unit?.symbol || item.requisition_ledger_item?.measurement_unit?.symbol}
                </Text>
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                  {item.rate?.toLocaleString()}
                </Text>
                {approval.requisition.process_type?.toLowerCase() === 'purchase' && approval.vat_amount > 0 && (
                  <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                    {((item.rate * (item.vat_percentage || 0) * 0.01) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </Text>
                )}
                <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                  {(item.quantity * item.rate * (1 + ((item.vat_percentage || 0) * 0.01))).toLocaleString('en-US', { 
                    style: 'currency', 
                    currency: approval.requisition.currency?.code 
                  })}
                </Text>
              </View>

              {Array.isArray(item?.vendors) && item.vendors.length > 0 && (
                <React.Fragment>
                  <View style={pdfStyles.tableRow}>
                    <Text style={{ ...pdfStyles.tableCell, flex: 0.05 }}></Text>
                    <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.95, textAlign: 'center' }}>
                      Vendors
                    </Text>
                  </View>

                  {item.vendors?.map((vendor, i) => (
                    <View key={vendor.id} style={{ ...pdfStyles.tableRow }}>
                      <Text style={{ ...pdfStyles.tableCell, flex: 0.05 }}></Text>
                      <Text style={{ ...pdfStyles.tableCell, flex: 0.58, paddingLeft: 10, backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor }}>
                        {vendor.name}
                      </Text>
                      <Text style={{ ...pdfStyles.tableCell, flex: 0.42, paddingLeft: 10, backgroundColor: i % 2 === 0 ? '#FFFFFF' : lightColor }}>
                        {vendor.remarks}
                      </Text>
                    </View>
                  ))}
                  <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <Text style={{ flex: 1 }}></Text>
                  </View>
                </React.Fragment>
              )}
            </React.Fragment>
          ))}
        </View>
        
        <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
          <Text style={{ flex: 4.5 }}></Text>
          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
            Total
          </Text>
          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
            {approval?.items?.reduce((total, item) =>total + (item.quantity || 0) * (item.rate || 0),0).toLocaleString('en-US', { 
              style: 'currency', 
              currency: approval.requisition.currency?.code 
            })}
          </Text>
        </View>
        
        {approval.requisition.process_type?.toLowerCase() === 'purchase' && totalVAT > 0 && (
          <>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
              <Text style={{ flex: 4.5 }}></Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                VAT
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                {totalVAT.toLocaleString('en-US', { 
                  style: 'currency', 
                  currency: approval.requisition.currency?.code 
                })}
              </Text>
            </View>
            <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
              <Text style={{ flex: 4.5 }}></Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                Grand Total (VAT Incl.)
              </Text>
              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                {grandTotal.toLocaleString('en-US', { 
                  style: 'currency', 
                  currency: approval.requisition.currency?.code 
                })}
              </Text>
            </View>
          </>
        )}
        
        {approval.remarks && (
          <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
            <View style={{ flex: 1, padding: 0.5}}>
              <Text style={{...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
              <Text style={{...pdfStyles.minInfo }}>{approval.remarks}</Text>
            </View>
          </View>
        )}
        
        <View style={{ ...pdfStyles.tableRow, marginBottom: 10}}>
          <View style={{ flex: 1, padding: 0.5}}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Requested By:</Text>
            <Text style={{...pdfStyles.minInfo }}>{approval.requisition.creator.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 0.5}}>
            <Text style={{...pdfStyles.minInfo, color: mainColor }}>Approved By:</Text>
            <Text style={{...pdfStyles.minInfo }}>{approval.creator?.name}</Text>
          </View>
        </View>
        
        <PageFooter/>
      </Page>
    </Document>
  );
}

export default ApprovalPDF;