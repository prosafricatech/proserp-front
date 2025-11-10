import React from 'react'
import { Text, View,Document,Page} from '@react-pdf/renderer'
import pdfStyles from '../../pdf/pdf-styles';
import PdfLogo from '../../pdf/PdfLogo';
import PageFooter from '../../pdf/PageFooter';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import { readableDate } from '@/app/helpers/input-sanitization-helpers';

const styles = pdfStyles;

function GrnPDF({grn,organization = null,baseCurrency,checkOrganizationPermission}){
    const currencySymbol = grn.currency.symbol;
    const base_Currency = baseCurrency.symbol;
    const mainColor = organization.settings?.main_color || "#2113AD";
    const lightColor = organization.settings?.light_color || "#bec5da";
    const contrastText = organization.settings?.contrast_text || "#FFFFFF";
    const exchangeRate = grn.exchange_rate;
    const costFactor = grn.cost_factor;
    const displayAmounts = checkOrganizationPermission([PERMISSIONS.ACCOUNTS_REPORTS,PERMISSIONS.PURCHASES_CREATE]);

    // Calculate the total amount to Base Currency
    let totalAmountBaseCurrency = 0;
        grn.items.forEach((grnItem) => {
        totalAmountBaseCurrency += (costFactor*grnItem.rate*exchangeRate*grnItem.quantity);
    });

    // Calculate the total amount of Grn items
    let totalAmount = 0;
        grn.items.forEach((grnItem) => {
        totalAmount += (grnItem.rate*grnItem.quantity);
    });

    // Calculate the total amount of Additional costs
    let totalAdditionalCosts = 0;
        grn.additional_costs.forEach((item) => {
        totalAdditionalCosts += (item.amount*item.exchange_rate);
    });

    return (
        <Document 
            title={grn.grnNo}
            author={`${grn.creator.name}`}
            subject='GOODS RECEIVABLE NOTES'
            creator='ProsERP'
            producer='ProsERP'
            keywords={grn.order.stakeholder.name}
        >
            <Page size="A4" style={styles.page}>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 20 }}>
                    <View style={{ flex: 1, maxWidth: (organization?.logo_path ? 130 : 250)}}>
                        <PdfLogo organization={organization}/>
                    </View>
                    <View style={{ flex: 1, textAlign: 'right' }}>
                        <Text style={{...pdfStyles.majorInfo, color: mainColor }}>GOODS RECEIVED NOTE</Text>
                        <Text style={{ ...pdfStyles.midInfo, }}>{grn.grnNo}</Text>
                    </View>
                </View>
                <View style={{ ...pdfStyles.tableRow, marginTop: 10}}>
                    <View style={{ ...pdfStyles.table,flex: 0.5 }}>
                        <View>
                            <Text style={{...pdfStyles.minInfo, color: mainColor}}>Date Received:</Text>
                            <Text style={{ ...pdfStyles.minInfo, }}>{readableDate(grn.date_received)}</Text>
                        </View>
                    </View>
                    {
                        grn?.reference &&
                        <View style={{ ...pdfStyles.table,flex: 0.5 }}>
                            <View>
                                <Text style={{...pdfStyles.minInfo, color: mainColor}}>Reference:</Text>
                                <Text style={{ ...pdfStyles.minInfo, }}>{grn.reference}</Text>
                            </View>
                        </View>
                    }
                    <View style={{ ...pdfStyles.table,flex: 0.5 }}>
                        <View>
                            <Text style={{...pdfStyles.minInfo, color: mainColor}}>Currency:</Text>
                            <Text style={{ ...pdfStyles.minInfo, }}>{grn.currency.name}</Text>
                        </View>
                    </View>
                    {
                        (grn?.currency.id > 1 && displayAmounts) &&
                        <View style={{ ...pdfStyles.table,flex: 0.5 }}>
                            <View>
                                <Text style={{...pdfStyles.minInfo, color: mainColor}}>Exchange Rate:</Text>
                                <Text style={{ ...pdfStyles.minInfo, }}>{exchangeRate}</Text>
                            </View>
                        </View>

                    }
                    {
                        grn?.cost_factor > 1 && displayAmounts &&
                        <View style={{ ...pdfStyles.table,flex: 0.5 }}>
                            <View>
                                <Text style={{...pdfStyles.minInfo, color: mainColor}}>Cost Factor:</Text>
                                <Text style={{ ...pdfStyles.minInfo, }}>{costFactor}</Text>
                            </View>
                        </View>
                    }
                </View>
                <View style={{ ...pdfStyles.tableRow, marginBottom: 10, marginTop: 5}}>
                    <View style={{ ...pdfStyles.table,flex: 1 }}>
                        <View>
                            <Text style={{...pdfStyles.minInfo, color: mainColor}}>Supplier:</Text>
                            <Text style={{ ...pdfStyles.minInfo, }}>{grn.order.stakeholder?.name}</Text>
                        </View>
                    </View>
                    <View style={{ ...pdfStyles.table,flex: 1 }}>
                        <View>
                            <Text style={{...pdfStyles.minInfo, color: mainColor}}>Receiving Store:</Text>
                            <Text style={{ ...pdfStyles.minInfo, }}>{grn.store.name}</Text>
                        </View>
                    </View>
                    {
                        grn?.order.cost_centers &&
                        <View style={{ ...pdfStyles.table,flex: 1 }}>
                                <View>
                                    <Text style={{...pdfStyles.minInfo, color: mainColor}}>Cost Center:</Text>
                                    <Text style={{ ...pdfStyles.minInfo, }}>{grn.order.cost_centers.map((cc)=> cc.name).join(', ')}</Text>
                                </View>
                        </View>
                    }
                </View>
                <View style={{...pdfStyles.table, minHeight: 130 }}>
                    <View style={styles.tableRow}>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.7 }}>S/N</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 5 }}>Product/Service</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 1 }}>Unit</Text>
                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 2 }}>Quantity</Text>
                        {
                            displayAmounts &&
                            <React.Fragment>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 2 }}>Unit Price</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.5 }}>Amount</Text>
                                { grn.additional_costs.length > 0 &&
                                    <>
                                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.7 }}>Cost P.U({base_Currency})</Text>
                                        <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.5 }}>Amount({base_Currency})</Text>
                                    </>
                                }
                            </React.Fragment>
                        }
                    </View>
                    {
                        grn.items.map((grnItem,index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 0.7 }}>{index+1}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 5 }}>{grnItem.product.name}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 1 }}>{grnItem.measurement_unit?.symbol}</Text>
                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 2, textAlign : 'right'  }}>{grnItem.quantity}</Text>
                                {
                                    displayAmounts &&
                                    <React.Fragment>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 2, textAlign : 'right' }}>{(grnItem.rate).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 3.5, textAlign : 'right'  }}>{currencySymbol} {(grnItem.rate*grnItem.quantity).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                        { grn.additional_costs.length > 0 &&
                                            <>
                                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 3.7, textAlign : 'right'  }}>{(costFactor*grnItem.rate*exchangeRate).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                                <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 3.5, textAlign : 'right'  }}>{(costFactor*grnItem.rate*exchangeRate*grnItem.quantity).toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2})}</Text>
                                            </>
                                        }
                                    </React.Fragment>
                                }
                            </View>
                        ))
                    }
                    {
                        displayAmounts &&
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 12.4, textAlign : 'center'  }}>TOTAL</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.5,textAlign : 'right' }}>{currencySymbol}{totalAmount.toLocaleString('en-US',{minimumFractionDigits:2})}</Text>
                            { grn.additional_costs.length > 0 &&
                            <>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.7 }}>{}</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 3.5, textAlign : 'right' }}>{totalAmountBaseCurrency.toLocaleString('en-US',{minimumFractionDigits:2})}</Text>
                            </>
                            }
                        </View>
                    }
                </View>
                { displayAmounts && grn.additional_costs.length > 0 &&
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1 }}></View>
                        <View style={{...pdfStyles.table,  marginTop: 30,flex: 1}}>
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.4 }}>Additional Costs</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.3 }}>Exchange Rate</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.3 }}>Amount</Text>
                            </View>
                            {
                                grn.additional_costs.map((item,index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 0.4 }}>{item.name}</Text>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 0.3,textAlign : 'right'}}>{item.exchange_rate}</Text>
                                        <Text style={{ ...styles.tableCell,backgroundColor: index % 2 === 0 ? '#FFFFFF' : lightColor,  flex : 0.3, textAlign : 'right'}}>{item.currency?.symbol}  {(item.amount)?.toLocaleString('en-US',{minimumFractionDigits:2})}</Text>
                                    </View>
                                ))
                            }
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.745, textAlign : 'center'}}>TOTAL Additional Costs ({base_Currency})</Text>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.3,textAlign : 'right'}}>{totalAdditionalCosts?.toLocaleString('en-US',{minimumFractionDigits:2})}</Text>
                            </View>
                        </View>
                    </View>
                }
                {
                    displayAmounts &&
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ flex: 1 }}>

                        </View>
                        <View style={{...pdfStyles.table, marginTop:10 ,flex: 1}}>
                            <View style={styles.tableRow}>
                                <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.745, textAlign : 'center'}}>Total Value of Goods ({base_Currency})</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableHeader, backgroundColor: mainColor, color: contrastText,   flex : 0.3,textAlign : 'right'}}>{totalAmountBaseCurrency?.toLocaleString('en-US',{minimumFractionDigits:2})}</Text>
                            </View>
                        </View>
                    </View>
                }
                <View style={{ ...pdfStyles.tableRow,marginTop: 50}}>
                    <View style={{ flex: 0.8 }}>
                        { grn.remarks &&
                            <>
                                <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Remarks:</Text>
                                <Text style={{...pdfStyles.minInfo }}>{grn.remarks}</Text>
                            </>
                        }
                    </View>
                    <View style={{ flex: 0.2 }}>
                        <Text style={{...pdfStyles.minInfo, color: mainColor, fontFamily: 'Helvetica-Bold' }}>Received By:</Text>
                        <Text style={{...pdfStyles.minInfo }}>{grn.creator?.name}</Text>
                    </View>
                </View>
                <PageFooter/>
            </Page>
        </Document>
    )
}

export default GrnPDF;