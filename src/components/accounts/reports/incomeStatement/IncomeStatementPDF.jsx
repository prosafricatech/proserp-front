import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const IncomeStatementPDF = ({ reportData, authOrganization, user }) => {
  console.log('reportData: ', reportData);
  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';

  const incomes = reportData?.incomes || [];
  const directExpenses =
    reportData?.directExpenses || reportData?.direct_expenses || [];
  const indirectExpenses =
    reportData?.indirectExpenses || reportData?.indirect_expenses || [];

  const hasRevenue = incomes.length > 0;
  const hasCostOfRevenue = directExpenses.length > 0;
  const hasOperatingExpenses = indirectExpenses.length > 0;

  const getLedgerTotal = (ledger) => {
    if (!Array.isArray(ledger?.amounts)) return 0;
    return ledger.amounts.reduce(
      (acc, item) => acc + (Number(item?.amount) || 0),
      0
    );
  };

  const formatDateTime = (value) => {
    if (!value) return '-';
    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;
    return parsedDate.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allLedgers = [...incomes, ...directExpenses, ...indirectExpenses];

  const periodMeta = allLedgers
    .flatMap((ledger) => (Array.isArray(ledger.amounts) ? ledger.amounts : []))
    .reduce((acc, item) => {
      if (!item?.period) return acc;
      if (!acc[item.period]) {
        acc[item.period] = {
          period: item.period,
          start_datetime: item.start_datetime,
          end_datetime: item.end_datetime,
        };
      }
      return acc;
    }, {});

  const periods = Object.values(periodMeta).sort((a, b) => {
    const aTime = a.start_datetime ? new Date(a.start_datetime).getTime() : 0;
    const bTime = b.start_datetime ? new Date(b.start_datetime).getTime() : 0;
    return aTime - bTime;
  });

  const getAmountItemByPeriod = (ledger, period) => {
    if (!Array.isArray(ledger?.amounts)) return null;
    return ledger.amounts.find((item) => item.period === period) || null;
  };

  const getAmountByPeriod = (ledger, period) => {
    const matched = getAmountItemByPeriod(ledger, period);
    return Number(matched?.amount) || 0;
  };

  const getSectionPeriodTotal = (items, period) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce(
      (acc, ledger) => acc + getAmountByPeriod(ledger, period),
      0
    );
  };

  // Totals based on new amounts[] response structure
  const totalRevenue = incomes.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalCostOfRevenue = directExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );
  const totalOperatingExpenses = indirectExpenses.reduce(
    (acc, curr) => acc + getLedgerTotal(curr),
    0
  );

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

  const numericincomeColWidth = 100 / (incomes.length + 2);
  const incomeColumnWidth = String(numericincomeColWidth) + '%';

  const numericDirectExpWidth = 100 / (directExpenses.length + 2);
  const directExpWidth = String(numericDirectExpWidth) + '%';

  const indirectExpWidth = String(100 / indirectExpenses.length + 2) + '%';

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
          {/* ====== REVENUE ===== */}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={{ ...pdfStyles.tableCell, fontSize: 12 }}>
                Revenue
              </Text>
            </View>
          </View>
          <View
            style={{
              ...pdfStyles.tableRow,
            }}
          >
            <View style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}
              >
                Periods
              </Text>
            </View>
            {incomes.map((income, index) => (
              <View
                key={index}
                style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}
              >
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginLeft: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {income.ledger_name}
                </Text>
              </View>
            ))}
            <View style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}
              >
                TOTALS
              </Text>
            </View>
          </View>
          {periods.map((period, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}
              >
                <Text>{period.period}</Text>
                <Text>
                  {' '}
                  {period.start_datetime && period.end_datetime
                    ? `${formatDateTime(period.start_datetime)} - ${formatDateTime(period.end_datetime)}`
                    : '-'}
                </Text>
              </View>

              {incomes.map((income, i) => {
                return income.income !== 0 ? (
                  <View
                    key={i}
                    style={{
                      ...pdfStyles.tableCell,
                      width: incomeColumnWidth,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      {getAmountByPeriod(income, period.period).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                ) : null;
              })}
              <View
                style={{
                  ...pdfStyles.tableCell,
                  textAlign: 'right',
                  width: incomeColumnWidth,
                }}
              >
                <Text>
                  {' '}
                  {getSectionPeriodTotal(incomes, period.period).toLocaleString(
                    'en-US',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </Text>
              </View>
            </View>
          ))}

          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 2,
                backgroundColor: pdfStyles.shadedBG,
                width: incomeColumnWidth,
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Revenue</Text>
            </View>
            {incomes.map((income, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableHeader,
                  marginLeft: 2,
                  backgroundColor: pdfStyles.shadedBG,
                  width: incomeColumnWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {getLedgerTotal(income).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))}
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                width: incomeColumnWidth,
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

          {/* ===== COST OF REVENUE ===== */}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={{ ...pdfStyles.tableCell, fontSize: 12 }}>
                Cost Of Revenue
              </Text>
            </View>
          </View>
          <View
            style={{
              ...pdfStyles.tableRow,
            }}
          >
            <View style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}
              >
                Periods
              </Text>
            </View>
            {directExpenses.map((exp, index) => (
              <View
                key={index}
                style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}
              >
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginLeft: 10,
                    fontWeight: 'bold',
                  }}
                >
                  {exp.ledger_name}
                </Text>
              </View>
            ))}
            <View style={{ ...pdfStyles.tableCell, width: incomeColumnWidth }}>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}
              >
                TOTALS
              </Text>
            </View>
          </View>
          {periods.map((period, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View style={{ ...pdfStyles.tableCell, width: directExpWidth }}>
                <Text>{period.period}</Text>
                <Text>
                  {' '}
                  {period.start_datetime && period.end_datetime
                    ? `${formatDateTime(period.start_datetime)} - ${formatDateTime(period.end_datetime)}`
                    : '-'}
                </Text>
              </View>

              {directExpenses.map((exp, i) => {
                return (
                  <View
                    key={i}
                    style={{
                      ...pdfStyles.tableCell,
                      width: directExpWidth,
                      textAlign: 'right',
                    }}
                  >
                    <Text>
                      {getAmountByPeriod(exp, period.period).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </Text>
                  </View>
                );
              })}
              <View
                style={{
                  ...pdfStyles.tableCell,
                  textAlign: 'right',
                  width: directExpWidth,
                }}
              >
                <Text>
                  {' '}
                  {getSectionPeriodTotal(
                    directExpenses,
                    period.period
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
          {/* === COST OF REVENUE TOTALS */}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 2,
                backgroundColor: pdfStyles.shadedBG,
                width: directExpWidth,
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Cost of Revenue</Text>
            </View>
            {directExpenses.map((exp, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableHeader,
                  marginLeft: 2,
                  backgroundColor: pdfStyles.shadedBG,
                  width: directExpWidth,
                }}
              >
                <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                  {getLedgerTotal(exp).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            ))}
            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                width: directExpWidth,
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {totalCostOfRevenue.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* ===== GROSS PROFIT ===== */}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={{ ...pdfStyles.tableCell, fontSize: 12 }}>
                Gross Profit
              </Text>
            </View>
          </View>
          {periods.map((period, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 && lightColor,
                  width: '80%',
                }}
              >
                <Text>{period.period}</Text>
                <Text>
                  {' '}
                  {period.start_datetime && period.end_datetime
                    ? `${formatDateTime(period.start_datetime)} - ${formatDateTime(period.end_datetime)}`
                    : '-'}
                </Text>
              </View>
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 && lightColor,
                  width: '20%',
                }}
              >
                <Text style={{ textAlign: 'right' }}>
                  {(
                    getSectionPeriodTotal(incomes, period.period) -
                    getSectionPeriodTotal(directExpenses, period.period)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
          {/* === TOTAL GROSS PROFIT */}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 2,
                backgroundColor: pdfStyles.shadedBG,
                width: '80%',
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Gross Profit</Text>
            </View>

            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                width: '20%',
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {(totalRevenue - totalCostOfRevenue).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>

          {/* ===== OPERATING EXPENSES */}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={{ ...pdfStyles.tableCell, fontSize: 12 }}>
                Operating Expenses
              </Text>
            </View>
          </View>
          {indirectExpenses.length && (
            <View
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View style={{ ...pdfStyles.tableCell, width: indirectExpWidth }}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginLeft: 10,
                    fontWeight: 'bold',
                  }}
                >
                  Periods
                </Text>
              </View>
              {indirectExpenses.map((exp, index) => (
                <View
                  key={index}
                  style={{ ...pdfStyles.tableCell, width: indirectExpWidth }}
                >
                  <Text
                    style={{
                      ...pdfStyles.tableCell,
                      marginLeft: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    {exp.ledger_name}
                  </Text>
                </View>
              ))}
              <View style={{ ...pdfStyles.tableCell, width: indirectExpWidth }}>
                <Text
                  style={{
                    ...pdfStyles.tableCell,
                    marginLeft: 10,
                    fontWeight: 'bold',
                  }}
                >
                  TOTALS
                </Text>
              </View>
            </View>
          )}
          {indirectExpenses.length &&
            periods.map((period, index) => (
              <View
                key={index}
                style={{
                  ...pdfStyles.tableRow,
                }}
              >
                <View
                  style={{ ...pdfStyles.tableCell, width: indirectExpWidth }}
                >
                  <Text>{period.period}</Text>
                  <Text>
                    {' '}
                    {period.start_datetime && period.end_datetime
                      ? `${formatDateTime(period.start_datetime)} - ${formatDateTime(period.end_datetime)}`
                      : '-'}
                  </Text>
                </View>
                {indirectExpenses.map((exp, i) => {
                  return (
                    <View
                      key={i}
                      style={{
                        ...pdfStyles.tableCell,
                        width: indirectExpWidth,
                        textAlign: 'right',
                      }}
                    >
                      <Text>
                        {getAmountByPeriod(exp, period.period).toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </Text>
                    </View>
                  );
                })}
                <View
                  style={{
                    ...pdfStyles.tableCell,
                    textAlign: 'right',
                    width: indirectExpWidth,
                  }}
                >
                  <Text>
                    {getSectionPeriodTotal(
                      indirectExpenses,
                      period.period
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </View>
            ))}
          {/* === TOTAL OPERATING EXPENSES */}
          {indirectExpenses.length ? (
            <View style={pdfStyles.tableRow}>
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  marginLeft: 2,
                  backgroundColor: pdfStyles.shadedBG,
                  width: indirectExpWidth,
                }}
              >
                <Text style={pdfStyles.tableCell}>Total Operating Costs</Text>
              </View>
              {indirectExpenses.map((exp, index) => (
                <View
                  key={index}
                  style={{
                    ...pdfStyles.tableHeader,
                    marginLeft: 2,
                    backgroundColor: pdfStyles.shadedBG,
                    width: indirectExpWidth,
                  }}
                >
                  <Text style={{ ...pdfStyles.tableCell, textAlign: 'right' }}>
                    {getLedgerTotal(exp).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              ))}
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  backgroundColor: pdfStyles.shadedBG,
                  width: indirectExpWidth,
                  textAlign: 'right',
                }}
              >
                <Text style={pdfStyles.tableCell}>
                  {totalOperatingExpenses.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={pdfStyles.tableRow}>
              <View
                style={{
                  ...pdfStyles.tableHeader,
                  marginLeft: 2,
                  backgroundColor: pdfStyles.shadedBG,
                  width: '100%',
                }}
              >
                <Text style={{ textAlign: 'center', fontWeight: 'light' }}>
                  No Operating Expenses Found
                </Text>
              </View>
            </View>
          )}

          {/* ===== NET INCOME ===== */}
          <View style={pdfStyles.tableRow}>
            <View style={{ ...pdfStyles.tableHeader, flex: 1 }}>
              <Text style={{ ...pdfStyles.tableCell, fontSize: 12 }}>
                Net Income
              </Text>
            </View>
          </View>
          {periods.map((period, index) => (
            <View
              key={index}
              style={{
                ...pdfStyles.tableRow,
              }}
            >
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 && lightColor,
                  width: '80%',
                }}
              >
                <Text>{period.period}</Text>
                <Text>
                  {' '}
                  {period.start_datetime && period.end_datetime
                    ? `${formatDateTime(period.start_datetime)} - ${formatDateTime(period.end_datetime)}`
                    : '-'}
                </Text>
              </View>
              <View
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 !== 0 && lightColor,
                  width: '20%',
                }}
              >
                <Text style={{ textAlign: 'right' }}>
                  {(
                    getSectionPeriodTotal(incomes, period.period) -
                    getSectionPeriodTotal(directExpenses, period.period) -
                    getSectionPeriodTotal(indirectExpenses, period.period)
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          ))}
          {/* === TOTAL NET INCOME */}
          <View style={pdfStyles.tableRow}>
            <View
              style={{
                ...pdfStyles.tableHeader,
                marginLeft: 2,
                backgroundColor: pdfStyles.shadedBG,
                width: '80%',
              }}
            >
              <Text style={pdfStyles.tableCell}>Total Net Income</Text>
            </View>

            <View
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: pdfStyles.shadedBG,
                width: '20%',
                textAlign: 'right',
              }}
            >
              <Text style={pdfStyles.tableCell}>
                {(
                  totalRevenue -
                  totalCostOfRevenue -
                  totalOperatingExpenses
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
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
