import axios from "@/lib/services/config";

const requisitionsServices = {};

requisitionsServices.getList = async (params) => {
  const response = await axios.get('/api/processApproval/getRequisitions', {
    params,  // pass all query params here directly
  });
  return response.data;
};

requisitionsServices.addRequisitions = async(requisitions) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/processApproval/addRequisitions`,requisitions)
        return data;
    }) 
}

requisitionsServices.getRolesOptions = async(mainOnly = true) => {
    const {data} = await axios.get(`/api/processApproval/getRolesOptions`,{
        params: {
            mainOnly: mainOnly,
        }
    })
    return data;
}

requisitionsServices.approveRequisition = async(approval) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/processApproval/approveRequisition`,approval)
        return data;
    })
}

requisitionsServices.getRequisitionDetails = async (id) => {
    const { data } = await axios.get(`/api/processApproval/${id}/getRequisitionDetails`);
    return data;
}

requisitionsServices.getRelatedTransactions = async(params) => {
    const {data} = await axios.get(`/api/processApproval/getRelatedTransactions`,{
        params
    });
    return data;
}

requisitionsServices.retrieveApprovalDetails = async (id) => {
    const {data} = await axios.get(`/api/processApproval/${id}/retrieveApprovalDetails`);
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

requisitionsServices.updateRequisition = async(requisition) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/processApproval/${requisition.id}/updateRequisition`,requisition)
        return data;
    })
}

requisitionsServices.editApprovalRequisition = async(approval) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/processApproval/${approval.id}/editApprovalRequisition`,approval)
        return data;
    })
}

requisitionsServices.deleteRequisiton = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/processApproval/${id}/deleteRequisiton`);
        return data;
    })
};

requisitionsServices.deleteApprovedPurchaseOrder = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`api/processApproval/${id}/deleteApprovedPurchaseOrder`);
        return data;
    })
};

requisitionsServices.deleteApprovedPaymentOrder = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`api/processApproval/${id}/deleteApprovedPaymentOrder`);
        return data;
    })
};

requisitionsServices.deleteApproval = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/processApproval/${id}/deleteApproval`);
        return data;
    })
};

export default requisitionsServices;