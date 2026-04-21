import { Document, Page, Text, View } from '@react-pdf/renderer';
import React from 'react';
import pdfStyles from '../pdf/pdf-styles';
import PdfLogo from '../pdf/PdfLogo';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import PageFooter from '../pdf/PageFooter';
import { PaymentItem, PurchaseItem, Requisition, RequisitionItem, Vendor } from './RequisitionType';
import { Organization } from '@/types/auth-types';

interface RequisitionPDFProps {
  requisition: Requisition;
  organization: Organization;
}

type LeaveViewItem = {
    id?: number;
    employee_id?: number;
    start_date?: string;
    end_date?: string;
    days_requested?: number;
    employee?: {
        employee_number?: string;
        first_name?: string;
        last_name?: string;
    };
    leave_type?: {
        name?: string;
    };
};

const normalizeLeaveItem = (item: any): LeaveViewItem => ({
    ...item,
    days_requested: Number(item?.days_requested || 0),
    employee:
        item?.employee ||
        (item?.employee_number || item?.first_name || item?.last_name
            ? {
                employee_number: item?.employee_number,
                first_name: item?.first_name,
                last_name: item?.last_name,
            }
            : undefined),
    leave_type:
        item?.leave_type ||
        (item?.leave_type_name
            ? {
                name: item.leave_type_name,
            }
            : undefined),
});

