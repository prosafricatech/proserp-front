import axios from "@/lib/services/config";

const humanResourcesServices = {};

// employees methods

humanResourcesServices.getList = async (params = {}) => {
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

humanResourcesServices.add = async (employee) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.post(`/api/humanResources/employees/add`, employee)
        return data;
    })
}

humanResourcesServices.update = async (employee) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.put(`/api/humanResources/employees/${employee.id}/update`, employee)
        return data;
    })
}

humanResourcesServices.delete = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const { data } = await axios.delete(`/api/humanResources/employees/${id}/delete`);
        return data;
    })
}

export default humanResourcesServices;