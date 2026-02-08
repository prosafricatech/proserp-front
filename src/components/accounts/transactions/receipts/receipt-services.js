import axios from "@/lib/services/config";

const receiptServices = {};

receiptServices.add = async(receipt) => {
   return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/transactions/receipts/add`,receipt);
        return data;
    })
}

receiptServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/receipts/${id}/show`);
    return data;
}

receiptServices.update = async(receipt) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/transactions/receipts/${receipt.id}/update`,receipt)
        return data;
    });
}


receiptServices.delete = async (receipt) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/accountsAndFinance/transactions/receipts/${receipt.id}/delete`);
        return data;
    })
};


export default receiptServices;