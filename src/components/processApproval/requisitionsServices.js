import axios from "@/lib/services/config";

const requisitionsServices = {};

requisitionsServices.productBudgetCheck = async ({ product_id, cost_center_id }) => {
    const response = await axios.post('/api/processApproval/product-budget-check', {
        product_id,
        cost_center_id,
    });
    return response.data;
};

requisitionsServices.getList = async (params) => {
    const response = await axios.get('/api/processApproval/getRequisitions', {
        params,
    });
    return response.data;
};

requisitionsServices.addRequisitions = async (requisitions) => {
    const { data } = await axios.post(`/api/processApproval/addRequisitions`, requisitions)
    return data;
}

requisitionsServices.getRolesOptions = async (mainOnly = true) => {
    const { data } = await axios.get(`/api/processApproval/getRolesOptions`, {
        params: {
            mainOnly: mainOnly,
        }
    })
    return data;
}

requisitionsServices.approveRequisition = async (approval) => {
    const { data } = await axios.post(`/api/processApproval/approveRequisition`, approval)
    return data;
}

requisitionsServices.getRequisitionDetails = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/getRequisitionDetails`);
    return data;
}

requisitionsServices.getRelatedTransactions = async (params) => {
    const { data } = await axios.get(`/api/processApproval/getRelatedTransactions`, {
        params
    });
    return data;
}

requisitionsServices.retrieveApprovalDetails = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/retrieveApprovalDetails`);
    return data;
}

requisitionsServices.getApprovedRequisitionDetails = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/getApprovedRequisitionDetails`);
    return data;
}

requisitionsServices.getApprovedPurchaseOrders = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/getApprovedPurchaseOrders`);
    return data;
}

requisitionsServices.getApprovedPayments = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/getApprovedPayments`);
    return data;
}

requisitionsServices.updateRequisition = async (requisition) => {
    const { data } = await axios.put(`/api/processApproval/${requisition.id}/updateRequisition`, requisition)
    return data;
}

requisitionsServices.editApprovalRequisition = async (approval) => {
    const { data } = await axios.put(`/api/processApproval/${approval.id}/editApprovalRequisition`, approval)
    return data;
}

requisitionsServices.deleteRequisiton = async (id) => {
    const { data } = await axios.delete(`/api/processApproval/${id}/deleteRequisiton`);
    return data;
};

requisitionsServices.deleteApprovedPurchaseOrder = async (id) => {
    const { data } = await axios.delete(`/api/processApproval/${id}/deleteApprovedPurchaseOrder`);
    return data;
};

requisitionsServices.deleteApprovedPaymentOrder = async (id) => {
    const { data } = await axios.delete(`/api/processApproval/${id}/deleteApprovedPaymentOrder`);
    return data;
};

requisitionsServices.deleteApproval = async (id) => {
    const { data } = await axios.delete(`/api/processApproval/${id}/deleteApproval`);
    return data;
};

requisitionsServices.expenseBudgetCheck = async ({ ledger_id, cost_center_id }) => {
    const response = await axios.get('/api/processApproval/expense-budget-check', {
        params: {
            ledger_id,
            cost_center_id,
        }
    });
    return response.data;
};

requisitionsServices.productBudgetCheck = async ({ product_id, cost_center_id }) => {
    const response = await axios.get('/api/processApproval/product-budget-check', {
        params: {
            product_id,
            cost_center_id,
        }
    });
    return response.data;
};

requisitionsServices.exportPurchaseRequisitionExcel = async (params) => {
    const { data } = await axios.post(`/api/exports/excel/purchaseRequisition`, params, {
        responseType: 'blob',
    })
    return data;
}


export default requisitionsServices;