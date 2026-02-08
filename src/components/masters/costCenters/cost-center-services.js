import axios from "@/lib/services/config";

const costCenterservices = {};

costCenterservices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/accountsAndFinance/cost-centers", {
      params: { page, limit, ...queryParams }
    });
    return data;
},

costCenterservices.getCostCenters = async(response) => {
    const {data} = await axios.get(`/api/accountsAndFinance/cost-centers/all-cost-centers`)
    return data;
}

costCenterservices.costCenterDetails = async(id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/cost-centers/${id}/costCenterDetails`);
    return data;
}

costCenterservices.getAllOutlets = async(response) => {
    const {data} = await axios.get(`/api/accountsAndFinance/cost-centers/getAllOutlets`)
    return data;
}

costCenterservices.add = async(costCenter) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/cost-centers/add`,costCenter)
        return data;
    })
}

costCenterservices.update = async(costCenter) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/cost-centers/${costCenter.id}/update`,costCenter)
        return data;    
    })
}

export default costCenterservices;