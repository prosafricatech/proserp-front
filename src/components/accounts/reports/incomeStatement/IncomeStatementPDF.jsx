import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const IncomeStatementPDF = ({ reportData, authOrganization, user }) => {
  console.log('reportData: ', reportData);
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const totalRevenue = reportData
    ? reportData.incomes.reduce((total, income) => total + income.amount, 0)
    : 0;
  const costOfRevenue = reportData
    ? reportData.direct_expenses.reduce(
        (total, expense) => total + expense.amount,
        0
      )
    : 0;
  const operationalExpenseTotal = reportData
    ? reportData.indirect_expenses.reduce(
        (total, expense) => total + expense.amount,
        0
      )
    : 0;
  const reportPeriod = `${readableDate(reportData.filters.from, true)} - ${readableDate(reportData.filters.to, true)}`;
  const costCenters = reportData.filters.cost_centers;
  const organization = authOrganization.organization;

  return reportData ? (
    <Document
      creator={` ${user.name} | Powered By ProsERP`}
      producer='ProsERP'
      title={`Income Statement ${reportPeriod}`}
    >
      <Page size='A4' style={pdfStyles.page} orientation='landscape'>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View
              style={{ flex: 1, maxWidth: organization?.logo_path ? 130 : 250 }}
            >
              <PdfLogo organization={organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Income Statement`}</Text>
              <Text style={{ ...pdfStyles.minInfo }}>{reportPeriod}</Text>
            </View>
          </View>
        </View>
        <View
          style={{ ...pdfStyles.tableRow, marginTop: 10, marginBottom: 10 }}
        >
          {costCenters.length !== 0 && (
            <View style={{ flex: 2, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Cost Centers
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {costCenters
                  .map((cost_centers) => cost_centers.name)
                  .join(', ')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed By
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>{user.name}</Text>
          </View>
          <View style={{ flex: 1, padding: 2 }}>
            <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
              Printed On
            </Text>
            <Text style={{ ...pdfStyles.minInfo }}>
              {readableDate(undefined, true)}
            </Text>
          </View>
        </View>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={pdfStyles.tableCell}>Revenue</Text>
            </View>
          </View>
          {reportData.incomes.map(
            (income, index) =>
              income.amount !== 0 && (
                <View key={index} style={pdfStyles.tableRow}>
                  <View style={{ ...pdfStyles.tableCell, flex: 2 }}>
                    <Text style={{ ...pdfStyles.tableCell, marginLeft: 10 }}>
                      {income.ledger_name}
                    </Text>
                  </View>
                  <View
                    style={{
                      ...pdfStyles.tableCell,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    <Text style={pdfStyles.tableCell}>
                      {income.amount?.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              )
          )}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 5,
                backgroundColor: pdfStyles.shadedBG,
                flex: 2,
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Revenue</Text>
            </View>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                flex: 1,
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {totalRevenue.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          <View style={{ ...pdfStyles.tableRow, marginLeft: 10 }}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={pdfStyles.tableCell}>Cost of Revenue</Text>
            </View>
          </View>
          {reportData.direct_expenses.map(
            (expense, index) =>
              expense.amount !== 0 && (
                <View key={index} style={pdfStyles.tableRow}>
                  <View style={{ ...pdfStyles.tableCell, flex: 2 }}>
                    <Text style={{ ...pdfStyles.tableCell, marginLeft: 15 }}>
                      {expense.ledger_name}
                    </Text>
                  </View>
                  <View
                    style={{
                      ...pdfStyles.tableCell,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    <Text style={pdfStyles.tableCell}>
                      {expense.amount?.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              )
          )}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 5,
                backgroundColor: pdfStyles.shadedBG,
                flex: 2,
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Cost Of Revenue</Text>
            </View>
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                flex: 1,
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {costOfRevenue.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableCell, marginLeft: 5, flex: 2 }}>
              <Text style={pdfStyles.tableCell}>Gross Profit</Text>
            </View>
            <View
              style={{ ...pdfStyles.tableCell, flex: 1, textAlign: 'right' }}
            >
              <Text style={pdfStyles.tableCell}>
                {(totalRevenue - costOfRevenue).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow, marginTop: 15 }}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={pdfStyles.tableCell}>Operating Expenses</Text>
            </View>
          </View>
          {reportData.indirect_expenses.map(
            (expense, index) =>
              expense.amount !== 0 && (
                <View key={index} style={pdfStyles.tableRow}>
                  <View style={{ ...pdfStyles.tableCell, flex: 2 }}>
                    <Text style={{ ...pdfStyles.tableCell, marginLeft: 10 }}>
                      {expense.ledger_name}
                    </Text>
                  </View>
                  <View
                    style={{
                      ...pdfStyles.tableCell,
                      flex: 1,
                      textAlign: 'right',
                    }}
                  >
                    <Text style={pdfStyles.tableCell}>
                      {expense.amount?.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </View>
                </View>
              )
          )}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableCell,
                marginLeft: 10,
                backgroundColor: pdfStyles.shadedBG,
                flex: 2,
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Operating Expenses</Text>
            </View>
            <View
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: pdfStyles.shadedBG,
                flex: 1,
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {operationalExpenseTotal.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow, marginTop: 15 }}>
            <View style={{ ...pdfStyles.tableHeader, flex: 2 }}>
              <Text style={pdfStyles.tableCell}>Net Income</Text>
            </View>
            <View
              style={{ ...pdfStyles.tableHeader, flex: 1, textAlign: 'right' }}
            >
              <Text style={pdfStyles.tableCell}>
                {(
                  totalRevenue -
                  costOfRevenue -
                  operationalExpenseTotal
                ).toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  ) : (
    ''
  );
};

export default IncomeStatementPDF;
