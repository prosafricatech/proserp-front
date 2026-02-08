import axios from "@/lib/services/config";

const approvalChainsServices = {};

approvalChainsServices.getList = async (params = {}) => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get("/api/masters/approvalChains", {
        params: { page, limit, ...queryParams }
    });
    return data;
},

approvalChainsServices.getApprovalRequisitionsList = async (params = {}) => {
  const response = await axios.get('/api/masters/approvalChains/getApprovalRequisitionsList', {
    params,  // pass all query params here directly
  });
  return response.data;
},

approvalChainsServices.getApprovalChainLevels = async (id, status) => {
    const { data } = await axios.get(`/api/masters/approvalChains/${id}/getApprovalChainLevels`, {
      params: { status },
    });
    return data;
};  

approvalChainsServices.addApprovalChains = async(ApprovalChains) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/approvalChains/addApprovalChains`,ApprovalChains)
        return data;
    })
}

approvalChainsServices.addNewChainLevel = async(newLevel) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/masters/approvalChains/addNewChainLevel`,newLevel)
        return data;
    })
}

approvalChainsServices.activateChain = async(chain) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/approvalChains/${chain.id}/activateChain`,chain)
        return data;
    })
}

approvalChainsServices.activateLevel = async(chainLevel) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/approvalChains/${chainLevel.id}/activateLevel`,chainLevel)
        return data;
    })
}

approvalChainsServices.editApprovalChain = async(chain) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/approvalChains/${chain.id}/update`,chain)
        return data;
    })
}

approvalChainsServices.editApprovalChainLevel = async(level) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/masters/approvalChains/${level.id}`,level)
        return data;
    })
}

approvalChainsServices.deactivateChain = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/approvalChains/${id}/delete`);
        return data;
    })
};

approvalChainsServices.deactivateLevel = async (id) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/masters/approvalChains/${id}/deactivateLevel`);
        return data;
    })
};


export default approvalChainsServices;