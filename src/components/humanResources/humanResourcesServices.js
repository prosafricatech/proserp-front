import axios from '@/lib/services/config';

const humanResourcesServices = {};

// ============================================
// EMPLOYEES
// ============================================
humanResourcesServices.getEmployeesList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/humanResources/employees", {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllEmployees = async () => {
    const { data } = await axios.get('/api/humanResources/employees/all_employees');
    return data;
};

humanResourcesServices.addEmployee = async (employee) => {
    const { data } = await axios.post(`/api/humanResources/employees/add`, employee)
    return data;
}

humanResourcesServices.updateEmployee = async (employee) => {
    const { data } = await axios.put(`/api/humanResources/employees/${employee.id}/update`, employee)
    return data;
}

humanResourcesServices.showEmployee = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employees/${id}`);
    return data;
};

humanResourcesServices.deleteEmployee = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employees/${id}/delete`);
    return data;
}

humanResourcesServices.downloadEmployeesRegistrationTemplate = async () => {
    const { data } = await axios.post('/api/humanResources/employees/registration-excel-template', {}, {
        responseType: 'blob',
    });
    return data;
}

humanResourcesServices.importEmployeesRegistrationExcel = async (file) => {
    // const formData = new FormData();
    // formData.append('employees_excel', file);
    const { data } = await axios.post('/api/humanResources/employees/import-registration-excel', file, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    // const { data } = await axios.post('/api/humanResources/employees/import-registration-excel', file);
    return data;
}

// ============================================
// EMPLOYEE CONTRACTS
// ============================================
humanResourcesServices.getEmployeesContactList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/humanResources/employeesContracts", {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeContract = async (contract) => {
    const { data } = await axios.post(`/api/humanResources/employeesContracts/add`, contract)
    return data;
}

humanResourcesServices.updateEmployeeContract = async (contract) => {
    const { data } = await axios.put(`/api/humanResources/employeesContracts/${contract.id}/update`, contract)
    return data;
}

humanResourcesServices.showEmployeeContract = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesContracts/${id}`);
    return data;
}

humanResourcesServices.terminateEmployeeContract = async ({ id, termination_date, remarks }) => {
    const { data } = await axios.post(`/api/humanResources/employeesContracts/${id}/terminate`, {
        termination_date,
        remarks,
    })
    return data;
}

humanResourcesServices.deleteEmployeeContract = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesContracts/${id}/delete`);
    return data;
}

// ============================================
// DEPARTMENTS
// ============================================
humanResourcesServices.getDepartmentsList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/departments', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllDepartments = async () => {
    const { data } = await axios.get('/api/humanResources/departments/all_departments');
    return data;
};

humanResourcesServices.addDepartment = async (department) => {
    const { data } = await axios.post(`/api/humanResources/departments/add`, department)
    return data;
}

humanResourcesServices.updateDepartment = async (department) => {
    const { data } = await axios.put(`/api/humanResources/departments/${department.id}/update`, department)
    return data;
}

humanResourcesServices.showDepartment = async (id) => {
    const { data } = await axios.get(`/api/humanResources/departments/${id}`);
    return data;
}

humanResourcesServices.deleteDepartment = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/departments/${id}/delete`);
    return data;
}

// ============================================
// DESIGNATIONS
// ============================================
humanResourcesServices.getDesignationsList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/designations', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllDesignations = async () => {
    const { data } = await axios.get('/api/humanResources/designations/all_designations');
    return data;
};

humanResourcesServices.addDesignation = async (designation) => {
    const { data } = await axios.post(`/api/humanResources/designations/add`, designation)
    return data;
}

humanResourcesServices.updateDesignation = async (designation) => {
    const { data } = await axios.put(`/api/humanResources/designations/${designation.id}/update`, designation)
    return data;
}

humanResourcesServices.showDesignation = async (id) => {
    const { data } = await axios.get(`/api/humanResources/designations/${id}`);
    return data;
}

humanResourcesServices.deleteDesignation = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/designations/${id}/delete`);
    return data;
}

// ============================================
// LEAVE TYPES
// ============================================
humanResourcesServices.getLeaveTypesList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leave_types', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.getAllLeaveTypes = async () => {
    const { data } = await axios.get('/api/humanResources/leave_types/all_leave_types');
    return data;
};

humanResourcesServices.addLeaveType = async (leaveType) => {
    const { data } = await axios.post(`/api/humanResources/leave_types/add`, leaveType)
    return data;
}

