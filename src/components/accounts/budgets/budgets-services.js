import axios from "@/lib/services/config";

const budgetsServices = {};

budgetsServices.getBudgets = async (params = {}) => {
    const response = await axios.get('/api/accountsAndFinance/budgets', {
        params,  // pass all query params here directly
    });
    return response.data;
};

export default budgetsServices;