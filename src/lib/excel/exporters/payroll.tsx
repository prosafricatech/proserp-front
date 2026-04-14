import { getExcelColumnName } from '../uitls';
import { createWorkbook } from '../workBook';

export async function ExportPayrollToExcel(exportedData: any) {
  try {
    const { organization } = exportedData;
    const organizationName = organization?.name;

    // create workbook and worksheet
    const wb = createWorkbook();
    const ws = wb.addWorksheet('Payroll');

    // column widths
    for (let x = 1; x <= 25; x++) {
      if (x === 1) {
        ws.getColumn(`${getExcelColumnName(x)}`).width = 9;
      } else {
        ws.getColumn(`${getExcelColumnName(x)}`).width = 25;
      }
    }

    // organization name and description
    ws.mergeCells('A1:Y1');
    const orgNameCell = ws.getCell('A1');
    orgNameCell.value = organizationName;
    ws.getRow(1).height = 25;
    ws.getRow(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    ws.getRow(1).font = {
      size: 20,
    };
    ws.mergeCells('A2:Y2');
    const descCell = ws.getCell('A2');
    descCell.value = 'description: ';
    ws.getRow(2).height = 20;
    ws.getRow(2).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    ws.getRow(2).font = {
      size: 18,
    };

    // ===== TABLE HEADINGS ===== //
    ws.mergeCells('A3:F3');
    ws.mergeCells('G3:S3');
    ws.mergeCells('T3:Y3');
    ws.getCell('A3').value = 'RECRUITMENT';
    ws.getCell('G3').value = 'EMPLOYEE';
    ws.getCell('W3').value = 'EMPLOYER';
    ws.getRow(3).height = 15;
    ws.getRow(3).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    ws.addRow([
      'S/N',
      'Name',
      'Description',
      'Head Count',
      'Nationality',
      'Department',
      'Basic Salary',
      'Responsibility Allowance',
      'Contract End',
      'Termination Benefits',
      'Gross salary',
      'NSSF Deductions',
      'Taxable Salary',
      'Deduct P.A.Y.E',
      'Deduct Advance',
      'Staff Loan Taken',
      'Deduct HESLB',
      'Loan Balance',
      'Nat Payable',
      'NSSF COntributions',
      'NFH COntributions',
      'SDL COntributions',
      'WCF COntributions',
      "TOTAL EMPLOYER'S CONTRIBUTIONS",
      'GROSS BY EMPLOYER',
    ]);
    ws.getCell('L5').value = 10 / 100;
    ws.getCell('L5').numFmt = '0.00%';
    ws.getCell('Q5').value = 15 / 100;
    ws.getCell('Q5').numFmt = '0.00%';
    ws.getCell('T5').value = 10 / 100;
    ws.getCell('T5').numFmt = '0.00%';
    ws.getCell('U5').value = 6 / 100;
    ws.getCell('U5').numFmt = '0.00%';
    ws.getCell('V5').value = 4 / 100;
    ws.getCell('V5').numFmt = '0.00%';
    ws.getCell('W5').value = 1 / 100;
    ws.getCell('W5').numFmt = '0.00%';

    // Return Excel buffer
    return await wb.xlsx.writeBuffer();
    // return {
    //   messaage: exportedData,
    // };
  } catch (error: any) {
    console.error('Error exporting sample Excel:', error);
    throw new Error(
      error?.message || 'Excel export failed during workbook generation'
    );
  }
}
