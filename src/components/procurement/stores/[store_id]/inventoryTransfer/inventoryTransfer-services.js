import axios from "@/lib/services/config";

const inventoryTransferServices = {};

inventoryTransferServices.getList = async ({ store_id, type, keyword, page, limit, from, to }) => {
  const response = await axios.get(`/api/stores/${store_id}/getInventoryTransferList`, {
    params: { store_id, type, keyword, page, limit, from, to },
  });
  return response.data;
};

inventoryTransferServices.add = async(transfers) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
         const {data} = await axios.post(`/api/inventoryTransfer/add`,transfers);
         return data;
     })
}

inventoryTransferServices.transferDetails = async (id) => {
    const {data} = await axios.get(`/api/inventoryTransfer/${id}/transferDetails`);
    return data;
}

inventoryTransferServices.update = async(transfer) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/inventoryTransfer/${transfer.id}/update`,transfer)
        return data;
    })
}

inventoryTransferServices.delete = async (transfers) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.delete(`/api/inventoryTransfer/${transfers.id}/delete`);
        return data;
    })
};

inventoryTransferServices.receive = async(transfer) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.post(`/api/inventoryTransfer/${transfer.id}/receive`,transfer)
        return data;
    })
}

inventoryTransferServices.getInventoryTrns = async (id) => {
    const {data} = await axios.get(`/api/inventoryTransfer/${id}/getInventoryTrns`);
    return data;
}

inventoryTransferServices.trnDetails = async (id) => {
    const {data} = await axios.get(`/api/inventoryTransfer/${id}/trnDetails`);
    return data;
}

inventoryTransferServices.unReceiveTrn = async (id) => {
    const {data} = await axios.delete(`/api/inventoryTransfer/${id}/unReceiveTrn`);
    return data;
}

export default inventoryTransferServices;