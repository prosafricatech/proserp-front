import axios from "@/lib/services/config";

const humanResourcesServices = {};


// employees methods

humanResourcesServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/humanResources/employees", {
        params: { page, limit, ...queryParams }
    });
    return data;
},

    humanResourcesServices.getAllEmployees = async () => {
        const { data } = await axios.get('/api/humanResources/employees/all_employees');
        return data;
    }

export default humanResourcesServices;