humanResourcesServices.updateLeaveType = async (leaveType) => {
    const { data } = await axios.put(`/api/humanResources/leave_types/${leaveType.id}/update`, leaveType)
    return data;
}

humanResourcesServices.showLeaveType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leave_types/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leave_types/${id}/delete`);
    return data;
}

// ============================================
// BANKS
// ============================================
humanResourcesServices.getBanksList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/masters/banks', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addBank = async (bank) => {
    const { data } = await axios.post('/api/masters/banks', bank);
    return data;
}

humanResourcesServices.updateBank = async (bank) => {
    const { data } = await axios.put(`/api/masters/banks/${bank.id}`, bank);
    return data;
}

humanResourcesServices.showBank = async (id) => {
    const { data } = await axios.get(`/api/masters/banks/${id}`);
    return data;
}

humanResourcesServices.deleteBank = async (id) => {
    const { data } = await axios.delete(`/api/masters/banks/${id}`);
    return data;
}

// ============================================
// EMPLOYEE BANK ACCOUNTS
// ============================================
humanResourcesServices.getEmployeeBankAccountsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeesBankAccounts', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeBankAccount = async (bankAccount) => {
    const { data } = await axios.post('/api/humanResources/employeesBankAccounts/add', bankAccount);
    return data;
}

humanResourcesServices.updateEmployeeBankAccount = async (bankAccount) => {
    const { data } = await axios.put(`/api/humanResources/employeesBankAccounts/${bankAccount.id}/update`, bankAccount);
    return data;
}

humanResourcesServices.showEmployeeBankAccount = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesBankAccounts/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeBankAccount = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesBankAccounts/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE NEXT OF KINS
// ============================================
humanResourcesServices.getEmployeeNextOfKinsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeesNextOfKins', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeNextOfKin = async (nextOfKin) => {
    const { data } = await axios.post('/api/humanResources/employeesNextOfKins/add', nextOfKin);
    return data;
}

humanResourcesServices.updateEmployeeNextOfKin = async (nextOfKin) => {
    const { data } = await axios.put(`/api/humanResources/employeesNextOfKins/${nextOfKin.id}/update`, nextOfKin);
    return data;
}

humanResourcesServices.showEmployeeNextOfKin = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeesNextOfKins/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeNextOfKin = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeesNextOfKins/${id}/delete`);
    return data;
}

// ============================================
// ALLOWANCE TYPES
// ============================================
humanResourcesServices.getAllowanceTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/allowanceTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addAllowanceType = async (allowanceType) => {
    const { data } = await axios.post('/api/humanResources/allowanceTypes/add', allowanceType);
    return data;
}

humanResourcesServices.updateAllowanceType = async (allowanceType) => {
    const { data } = await axios.put(`/api/humanResources/allowanceTypes/${allowanceType.id}/update`, allowanceType);
    return data;
}

humanResourcesServices.showAllowanceType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/allowanceTypes/${id}`);
    return data;
}

humanResourcesServices.deleteAllowanceType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/allowanceTypes/${id}/delete`);
    return data;
}

// ============================================
// DEDUCTION TYPES
// ============================================
humanResourcesServices.getDeductionTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/deductionTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addDeductionType = async (deductionType) => {
    const { data } = await axios.post('/api/humanResources/deductionTypes/add', deductionType);
    return data;
}

humanResourcesServices.updateDeductionType = async (deductionType) => {
    const { data } = await axios.put(`/api/humanResources/deductionTypes/${deductionType.id}/update`, deductionType);
    return data;
}

humanResourcesServices.showDeductionType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/deductionTypes/${id}`);
    return data;
}

humanResourcesServices.deleteDeductionType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/deductionTypes/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYER CONTRIBUTION TYPES
// ============================================
humanResourcesServices.getEmployerContributionTypesList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employerContributionTypes', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployerContributionType = async (contributionType) => {
    const { data } = await axios.post('/api/humanResources/employerContributionTypes/add', contributionType);
    return data;
}

humanResourcesServices.updateEmployerContributionType = async (contributionType) => {
    const { data } = await axios.put(`/api/humanResources/employerContributionTypes/${contributionType.id}/update`, contributionType);
    return data;
}

humanResourcesServices.showEmployerContributionType = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employerContributionTypes/${id}`);
    return data;
}

humanResourcesServices.deleteEmployerContributionType = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employerContributionTypes/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE ALLOWANCES
// ============================================
humanResourcesServices.getEmployeeAllowancesList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeAllowances', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeAllowance = async (employeeAllowance) => {
    const { data } = await axios.post('/api/humanResources/employeeAllowances/add', employeeAllowance);
    return data;
}

