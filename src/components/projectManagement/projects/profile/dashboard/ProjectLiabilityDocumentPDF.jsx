import { readableDate } from '@/app/helpers/input-sanitization-helpers';
import pdfStyles from '@/components/pdf/pdf-styles';
import PdfLogo from '@/components/pdf/PdfLogo';
import { Document, Page, Text, View } from '@react-pdf/renderer';

const ProjectLiabilityDocumentPDF = ({
  transactionsData,
  authOrganization,
  user,
  ledger,
  ledgerName,
  increasesWith,
}) => {
  const [openingBalanceTx, ...restTransactions] = transactionsData.transactions;

  // Opening balance seeds cumulative balance but is excluded from DR/CR totals
  const openingBalance = openingBalanceTx
    ? increasesWith === 'DR'
      ? openingBalanceTx.debit - openingBalanceTx.credit
      : openingBalanceTx.credit - openingBalanceTx.debit
    : 0;

  const totalCredits = restTransactions.reduce(
    (total, transaction) => total + transaction.credit,
    0
  );
  const totalDebits = restTransactions.reduce(
    (total, transaction) => total + transaction.debit,
    0
  );

  const mainColor =
    authOrganization.organization.settings?.main_color || '#2113AD';
  const lightColor =
    authOrganization.organization.settings?.light_color || '#bec5da';
  const contrastText =
    authOrganization.organization.settings?.contrast_text || '#FFFFFF';
  const costCenters = transactionsData.filters.cost_centers;

  let runningBalance = openingBalance;

  const tableRows = [
    ...(openingBalanceTx
      ? [
          {
            transactionDate: openingBalanceTx.transactionDate,
            reference: '',
            description: openingBalanceTx.description,
            debit: null,
            credit: null,
            balance: openingBalance,
          },
        ]
      : []),
    ...restTransactions.map((transaction) => {
      runningBalance +=
        increasesWith === 'DR'
          ? transaction.debit - transaction.credit
          : transaction.credit - transaction.debit;

      return {
        transactionDate: transaction.transactionDate,
        reference:
          `${transaction.voucherNo ? transaction.voucherNo : ''} ${transaction.reference ? transaction.reference : ''}`.trim(),
        description: transaction.description,
        debit: transaction.debit,
        credit: transaction.credit,
        balance: runningBalance,
      };
    }),
  ];
  return transactionsData ? (
    <Document
      creator={`${user.name} | Powered by ProsERP`}
      producer='ProsERP'
      title={`${ledger?.name || ledgerName} Statement ${readableDate(transactionsData.filters.from)} to ${readableDate(transactionsData.filters.to)}`}
    >
      <Page size='A4' style={pdfStyles.page}>
        <View style={pdfStyles.table}>
          <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
            <View style={{ flex: 1, maxWidth: 120 }}>
              <PdfLogo organization={authOrganization.organization} />
            </View>
            <View style={{ flex: 1, textAlign: 'right' }}>
              <Text
                style={{ ...pdfStyles.majorInfo, color: mainColor }}
              >{`Ledger Statement`}</Text>
              <Text
                style={{ ...pdfStyles.midInfo }}
              >{`${ledger?.name || ledgerName}`}</Text>
              <Text
                style={{ ...pdfStyles.minInfo }}
              >{`${readableDate(transactionsData.filters.from, true)} - ${readableDate(transactionsData.filters.to, true)}`}</Text>
            </View>
          </View>
          <View style={{ ...pdfStyles.tableRow, marginTop: 10 }}>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Credits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalCredits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View style={{ flex: 1, padding: 2 }}>
              <Text style={{ ...pdfStyles.minInfo, color: mainColor }}>
                Total Debits
              </Text>
              <Text style={{ ...pdfStyles.minInfo }}>
                {totalDebits.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
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
          <View style={{ ...pdfStyles.tableRow, marginBottom: 2 }}>
            {Array.isArray(costCenters) && costCenters.length > 0 && (
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
          </View>
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
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
              Reference
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 2,
              }}
            >
              Description
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Debit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1,
              }}
            >
              Credit
            </Text>
            <Text
              style={{
                ...pdfStyles.tableHeader,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            >
              Balance
            </Text>
          </View>
          {tableRows.map((row, index) => (
            <View
              key={`${row.transactionDate}-${index}`}
              style={pdfStyles.tableRow}
            >
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1.5,
                }}
              >
                {readableDate(row.transactionDate)}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                }}
              >
                {row.reference}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 2,
                }}
              >
                {row.description}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {row.debit && row.debit !== 0
                  ? row.debit.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })
                  : '-'}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {row.credit && row.credit !== 0
                  ? row.credit.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })
                  : '-'}
              </Text>
              <Text
                style={{
                  ...pdfStyles.tableCell,
                  backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,
                  flex: 1.5,
                  textAlign: 'right',
                }}
              >
                {row.balance.toLocaleString('en-US', {
                  maximumFractionDigits: 2,
                  minimumFractionDigits: 2,
                }) === '-0.00'
                  ? '0.00'
                  : row.balance.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
              </Text>
            </View>
          ))}
          {/* TOTAL row */}
          <View style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                textAlign: 'center',
                flex: 4.7,
              }}
            >
              TOTAL
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'right',
              }}
            >
              {totalDebits.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'right',
              }}
            >
              {totalCredits.toLocaleString('en-US', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text
              style={{
                ...pdfStyles.tableCell,
                backgroundColor: mainColor,
                color: contrastText,
                flex: 1.5,
              }}
            ></Text>
          </View>
        </View>
      </Page>
    </Document>
  ) : null;
};

export default ProjectLiabilityDocumentPDF;