function RequisitionPDF({ requisition, organization }: RequisitionPDFProps) {
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    const isLeaveRequest = requisition?.approval_chain?.process_type?.toLowerCase() === 'leave_request';
    const requisitionItems: RequisitionItem[] = 'items' in requisition ? (requisition.items || []) : [];
    const leaveSource = (requisition?.leave_items && requisition.leave_items.length ? requisition.leave_items : requisitionItems) || [];
    const leaveItems: LeaveViewItem[] = (leaveSource as any[]).map(normalizeLeaveItem);

    const totalVAT = requisitionItems
        ?.filter((item: RequisitionItem) => (item.vat_percentage || 0) > 0)
        .reduce((total: number, item: RequisitionItem) => 
            total + (item.rate * item.quantity * (item.vat_percentage || 0) * 0.01), 0) || 0;

    const grandTotal = requisitionItems
        ?.reduce((total: number, item: RequisitionItem) => 
            total + (item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01)), 0) || 0;
    const totalLeaveDays = leaveItems.reduce((sum, item) => sum + Number(item.days_requested || 0), 0);


    return (
        <Document
            title={`Requisition`}
            subject="Requisition"
            creator="ProsERP"
            producer="ProsERP"
        >
            <Page size="A4" style={pdfStyles.page}>
                {requisition.status === 'rejected' && (
                    <View style={pdfStyles.watermark} fixed>
                        <Text style={pdfStyles.watermarkText}>REJECTED</Text>
                    </View>
                )}
                <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                    <View style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}>
                        <PdfLogo organization={organization} />
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                            {isLeaveRequest
                                ? 'Leave Request'
                                : requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase'
                                ? 'Purchase Requisition'
                                : 'Payment Requisition'}
                        </Text>
                        <Text style={{ ...pdfStyles.midInfo }}>{requisition.requisitionNo}</Text>
                    </View>
                </View>

                <View style={{ ...pdfStyles.tableRow, marginBottom: 10 }}>
                    <View style={{ flex: 1, padding: 0.5 }}>
                        <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Requisition Date</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{readableDate(requisition?.requisition_date)}</Text>
                    </View>
                    <View style={{ flex: 1, padding: 0.5 }}>
                        <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Cost Center</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{requisition.cost_center?.name}</Text>
                    </View>
                </View>

                <View style={{ ...pdfStyles.table, minHeight: 150, marginBottom: 50 }}>
                    {isLeaveRequest ? (
                      <>
                        <View style={pdfStyles.tableRow}>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.08 }}>S/N</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.26 }}>Employee</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Leave Type</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.16 }}>Start</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.16 }}>End</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.14 }}>Days</Text>
                        </View>

                        {leaveItems.map((item, index) => (
                          <View key={item.id || `${item.employee_id}-${index}`} style={pdfStyles.tableRow}>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.08 }}>
                              {index + 1}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.26 }}>
                                                            {[item.employee?.first_name, item.employee?.last_name, item.employee?.employee_number].filter(Boolean).join(' ')}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2 }}>
                              {item.leave_type?.name || '-'}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.16 }}>
                              {readableDate(item.start_date, false)}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.16 }}>
                              {readableDate(item.end_date, false)}
                            </Text>
                            <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.14, textAlign: 'right' }}>
                              {Number(item.days_requested || 0).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : (
                      <>
                        <View style={pdfStyles.tableRow}>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.05 }}>S/N</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.35 }}>
                              {requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase' ? 'Product' : 'Ledger'}
                          </Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Quantity</Text>
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Rate</Text>
                          {requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase' && requisition.vat_amount > 0 && (
                              <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>VAT</Text>
                          )}
                          <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 0.2 }}>Amount</Text>
                        </View>

                        {requisitionItems.map((item: RequisitionItem, index: number) => (
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
                                            {requisition.approval_chain.process_type.toLowerCase() === 'purchase'
                                                ? (item as PurchaseItem).product?.name
                                                : (item as PaymentItem).ledger?.name}
                                        </Text>
                                        {item.relatableNo && <Text>{`${item.relatableNo}`}</Text>}
                                        {item.remarks && <Text>{`(${item.remarks})`}</Text>}
                                    </View>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                        {item.quantity?.toLocaleString()} {item.measurement_unit?.symbol}
                                    </Text>
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                        {item.rate?.toLocaleString()}
                                    </Text>
                                    {requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase' && requisition.vat_amount > 0 && (
                                        <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                            {(item.rate * (item.vat_percentage || 0) * 0.01).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                        </Text>
                                    )}
                                    <Text style={{ ...pdfStyles.tableCell, backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor, flex: 0.2, textAlign: 'right' }}>
                                        {(item.quantity * item.rate * (1 + (item.vat_percentage || 0) * 0.01)).toLocaleString('en-US', { 
                                            style: 'currency', 
                                            currency: requisition.currency?.code 
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

                                        {item.vendors?.map((vendor: Vendor, i: number) => (
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
                      </>
                    )}
                </View>

                                {isLeaveRequest ? (
                                    <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
                                        <Text style={{ textAlign: 'center', flex : 4.5 }}></Text>
                                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                                            Total Leave Days
                                        </Text>
                                        <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                                            {`${totalLeaveDays.toLocaleString()} day(s)`}
                                        </Text>
                                    </View>
                                ) : (
                  <>
                    <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
                      <Text style={{ textAlign: 'center', flex : 4.5 }}></Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                          Total
                      </Text>
                      <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                          {requisitionItems.reduce((total: number, item: RequisitionItem) => total + (item.quantity || 0) * (item.rate || 0), 0).toLocaleString('en-US', { 
                              style: 'currency', 
                              currency: requisition.currency?.code 
                          })}
                      </Text>
                    </View>
                    {requisition?.approval_chain?.process_type?.toLowerCase() === 'purchase' && totalVAT > 0 &&
                        <>
                            <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
                                <Text style={{ textAlign: 'center', flex : 4.5 }}></Text>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                                    VAT
                                </Text>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                                    {totalVAT.toLocaleString('en-US', { 
                                        style: 'currency', 
                                        currency: requisition.currency?.code 
                                    })}
                                </Text>
                            </View>
                            <View style={{ ...pdfStyles.tableRow, marginBottom: 4 }}>
                                <Text style={{ textAlign: 'center', flex : 4.5 }}></Text>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2, textAlign: 'right' }}>
                                    Grand Total (VAT Incl.)
                                </Text>
                                <Text style={{ ...pdfStyles.tableHeader, backgroundColor: mainColor, color: contrastText, flex: 2.2, textAlign: 'right' }}>
                                    {grandTotal.toLocaleString('en-US', { 
                                        style: 'currency', 
                                        currency: requisition.currency?.code 
                                    })}
                                </Text>
                            </View>
                        </>
                    }
                  </>
                                )}

                {requisition?.remarks && (
                    <View style={{ marginBottom: 8 }}>
                        <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Remarks</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{requisition.remarks}</Text>
                    </View>
                )}
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10, justifyContent: 'flex-end' }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>Requested By</Text>
                        <Text style={{ ...pdfStyles.minInfo }}>{requisition.creator?.name}</Text>
                    </View>
                </View>

                <PageFooter />
            </Page>
        </Document>
    );
}

export default RequisitionPDF;