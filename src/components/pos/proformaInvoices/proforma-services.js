import axios from "@/lib/services/config";


const proformaServices = {};

proformaServices.getList = async (params) => {
  const response = await axios.get('/api/pos/proforma', {
    params,
  });
  return response.data;
};

proformaServices.getProformaRemarks = async () => {
    const { data } = await axios.get(`/api/pos/proforma/getProformaRemarks`);
    return data;
}

proformaServices.getProformaDetails = async (id) => {
    const { data } = await axios.get(`/api/pos/proforma/${id}/show`);
    return data;
}

proformaServices.add = async(proforma) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/pos/proforma/add`,proforma)
        return data;
    })
}

proformaServices.update = async(proforma) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/pos/proforma/${proforma.id}/update`,proforma)
        return data;
    })
}

proformaServices.deleteProforma = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/pos/proforma/${id}/delete`);
        return data;
    })
};

export default proformaServices;