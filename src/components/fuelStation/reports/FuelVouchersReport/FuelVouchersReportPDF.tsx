import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import dayjs from 'dayjs';

interface FuelVouchersReportPDFProps {
  reportData: any;
  organization: any;
  filters: any;
}

function FuelVouchersReportPDF({
  reportData,
  organization,
  filters,
}: FuelVouchersReportPDFProps) {
  const mainColor = organization.settings?.main_color || '#2113AD';
  const lightColor = organization.settings?.light_color || '#bec5da';
  const contrastText = organization.settings?.contrast_text || '#FFFFFF';

  const totalLts = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity,
    0
  );

  const totalAmount = reportData.reduce(
    (sum: any, fv: any) => sum + fv.quantity * fv.price,
    0
  );

  let runningBalance: number = 0;
  return (
    <Document
      title={`Fuel Vouchers Report | ${organization.name}`}
      author={filters.stationName}
      subject={'Fuel Vouchers Report'}
      creator={`Powered By ProsERP`}
      producer='ProsERP'
    >
      <Page size='A4' orientation='landscape' style={pdfStyles.page}>
        {/* ================= HEADER ================= */}
        <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
          <View
            style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
          >
            <PdfLogo organization={organization} />
          </View>
        </View>
        {/* ===== FILTERS ===== */}
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow }}>
            {filters.stationName && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                  Station Name
                </Text>
              </View>
            )}
            {filters.stakeholder_name && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                  Stakeholder Name
                </Text>
              </View>
            )}
            {filters.from && filters.to && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: mainColor }}>
                  Date Range
                </Text>
              </View>
            )}
          </View>
          <View style={{ ...pdfStyles.tableRow }}>
            {filters.stationName && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {filters.stationName}
                </Text>
              </View>
            )}

            {filters.stakeholder_name && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {filters.stakeholder_name}
                </Text>
              </View>
            )}

            {filters.from && filters.to && (
              <View style={{ ...pdfStyles.tableCell, flex: 1 }}>
                <Text style={{ ...pdfStyles.majorInfo, color: 'black' }}>
                  {`${filters.from} - ${filters.to}`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ===== FUEL VOUCHERS ===== */}
        <View style={{ marginBottom: 12 }}>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.5,
                }}
              >
                Date
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1,
                }}
              >
                Voucher No
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1.5,
                }}
              >
                Stakeholder/Expense Ledger
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1,
                }}
              >
                Reference
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.8,
                }}
              >
                Product
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 1,
                }}
              >
                Narration
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.6,
                }}
              >
                Lts
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.5,
                }}
              >
                Price
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: mainColor,
                  color: contrastText,
                  flex: 0.8,
                }}
              >
                {`${filters.with_receipts == 1 ? 'Debit' : 'Amount'}`}
              </Text>
              {filters.with_receipts == 1 && (
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.5,
                  }}
                >
                  Credit
                </Text>
              )}
              {filters.with_receipts == 1 && (
                <Text
                  style={{
                    ...pdfStyles.tableHeader,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                  }}
                >
                  Running Balance
                </Text>
              )}
            </View>
            {reportData.length &&
              reportData.map((rd: any, index: number) => {
                runningBalance += rd.debit - rd.credit;
                return (
                  <View key={index} style={pdfStyles.tableRow}>
                    {/* date */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.5,
                      }}
                    >
                      {dayjs(rd.transaction_date).format('DD-MM-YYYY')}
                    </Text>
                    {/* Voucher No */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {rd.voucherNo}
                    </Text>
                    {/* Stakeholder/Expense Ledger */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1.5,
                        textAlign: 'right',
                      }}
                    >
                      {rd.expense_ledger?.name || rd.stakeholder?.name}
                    </Text>
                    {/* Reference */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {rd.reference || ''}
                    </Text>
                    {/* Product */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.8,
                        textAlign: 'right',
                      }}
                    >
                      {rd.product?.name}
                    </Text>
                    {/* Narration */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 1,
                        textAlign: 'right',
                      }}
                    >
                      {rd.narration}
                    </Text>
                    {/* LTS */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.6,
                        textAlign: 'right',
                      }}
                    >
                      {rd.quantity.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    {/* price */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.5,
                        textAlign: 'right',
                      }}
                    >
                      {rd.price.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                    {/* AMOUNT */}
                    <Text
                      style={{
                        ...pdfStyles.tableCell,
                        backgroundColor:
                          index % 2 === 0 ? '#FFFFFF' : lightColor,
                        flex: 0.8,
                        textAlign: 'right',
                      }}
                    >
                      {filters.with_receipts == 0
                        ? rd.amount.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })
                        : rd.debit.toLocaleString('en-US', {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                    </Text>
                    {filters.with_receipts == 1 && (
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 0.5,
                          textAlign: 'right',
                        }}
                      >
                        {rd.credit.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    )}
                    {filters.with_receipts == 1 && (
                      <Text
                        style={{
                          ...pdfStyles.tableCell,
                          backgroundColor:
                            index % 2 === 0 ? '#FFFFFF' : lightColor,
                          flex: 1,
                          textAlign: 'right',
                        }}
                      >
                        {runningBalance.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    )}
                  </View>
                );
              })}

            {/* TOTALS */}
            {/* {reportData.length && (
              <View style={pdfStyles.tableRow}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 5,
                  }}
                >
                  TOTAL
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 0.5,
                    textAlign: 'right',
                  }}
                >
                  {totalLts.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                    textAlign: 'right',
                  }}
                ></Text>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    backgroundColor: mainColor,
                    color: contrastText,
                    flex: 1,
                    textAlign: 'right',
                  }}
                >
                  {totalAmount.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            )} */}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default FuelVouchersReportPDF;
