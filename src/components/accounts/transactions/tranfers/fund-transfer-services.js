import axios from "@/lib/services/config";

const fundTransferServices = {};

fundTransferServices.add = async(transfer) => {
   return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/transactions/transfers/add`,transfer);
        return data;
    })
}

fundTransferServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/transfers/${id}/show`);
    return data;
}

fundTransferServices.update = async(transfer) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/update`,transfer)
        return data;
    });
}

fundTransferServices.delete = async (transfer) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/accountsAndFinance/transactions/transfers/${transfer.id}/delete`);
        return data;
    })
};


export default fundTransferServices;