import axios from "@/lib/services/config";

const journalServices = {};

journalServices.add = async(journal) => {
   return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/accountsAndFinance/transactions/journal/add`,journal);
        return data;
    })
}

journalServices.show = async (id) => {
    const {data} = await axios.get(`/api/accountsAndFinance/transactions/journal/${id}/show`);
    return data;
}


journalServices.update = async(journal) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/accountsAndFinance/transactions/journal/${journal.id}/update`,journal)
        return data;
    });
}


journalServices.delete = async (journal) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/accountsAndFinance/transactions/journal/${journal.id}/delete`);
        return data;
    })
};


export default journalServices;