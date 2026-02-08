import axios from "@/lib/services/config";


const priceListServices = {};

priceListServices.getList = async (params, fuelPriceLists) => {
    const response = await axios.get('/api/pos/priceLists', {
        params: {
            ...params,
            fuelPriceLists: fuelPriceLists ? true : false,
        },
    });
    return response.data;
};

priceListServices.getCostInsights = async(params) => {
    const {data} = await axios.get(`/api/pos/priceLists/${params.product_id}/getCostInsights`,{
        params
    });
    return data;
}

priceListServices.add = async(priceList) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
         const {data} = await axios.post(`/api/pos/priceLists/add`,priceList);
         return data;
     })
}

priceListServices.update = async(priceList) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/pos/priceLists/${priceList.id}/update`,priceList)
        return data;
    })
}

priceListServices.delete = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/pos/priceLists/${id}/delete`);
        return data;
    })
};

priceListServices.show = async (id) => {
    const {data} = await axios.get(`/api/pos/priceLists/${id}/show`);
    return data;
}

priceListServices.importPriceListsExcel = async (postData) => {
    return await axios.get('/sanctum/csrf-cookie').then(async () => {
        const formData = new FormData();
        Object.keys(postData).forEach((key) => {
            if (key === 'price_lists_excel') {
                formData.append(key, postData[key][0]);
            } else if (key === 'sales_outlet_ids') {
                postData[key].forEach((id) => {
                    formData.append('sales_outlet_ids[]', id);
                });
            } else {
                formData.append(key, postData[key] !== 'null' ? postData[key] : null);
            }
        });

        const { data } = await axios.post(`/api/pos/priceLists/importPriceListsExcel`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return data;
    });
};

priceListServices.downloadExcelTemplate = async (stores) => {
    const { data } = await axios.post(`/api/pos/priceLists/downloadExcelTemplate`, stores, {
      responseType: 'blob',
    });      
    return data;
};

export default priceListServices;