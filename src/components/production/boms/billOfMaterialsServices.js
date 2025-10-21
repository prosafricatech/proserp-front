import axios from "@/lib/services/config";

const billOfMaterialsServices = {};

billOfMaterialsServices.getList = async (params) => {
  const response = await axios.get('/api/manufacturing/boms', {
    params,
  });
  return response.data;  
};

billOfMaterialsServices.getBOMs = async() => {
    const {data} = await axios.get(`/api/manufacturing/boms/getBOMs`)
    return data;
}

billOfMaterialsServices.billOfMaterialDetails = async (id) => {
    const {data} = await axios.get(`/api/manufacturing/boms/${id}/billOfMaterialDetails`);
    return data;
}

billOfMaterialsServices.addBillOfMaterials = async(billOfMaterial) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/manufacturing/boms/add`,billOfMaterial)
        return data;
    })
}

billOfMaterialsServices.updateBillOfMaterial = async(billOfMaterial) => {
    const id = billOfMaterial.id;
    return await axios.get('/sanctum/csrf-cookie').then(    async (response) => {
        const {data} = await axios.put(`/api/manufacturing/boms/${id}/update`,billOfMaterial)
        return data;    
    })
}

billOfMaterialsServices.delete = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/manufacturing/boms/${id}/delete`);
        return data;
    })
};

export default billOfMaterialsServices;