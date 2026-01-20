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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.post(`/api/humanResources/employees/add`, employee)
        return data;
    })
}

humanResourcesServices.updateEmployee = async (employee) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.put(`/api/humanResources/employees/${employee.id}/update`, employee)
        return data;
    })
}

humanResourcesServices.deleteEmployee = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.delete(`/api/humanResources/employees/${id}/delete`);
        return data;
    })
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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.post(`/api/humanResources/departments/add`, department)
        return data;
    })
}

humanResourcesServices.updateDepartment = async (department) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.put(`/api/humanResources/departments/${department.id}/update`, department)
        return data;
    })
}

humanResourcesServices.deleteDepartment = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.delete(`/api/humanResources/departments/${id}/delete`);
        return data;
    })
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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.post(`/api/humanResources/designations/add`, designation)
        return data;
    })
}

humanResourcesServices.updateDesignation = async (designation) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.put(`/api/humanResources/designations/${designation.id}/update`, designation)
        return data;
    })
}

humanResourcesServices.deleteDesignation = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.delete(`/api/humanResources/designations/${id}/delete`);
        return data;
    })
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
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.post(`/api/humanResources/leave_types/add`, leaveType)
        return data;
    })
}

humanResourcesServices.updateLeaveType = async (leaveType) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.put(`/api/humanResources/leave_types/${leaveType.id}/update`, leaveType)
        return data;
    })
}

humanResourcesServices.deleteLeaveType = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.delete(`/api/humanResources/leave_types/${id}/delete`);
        return data;
    })
}

export default humanResourcesServices;