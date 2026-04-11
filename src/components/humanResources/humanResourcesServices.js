import axios from '@/lib/services/config';

const humanResourcesServices = {};

// employees methods
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

// ===== EMPLOYEE CONTRACTS ===== //
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


// departments methods
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

// designations methods
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

// leave types methods
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

// banks methods
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

// employee bank accounts methods
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

// employee next of kins methods
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

// allowance types methods
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

// deduction types methods
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

// employee allowances methods
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

// employee deductions methods
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

// leave allocations methods
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

// leave requests methods
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

humanResourcesServices.showLeaveRequest = async (id) => {
    const { data } = await axios.get(`/api/humanResources/leaveRequests/${id}`);
    return data;
}

humanResourcesServices.deleteLeaveRequest = async (id) => {
    const { data } = await axios.delete(`/api/humanResources/leaveRequests/${id}/delete`);
    return data;
}

// PAYE tax bands methods
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

// payroll periods methods
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

humanResourcesServices.showPayrollPeriod = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollPeriods/${id}`);
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

// payroll runs methods
humanResourcesServices.getPayrollRunsList = async (params = {}) => {
    const { page = 1, limit = 20, ...queryParams } = params;
    const { data } = await axios.get('/api/humanResources/payrollRuns', {
        params: { page, limit, ...queryParams }
    });
    return data;
};

humanResourcesServices.showPayrollRun = async (id) => {
    const { data } = await axios.get(`/api/humanResources/payrollRuns/${id}`);
    return data;
}

humanResourcesServices.finalizePayrollRun = async (id) => {
    const { data } = await axios.post(`/api/humanResources/payrollRuns/${id}/finalize`);
    return data;
}

export default humanResourcesServices;