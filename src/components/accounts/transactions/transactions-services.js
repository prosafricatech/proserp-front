import axios from "@/lib/services/config";

const transactionServices = {};

transactionServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/accountsAndFinance/transactions/${queryParams.type}`, {
        params: { page, limit, ...queryParams }
    });
    return data;
}

export default transactionServices;
