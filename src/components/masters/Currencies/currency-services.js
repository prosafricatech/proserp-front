import axios from "@/lib/services/config";

const currencyServices = {};

currencyServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/masters/currencies`, {
      params: { page, limit, ...queryParams }
    });
    return data;
},

currencyServices.add = async(currency) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/currencies/add`,currency)
        return data;
    })
}

currencyServices.updateCurrencyExchangeRate = async(exchangeRate) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/currencies/${exchangeRate.id}/updateCurrencyExchangeRate`,exchangeRate)
        return data;
    })
}

currencyServices.update = async(currency) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/currencies/${currency.id}/update`,currency)
        return data;    
    })
}

currencyServices.delete = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/currencies/${id}/delete`);
        return data;
    })
};

currencyServices.deleteExchangeRate = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/currencies/${id}/deleteExchangeRate`);
        return data;
    })
};

currencyServices.getExchangeRate = async(params) => {
    const {data} = await axios.get(`/api/masters/currencies/${params.currencyId}/getExchangeRate`,{
        params
    });
    return data;
}

export default currencyServices;