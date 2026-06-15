import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import { useCurrencySelect } from '@/components/masters/Currencies/CurrencySelectProvider';
import { PERMISSIONS } from '@/utilities/constants/permissions';
import {
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

function SummaryTab({
  authOrganization,
  order,
  getReceivedItemsSummary,
  gettotalAmount,
  getTotalCostAmount,
  getTotalAdditionalCostsAmount,
  getAdditionalCostsSummary,
}) {
  const theme = useTheme();
  const { currencies } = useCurrencySelect();
  const currency = order.currency;
  const baseCurrency = currencies.find(
    (currency) => !!currency?.is_base
  ).symbol;

  const { checkOrganizationPermission } = useJumboAuth();
  const withPrices = [
    PERMISSIONS.ACCOUNTS_REPORTS,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.APPROVED_REQUISITIONS_PURCHASE,
  ].some((perm) => checkOrganizationPermission([perm]));

  const mainColor =
    authOrganization.organization.settings?.main_color ||
    theme.palette.primary.main;

  const contrastText =
    authOrganization.organization.settings?.contrast_text ||
    theme.palette.getContrastText(mainColor);

  const lightColor =
    theme.palette.mode === 'dark'
      ? theme.palette.action.hover
      : authOrganization.organization.settings?.light_color ||
        theme.palette.action.selected;

  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <Divider />
      </Grid>

      {/* ---------------- RECEIVED ITEMS ---------------- */}
      <Grid size={12}>
        <Typography variant='h3' align='center'>
          Received Items
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  S/N
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  Product/Service
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                >
                  Unit
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: mainColor, color: contrastText }}
                  align='right'
                >
                  Quantity
                </TableCell>

                {withPrices && (
                  <>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                      align='right'
                    >
                      Unit Price
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                      align='right'
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                      align='right'
                    >
                      Cost P.U ({baseCurrency})
                    </TableCell>
                    <TableCell
                      sx={{ backgroundColor: mainColor, color: contrastText }}
                      align='right'
                    >
                      Amount ({baseCurrency})
                    </TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {getReceivedItemsSummary()
                .filter((item) => item.receivedQuantity > 0)
                .map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.background.paper
                          : lightColor,
                    }}
                  >
                    <TableCell
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {index + 1}.
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.product}
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.unit}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.receivedQuantity}
                    </TableCell>

                    {withPrices && (
                      <>
                        <TableCell
                          align='right'
                          sx={{
                            color:
                              index % 2 === 0
                                ? theme.palette.getContrastText(
                                    theme.palette.background.paper
                                  )
                                : theme.palette.getContrastText(lightColor),
                          }}
                        >
                          {item.rate.toLocaleString()}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            color:
                              index % 2 === 0
                                ? theme.palette.getContrastText(
                                    theme.palette.background.paper
                                  )
                                : theme.palette.getContrastText(lightColor),
                          }}
                        >
                          <Typography noWrap>
                            {(item.receivedQuantity * item.rate).toLocaleString(
                              'en-US',
                              {
                                style: 'currency',
                                currency: currency.code,
                              }
                            )}
                          </Typography>
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            color:
                              index % 2 === 0
                                ? theme.palette.getContrastText(
                                    theme.palette.background.paper
                                  )
                                : theme.palette.getContrastText(lightColor),
                          }}
                        >
                          {(
                            item.exchangeRate *
                            item.rate *
                            item.costfactor
                          ).toLocaleString()}
                        </TableCell>

                        <TableCell
                          align='right'
                          sx={{
                            color:
                              index % 2 === 0
                                ? theme.palette.getContrastText(
                                    theme.palette.background.paper
                                  )
                                : theme.palette.getContrastText(lightColor),
                          }}
                        >
                          {(
                            item.exchangeRate *
                            item.rate *
                            item.costfactor *
                            item.receivedQuantity
                          ).toLocaleString()}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
            </TableBody>

            {withPrices && (
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                    colSpan={4}
                    align='right'
                  >
                    TOTAL
                  </TableCell>

                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                    colSpan={2}
                    align='right'
                  >
                    <Typography noWrap>
                      {currency.symbol} {gettotalAmount().toLocaleString()}
                    </Typography>
                  </TableCell>

                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                  />

                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                    align='right'
                  >
                    {getTotalCostAmount().toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableHead>
            )}
          </Table>
        </TableContainer>
      </Grid>

      {/* ---------------- ADDITIONAL COSTS ---------------- */}
      {getAdditionalCostsSummary().length > 0 && (
        <Grid size={12} mt={3}>
          <Typography variant='h3' color={contrastText} align='center'>
            Additional Costs
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                  >
                    S/N
                  </TableCell>
                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                  >
                    Additional Costs
                  </TableCell>
                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                    align='right'
                  >
                    Exchange Rate
                  </TableCell>
                  <TableCell
                    sx={{ backgroundColor: mainColor, color: contrastText }}
                    align='right'
                  >
                    Amount
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {getAdditionalCostsSummary().map((item, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.background.paper
                          : lightColor,
                    }}
                  >
                    <TableCell
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {index + 1}.
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.costName}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.exchangeRate.toLocaleString()}
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        color:
                          index % 2 === 0
                            ? theme.palette.getContrastText(
                                theme.palette.background.paper
                              )
                            : theme.palette.getContrastText(lightColor),
                      }}
                    >
                      {item.itemCurrency} {item.amount?.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableHead>
                <TableRow>
                  <TableCell colSpan={3} align='right'>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.getContrastText(
                          theme.palette.background.paper
                        ),
                      }}
                    >
                      TOTAL Additional Costs ({baseCurrency})
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.getContrastText(
                          theme.palette.background.paper
                        ),
                      }}
                    >
                      {getTotalAdditionalCostsAmount().toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell colSpan={3} align='right'>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.getContrastText(
                          theme.palette.background.paper
                        ),
                      }}
                    >
                      TOTAL Value of Goods ({baseCurrency})
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography
                      variant='body2'
                      sx={{
                        color: theme.palette.getContrastText(
                          theme.palette.background.paper
                        ),
                      }}
                    >
                      {getTotalCostAmount().toLocaleString()}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
            </Table>
          </TableContainer>
        </Grid>
      )}
    </Grid>
  );
}

export default SummaryTab;
