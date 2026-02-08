import axios from "@/lib/services/config";

const paymentServices = {};

paymentServices.add = async(payment) => {
   return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/transactions/payments/add`,payment);
        return data;
    })
}

paymentServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/payments/${id}/show`);
    return data;
}


paymentServices.update = async(payment) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/transactions/payments/${payment.id}/update`,payment)
        return data;
    });
}


paymentServices.delete = async (payment) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/accountsAndFinance/transactions/payments/${payment.id}/delete`);
        return data;
    })
};


export default paymentServices;