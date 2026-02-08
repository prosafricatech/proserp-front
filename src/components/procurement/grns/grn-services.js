import axios from "@/lib/services/config";

const grnServices = {};

grnServices.getGrnsList = async ({ store_id, type, keyword, page, limit, from, to }) => {
  const response = await axios.get(`/api/stores/${store_id}/getGrnsList`, {
    params: { store_id, type, keyword, page, limit, from, to },
  });
  return response.data;
};

grnServices.grnValues = async(params) => {
    const {data} = await axios.get('/api/grns/grnValues',{ params});
    return data
}

grnServices.grnDetails = async (id) => {
    const {data} = await axios.get(`/api/grns/${id}/grnDetails`);
    return data;
}

export default grnServices;