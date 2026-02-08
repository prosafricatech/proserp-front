import axios from "@/lib/services/config";

const inventoryConsumptionsServices = {};

inventoryConsumptionsServices.getList = async (params) => {
  const response = await axios.get('/api/inventoryConsumptions', {
    params,  // pass all query params here directly
  });
  return response.data;
};

inventoryConsumptionsServices.getListInStore = async (params) => {
  const response = await axios.get(`/api/inventoryConsumptions/${params.id}/getListInStore`, {
    params,  // will send as query string
  });
  return response.data;
};

inventoryConsumptionsServices.add = async(inventoryConsumptions) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/inventoryConsumptions/add`,inventoryConsumptions)
        return data;
    })
}

inventoryConsumptionsServices.delete = async (inventoryConsumption) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/inventoryConsumptions/${inventoryConsumption.id}/delete`);
        return data;
    })
};

inventoryConsumptionsServices.show = async(id) => {
    const {data} = await axios.get(`/api/inventoryConsumptions/${id}/show`)
    return data;
}

inventoryConsumptionsServices.update = async(inventoryConsumption) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/inventoryConsumptions/${inventoryConsumption.id}/update`,inventoryConsumption)
        return data;
    })
}

export default inventoryConsumptionsServices;