humanResourcesServices.updateEmployeeAllowance = async (employeeAllowance) => {
    const { data } = await axios.put(`/api/humanResources/employeeAllowances/${employeeAllowance.id}/update`, employeeAllowance);
    return data;
}

humanResourcesServices.showEmployeeAllowance = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeAllowances/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeAllowance = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeAllowances/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE DEDUCTIONS
// ============================================
humanResourcesServices.getEmployeeDeductionsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeDeductions', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeDeduction = async (employeeDeduction) => {
    const { data } = await axios.post('/api/humanResources/employeeDeductions/add', employeeDeduction);
    return data;
}

humanResourcesServices.updateEmployeeDeduction = async (employeeDeduction) => {
    const { data } = await axios.put(`/api/humanResources/employeeDeductions/${employeeDeduction.id}/update`, employeeDeduction);
    return data;
}

humanResourcesServices.showEmployeeDeduction = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeDeductions/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeDeduction = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeDeductions/${id}/delete`);
    return data;
}

// ============================================
// EMPLOYEE EMPLOYER CONTRIBUTIONS
// ============================================
humanResourcesServices.getEmployeeEmployerContributionsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/employeeEmployerContributions', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addEmployeeEmployerContribution = async (employeeEmployerContribution) => {
    const { data } = await axios.post('/api/humanResources/employeeEmployerContributions/add', employeeEmployerContribution);
    return data;
}

humanResourcesServices.updateEmployeeEmployerContribution = async (employeeEmployerContribution) => {
    const { data } = await axios.put(`/api/humanResources/employeeEmployerContributions/${employeeEmployerContribution.id}/update`, employeeEmployerContribution);
    return data;
}

humanResourcesServices.showEmployeeEmployerContribution = async (id) => {
    const { data } = await axios.get(`/api/humanResources/employeeEmployerContributions/${id}`);
    return data;
}

humanResourcesServices.deleteEmployeeEmployerContribution = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/employeeEmployerContributions/${id}/delete`);
    return data;
}

// ============================================
// LEAVE ALLOCATIONS
// ============================================
humanResourcesServices.getLeaveAllocationsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leaveAllocations', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addLeaveAllocation = async (leaveAllocation) => {
    const { data } = await axios.post('/api/humanResources/leaveAllocations/add', leaveAllocation);
    return data;
}

humanResourcesServices.updateLeaveAllocation = async (leaveAllocation) => {
    const { data } = await axios.put(`/api/humanResources/leaveAllocations/${leaveAllocation.id}/update`, leaveAllocation);
    return data;
}

humanResourcesServices.showLeaveAllocation = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leaveAllocations/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveAllocation = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveAllocations/${id}/delete`);
    return data;
}

// ============================================
// LEAVE REQUESTS
// ============================================
humanResourcesServices.getLeaveRequestsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/leaveRequests', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addLeaveRequest = async (leaveRequest) => {
    const { data } = await axios.post('/api/humanResources/leaveRequests/add', leaveRequest);
    return data;
}

humanResourcesServices.updateLeaveRequest = async (leaveRequest) => {
    const { data } = await axios.put(`/api/humanResources/leaveRequests/${leaveRequest.id}/update`, leaveRequest);
    return data;
}

humanResourcesServices.approveLeaveRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/approve`, payload);
    return data;
}

humanResourcesServices.rejectLeaveRequest = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/reject`, payload);
    return data;
}

humanResourcesServices.cancelLeaveRequest = async (id) => {
    const { data } = await axios.post(`/api/humanResources/leaveRequests/${id}/cancel`);
    return data;
}

humanResourcesServices.addLeaveRequestApproval = async (approval) => {
    const { data } = await axios.post('/api/humanResources/leaveRequestApprovals', approval);
    return data;
}

humanResourcesServices.showLeaveRequest = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leaveRequests/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveRequest = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveRequests/${id}/delete`);
    return data;
}

// ============================================
// PAYE TAX BANDS
// ============================================
humanResourcesServices.getPayeTaxBandsList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payeTaxBands', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayeTaxBand = async (payeTaxBand) => {
    const { data } = await axios.post('/api/humanResources/payeTaxBands/add', payeTaxBand);
    return data;
}

humanResourcesServices.updatePayeTaxBand = async (payeTaxBand) => {
    const { data } = await axios.put(`/api/humanResources/payeTaxBands/${payeTaxBand.id}/update`, payeTaxBand);
    return data;
}

