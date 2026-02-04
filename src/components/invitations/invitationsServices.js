import axios from "@/lib/services/config";

const invitationsServices = {};

invitationsServices.getList = async (params) => {
  const response = await axios.get('/api/invitations', {
    params,  // pass all query params here directly
  });
  return response.data;
};

export default invitationsServices;