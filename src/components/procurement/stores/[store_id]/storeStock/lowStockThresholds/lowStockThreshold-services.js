import axios from "@/lib/services/config";

const lowStockThresholdServices = {};

lowStockThresholdServices.getList = async ({ store_id, type, keyword, page, limit }) => {
    const response = await axios.get(`/api/lowStockThreshold/${store_id}`, {
      params: { store_id, type, keyword, page, limit },
    });
    return response.data;
},

lowStockThresholdServices.add = async(thresholdId) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
         const {data} = await axios.post(`/api/lowStockThreshold/add`,thresholdId);
         return data;
     })
}

lowStockThresholdServices.update = async(thresholdId) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/lowStockThreshold/${thresholdId}/update`,thresholdId)
        return data;
    })
}

lowStockThresholdServices.delete = async (thresholdId) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/lowStockThreshold/${thresholdId}/delete`);
        return data;
    })
};

lowStockThresholdServices.alerts = async (params) => {
    const {data} = await axios.get(`/api/lowStockThreshold/alerts`, {
        params
    });
    return data;
};

export default lowStockThresholdServices;