humanResourcesServices.showPayeTaxBand = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payeTaxBands/${id}`);
    return data;
}

humanResourcesServices.deletePayeTaxBand = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payeTaxBands/${id}/delete`);
    return data;
}

// ============================================
// PAYROLL PERIODS
// ============================================
humanResourcesServices.getPayrollPeriodsList = async (params = {}) => {
    const { page = 1, limit = 50, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payrollPeriods', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayrollPeriod = async (payrollPeriod) => {
    const { data } = await axios.post('/api/humanResources/payrollPeriods/add', payrollPeriod);
    return data;
}

humanResourcesServices.updatePayrollPeriod = async (payrollPeriod) => {
    const { data } = await axios.put(`/api/humanResources/payrollPeriods/${payrollPeriod.id}/update`, payrollPeriod);
    return data;
}

humanResourcesServices.deletePayrollPeriod = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payrollPeriods/${id}/delete`);
    return data;
}

humanResourcesServices.showPayrollPeriod = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollPeriods/${id}`);
    return data;
}

humanResourcesServices.processPayrollPeriodAllEmployees = async (payload = {}) => {
    const { id } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process`);
    return data;
}

humanResourcesServices.processPayrollPeriodSingleEmployee = async (payload = {}) => {
    const { id, employee_id } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process-employee`, {
        employee_id,
    });
    return data;
}

humanResourcesServices.processPayrollPeriodEmployees = async (payload = {}) => {
    const { id, employee_ids = [] } = payload;
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/process-employees`, {
        employee_ids,
    });
    return data;
}

humanResourcesServices.approvePayrollPeriod = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/approve`);
    return data;
}

humanResourcesServices.markPayrollPeriodPaid = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollPeriods/${id}/mark-paid`);
    return data;
}

// ============================================
// PAYROLL RUNS
// ============================================
humanResourcesServices.getPayrollRunsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payrollRuns', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.addPayrollRun = async (payload) => {
    const { data } = await axios.post('/api/humanResources/payrollRuns/add', payload);
    return data;
}

humanResourcesServices.updatePayrollRun = async (payload) => {
    const { data } = await axios.put(`/api/humanResources/payrollRuns/${payload.id}/update`, payload);
    return data;
}

humanResourcesServices.showPayrollRun = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}`);
    return data?.data || data;
}

humanResourcesServices.deletePayrollRun = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/payrollRuns/${id}/delete`);
    return data;
}

humanResourcesServices.finalizePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/finalize`);
    return data;
}

// Preview - calculate live without saving
humanResourcesServices.previewPayrollRun = async ({ id, employee_ids = [] }) => {
    const payload = Array.isArray(employee_ids) && employee_ids.length ? { employee_ids } : {};
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/preview`, payload);
    return data;
}

// Simulate - calculate for a single employee
humanResourcesServices.simulatePayrollRun = async ({ id, employee_id }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/simulate`, { employee_id });
    return data;
}

// Submit - saves payslips and moves to submitted status
humanResourcesServices.submitPayrollRun = async ({ id, employee_ids = [] }) => {
    const payload = Array.isArray(employee_ids) && employee_ids.length ? { employee_ids } : {};
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/submit`, payload);
    return data;
}

// Direct Approval (no chain)
humanResourcesServices.approvePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/approve`);
    return data;
}

// Chain Approval
humanResourcesServices.addPayrollRunApproval = async (approval) => {
    const { data } = await axios.post('/api/humanResources/payrollRunApprovals', approval);
    return data;
}

// Post Transactions - creates Journal Voucher
humanResourcesServices.postPayrollRunTransactions = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/post-transactions`, payload);
    return data;
}

// Pay Employees - creates Payment Voucher
humanResourcesServices.payPayrollRun = async ({ id, ...payload }) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/pay`, payload);
    return data;
}

// ============================================
// PAYSLIPS
// ============================================
humanResourcesServices.getPayslipsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payslips', {
        params: { page, limit, ...queryParams }
    });
    return data;
}

humanResourcesServices.showPayslip = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payslips/${id}`);
    return data?.data || data;
}

// ============================================
// EXPORT
// ============================================
humanResourcesServices.ExportPayrollToExcel = async (exportedData) => {
    const res = await axios.post(`/api/exports/excel/payrolls/`, exportedData, {
        responseType: 'blob',
    });
    return res.data;
}

export default humanResourcesServices;