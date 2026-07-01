import { useLanguage } from '@/app/[lang]/contexts/LanguageContext';
import { useJumboAuth } from '@/app/providers/JumboAuthProvider';
import PDFContent from '@/components/pdf/PDFContent';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useJumboTheme } from '@jumbo/components/JumboTheme/hooks';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { useMediaQuery } from '@mui/system';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import PayrollPeriodPDF from './PayrollPeriodPDF';

type SalaryTypeItem = {
  id?: number;
  name?: string;
  category?: string;
  is_pre_tax?: boolean;
  computation_method?:
    | 'fixed'
    | 'percentage_of_basic'
    | 'percentage_of_gross'
    | string;
  default_value?: number;
};

export interface PayrollPeriodViewDialogProp {
  open: boolean;
  onClose: () => void;
  allowanceTypes?: Array<any>;
  contributionTypes?: Array<any>;
  created_at?: String;
  created_by?: Number;
  deductionTypes?: Array<any>;
  deleted_at?: String;
  id?: Number;
  month?: Number;
  periodLabel?: String;
  remarks?: String;
  rows?: Array<any>;
  runs?: Array<any>;
  runs_count?: Number;
  updated_at?: String;
  year?: Number;
  isLoading?: boolean;
}

const PayrollPeriodNewViewDialog = ({
  open = false,
  onClose,
  allowanceTypes,
  contributionTypes,
  created_at,
  created_by,
  deductionTypes,
  deleted_at,
  id,
  month,
  periodLabel,
  remarks,
  rows,
  runs,
  runs_count,
  updated_at,
  year,
  isLoading,
}: PayrollPeriodViewDialogProp) => {
  const router = useRouter();
  const lang = useLanguage();
  const authObject = useJumboAuth() as any;
  const theme = useTheme();
  const [openPdfDialog, setOpenPdfDialog] = useState(false);
  const { theme: jumboTheme } = useJumboTheme();
  const smallScreen = useMediaQuery(jumboTheme.breakpoints.down('md'));

  const mappedRows = useMemo(() => {
    if (!runs || !rows) return [];

    return runs.map((run: any) => {
      const matchingRows = rows.filter(
        (row) => row.run?.cost_center_id === run?.cost_center_id
      );

      return {
        ...run,
        cost_center: run.cost_center,
        run: [...(run.run || []), ...matchingRows],
      };
    });
  }, [runs, rows]);

  const [isExporting, setIsExporting] = useState(false);

  const organization = authObject?.authOrganization?.organization;

  const employeeDeductions = rows?.flatMap((itm) =>
    itm.run?.deductions?.map((deduction: any) => ({
      ...deduction,
      employee_contract_id: itm.run.employee?.id,
    }))
  );

  const preTaxDeductionTypes = deductionTypes?.filter((type) =>
    Boolean(type.is_pre_tax)
  );
  const postTaxDeductionTypes = deductionTypes?.filter(
    (type) => !type.is_pre_tax
  );

  const hasAllowances = allowanceTypes && allowanceTypes.length > 0;
  const hasDeductions = deductionTypes && deductionTypes.length > 0;
  const hasContributions = contributionTypes && contributionTypes.length > 0;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth='xl'
        fullScreen={smallScreen}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogTitle>
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Box>
              <Typography variant='h6'>
                {organization?.name || 'Company'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Salary Payroll - {periodLabel}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              py={8}
            >
              <CircularProgress />
              <Typography variant='body2' color='text.secondary' sx={{ ml: 2 }}>
                Generating Preview...
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  {/* Group Headers - RECRUITMENT, EMPLOYEE, EMPLOYER */}
                  <TableRow>
                    <TableCell
                      sx={{
                        width: 'fit-content',
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    ></TableCell>
                    <TableCell
                      colSpan={3}
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      RECRUITMENT
                    </TableCell>
                    <TableCell
                      colSpan={
                        2 +
                        (hasAllowances ? allowanceTypes.length : 0) +
                        (hasDeductions ? deductionTypes.length + 1 : 0)
                      }
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      EMPLOYEE
                    </TableCell>
                    <TableCell
                      colSpan={
                        2 + (hasContributions ? contributionTypes.length : 0)
                      }
                      sx={{
                        textAlign: 'center',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: 'divider',
                        fontSize: '0.9rem',
                      }}
                    >
                      EMPLOYER
                    </TableCell>
                  </TableRow>

                  {/* Sub-headers - Allowances, Deductions, Contributions */}
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                        textWrap: 'nowrap',
                      }}
                    >
                      cost center
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      S/N
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Employee
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Designation
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Basic
                    </TableCell>

                    {hasAllowances && (
                      <TableCell
                        colSpan={allowanceTypes.length}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Allowances
                      </TableCell>
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Gross
                    </TableCell>

                    {hasDeductions && (
                      <TableCell
                        colSpan={deductionTypes.length + 1}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Deductions
                      </TableCell>
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 500,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Net Payable
                    </TableCell>

                    {hasContributions && (
                      <TableCell
                        colSpan={contributionTypes.length + 1}
                        align='center'
                        sx={{
                          fontWeight: 500,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        Employer Contributions
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Column Headers */}
                  <TableRow>
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      align='right'
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {allowanceTypes?.map((type, idx) => (
                      <TableCell
                        key={`allowance-header-${type.id || type.name}-${idx}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 450,
                        }}
                      >
                        {type.name || 'Allowance'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {deductionTypes?.map((type, idx) => (
                      <TableCell
                        key={`deduction-header-${type.id || type.name}-${idx}`}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          fontWeight: 450,
                        }}
                      >
                        {type.name || 'Deduction'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        fontWeight: 450,
                      }}
                    >
                      PAYE
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 400,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />

                    {contributionTypes?.map((type, idx) => (
                      <TableCell
                        key={`contribution-header-${type.id || type.name}-${idx}`}
                        sx={{
                          fontWeight: 450,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        {type.name || 'Contribution'}
                      </TableCell>
                    ))}

                    <TableCell
                      sx={{
                        fontWeight: 450,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      Total Empr. Cost
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {mappedRows?.map((row, index) => {
                    const isEven = index % 2 === 0;
                    const employees = row.run || [];

                    return employees.map((entry: any, empIndex: number) => {
                      const run = entry.run;
                      const computed = entry.computed;
                      const name = getEmployeeName(run);
                      const employeeNumber = getEmployeeNumber(run);
                      const designation = getDesignation(run);
                      const isFirstEmployee = empIndex === 0;
                      const totalEmployees = employees.length;

                      return (
                        <TableRow
                          key={`salary-row-${run.id || index}-${empIndex}`}
                          sx={{
                            backgroundColor: isEven
                              ? theme.palette.background.paper
                              : theme.palette.action.hover,
                            '&:hover': {
                              backgroundColor: theme.palette.action.selected,
                            },
                          }}
                        >
                          {isFirstEmployee && (
                            <TableCell
                              rowSpan={totalEmployees}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                textWrap: 'nowrap',
                                maxWidth: 300,
                              }}
                            >
                              {row.cost_center?.name || '-'}
                            </TableCell>
                          )}

                          <TableCell
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {empIndex + 1}
                          </TableCell>

                          {/* Employee Name */}
                          <TableCell
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              textWrap: 'nowrap',
                              cursor: 'pointer',
                              '&:hover': {
                                color: 'primary.main',
                                textDecoration: 'underline',
                              },
                            }}
                            onClick={() =>
                              router.push(
                                `/${lang}/humanResources/employees/${entry.run.employee?.id}`
                              )
                            }
                          >
                            {name}
                            {/* Employee Number */}
                            <Typography
                              variant='body2'
                              fontSize={10}
                              color='textSecondary'
                            >
                              {employeeNumber && `(${employeeNumber})`}
                            </Typography>
                          </TableCell>

                          {/* Designation */}
                          <TableCell
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {designation}
                          </TableCell>

                          {/* Basic Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(computed.basicSalary)}
                          </TableCell>

                          {/* Allowances */}
                          {allowanceTypes?.map((type, typeIdx) => (
                            <TableCell
                              key={`allowance-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                              align='right'
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {fmt(sumAllowanceByType(run, type))}
                            </TableCell>
                          ))}

                          {/* Gross Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(computed.grossSalary)}
                          </TableCell>

                          {/* Deductions */}
                          {deductionTypes?.map((type, typeIdx) => (
                            <TableCell
                              key={`deduction-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                              align='right'
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {fmt(sumDeductionByType(run, type))}
                            </TableCell>
                          ))}

                          {/* PAYE */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(computed.paye)}
                          </TableCell>

                          {/* Net Salary */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(computed.netSalary)}
                          </TableCell>

                          {/* Employer Contributions */}
                          {contributionTypes?.map((type, typeIdx) => (
                            <TableCell
                              key={`contribution-value-${run.id || index}-${type.id || type.name}-${typeIdx}`}
                              align='right'
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {fmt(sumContributionByType(run, type))}
                            </TableCell>
                          ))}

                          {/* Total Employer Cost */}
                          <TableCell
                            align='right'
                            sx={{ border: '1px solid', borderColor: 'divider' }}
                          >
                            {fmt(computed.totalEmployerCost)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })}

                  {/* Totals Row */}
                  <TableRow>
                    <TableCell
                      sx={{ border: '1px solid', borderColor: 'divider' }}
                    />
                    <TableCell
                      colSpan={3}
                      sx={{
                        fontWeight: 700,
                        textAlign: 'center',
                        borderTop: '2px solid',
                        borderLeft: '2px solid',
                        borderRight: '2px solid',
                        borderColor: 'divider',
                      }}
                    >
                      TOTALS
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals?.basicSalary)}
                    </TableCell>

                    {totals?.allowanceByType.map((amount: any, idx: Number) => (
                      <TableCell
                        key={`allowance-total-${idx}`}
                        align='right'
                        sx={{
                          fontWeight: 700,
                          borderTop: '2px solid',
                          borderColor: 'divider',
                          borderRight: '0.001px solid white',
                        }}
                      >
                        {fmt(amount)}
                      </TableCell>
                    ))}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals?.grossSalary)}
                    </TableCell>

                    {totals?.preTaxDeductionByType.map(
                      (amount: any, idx: Number) => (
                        <TableCell
                          key={`pre-tax-total-${idx}`}
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(amount)}
                        </TableCell>
                      )
                    )}

                    {totals?.postTaxDeductionByType.map(
                      (amount: any, idx: Number) => (
                        <TableCell
                          key={`pre-tax-total-${idx}`}
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(amount)}
                        </TableCell>
                      )
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals?.paye)}
                    </TableCell>

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals?.netSalary)}
                    </TableCell>

                    {totals?.contributionByType.map(
                      (amount: any, idx: Number) => (
                        <TableCell
                          key={`contribution-total-${idx}`}
                          align='right'
                          sx={{
                            fontWeight: 700,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderRight: '0.001px solid white',
                          }}
                        >
                          {fmt(amount)}
                        </TableCell>
                      )
                    )}

                    <TableCell
                      align='right'
                      sx={{
                        fontWeight: 700,
                        borderTop: '2px solid',
                        borderColor: 'divider',
                        borderRight: '0.001px solid white',
                      }}
                    >
                      {fmt(totals?.totalEmployerCost)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant='outlined'
            onClick={() => setOpenPdfDialog(true)}
            disabled={rows?.length === 0 || isLoading}
          >
            Print
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* PDF Dialog */}
      <Dialog
        open={openPdfDialog}
        onClose={() => setOpenPdfDialog(false)}
        fullWidth
        maxWidth='xl'
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
          },
        }}
      >
        <DialogContent>
          <PDFContent
            document={
              <PayrollPeriodPDF
                organization={organization}
                allowanceTypes={allowanceTypes}
                contributionTypes={contributionTypes}
                created_at={created_at}
                created_by={created_by}
                deductionTypes={deductionTypes}
                deleted_at={deleted_at}
                id={id}
                month={month}
                periodLabel={periodLabel}
                remarks={remarks}
                rows={rows}
                runs={runs}
                runs_count={runs_count}
                updated_at={updated_at}
                year={year}
                isLoading={isLoading}
              />
            }
            fileName={`Salary-Sheet-${periodLabel}`}
          />
        </DialogContent>
        <DialogActions>
          <LoadingButton
            size='small'
            onClick={() => handleExcelExport(exportedData)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              gap: 1,
            }}
            color='success'
            variant='contained'
            disabled={isExporting || rows?.length === 0 || isLoading}
            loading={isExporting}
          >
            <FontAwesomeIcon icon={faFileExcel} color='green' /> Excel
          </LoadingButton>
          <Button onClick={() => setOpenPdfDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PayrollPeriodNewViewDialog;
