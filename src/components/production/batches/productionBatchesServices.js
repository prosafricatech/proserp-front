import axios from "@/lib/services/config";

const productionBatchesServices = {};

productionBatchesServices.getProductionBatches = async (params) => {
  const response = await axios.get('/api/manufacturing/batches/getProductionBatches', {
    params,  // pass all query params here directly
  });
  return response.data;
};

productionBatchesServices.showBatchDetails = async (id) => {
    const {data} = await axios.get(`/api/manufacturing/batches/${id}/showBatchDetails`);
    return data;
}

productionBatchesServices.getUserWorkCenters = async ({ queryKey }) => {
    const { userId, type } = queryKey[1];

    const { data } = await axios.get(`/api/manufacturing/batches/${userId}/getUserWorkCenters`, {
        params: { type }
    });
    return data;
};

productionBatchesServices.addProduction = async(batch) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/manufacturing/batches/addProduction',batch)
        return data;
    })
}

productionBatchesServices.updateProduction = async(batch) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/manufacturing/batches/${batch.id}/updateProduction`,batch)
        return data;    
    })
}

productionBatchesServices.deleteProduction = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/manufacturing/batches/${id}/deleteProduction`);
        return data;
    })
};

productionBatchesServices.expensesManifest = async(params) => {
    const {data} = await axios.get(`/api/manufacturing/batches/expensesManifest`,{
        params
    });
    return data;
}

productionBatchesServices.deleteProductionBatch = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/manufacturing/batches/${id}/deleteProductionBatch`);
        return data;
    })
};

export default productionBatchesServices;