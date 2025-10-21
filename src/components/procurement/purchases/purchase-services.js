import axios from "@/lib/services/config";

const purchaseServices = {};

purchaseServices.getList = async (params) => {
  const response = await axios.get('/api/purchaseOrders', {
    params,  // pass all query params here directly
  });
  return response.data;
};

purchaseServices.getEditComplements = async (order_id) => {
    const {data} = await axios.get(`/api/purchaseOrders/${order_id}/getEditComplements`);
    return data;
}

purchaseServices.PurchaseGrnsReport = async (id) => {
    const {data} = await axios.get(`/api/purchaseOrders/${id}/PurchaseGrnsReport`);
    return data;
}

purchaseServices.add = async(order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/purchaseOrders/add`,order)
        return data;
    })
}

purchaseServices.update = async(order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/purchaseOrders/${order.id}/update`,order)
        return data;
    })
}

purchaseServices.delete = async (order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/purchaseOrders/${order.id}/delete`);
        return data;
    })
};

purchaseServices.orderDetails = async (id) => {
    const {data} = await axios.get(`/api/purchaseOrders/${id}/orderDetails`);
    return data;
}

purchaseServices.getPurchaseOrderGrns = async (id) => {
    const {data} = await axios.get(`/api/purchaseOrders/${id}/getPurchaseOrderGrns`);
    return data;
}

purchaseServices.unReceiveOrderGrn = async (id) => {
    const {data} = await axios.delete(`/api/purchaseOrders/${id}/unReceiveOrderGrn`);
    return data;
}

purchaseServices.purchaseValues = async(params) => {
    const {data} = await axios.get(`/api/purchaseOrders/purchaseValues`,{params});
    return data;
}

purchaseServices.receive = async(order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/purchaseOrders/${order.id}/receive`,order)
        return data;
    })
}

purchaseServices.getPurchasesReport = async (params) => {
    const { data } = await axios.get(`/api/purchaseOrders/getPurchasesReport`, {
        params: params,
        paramsSerializer: (params) => {
            const searchParams = new URLSearchParams();
            
            Object.keys(params).forEach(key => {
                const value = params[key];
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(`${key}[]`, item));
                } else if (value !== null && value !== undefined && value !== '') {
                    searchParams.append(key, value);
                }
            });
            
            return searchParams.toString();
        }
    });
    return data;
};

purchaseServices.getLastPrice = async(params) => {
    const {data} = await axios.get(`/api/purchaseOrders/getLastPrice`,{
        params
    });
    return data;
}

purchaseServices.closeOrder = async(order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/purchaseOrders/${order.id}/closeOrder`,order)
        return data;
    })
}

purchaseServices.reOpenOrder = async(order) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/purchaseOrders/${order.id}/reOpenOrder`,order)
        return data;
    })
}

export default purchaseServices;