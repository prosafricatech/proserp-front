import axios from "@/lib/services/config";

const ledgerServices = {};

ledgerServices.getLedgers = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/accountsAndFinance/ledgers`, {
      params: { page, limit, ...queryParams }
    });
    return data;
},

ledgerServices.storeLedgerGroup = async(group) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post('/api/accountsAndFinance/ledgers/storeLedgerGroup',group)
        return data;
    })
}

ledgerServices.getLedgerOptions = async() => {
    const {data} = await axios.get("/api/accountsAndFinance/ledgers/getLedgerOptions");
    return data;
}

ledgerServices.add = async (ledger) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post("/api/accountsAndFinance/ledgers/add", ledger).then(res => res.data).catch(err => {
            return Promise.reject(err);
        });
        return data;
    });
};

ledgerServices.update = async (ledger) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/ledgers/${ledger.id}/update`, ledger);
        return data;
    });
};

ledgerServices.updateLedgerGroup = async (group) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/ledgers/${group.id}/updateLedgerGroup`, group);
        return data;
    });
};

ledgerServices.delete = async (ledger) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/accountsAndFinance/ledgers/${ledger.id}/delete`);
        return data;
    });
};

ledgerServices.deleteMultiple = async (selectedIDs) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put("/api/accountsAndFinance/ledgers/delete_multiple_ledgers", {
            ledgerIDs: selectedIDs
        });
        return data;
    });
};

ledgerServices.statement = async (params) => {
    const {data} = await axios.get(`/api/accountsAndFinance/ledgers/${params.ledger_id}/statement`,{
        params
    })
    return data;
}

ledgerServices.mergeLedgers = async(ledger) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/ledgers/mergeLedgers`,ledger)
        return data;
    })
}

ledgerServices.downloadExcelTemplate = async (filters) => {
    const { data } = await axios.post(`/api/accountsAndFinance/ledgers/${filters.ledger_id}/downloadExcelTemplate`,filters,
        {
            responseType: 'blob',
        }
    );      
    return data;
};

export default ledgerServices;