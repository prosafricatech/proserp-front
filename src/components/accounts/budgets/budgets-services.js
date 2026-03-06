import axios from "@/lib/services/config";

const budgetsServices = {};

budgetsServices.getBudgets = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get(`/api/accountsAndFinance/budgets`, {
        params: { page, limit, ...queryParams }
    });
    return data;
};

export default budgetsServices;